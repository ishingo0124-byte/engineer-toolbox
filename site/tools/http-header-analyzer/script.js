(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // よく見るヘッダーの意味（一覧テーブル用の簡潔な説明）
  const MEANINGS = {
    "date": "レスポンスを生成したサーバー側の日時。",
    "content-type": "レスポンスボディのMIMEタイプと文字エンコーディング。",
    "content-length": "レスポンスボディのバイト数。",
    "content-encoding": "gzip等、ボディに適用された圧縮方式。",
    "transfer-encoding": "chunked等、転送時のエンコーディング方式。",
    "connection": "TCP接続の維持方法（keep-alive等）。",
    "server": "サーバーソフトウェア名とバージョン（情報漏えいに注意）。",
    "x-powered-by": "使用しているフレームワーク/言語の情報（情報漏えいに注意）。",
    "cache-control": "ブラウザ・中間キャッシュへの保存可否や保存期間の指示。",
    "expires": "レスポンスの有効期限（Cache-Controlのmax-ageが優先される）。",
    "etag": "リソースのバージョンを識別するタグ。条件付きリクエストに使用。",
    "last-modified": "リソースの最終更新日時。",
    "vary": "キャッシュを分岐させるリクエストヘッダーの指定。",
    "location": "リダイレクト先やPOST後の作成先リソースのURI。",
    "retry-after": "再試行までの待機時間（429/503等で使用）。",
    "strict-transport-security": "HSTS。今後常にHTTPSで接続するようブラウザに指示するセキュリティヘッダー。",
    "content-security-policy": "CSP。スクリプトや画像等の読み込み元を制限し、XSSの被害範囲を抑えるセキュリティヘッダー。",
    "content-security-policy-report-only": "CSPをブロックせず違反のみ報告するテスト用モード。",
    "x-content-type-options": "MIMEタイプの自動判定（スニッフィング）を無効化するセキュリティヘッダー。",
    "x-frame-options": "他サイトの<iframe>への埋め込みを制限し、クリックジャッキングを防ぐセキュリティヘッダー。",
    "referrer-policy": "他サイトへ遷移する際にReferer情報をどこまで送るか制御するセキュリティヘッダー。",
    "permissions-policy": "カメラ・位置情報等のブラウザ機能の利用可否を制御するセキュリティヘッダー。",
    "x-xss-protection": "旧ブラウザのXSSフィルタ制御（非推奨。現在はCSPが主流）。",
    "set-cookie": "Cookieの発行。Secure/HttpOnly/SameSite属性の有無がセキュリティに影響。",
    "access-control-allow-origin": "CORSで許可するオリジン。",
    "access-control-allow-credentials": "CORSでCookie等の認証情報付きリクエストを許可するか。",
    "x-aspnet-version": "ASP.NETのバージョン情報（情報漏えいに注意）。",
    "x-aspnetmvc-version": "ASP.NET MVCのバージョン情報（情報漏えいに注意）。",
    "x-generator": "生成に使用したCMS等の情報（情報漏えいに注意）。"
  };

  const LEAK_HEADERS = ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version", "x-generator"];

  function fmtDays(days) {
    const rounded = Math.round(days * 10) / 10;
    return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
  }

  // --- HTTPヘッダー文字列のパース ---
  function parseHeaders(raw) {
    const lines = raw.split(/\r?\n/);
    const headers = []; // [{name, value}] 出現順・重複可
    let statusLine = null;
    for (let line of lines) {
      line = line.trim();
      if (line === "") continue;
      // curl -v 形式の "< " / "> " プレフィックスを除去
      line = line.replace(/^[<>]\s*/, "");
      if (/^HTTP\/\d(\.\d)?\s+\d{3}/.test(line)) {
        statusLine = line;
        continue;
      }
      const idx = line.indexOf(":");
      if (idx === -1) continue; // ヘッダー行として解釈できない行は無視
      const name = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (name === "") continue;
      headers.push({ name, value });
    }
    return { statusLine, headers };
  }

  function groupByLower(headers) {
    const map = new Map();
    for (const h of headers) {
      const key = h.name.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h.value);
    }
    return map;
  }

  // --- セキュリティヘッダー評価 ---
  function evalHSTS(vals) {
    if (!vals.length) {
      return { status: "missing", note: "未設定です。HTTPS配信のサイトでは、常にHTTPSで接続させるためHSTSの設定を推奨します。", recommended: "max-age=31536000; includeSubDomains; preload" };
    }
    const v = vals[0];
    const m = /max-age=(\d+)/i.exec(v);
    if (!m) return { status: "bad", note: "max-age が見つかりません。", recommended: "max-age=31536000; includeSubDomains; preload" };
    const sec = parseInt(m[1], 10);
    const days = sec / 86400;
    const hasSub = /includesubdomains/i.test(v);
    const hasPreload = /preload/i.test(v);
    let status = "ok";
    let note = "max-age=" + sec + "秒（約" + fmtDays(days) + "日）。";
    if (sec === 0) { status = "bad"; note = "max-age=0 はHSTSの無効化を意味します。"; }
    else if (sec < 15552000) { status = "warn"; note += "推奨の180日（15552000秒）未満です。"; }
    else if (sec < 31536000) { status = "warn"; note += "180日以上ですが、プリロード登録の目安である1年（31536000秒）未満です。"; }
    if (status !== "bad") {
      if (!hasSub) { status = status === "ok" ? "warn" : status; note += " includeSubDomains が未指定です。"; }
      if (!hasPreload) note += " preload は未指定です（HSTSプリロードリスト登録には必須）。";
    }
    return { status, note, recommended: "max-age=31536000; includeSubDomains; preload" };
  }

  function evalCSP(vals) {
    if (!vals.length) {
      return { status: "missing", note: "未設定です。XSS等が発生した際の被害範囲を制限するCSPの設定を推奨します。", recommended: "default-src 'self'" };
    }
    const v = vals.join("; ");
    const issues = [];
    if (/unsafe-inline/i.test(v)) issues.push("'unsafe-inline' はインラインscript/styleを許可し、XSS対策としての効果を大きく弱めます");
    if (/unsafe-eval/i.test(v)) issues.push("'unsafe-eval' はeval()等の動的コード実行を許可します");
    if (/(?:^|[\s;])\*(?=[\s;]|$)/.test(v)) issues.push("ワイルドカード(*)によるソース許可はスコープが広すぎる可能性があります");
    if (!/default-src/i.test(v) && !/script-src/i.test(v)) issues.push("default-src / script-src が指定されていません");
    const status = issues.length ? "warn" : "ok";
    const note = issues.length ? issues.join("。") + "。" : "明らかな弱体化パターンは検出されませんでした（構文の妥当性までは検証していません）。";
    return { status, note, recommended: "default-src 'self'（必要な読み込み元のみ個別に許可）" };
  }

  function evalXCTO(vals) {
    if (!vals.length) return { status: "missing", note: "未設定です。MIMEスニッフィングによる意図しないコンテンツ実行を防ぐため nosniff を推奨します。", recommended: "nosniff" };
    const ok = vals.some((v) => v.trim().toLowerCase() === "nosniff");
    return ok ? { status: "ok", note: "nosniff が設定されています。" } : { status: "bad", note: "値が nosniff ではありません: " + vals.join(", "), recommended: "nosniff" };
  }

  function evalXFO(vals) {
    if (!vals.length) return { status: "warn", note: "未設定です。CSPのframe-ancestorsで代替できますが、古いブラウザ対応のため併用設定を推奨します。", recommended: "DENY または SAMEORIGIN" };
    const v = vals[0].trim().toUpperCase();
    if (v === "DENY" || v === "SAMEORIGIN") return { status: "ok", note: v + " が設定されています。" };
    return { status: "warn", note: "値が DENY/SAMEORIGIN 以外です: " + vals[0] + "（ALLOW-FROM は多くのブラウザで非対応です）", recommended: "DENY または SAMEORIGIN" };
  }

  function evalReferrer(vals) {
    if (!vals.length) return { status: "warn", note: "未設定です。未設定時はブラウザ既定値が使われますが、明示的な指定を推奨します。", recommended: "strict-origin-when-cross-origin" };
    const v = vals[0].trim().toLowerCase();
    if (v === "unsafe-url") return { status: "bad", note: "unsafe-url はHTTPS→HTTP遷移時も含め常にフルURLを送信し、機密情報を含むURLが第三者に漏えいするおそれがあります。", recommended: "strict-origin-when-cross-origin" };
    if (v === "no-referrer-when-downgrade") return { status: "warn", note: "旧ブラウザ既定値相当です。より制限的な値への変更を検討してください。", recommended: "strict-origin-when-cross-origin" };
    return { status: "ok", note: "\"" + vals[0] + "\" が設定されています。" };
  }

  function evalPermissions(vals) {
    if (!vals.length) return { status: "warn", note: "未設定です。カメラ・位置情報等のブラウザ機能を使わない場合は制限設定を検討してください。", recommended: "camera=(), microphone=(), geolocation=()" };
    return { status: "ok", note: vals.join("; ") + " が設定されています。" };
  }

  function evalCacheControl(vals) {
    if (!vals.length) return { status: "warn", note: "未設定です。ログイン後の個人情報を含むページ等では no-store の明示指定を推奨します。", recommended: "no-store（機密情報を含む場合）" };
    const v = vals.join(", ").toLowerCase();
    if (v.indexOf("no-store") !== -1) return { status: "ok", note: "no-store が指定されており、ブラウザ・中間キャッシュへの保存が防止されます。" };
    if (v.indexOf("private") !== -1) return { status: "ok", note: "private が指定されており、共有キャッシュへの保存は防止されます（特に機密性が高い場合はno-storeを検討）。" };
    if (v.indexOf("public") !== -1) return { status: "warn", note: "public はCDN等の共有キャッシュにも保存されます。機密情報を含むレスポンスでは注意してください。" };
    return { status: "ok", note: vals.join(", ") };
  }

  function evalSetCookie(vals) {
    if (!vals.length) return { status: "ok", note: "Set-Cookie ヘッダーは検出されませんでした。" };
    let anyIssue = false;
    const parts2 = vals.map((v) => {
      const attrs = v.split(";").map((s) => s.trim());
      const cname = (attrs[0] || "").split("=")[0];
      const hasSecure = attrs.some((p) => /^secure$/i.test(p));
      const hasHttpOnly = attrs.some((p) => /^httponly$/i.test(p));
      const ssAttr = attrs.find((p) => /^samesite=/i.test(p));
      const sameSite = ssAttr ? ssAttr.split("=")[1] : null;
      const issues = [];
      if (!hasSecure) issues.push("Secure属性なし");
      if (!hasHttpOnly) issues.push("HttpOnly属性なし（JavaScriptからの読み取りを許可）");
      if (sameSite && sameSite.toLowerCase() === "none" && !hasSecure) issues.push("SameSite=NoneにはSecure属性が必須");
      if (!sameSite) issues.push("SameSite未指定（多くの主要ブラウザはLax扱い）");
      if (issues.length) anyIssue = true;
      return cname + ": " + (issues.length ? issues.join("、") : "主要属性は妥当です");
    });
    return { status: anyIssue ? "warn" : "ok", note: parts2.join(" / ") };
  }

  const SECURITY_HEADERS = [
    { key: "strict-transport-security", label: "Strict-Transport-Security（HSTS）", evaluate: evalHSTS },
    { key: "content-security-policy", label: "Content-Security-Policy（CSP）", evaluate: evalCSP },
    { key: "x-content-type-options", label: "X-Content-Type-Options", evaluate: evalXCTO },
    { key: "x-frame-options", label: "X-Frame-Options", evaluate: evalXFO },
    { key: "referrer-policy", label: "Referrer-Policy", evaluate: evalReferrer },
    { key: "permissions-policy", label: "Permissions-Policy", evaluate: evalPermissions },
    { key: "cache-control", label: "Cache-Control", evaluate: evalCacheControl },
    { key: "set-cookie", label: "Set-Cookie（Secure / HttpOnly / SameSite）", evaluate: evalSetCookie }
  ];

  const STATUS_META = {
    ok: { label: "OK", cls: "s-ok" },
    warn: { label: "要確認", cls: "s-warn" },
    missing: { label: "未設定", cls: "s-missing" },
    bad: { label: "不適切", cls: "s-bad" }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function run() {
    const errEl = $("hha-error");
    errEl.textContent = "";
    const raw = $("hha-input").value;
    const { headers } = parseHeaders(raw);
    const grouped = groupByLower(headers);

    $("hha-count").textContent = String(headers.length);
    const tbody = document.querySelector("#hha-table tbody");
    if (headers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="hha-empty">ヘッダーを貼り付けると一覧が表示されます。</td></tr>';
    } else {
      tbody.innerHTML = headers.map((h) => {
        const meaning = MEANINGS[h.name.toLowerCase()] || "（説明未登録の一般的なヘッダーです）";
        return "<tr><td class=\"hha-name\">" + esc(h.name) + "</td><td class=\"hha-val\">" + esc(h.value) + "</td><td>" + esc(meaning) + "</td></tr>";
      }).join("");
    }

    const checklistEl = $("hha-checklist");
    checklistEl.innerHTML = SECURITY_HEADERS.map((def) => {
      const vals = grouped.get(def.key) || [];
      const r = def.evaluate(vals);
      const meta = STATUS_META[r.status];
      return (
        '<div class="hha-check"><div class="hha-head"><strong>' + esc(def.label) + "</strong>" +
        '<span class="hha-badge ' + meta.cls + '">' + meta.label + "</span></div>" +
        "<p>" + esc(r.note) + "</p>" +
        (r.recommended && r.status !== "ok" ? '<p class="hha-rec">推奨値の例: <span class="mono">' + esc(r.recommended) + "</span></p>" : "") +
        "</div>"
      );
    }).join("");

    const leaksEl = $("hha-leaks");
    const found = LEAK_HEADERS.filter((k) => grouped.has(k));
    if (found.length === 0) {
      leaksEl.innerHTML = '<p class="hha-empty">Server / X-Powered-By 等、サーバー実装を推測させるヘッダーは検出されませんでした。</p>';
    } else {
      leaksEl.innerHTML = found.map((k) => {
        const vals = grouped.get(k);
        return '<div class="hha-leak"><span class="hha-name">' + esc(k) + "</span>: <span class=\"hha-val\">" + esc(vals.join(", ")) +
          "</span><p>攻撃者に使用ソフトウェアやバージョンの手がかりを与える可能性があります。不要であれば配信設定（リバースプロキシ等）で削除・匿名化を検討してください。</p></div>";
      }).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("hha-input").addEventListener("input", run);
    $("hha-clear").addEventListener("click", () => { $("hha-input").value = ""; run(); });
    run();
  });
})();
