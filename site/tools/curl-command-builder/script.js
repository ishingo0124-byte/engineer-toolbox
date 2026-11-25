(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const val = (id) => String($(id).value == null ? "" : $(id).value);
  const chk = (id) => !!$(id).checked;

  const LONG = {
    s: "--silent", S: "--show-error", i: "--include", v: "--verbose", L: "--location", k: "--insecure",
    g: "--globoff", I: "--head", X: "--request", u: "--user", H: "--header", d: "--data", F: "--form"
  };
  const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/; // RFC 9110 の token（ヘッダー名）

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // ---- シェルごとの引用符 ----
  function quoteBash(s) {
    if (/^[A-Za-z0-9_@%+=:,.\/-]+$/.test(s)) return s;
    return "'" + s.replace(/'/g, "'\\''") + "'";
  }
  // PowerShell の単一引用符文字列は ' と、見た目が似た ‘ ’ ‚ ‛ も引用符として扱われるので、いずれも重ねて書く
  function quotePs(s, legacy) {
    if (/^[A-Za-z0-9_.\/-]+$/.test(s)) return s;
    let t = s.replace(/['‘’‚‛]/g, (c) => c + c);
    if (legacy) t = t.replace(/(\\*)"/g, (m, b) => b + b + '\\"'); // Windows PowerShell 5.1 は内側の " を落とすので \" にする
    return "'" + t + "'";
  }
  // cmd.exe: 全体を " で囲み、中の " は \" にする。cmd は \" でも引用状態を切り替えるので、外側になった区間の & | < > ^ ( ) は ^ で守る
  function quoteCmd(s) {
    if (/^[A-Za-z0-9_@+=:,.\/-]+$/.test(s)) return s;
    let out = '"', inQ = true, bs = 0;
    for (const ch of s) {
      if (ch === "\\") { bs++; continue; }
      if (ch === '"') { out += "\\".repeat(bs * 2 + 1) + '"'; bs = 0; inQ = !inQ; continue; }
      out += "\\".repeat(bs); bs = 0;
      if (!inQ && "&|<>^()".indexOf(ch) >= 0) out += "^";
      out += ch;
    }
    return out + "\\".repeat(bs * 2) + '"';
  }

  function build() {
    const errors = [], warns = [];
    const shell = val("cb-shell");
    const useLong = chk("cb-long");
    const q = shell === "bash" ? quoteBash : shell === "cmd" ? quoteCmd : (s) => quotePs(s, shell === "ps5");

    function opt(short, longName, arg) {
      const name = useLong ? (longName || LONG[short]) : (short ? "-" + short : longName);
      return arg == null ? name : name + " " + q(arg);
    }

    // ---- URL ----
    const url = val("cb-url").trim();
    if (!url) errors.push("URL を入力してください");
    else if (/\s/.test(url)) errors.push("URL に空白が含まれています（空白は %20 にしてください）");
    else {
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) warns.push("URL に https:// などのスキームがありません。curl は http:// とみなして接続します。");
      if (/[\[\]{}]/.test(url) && !chk("cb-g")) warns.push("URL に [ ] { } があります。curl は範囲指定（グロビング）と解釈するので、-g（--globoff）を付けてください。");
    }

    // ---- ヘッダー ----
    const headers = [];
    val("cb-headers").split(/\r?\n/).forEach((line, i) => {
      const t = line.trim();
      if (!t) return;
      if (/^[^:\s]+;$/.test(t)) { headers.push(t); return; } // 「Name;」は空のヘッダーを送る curl 記法
      const idx = t.indexOf(":");
      if (idx < 1) { errors.push((i + 1) + "行目のヘッダーに : がありません"); return; }
      const name = t.slice(0, idx).trim(), value = t.slice(idx + 1).trim();
      if (!TOKEN.test(name)) { errors.push((i + 1) + "行目のヘッダー名に使えない文字があります"); return; }
      if (value === "") warns.push(name + ": の値が空です。curl では、この書き方は既定のヘッダーを送らない指定になります。");
      headers.push(name + ":" + (value === "" ? "" : " " + value));
    });
    const hasHeader = (n) => headers.some((h) => h.toLowerCase().indexOf(n.toLowerCase() + ":") === 0);

    // ---- メソッドとボディ ----
    const method = val("cb-method");
    const bt = val("cb-bodytype");
    let bodyText = val("cb-body").replace(/\r\n/g, "\n");
    const bodyParts = []; // 先に組み立てる（引用符は後段）
    let hasBody = false;
    const lines = bodyText.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l !== "");

    if (bt === "json" || bt === "raw") {
      let b = bodyText.replace(/^\s+|\s+$/g, "");
      if (b === "") warns.push("ボディが空です。ボディなしで出力します。");
      else {
        if (bt === "json") {
          try {
            const parsed = JSON.parse(b);
            if (chk("cb-minify")) b = JSON.stringify(parsed);
          } catch (e) {
            warns.push("ボディが JSON として読み込めません（" + e.message + "）。このまま出力します。");
          }
        }
        hasBody = true;
        if (b.charAt(0) === "@") warns.push("-d の値が @ で始まると、curl はファイル名として読み込みます。文字として送りたい場合は、@ 以外で始めてください。");
        if (bt === "json" && chk("cb-jsonopt")) bodyParts.push(opt(null, "--json", b));
        else {
          bodyParts.push(opt("d", null, b));
          if (bt === "json" && !hasHeader("Content-Type")) headers.push("Content-Type: application/json");
        }
      }
    } else if (bt === "form" || bt === "formenc" || bt === "multipart") {
      if (lines.length === 0) warns.push("ボディが空です。ボディなしで出力します。");
      lines.forEach((l, i) => {
        if (bt === "multipart" && l.indexOf("=") < 1) { errors.push((i + 1) + "行目に name=value の形がありません（-F 用）"); return; }
        if (bt === "form" && l.charAt(0) === "@") warns.push("-d の値が @ で始まると、curl はファイル名として読み込みます。");
        hasBody = true;
        bodyParts.push(bt === "form" ? opt("d", null, l) : bt === "formenc" ? opt(null, "--data-urlencode", l) : opt("F", null, l));
      });
    }

    let methodPart = null;
    if (method === "HEAD") {
      if (hasBody) errors.push("HEAD にはボディを付けられません。メソッドかボディを変更してください");
      methodPart = opt("I", null, null);
    } else {
      const implied = hasBody ? "POST" : "GET";
      if (method !== implied || chk("cb-xalways")) {
        methodPart = opt("X", null, method);
        if (chk("cb-L") && method !== "GET") warns.push("-X と -L を併用すると、リダイレクト先でも同じメソッドで再送されます。意図しない再送になることがあるので、リダイレクトを辿る場合は -X を外せるか確認してください。");
      }
      if (method === "GET" && hasBody) warns.push("GET にボディを付けています。サーバーによっては無視されます。クエリとして送るなら -G を使う方法もあります。");
    }

    // ---- 認証 ----
    const authType = val("cb-auth");
    const authParts = [];
    if (authType === "basic") {
      const u = val("cb-user"), p = val("cb-pass");
      if (u === "") errors.push("ユーザー名を入力してください");
      else if (u.indexOf(":") >= 0) errors.push("Basic 認証のユーザー名に : は使えません（RFC 7617）");
      else authParts.push(opt("u", null, u + ":" + p));
    } else if (authType === "bearer") {
      const tk = val("cb-token").trim();
      if (tk === "") errors.push("Bearer トークンを入力してください");
      else {
        if (/\s/.test(tk)) warns.push("トークンに空白が含まれています。Bearer の値には通常、空白は入りません（RFC 6750）。");
        if (/^bearer\s/i.test(tk)) warns.push("トークンの先頭に「Bearer 」が入っています。ツールが付けるので、二重になります。");
        authParts.push(opt("H", null, "Authorization: Bearer " + tk));
      }
    }
    if (authType !== "none") {
      if (hasHeader("Authorization")) warns.push("ヘッダー欄にも Authorization があります。認証が二重に付きます。");
      if (/^http:\/\//i.test(url)) warns.push("http:// のまま認証情報を送ると、通信経路で読み取られます。https:// にできるか確認してください。");
      warns.push("パスワードやトークンをコマンドに書くと、シェルの履歴やプロセス一覧に残ることがあります。");
    }

    // ---- タイムアウト ----
    const timeParts = [];
    [["cb-maxtime", "--max-time"], ["cb-conntime", "--connect-timeout"]].forEach((pair) => {
      const v = tb.z2h(val(pair[0])).trim();
      if (v === "") return;
      if (!/^\d+(\.\d+)?$/.test(v) || parseFloat(v) <= 0) { errors.push(pair[1] + " は 0 より大きい数字（秒）で入力してください"); return; }
      timeParts.push(pair[1] + " " + v);
    });

    // ---- シェル別の注意 ----
    if (shell === "cmd") {
      const all = [url].concat(headers, bodyParts);
      if (bodyParts.some((p) => /\n/.test(p))) warns.push("cmd では、値の途中に改行を入れられません。JSON は「JSON を1行に整える」を使うか、-d @ファイル名 でファイルから読み込んでください。");
      if (all.some((s) => /%/.test(s))) warns.push("% を含む値は、cmd の変数展開に巻き込まれることがあります。バッチファイルに書く場合は %% にしてください。");
      const rawVals = [url].concat(val("cb-headers").split("\n"), [val("cb-body")]);
      if (rawVals.some((s) => ((s.match(/"/g) || []).length % 2) === 1)) warns.push("二重引用符が奇数個の値は、cmd では正しく扱えません。値を見直してください。");
    }
    if (shell === "ps5") warns.push("Windows PowerShell 5.1 は、内側の二重引用符を \\\" に直して渡す形で出力しています。PowerShell 7.3 以降では「PowerShell 7.3 以降」を選んでください。");

    return { errors, warns, shell, build2: { methodPart, authParts, timeParts, headers, bodyParts, url, opt, q } };
  }

  function render() {
    const err = $("cb-error"), warn = $("cb-warn"), out = $("cb-out");
    const r = build();
    err.textContent = r.errors.join(" / ");
    warn.innerHTML = r.warns.map((w) => "・" + esc(w)).join("<br>");
    if (r.errors.length) { out.textContent = ""; return; }
    const b = r.build2, opt = b.opt, q = b.q;
    const parts = [];
    ["s", "S", "i", "v", "L", "k", "g"].forEach((f) => { if (chk("cb-" + f)) parts.push(opt(f, null, null)); });
    if (chk("cb-compressed")) parts.push("--compressed");
    if (b.methodPart) parts.push(b.methodPart);
    b.timeParts.forEach((t) => parts.push(t));
    b.authParts.forEach((a) => parts.push(a));
    b.headers.forEach((h) => parts.push(opt("H", null, h)));
    b.bodyParts.forEach((p) => parts.push(p));
    parts.push(q(b.url));
    const head = r.shell === "ps5" || r.shell === "ps7" ? "curl.exe" : "curl";
    const cont = r.shell === "bash" ? " \\\n  " : r.shell === "cmd" ? " ^\n  " : " `\n  ";
    out.textContent = head + (chk("cb-oneline") ? " " + parts.join(" ") : cont + parts.join(cont));
  }

  function syncAuth() {
    const a = val("cb-auth");
    $("cb-basic-row").hidden = a !== "basic";
    $("cb-bearer-row").hidden = a !== "bearer";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ids = ["cb-method", "cb-url", "cb-headers", "cb-bodytype", "cb-auth", "cb-body", "cb-user", "cb-pass", "cb-token",
      "cb-maxtime", "cb-conntime", "cb-shell", "cb-s", "cb-S", "cb-i", "cb-v", "cb-L", "cb-k", "cb-g", "cb-compressed",
      "cb-jsonopt", "cb-minify", "cb-xalways", "cb-long", "cb-oneline"];
    ids.forEach((id) => {
      $(id).addEventListener("input", render);
      $(id).addEventListener("change", render);
    });
    $("cb-auth").addEventListener("change", syncAuth);
    syncAuth();
    render();
  });
})();
