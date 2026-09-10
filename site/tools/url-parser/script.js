(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const DEFAULT_PORTS = {
    "http:": "80", "https:": "443", "ftp:": "21", "ftps:": "990",
    "ws:": "80", "wss:": "443", "gopher:": "70"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return s + "（デコード失敗: 不正な%エンコーディング）"; }
  }

  // 入力文字列から「スキーム・userinfoの後 〜 ポートまたはパス開始の前」のホスト表記（Unicode）を素朴に抜き出す。
  // URL API の hostname は常にpunycode(ASCII)化されるため、入力側の見た目を別途表示する。
  function extractRawHost(raw) {
    const m = /^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/(?:[^@/?#]*@)?(\[[^\]]*\]|[^/?#:]+)/.exec(raw.trim());
    return m ? m[1] : null;
  }

  function run() {
    const errEl = $("up-error");
    const resultEl = $("up-result");
    errEl.textContent = "";
    resultEl.hidden = true;

    const raw = $("up-input").value.trim();
    if (raw === "") return;

    let u;
    try {
      u = new URL(raw);
    } catch (e) {
      errEl.textContent = "URLとして解析できません。scheme（https:// など）から始まる絶対URLを入力してください。";
      return;
    }

    $("up-scheme").textContent = u.protocol.replace(/:$/, "");
    const userinfo = u.username ? (u.username + (u.password ? ":" + "*".repeat(u.password.length) : "")) : "(なし)";
    $("up-userinfo").textContent = userinfo + (u.username ? "（パスワードは伏字表示。値: username=" + u.username + (u.password ? ", password=" + u.password : "") + "）" : "");
    $("up-host").textContent = u.hostname || "(なし)";
    const rawHost = extractRawHost(raw);
    $("up-host-unicode").textContent = rawHost && rawHost !== u.hostname ? rawHost + "（punycode: " + u.hostname + "）" : (rawHost || "(なし)") + "（ASCIIのみ、punycode変換なし）";
    const defPort = DEFAULT_PORTS[u.protocol];
    if (u.port) {
      $("up-port").textContent = u.port + "（明示指定）";
    } else if (defPort) {
      $("up-port").textContent = defPort + "（" + u.protocol + " の既定値。URL中には省略されています）";
    } else {
      $("up-port").textContent = "(不明。このスキームに既定ポートの定義がありません)";
    }
    $("up-origin").textContent = u.origin;
    $("up-hash").textContent = u.hash ? safeDecode(u.hash.slice(1)) + "（raw: " + u.hash + "）" : "(なし)";

    const segEl = $("up-segments");
    const segs = u.pathname.split("/").filter((s, i) => !(i === 0 && s === ""));
    if (segs.length === 0 || (segs.length === 1 && segs[0] === "")) {
      segEl.innerHTML = '<li class="hint">(パスセグメントなし。ルート "/" )</li>';
    } else {
      segEl.innerHTML = segs.map((s) => "<li>" + esc(safeDecode(s)) + "</li>").join("");
    }

    const qBody = document.querySelector("#up-query-tbl tbody");
    const params = Array.from(new URLSearchParams(u.search).entries());
    if (params.length === 0) {
      qBody.innerHTML = '<tr><td colspan="3" class="hint">クエリパラメータなし</td></tr>';
    } else {
      qBody.innerHTML = params.map((p, i) => "<tr><td>" + (i + 1) + "</td><td class=\"mono\">" + esc(p[0]) + "</td><td class=\"mono\">" + esc(p[1]) + "</td></tr>").join("");
    }

    resultEl.hidden = false;
  }

  function runBuilder() {
    const errEl = $("up-b-error");
    const resultEl = $("up-b-result");
    errEl.textContent = "";
    resultEl.hidden = true;

    const scheme = $("up-b-scheme").value.trim() || "http";
    const host = $("up-b-host").value.trim();
    if (host === "") { errEl.textContent = "host を入力してください。"; return; }

    let u;
    try {
      u = new URL(scheme.replace(/:$/, "") + "://placeholder.invalid/");
      u.hostname = host;
      const user = $("up-b-user").value;
      const pass = $("up-b-pass").value;
      if (user) u.username = user;
      if (pass) u.password = pass;
      const port = $("up-b-port").value.trim();
      if (port) u.port = port;
      const path = $("up-b-path").value;
      u.pathname = path ? (path.indexOf("/") === 0 ? path : "/" + path) : "/";
      const query = $("up-b-query").value.trim();
      u.search = query ? "?" + query : "";
      const hash = $("up-b-hash").value.trim();
      u.hash = hash ? "#" + hash : "";
    } catch (e) {
      errEl.textContent = "組み立てに失敗しました: " + e.message;
      return;
    }

    $("up-b-assembled").textContent = u.href;
    resultEl.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("up-input").addEventListener("input", run);
    ["up-b-scheme", "up-b-user", "up-b-pass", "up-b-host", "up-b-port", "up-b-path", "up-b-query", "up-b-hash"].forEach((id) => {
      $(id).addEventListener("input", runBuilder);
    });
    run();
    runBuilder();
  });
})();
