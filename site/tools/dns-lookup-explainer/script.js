(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const TYPE_DESC = {
    A: "IPv4アドレスを示すレコード。",
    AAAA: "IPv6アドレスを示すレコード。",
    CNAME: "正規のドメイン名への別名（エイリアス）。参照先の名前がさらに解決される。",
    MX: "メールの配送先サーバーと優先度（数値が小さいほど優先）を示すレコード。",
    NS: "そのゾーンを管理する権威DNSサーバーを示すレコード。",
    TXT: "任意のテキスト情報を格納するレコード。SPF/DKIM等のメール認証やドメイン所有権確認に使われることが多い。",
    SOA: "ゾーンの管理情報（プライマリサーバー・管理者・シリアル番号・再試行間隔等）を示すレコード。ゾーンごとに1つ。",
    PTR: "IPアドレスからホスト名への逆引きに使うレコード。",
    SRV: "サービスを提供するホストとポート番号、優先度・重みを示すレコード。",
    CAA: "そのドメインに証明書を発行できる認証局(CA)を制限するレコード。",
    OPT: "EDNS0の拡張情報を運ぶ疑似レコード（ADDITIONAL SECTIONに現れる）。"
  };

  const FLAG_DESC = {
    qr: "Query/Response — このメッセージが「応答」であることを示す",
    aa: "Authoritative Answer — 権威DNSサーバー自身からの正式な回答",
    rd: "Recursion Desired — クライアントが再帰的な問い合わせを要求した",
    ra: "Recursion Available — 問い合わせ先サーバーが再帰的な問い合わせに対応している",
    ad: "Authenticated Data — DNSSECにより検証済みのデータであることを示す",
    cd: "Checking Disabled — DNSSEC検証を行わないようクライアントが要求した",
    tc: "TrunCated — 応答がサイズ制限（主にUDP 512byte）により切り詰められた"
  };

  const STATUS_DESC = {
    NOERROR: "エラーなし。ただしANSWERが0件の場合、該当タイプのレコードが存在しない（NODATA）ことを示す場合があります。",
    NXDOMAIN: "問い合わせたドメイン名自体が存在しません。",
    SERVFAIL: "権威サーバーの異常やDNSSEC検証失敗など、サーバー側の問題で正常に応答できませんでした。",
    REFUSED: "サーバーがこのクエリへの応答を拒否しました（アクセス制限等）。",
    FORMERR: "クエリメッセージの形式が不正です。",
    NOTIMP: "サーバーがその種類のクエリ（機能）に対応していません。"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtDuration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const parts = [];
    if (d > 0) parts.push(d + "日");
    if (d > 0 || h > 0) parts.push(h + "時間");
    if (d === 0 && (h > 0 || m > 0)) parts.push(m + "分");
    if (d === 0 && h === 0) parts.push(s + "秒");
    return parts.length ? parts.join("") : "0秒";
  }

  function normName(n) {
    return (n || "").replace(/\.$/, "").toLowerCase();
  }

  // --- dig 形式の解析 ---
  function isDigFormat(text) {
    return /;;\s*->>HEADER<<-/.test(text) || /;;\s*(QUESTION|ANSWER|AUTHORITY|ADDITIONAL)\s*SECTION:/i.test(text);
  }

  function parseDig(text) {
    const lines = text.split(/\r?\n/);
    const result = { header: null, flags: null, sections: { QUESTION: [], ANSWER: [], AUTHORITY: [], ADDITIONAL: [] }, meta: {} };
    let currentSection = null;

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, "");
      const hm = /^;;\s*->>HEADER<<-\s*opcode:\s*([A-Za-z]+),\s*status:\s*([A-Za-z]+),\s*id:\s*(\d+)/.exec(line);
      if (hm) { result.header = { opcode: hm[1], status: hm[2].toUpperCase(), id: hm[3] }; continue; }

      const fm = /^;;\s*flags:\s*([a-z ]*);\s*QUERY:\s*(\d+),\s*ANSWER:\s*(\d+),\s*AUTHORITY:\s*(\d+),\s*ADDITIONAL:\s*(\d+)/i.exec(line);
      if (fm) {
        result.flags = { list: fm[1].trim().split(/\s+/).filter(Boolean), counts: { QUERY: fm[2], ANSWER: fm[3], AUTHORITY: fm[4], ADDITIONAL: fm[5] } };
        continue;
      }

      const sm = /^;;\s*(QUESTION|ANSWER|AUTHORITY|ADDITIONAL)\s*SECTION:/i.exec(line);
      if (sm) { currentSection = sm[1].toUpperCase(); continue; }

      const wm = /^;;\s*WHEN:\s*(.+)$/i.exec(line);
      if (wm) { result.meta.when = wm[1].trim(); continue; }
      const svm = /^;;\s*SERVER:\s*(.+)$/i.exec(line);
      if (svm) { result.meta.server = svm[1].trim(); continue; }
      const qtm = /^;;\s*Query time:\s*(.+)$/i.exec(line);
      if (qtm) { result.meta.queryTime = qtm[1].trim(); continue; }

      if (line.trim() === "") { continue; }
      if (line.trim().indexOf(";") === 0 && line.trim().indexOf(";;") !== 0 && currentSection === "QUESTION") {
        // ;name.  IN  A
        const t = line.trim().slice(1).trim().split(/\s+/);
        if (t.length >= 3) {
          result.sections.QUESTION.push({ name: t[0], ttl: null, cls: t[1], type: t[2], rdata: "" });
        }
        continue;
      }
      if (line.trim().indexOf(";") === 0) continue; // その他コメント行は無視

      if (currentSection && result.sections[currentSection]) {
        const t = line.trim().split(/\s+/);
        if (t.length >= 4) {
          const [name, ttl, cls, type, ...rest] = t;
          if (/^\d+$/.test(ttl)) {
            result.sections[currentSection].push({ name, ttl: parseInt(ttl, 10), cls, type: type.toUpperCase(), rdata: rest.join(" ") });
          }
        }
      }
    }
    return result;
  }

  // --- nslookup 形式の解析 ---
  function isNslookupFormat(text) {
    return /^Server:/im.test(text) || /^Address:\s*.+#\d+/im.test(text) || /canonical name =/i.test(text) || /^Name:\s*/im.test(text);
  }

  function parseNslookup(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const result = { server: null, records: [], soa: null, nonAuth: false };
    let pendingName = null;
    let soaCtx = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === "") continue;

      let m;
      if ((m = /^Server:\s*(.+)$/i.exec(line))) { result.server = m[1]; continue; }
      if (/^non-authoritative answer:/i.test(line)) { result.nonAuth = true; continue; }
      if ((m = /^Name:\s*(.+)$/i.exec(line))) { pendingName = m[1]; continue; }
      if ((m = /^Address(?:es)?:\s*([0-9a-fA-F.:]+)$/i.exec(line))) {
        const isV6 = m[1].indexOf(":") !== -1;
        result.records.push({ name: pendingName || "(不明)", type: isV6 ? "AAAA" : "A", rdata: m[1] });
        continue;
      }
      if ((m = /^(\S+)\s+canonical name = (\S+?)\.?$/i.exec(line))) {
        result.records.push({ name: m[1], type: "CNAME", rdata: m[2] });
        continue;
      }
      if ((m = /^(\S+)\s+nameserver = (\S+?)\.?$/i.exec(line))) {
        result.records.push({ name: m[1], type: "NS", rdata: m[2] });
        continue;
      }
      if ((m = /^(\S+)\s+mail exchanger = (\d+)\s+(\S+?)\.?$/i.exec(line))) {
        result.records.push({ name: m[1], type: "MX", rdata: m[2] + " " + m[3] });
        continue;
      }
      if ((m = /^(\S+)\s+text = "(.*)"$/i.exec(line))) {
        result.records.push({ name: m[1], type: "TXT", rdata: m[2] });
        continue;
      }
      if ((m = /^origin = (\S+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.mname = m[1]; continue; }
      if ((m = /^mail addr = (\S+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.rname = m[1]; continue; }
      if ((m = /^serial\s*=\s*(\d+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.serial = m[1]; continue; }
      if ((m = /^refresh\s*=\s*(\d+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.refresh = m[1]; continue; }
      if ((m = /^retry\s*=\s*(\d+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.retry = m[1]; continue; }
      if ((m = /^expire\s*=\s*(\d+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.expire = m[1]; continue; }
      if ((m = /^minimum\s*=\s*(\d+)$/i.exec(line))) { soaCtx = soaCtx || {}; soaCtx.minimum = m[1]; result.soa = soaCtx; continue; }
    }
    return result;
  }

  function rrRow(rr) {
    const desc = TYPE_DESC[rr.type] || "（説明未登録のレコード種別です）";
    return (
      "<tr><td class=\"mono\">" + esc(rr.name) + "</td>" +
      "<td>" + (rr.ttl != null ? esc(String(rr.ttl)) + "秒<br><span class=\"hint\">≈ " + esc(fmtDuration(rr.ttl)) + "</span>" : "<span class=\"hint\">(質問には無し)</span>") + "</td>" +
      "<td>" + esc(rr.cls || "") + "</td>" +
      "<td class=\"dle-type\">" + esc(rr.type) + "</td>" +
      "<td class=\"mono\">" + esc(rr.rdata || "") + "</td>" +
      "<td class=\"hint\">" + esc(desc) + "</td></tr>"
    );
  }

  function soaBlockHtml(rdata) {
    const t = rdata.trim().split(/\s+/);
    if (t.length < 7) return "";
    const [mname, rname, serial, refresh, retry, expire, minimum] = t;
    return (
      '<div class="result"><p class="hint">SOAレコードの内訳</p><dl class="result-grid dle-soa">' +
      "<dt>mname（プライマリDNSサーバー）</dt><dd class=\"mono\">" + esc(mname) + "</dd>" +
      "<dt>rname（管理者メールアドレス。最初の.が@に相当）</dt><dd class=\"mono\">" + esc(rname) + "</dd>" +
      "<dt>serial（シリアル番号。更新のたびに増加）</dt><dd class=\"mono\">" + esc(serial) + "</dd>" +
      "<dt>refresh（セカンダリがゾーン更新を確認する間隔）</dt><dd class=\"mono\">" + esc(refresh) + "秒（" + fmtDuration(parseInt(refresh, 10) || 0) + "）</dd>" +
      "<dt>retry（refresh失敗後の再試行間隔）</dt><dd class=\"mono\">" + esc(retry) + "秒（" + fmtDuration(parseInt(retry, 10) || 0) + "）</dd>" +
      "<dt>expire（セカンダリが古い情報を破棄するまでの期限）</dt><dd class=\"mono\">" + esc(expire) + "秒（" + fmtDuration(parseInt(expire, 10) || 0) + "）</dd>" +
      "<dt>minimum（ネガティブキャッシュのTTL。RFC 2308）</dt><dd class=\"mono\">" + esc(minimum) + "秒（" + fmtDuration(parseInt(minimum, 10) || 0) + "）</dd>" +
      "</dl></div>"
    );
  }

  function renderDig(parsed) {
    let html = "";
    if (parsed.header) {
      const st = parsed.header.status;
      html += '<div class="result"><dl class="result-grid">' +
        "<dt>opcode</dt><dd>" + esc(parsed.header.opcode) + "</dd>" +
        "<dt>status</dt><dd>" + esc(st) + (STATUS_DESC[st] ? " — " + esc(STATUS_DESC[st]) : "") + "</dd>" +
        "<dt>id</dt><dd>" + esc(parsed.header.id) + "（クエリとレスポンスを対応付けるトランザクションID）</dd>" +
        "</dl></div>";
    }
    if (parsed.flags) {
      const allFlags = ["qr", "aa", "tc", "rd", "ra", "ad", "cd"];
      html += '<p class="dle-sec">flags</p><div>' + allFlags.map((f) => {
        const on = parsed.flags.list.indexOf(f) !== -1;
        return '<span class="dle-chip' + (on ? " on" : "") + '" title="' + esc(FLAG_DESC[f] || "") + '">' + f + (on ? "" : "（無効）") + "</span>";
      }).join("") + "</div>";
      html += '<p class="hint">' + allFlags.filter((f) => parsed.flags.list.indexOf(f) !== -1).map((f) => f + ": " + FLAG_DESC[f]).join(" / ") + "</p>";
      const c = parsed.flags.counts;
      html += '<p class="hint">QUESTION: ' + c.QUERY + " / ANSWER: " + c.ANSWER + " / AUTHORITY: " + c.AUTHORITY + " / ADDITIONAL: " + c.ADDITIONAL + "</p>";
    }
    if (parsed.meta.server || parsed.meta.when || parsed.meta.queryTime) {
      html += '<p class="hint">' +
        (parsed.meta.server ? "問い合わせ先サーバー: " + esc(parsed.meta.server) + " " : "") +
        (parsed.meta.queryTime ? " / 応答時間: " + esc(parsed.meta.queryTime) : "") +
        (parsed.meta.when ? " / 照会日時: " + esc(parsed.meta.when) : "") + "</p>";
    }

    const sectionLabels = {
      QUESTION: "QUESTION SECTION（問い合わせの内容）",
      ANSWER: "ANSWER SECTION（回答レコード）",
      AUTHORITY: "AUTHORITY SECTION（権威サーバー情報。委任やSOAが入ることが多い）",
      ADDITIONAL: "ADDITIONAL SECTION（補足情報。権威サーバーのAレコード等）"
    };
    ["QUESTION", "ANSWER", "AUTHORITY", "ADDITIONAL"].forEach((secName) => {
      const rows = parsed.sections[secName];
      if (!rows.length) return;
      html += '<p class="dle-sec">' + sectionLabels[secName] + "</p>";
      html += '<div class="dle-tbl-wrap"><table class="dle-tbl"><thead><tr><th>name</th><th>TTL</th><th>class</th><th>type</th><th>rdata</th><th>意味</th></tr></thead><tbody>' +
        rows.map(rrRow).join("") + "</tbody></table></div>";
      rows.forEach((r) => { if (r.type === "SOA") html += soaBlockHtml(r.rdata); });
    });
    return html;
  }

  function renderNslookup(parsed) {
    let html = "";
    html += '<div class="result"><dl class="result-grid">' +
      "<dt>問い合わせ先サーバー</dt><dd>" + esc(parsed.server || "(不明)") + "</dd>" +
      "<dt>回答の種別</dt><dd>" + (parsed.nonAuth ? "非権威応答（Non-authoritative。キャッシュを持つリゾルバからの回答）" : "権威応答、または種別の記載なし") + "</dd>" +
      "</dl></div>";
    if (parsed.records.length) {
      html += '<p class="dle-sec">検出されたレコード</p>';
      html += '<div class="dle-tbl-wrap"><table class="dle-tbl"><thead><tr><th>name</th><th>type</th><th>rdata</th><th>意味</th></tr></thead><tbody>' +
        parsed.records.map((r) => "<tr><td class=\"mono\">" + esc(r.name) + "</td><td class=\"dle-type\">" + esc(r.type) + "</td><td class=\"mono\">" + esc(r.rdata) +
          "</td><td class=\"hint\">" + esc(TYPE_DESC[r.type] || "") + "</td></tr>").join("") + "</tbody></table></div>";
    } else {
      html += '<p class="dle-empty">Name/Address等のレコード情報は検出されませんでした。</p>';
    }
    if (parsed.soa) {
      html += soaBlockHtml([parsed.soa.mname, parsed.soa.rname, parsed.soa.serial, parsed.soa.refresh, parsed.soa.retry, parsed.soa.expire, parsed.soa.minimum].join(" "));
    }
    return html;
  }

  function buildChainFromDig(parsed) {
    const answer = parsed.sections.ANSWER;
    if (!answer.length) return null;
    return buildChainGeneric(answer.map((r) => ({ name: r.name, type: r.type, rdata: r.rdata })));
  }
  function buildChainFromNslookup(parsed) {
    if (!parsed.records.length) return null;
    return buildChainGeneric(parsed.records);
  }
  function buildChainGeneric(recs) {
    const cnames = recs.filter((r) => r.type === "CNAME");
    if (!cnames.length) return null;
    const byName = new Map();
    recs.forEach((r) => { const k = normName(r.name); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(r); });
    let current = cnames[0];
    const chain = [{ name: current.name, type: current.type, rdata: current.rdata }];
    const seen = new Set([normName(current.name)]);
    let guard = 0;
    while (current.type === "CNAME" && guard++ < 20) {
      const nextKey = normName(current.rdata);
      const candidates = byName.get(nextKey);
      if (!candidates || !candidates.length || seen.has(nextKey)) break;
      const next = candidates[0];
      chain.push({ name: next.name, type: next.type, rdata: next.rdata });
      seen.add(nextKey);
      current = next;
    }
    return chain;
  }

  function renderChain(chain) {
    if (!chain || chain.length < 2) return "";
    const segs = [];
    segs.push('<span class="seg">' + esc(chain[0].name) + "</span>");
    for (let i = 0; i < chain.length; i++) {
      segs.push("→");
      segs.push('<span class="seg">' + esc(chain[i].rdata) + (i === chain.length - 1 ? " (" + esc(chain[i].type === "CNAME" ? "続きは検出できず" : chain[i].type) + ")" : " (CNAME)") + "</span>");
    }
    return '<p class="dle-sec">CNAMEチェーン</p><div class="dle-chain">' + segs.join(" ") + "</div>";
  }

  function run() {
    const errEl = $("dle-error");
    const fmtEl = $("dle-format");
    const headerEl = $("dle-header-block");
    const sectionsEl = $("dle-sections");
    const chainEl = $("dle-chain-block");
    errEl.textContent = "";
    headerEl.innerHTML = "";
    sectionsEl.innerHTML = "";
    chainEl.innerHTML = "";
    fmtEl.textContent = "";

    const raw = $("dle-input").value;
    if (raw.trim() === "") return;

    if (isDigFormat(raw)) {
      fmtEl.textContent = "dig 形式として解析しました。";
      const parsed = parseDig(raw);
      if (!parsed.header && !parsed.flags && Object.values(parsed.sections).every((a) => a.length === 0)) {
        errEl.textContent = "dig の出力らしき特徴（;; ->>HEADER<<- 等）はありますが、解析できる行が見つかりませんでした。";
        return;
      }
      sectionsEl.innerHTML = renderDig(parsed);
      chainEl.innerHTML = renderChain(buildChainFromDig(parsed));
    } else if (isNslookupFormat(raw)) {
      fmtEl.textContent = "nslookup 形式として解析しました。";
      const parsed = parseNslookup(raw);
      sectionsEl.innerHTML = renderNslookup(parsed);
      chainEl.innerHTML = renderChain(buildChainFromNslookup(parsed));
    } else {
      errEl.textContent = "dig または nslookup の出力として認識できませんでした。「;; ->>HEADER<<-」「;; ANSWER SECTION:」「Non-authoritative answer:」「Name:」等の行が含まれる出力を貼り付けてください。";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("dle-input").addEventListener("input", run);
    $("dle-clear").addEventListener("click", () => { $("dle-input").value = ""; run(); });
    run();
  });
})();
