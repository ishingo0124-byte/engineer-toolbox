(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const KEYTYPES = {
    "rsa2048": { args: ["-newkey rsa:2048"], label: "RSA 2048 ビット" },
    "rsa3072": { args: ["-newkey rsa:3072"], label: "RSA 3072 ビット" },
    "rsa4096": { args: ["-newkey rsa:4096"], label: "RSA 4096 ビット" },
    "ec-p256": { args: ["-newkey ec", "-pkeyopt ec_paramgen_curve:prime256v1"], label: "EC P-256（prime256v1）" },
    "ec-p384": { args: ["-newkey ec", "-pkeyopt ec_paramgen_curve:secp384r1"], label: "EC P-384（secp384r1）" }
  };

  // ---- シェル引用 ----
  const SAFE = /^[A-Za-z0-9_@%+=:,.\/-]+$/;
  function sq(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }
  // 常に引用する（-subj / -addext / -name 用）。特殊文字があれば単一引用符、なければ二重引用符
  function qa(s) { return /[\\"$`!']/.test(s) ? sq(s) : '"' + s + '"'; }
  // 安全な文字だけなら素のまま
  function qf(s) { return SAFE.test(s) ? s : qa(s); }

  function checkFile(name, label) {
    const s = String(name == null ? "" : name).trim();
    if (s === "") return { error: label + "のファイル名を入力してください" };
    if (s.charAt(0) === "-") return { error: label + "のファイル名の先頭を - にすると、オプションと取り違えられます" };
    if (/[\r\n]/.test(s)) return { error: label + "のファイル名に改行は使えません" };
    return { value: s };
  }

  function escSubj(v) { return v.replace(/\\/g, "\\\\").replace(/\//g, "\\/").replace(/\+/g, "\\+"); }

  function buildSubject(st) {
    const cn = String(st.cn || "").trim();
    if (cn === "") return { error: "CN（共通名）を入力してください。例: example.com" };
    const items = [];
    const c = String(st.c || "").trim();
    if (c !== "") {
      if (!/^[A-Za-z]{2}$/.test(c)) return { error: "C（国）は JP のように英字2文字で入力してください" };
      items.push("C=" + c.toUpperCase());
    }
    for (const [k, v, lab] of [["ST", st.st, "ST（都道府県）"], ["L", st.l, "L（市区町村）"], ["O", st.o, "O（組織名）"]]) {
      const s = String(v || "").trim();
      if (s === "") continue;
      if (/[\r\n]/.test(s)) return { error: lab + "に改行は使えません" };
      items.push(k + "=" + escSubj(s));
    }
    if (/[\r\n]/.test(cn)) return { error: "CN に改行は使えません" };
    items.push("CN=" + escSubj(cn));
    return { value: "/" + items.join("/") };
  }

  function parseSan(raw) {
    const out = [];
    const seen = {};
    const list = String(raw || "").split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
    for (const item of list) {
      let entry;
      const m = /^(DNS|IP|email|URI):(.*)$/i.exec(item);
      if (m) {
        const tag = { dns: "DNS", ip: "IP", email: "email", uri: "URI" }[m[1].toLowerCase()];
        const val = m[2].trim();
        if (val === "") return { error: "SAN の「" + item + "」の値が空です" };
        if (/\s/.test(val)) return { error: "SAN の「" + item + "」に空白は使えません" };
        entry = tag + ":" + val;
      } else if (/^\d+(\.\d+){3}$/.test(item)) {
        if (item.split(".").some((n) => Number(n) > 255)) return { error: "SAN の IP アドレスが正しくありません: " + item };
        entry = "IP:" + item;
      } else if (item.indexOf(":") !== -1 && /^[0-9a-fA-F:.]+$/.test(item)) {
        entry = "IP:" + item;
      } else if (item.indexOf("@") !== -1 && !/\s/.test(item)) {
        entry = "email:" + item;
      } else {
        if (!/^[A-Za-z0-9*._-]+$/.test(item)) return { error: "SAN の「" + item + "」はホスト名として使えない文字を含みます（日本語ドメインは xn-- 形式で入力してください）" };
        entry = "DNS:" + item;
      }
      if (!seen[entry]) { seen[entry] = true; out.push(entry); }
    }
    return { value: out };
  }

  function encFlag(enc) {
    if (enc === "noenc") return { flag: "-noenc", text: "-noenc: 秘密鍵をパスフレーズなしで保存します（OpenSSL 3.0 以降のオプション）" };
    if (enc === "pass") return { flag: "", text: "暗号化オプションなし: 実行時にパスフレーズを入力して秘密鍵を暗号化します" };
    return { flag: "-nodes", text: "-nodes: 秘密鍵をパスフレーズなしで保存します（1.1.1 でも 3.x でも動きます。3.0 以降では -noenc の古い別名）" };
  }

  function legacyArgs(l) {
    if (l === "legacy") return { args: ["-legacy"], text: "-legacy: OpenSSL 3.x で古い方式（旧アルゴリズム）を使います。レガシープロバイダが入っていない環境ではエラーになります" };
    if (l === "pbe") return { args: ["-certpbe PBE-SHA1-3DES", "-keypbe PBE-SHA1-3DES", "-macalg sha1"], text: "-certpbe / -keypbe / -macalg: 暗号と MAC を旧来の 3DES・SHA-1 に指定します（-legacy が使えないとき用）" };
    return { args: [], text: "" };
  }

  function isIPv4(h) { return /^\d+(\.\d+){3}$/.test(h) && h.split(".").every((n) => Number(n) <= 255); }

  // st: 入力値のオブジェクト。戻り値 { commands: [[...args]], explain: [...] } または { error }
  function build(st) {
    const ex = [];
    const f = (v, label) => checkFile(v, label);
    let r;
    switch (st.purpose) {
      case "key-csr":
      case "selfsigned": {
        const self = st.purpose === "selfsigned";
        const kt = KEYTYPES[st.keytype];
        if (!kt) return { error: "鍵の種類を選んでください" };
        const key = f(st.key, "秘密鍵"); if (key.error) return key;
        const out = f(self ? st.cert : st.csr, self ? "証明書" : "CSR"); if (out.error) return out;
        const subj = buildSubject(st); if (subj.error) return subj;
        const san = parseSan(st.san); if (san.error) return san;
        let days = null;
        if (self) {
          const dRaw = String(st.days == null ? "" : st.days).trim();
          if (!/^\d+$/.test(dRaw) || Number(dRaw) < 1 || Number(dRaw) > 36500) return { error: "有効日数は 1〜36500 の整数で入力してください" };
          days = Number(dRaw);
        }
        const e = encFlag(st.enc);
        const args = ["openssl req", self ? "-x509" : "-new"].concat(kt.args);
        if (e.flag) args.push(e.flag);
        args.push("-keyout " + qf(key.value), "-out " + qf(out.value));
        if (self) args.push("-days " + days);
        args.push("-subj " + qa(subj.value));
        if (san.value.length) args.push("-addext " + qa("subjectAltName=" + san.value.join(",")));
        ex.push(self ? "req -x509: CSR ではなく自己署名証明書を出力します" : "req -new: 証明書署名要求（CSR）を作ります");
        ex.push("-newkey: " + kt.label + "の秘密鍵を同時に作ります");
        if (e.text) ex.push(e.text);
        ex.push("-keyout: 秘密鍵の保存先 / -out: " + (self ? "証明書" : "CSR") + "の保存先");
        if (self) ex.push("-days: 有効期間（" + days + "日）");
        ex.push("-subj: 対話入力を省略して件名を渡します（" + subj.value + "）");
        if (san.value.length) ex.push("-addext: SAN（" + san.value.join(", ") + "）を追加します。OpenSSL 1.1.1 以降のオプションです");
        else ex.push("SAN が空です。いまのブラウザは SAN を見て照合するため、通常は入れてください");
        return { commands: [args], explain: ex };
      }
      case "x509-text": {
        const c = f(st.cert, "証明書"); if (c.error) return c;
        return { commands: [["openssl x509", "-in " + qf(c.value), "-text", "-noout"]], explain: ["x509 -text: 証明書の中身（件名・発行者・有効期間・SAN など）を文字で表示します", "-noout: PEM 本体の出力を省きます"] };
      }
      case "enddate": {
        const c = f(st.cert, "証明書"); if (c.error) return c;
        const cmds = [["openssl x509", "-in " + qf(c.value), "-noout", "-enddate"]];
        ex.push("-enddate: 有効期限（notAfter）だけを表示します");
        const dRaw = String(st.checkend == null ? "" : st.checkend).trim();
        if (dRaw !== "") {
          if (!/^\d+$/.test(dRaw) || Number(dRaw) > 36500) return { error: "失効確認の日数は 0〜36500 の整数で入力してください（空欄で省略）" };
          const sec = Number(dRaw) * 86400;
          cmds.push(["openssl x509", "-in " + qf(c.value), "-noout", "-checkend " + sec]);
          ex.push("-checkend " + sec + "（" + dRaw + "日）: その期間内に失効するかを調べます。失効しないなら終了コード 0、失効するなら 1 です");
        }
        return { commands: cmds, explain: ex };
      }
      case "csr-verify": {
        const c = f(st.csr, "CSR"); if (c.error) return c;
        return { commands: [["openssl req", "-in " + qf(c.value), "-noout", "-text", "-verify"]], explain: ["req -text: CSR の中身（件名・公開鍵・要求された拡張）を表示します", "-verify: CSR の署名が正しいかを検証します", "-noout: CSR 本体の出力を省きます"] };
      }
      case "convert": {
        const i = f(st.in, "変換元"); if (i.error) return i;
        const o = f(st.out, "変換先"); if (o.error) return o;
        const toDer = st.dir !== "der2pem";
        const base = { cert: "openssl x509", key: "openssl pkey", csr: "openssl req" }[st.obj];
        if (!base) return { error: "変換するものを選んでください" };
        const args = [base, "-in " + qf(i.value)];
        if (toDer) args.push("-outform DER"); else args.push("-inform DER", "-outform PEM");
        args.push("-out " + qf(o.value));
        ex.push((toDer ? "PEM → DER" : "DER → PEM") + "に変換します（" + { cert: "証明書", key: "秘密鍵", csr: "CSR" }[st.obj] + "）");
        ex.push(toDer ? "-outform DER: 出力形式を DER（バイナリ）にします" : "-inform DER: 入力が DER（バイナリ）であることを指定します");
        if (st.obj === "key") ex.push("秘密鍵が暗号化されている場合は、パスフレーズを聞かれます。出力された鍵は暗号化されません");
        return { commands: [args], explain: ex };
      }
      case "pem2pfx": {
        const key = f(st.key, "秘密鍵"); if (key.error) return key;
        const cert = f(st.cert, "証明書"); if (cert.error) return cert;
        const pfx = f(st.pfx, "PFX"); if (pfx.error) return pfx;
        const args = ["openssl pkcs12", "-export", "-out " + qf(pfx.value), "-inkey " + qf(key.value), "-in " + qf(cert.value)];
        ex.push("pkcs12 -export: 秘密鍵と証明書を PKCS#12（PFX）にまとめます");
        const chainRaw = String(st.chain || "").trim();
        if (chainRaw !== "") {
          const ch = f(chainRaw, "中間証明書"); if (ch.error) return ch;
          args.push("-certfile " + qf(ch.value));
          ex.push("-certfile: 中間証明書（チェーン）も同梱します");
        }
        const nm = String(st.name || "").trim();
        if (nm !== "") {
          if (/[\r\n]/.test(nm)) return { error: "フレンドリ名に改行は使えません" };
          args.push("-name " + qa(nm));
          ex.push("-name: PFX 内の表示名（フレンドリ名）です");
        }
        const lg = legacyArgs(st.legacy);
        lg.args.forEach((a) => args.push(a));
        if (lg.text) ex.push(lg.text);
        ex.push("実行すると、PFX を守るエクスポートパスワードの入力を求められます");
        return { commands: [args], explain: ex };
      }
      case "pfx2pem": {
        const pfx = f(st.pfx, "PFX"); if (pfx.error) return pfx;
        const o = f(st.pem, "出力 PEM"); if (o.error) return o;
        const args = ["openssl pkcs12", "-in " + qf(pfx.value), "-out " + qf(o.value)];
        const mode = st.extract;
        if (mode === "cert") {
          args.push("-nokeys");
          ex.push("-nokeys: 秘密鍵は出さず、証明書だけを取り出します");
        } else {
          if (mode === "key") { args.push("-nocerts"); ex.push("-nocerts: 証明書は出さず、秘密鍵だけを取り出します"); }
          else ex.push("証明書と秘密鍵をすべて 1 つの PEM に取り出します");
          const e = encFlag(st.enc);
          if (e.flag) args.push(e.flag);
          if (e.text) ex.push(e.text);
        }
        const lg = legacyArgs(st.legacy);
        lg.args.forEach((a) => args.push(a));
        if (lg.text) ex.push(lg.text);
        ex.push("実行すると、PFX のインポートパスワードを聞かれます");
        return { commands: [args], explain: ex };
      }
      case "match": {
        const key = f(st.key, "秘密鍵"); if (key.error) return key;
        const cert = f(st.cert, "証明書"); if (cert.error) return cert;
        const cmds = [
          ["openssl pkey", "-in " + qf(key.value), "-pubout", "| openssl dgst -sha256"],
          ["openssl x509", "-in " + qf(cert.value), "-noout", "-pubkey", "| openssl dgst -sha256"]
        ];
        ex.push("秘密鍵から取り出した公開鍵と、証明書に入っている公開鍵のハッシュを比べます");
        if (st.withCsr) {
          const c = f(st.csr, "CSR"); if (c.error) return c;
          cmds.push(["openssl req", "-in " + qf(c.value), "-noout", "-pubkey", "| openssl dgst -sha256"]);
          ex.push("CSR の公開鍵も同じ方法で出します");
        }
        ex.push("出力されたハッシュがすべて同じなら、同じ鍵のペアです。RSA でも EC でも使えます");
        ex.push("秘密鍵が暗号化されている場合は、パスフレーズを聞かれます");
        return { commands: cmds, explain: ex };
      }
      case "sclient": {
        const host = String(st.host == null ? "" : st.host).trim();
        if (host === "") return { error: "接続先のホスト名を入力してください。例: example.com" };
        const v6 = host.indexOf(":") !== -1;
        if (v6) {
          if (!/^[0-9a-fA-F:.]+$/.test(host)) return { error: "IPv6 アドレスの形式が正しくありません" };
        } else if (/^\d+(\.\d+){3}$/.test(host)) {
          if (!isIPv4(host)) return { error: "IPv4 アドレスの形式が正しくありません" };
        } else if (!/^[A-Za-z0-9.-]+$/.test(host)) {
          return { error: "ホスト名に使えない文字が含まれています（日本語ドメインは xn-- 形式で入力してください）" };
        }
        const pRaw = String(st.port == null ? "" : st.port).trim();
        let port = 443;
        if (pRaw !== "") {
          if (!/^\d+$/.test(pRaw) || Number(pRaw) < 1 || Number(pRaw) > 65535) return { error: "ポートは 1〜65535 の整数で入力してください" };
          port = Number(pRaw);
        }
        const isIp = v6 || isIPv4(host);
        const args = ["openssl s_client", "-connect " + (v6 ? "[" + host + "]" : host) + ":" + port];
        ex.push("s_client -connect: 指定したホストとポートへ TLS で接続します（通信内容の送信は行わず、接続して証明書情報を見るために使います）");
        if (st.sni && !isIp) { args.push("-servername " + host); ex.push("-servername: SNI でホスト名を伝えます。1 つの IP に複数のサイトがある場合に必要です"); }
        else if (st.sni && isIp) ex.push("接続先が IP アドレスなので -servername は付けていません（SNI には IP アドレスを使えません）");
        if (st.showcerts) { args.push("-showcerts"); ex.push("-showcerts: サーバーが送ってきた証明書チェーンをすべて表示します"); }
        if (st.datesOnly) {
          args.push("</dev/null", "2>/dev/null", "| openssl x509 -noout -dates");
          ex.push("</dev/null: 標準入力を空にして、接続後すぐ終了させます");
          ex.push("x509 -noout -dates: 受け取った証明書の有効期間（notBefore / notAfter）だけを表示します");
        } else if (st.quit) {
          args.push("</dev/null");
          ex.push("</dev/null: 標準入力を空にして、接続後すぐ終了させます（付けないと入力待ちで止まります）");
        }
        return { commands: [args], explain: ex };
      }
    }
    return { error: "目的を選んでください" };
  }

  function render(res, multiline) {
    return res.commands.map((args) => args.join(multiline ? " \\\n  " : " ")).join("\n");
  }

  const core = { build, render, parseSan, buildSubject, qa, qf, escSubj };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined") return;

  // ---- 画面 ----

  function readState() {
    const v = (id) => ($(id) ? $(id).value : "");
    const c = (id) => ($(id) ? $(id).checked : false);
    return {
      purpose: v("ocb-purpose"), keytype: v("ocb-keytype"),
      key: v("ocb-key"), csr: v("ocb-csr"), cert: v("ocb-cert"), chain: v("ocb-chain"), pfx: v("ocb-pfx"), pem: v("ocb-pem"),
      cn: v("ocb-cn"), c: v("ocb-c"), st: v("ocb-st"), l: v("ocb-l"), o: v("ocb-o"), san: v("ocb-san"),
      days: v("ocb-days"), enc: v("ocb-enc"), legacy: v("ocb-legacy"), name: v("ocb-name"),
      obj: v("ocb-obj"), dir: v("ocb-dir"), in: v("ocb-in"), out: v("ocb-out"),
      checkend: v("ocb-checkend"), extract: v("ocb-extract"), withCsr: c("ocb-with-csr"),
      host: v("ocb-host"), port: v("ocb-port"), sni: c("ocb-sni"), showcerts: c("ocb-showcerts"), quit: c("ocb-quit"), datesOnly: c("ocb-dates")
    };
  }

  function updateVisibility(st) {
    document.querySelectorAll("[data-p]").forEach((el) => {
      const list = el.getAttribute("data-p").split(" ");
      let show = list.indexOf(st.purpose) !== -1;
      if (show && el.id === "ocb-g-enc" && st.purpose === "pfx2pem" && st.extract === "cert") show = false;
      el.hidden = !show;
    });
  }

  function run() {
    const st = readState();
    updateVisibility(st);
    const res = build(st);
    const err = $("ocb-error");
    const box = $("ocb-command");
    const list = $("ocb-explain");
    if (res.error) {
      err.textContent = res.error;
      box.textContent = "-";
      list.innerHTML = "";
      return;
    }
    err.textContent = "";
    box.textContent = render(res, $("ocb-multiline").checked);
    list.innerHTML = "";
    res.explain.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      list.appendChild(li);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#openssl-builder input, #openssl-builder select, #openssl-builder textarea").forEach((el) => {
      el.addEventListener("input", run);
      el.addEventListener("change", run);
    });
    const dir = $("ocb-dir");
    if (dir) dir.addEventListener("change", () => {
      const a = $("ocb-in").value; $("ocb-in").value = $("ocb-out").value; $("ocb-out").value = a;
      run();
    });
    run();
  });
})();
