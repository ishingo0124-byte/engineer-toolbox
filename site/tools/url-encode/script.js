(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function currentMethod() {
    const el = document.querySelector('input[name="ue-method"]:checked');
    return el ? el.value : "component";
  }

  function encodeStr(text, method, plus) {
    let s = method === "uri" ? encodeURI(text) : encodeURIComponent(text);
    if (plus) s = s.replace(/%20/g, "+");
    return s;
  }

  function decodeStr(text, plus) {
    const s = plus ? text.replace(/\+/g, "%20") : text;
    try {
      return decodeURIComponent(s);
    } catch (e) {
      throw new Error("不正な % エスケープシーケンスが含まれています（例: %GG のような不正な16進数、末尾が %XX で終わっていない、など）");
    }
  }

  function runFromText() {
    const err = $("ue-error");
    try {
      $("ue-encoded").value = encodeStr($("ue-text").value, currentMethod(), $("ue-plus").checked);
      err.textContent = "";
    } catch (e) {
      err.textContent = "エンコードエラー: " + e.message;
    }
  }

  function runFromEncoded() {
    const err = $("ue-error");
    try {
      $("ue-text").value = decodeStr($("ue-encoded").value, $("ue-plus").checked);
      err.textContent = "";
    } catch (e) {
      err.textContent = "デコードエラー: " + e.message;
    }
  }

  function parseQuery(urlStr) {
    let query;
    try {
      const u = new URL(urlStr);
      query = u.search.replace(/^\?/, "");
    } catch (e) {
      const s = urlStr.trim();
      const idx = s.indexOf("?");
      if (idx !== -1) query = s.slice(idx + 1);
      else if (s.startsWith("?")) query = s.slice(1);
      else query = s;
    }
    query = query.split("#")[0];
    if (query.trim() === "") return [];
    return query.split("&").filter((p) => p !== "").map((pair) => {
      const eq = pair.indexOf("=");
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawVal = eq === -1 ? "" : pair.slice(eq + 1);
      let key, val;
      try { key = decodeURIComponent(rawKey.replace(/\+/g, " ")); } catch (e) { key = rawKey + "（デコード失敗）"; }
      try { val = decodeURIComponent(rawVal.replace(/\+/g, " ")); } catch (e) { val = rawVal + "（デコード失敗）"; }
      return { key: key, val: val };
    });
  }

  function renderTable() {
    const body = $("ue-table-body");
    const errEl = $("ue-url-error");
    body.innerHTML = "";
    errEl.textContent = "";
    const raw = $("ue-url").value;
    if (raw.trim() === "") return;
    let rows;
    try {
      rows = parseQuery(raw);
    } catch (e) {
      errEl.textContent = "解析エラー: " + e.message;
      return;
    }
    if (rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "hint";
      td.textContent = "クエリ文字列が見つかりませんでした（? 以降がありません）";
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      const tdK = document.createElement("td");
      tdK.textContent = r.key;
      tdK.className = "mono";
      const tdV = document.createElement("td");
      tdV.textContent = r.val;
      tdV.className = "mono";
      tr.appendChild(tdK);
      tr.appendChild(tdV);
      body.appendChild(tr);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ue-text").addEventListener("input", runFromText);
    $("ue-encoded").addEventListener("input", runFromEncoded);
    $("ue-plus").addEventListener("change", runFromText);
    document.querySelectorAll('input[name="ue-method"]').forEach((r) => r.addEventListener("change", runFromText));
    $("ue-clear").addEventListener("click", () => {
      $("ue-text").value = "";
      $("ue-encoded").value = "";
      $("ue-error").textContent = "";
      $("ue-text").focus();
    });
    $("ue-url").addEventListener("input", renderTable);
    runFromText();
    renderTable();
  });
})();
