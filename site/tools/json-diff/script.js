(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function typeOf(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v; // "object" | "string" | "number" | "boolean"
  }

  function fmtKey(k) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? "." + k : "[" + JSON.stringify(k) + "]";
  }

  function short(v) {
    let s;
    try { s = JSON.stringify(v); } catch (e) { s = String(v); }
    if (s === undefined) s = String(v);
    return s.length > 80 ? s.slice(0, 80) + "…" : s;
  }

  function canon(v) {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === "object") {
      const o = {};
      Object.keys(v).sort().forEach((k) => { o[k] = canon(v[k]); });
      return o;
    }
    return v;
  }

  function multisetDiff(path, a, b, out) {
    const ca = new Map(), cb = new Map();
    a.forEach((v) => { const k = JSON.stringify(canon(v)); ca.set(k, (ca.get(k) || 0) + 1); });
    b.forEach((v) => { const k = JSON.stringify(canon(v)); cb.set(k, (cb.get(k) || 0) + 1); });
    const keys = new Set([...ca.keys(), ...cb.keys()]);
    keys.forEach((k) => {
      const na = ca.get(k) || 0, nb = cb.get(k) || 0;
      if (na === nb) return;
      const val = JSON.parse(k);
      if (nb > na) out.push({ kind: "added", path: path + "[]", detail: short(val) + (nb - na > 1 ? " ×" + (nb - na) : "") });
      else out.push({ kind: "removed", path: path + "[]", detail: short(val) + (na - nb > 1 ? " ×" + (na - nb) : "") });
    });
  }

  function diffValues(path, a, b, ignoreOrder, out) {
    const ta = typeOf(a), tb = typeOf(b);
    if (ta !== tb) {
      out.push({ kind: "type", path: path, detail: ta + " " + short(a) + " → " + tb + " " + short(b) });
      return;
    }
    if (ta === "object") {
      const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
      keys.forEach((k) => {
        const p = path + fmtKey(k);
        if (!(k in a)) out.push({ kind: "added", path: p, detail: short(b[k]) });
        else if (!(k in b)) out.push({ kind: "removed", path: p, detail: short(a[k]) });
        else diffValues(p, a[k], b[k], ignoreOrder, out);
      });
    } else if (ta === "array") {
      if (ignoreOrder) {
        multisetDiff(path, a, b, out);
      } else {
        const len = Math.max(a.length, b.length);
        for (let i = 0; i < len; i++) {
          const p = path + "[" + i + "]";
          if (i >= a.length) out.push({ kind: "added", path: p, detail: short(b[i]) });
          else if (i >= b.length) out.push({ kind: "removed", path: p, detail: short(a[i]) });
          else diffValues(p, a[i], b[i], ignoreOrder, out);
        }
      }
    } else {
      if (a !== b) out.push({ kind: "changed", path: path, detail: short(a) + " → " + short(b) });
    }
  }

  function formatError(text, e) {
    const m = /position (\d+)/.exec(e.message);
    if (!m) return e.message;
    const pos = parseInt(m[1], 10);
    const upto = text.slice(0, pos);
    const line = (upto.match(/\n/g) || []).length + 1;
    const col = pos - upto.lastIndexOf("\n");
    return e.message + "（" + line + "行目 " + col + "文字目付近）";
  }

  function parseJson(text) {
    if (text.trim() === "") throw new SyntaxError("入力が空です");
    return JSON.parse(text);
  }

  const LABELS = { added: "追加", removed: "削除", changed: "値変更", type: "型変更" };

  function run() {
    const errA = $("jd-error-a"), errB = $("jd-error-b");
    errA.textContent = "";
    errB.textContent = "";
    const rawA = $("jd-a").value, rawB = $("jd-b").value;
    let a, b, ok = true;
    try { a = parseJson(rawA); } catch (e) { errA.textContent = "JSON Aの構文エラー: " + formatError(rawA, e); ok = false; }
    try { b = parseJson(rawB); } catch (e) { errB.textContent = "JSON Bの構文エラー: " + formatError(rawB, e); ok = false; }
    const table = $("jd-table"), tbody = $("jd-rows"), summary = $("jd-summary");
    tbody.innerHTML = "";
    if (!ok) {
      table.hidden = true;
      summary.textContent = "JSON を修正してください。";
      return;
    }
    const results = [];
    diffValues("$", a, b, $("jd-ignore-order").checked, results);
    if (results.length === 0) {
      table.hidden = true;
      summary.textContent = "差分はありません（内容は一致しています）。";
      return;
    }
    summary.textContent = tb.fmt(results.length) + " 件の差分があります。";
    table.hidden = false;
    results.forEach((r) => {
      const tr = document.createElement("tr");
      const tdKind = document.createElement("td"); tdKind.textContent = LABELS[r.kind];
      const tdPath = document.createElement("td"); tdPath.className = "mono"; tdPath.textContent = r.path;
      const tdDetail = document.createElement("td"); tdDetail.className = "mono"; tdDetail.textContent = r.detail;
      tr.appendChild(tdKind); tr.appendChild(tdPath); tr.appendChild(tdDetail);
      tbody.appendChild(tr);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["jd-a", "jd-b"].forEach((id) => $(id).addEventListener("input", run));
    $("jd-ignore-order").addEventListener("change", run);
    $("jd-swap").addEventListener("click", () => {
      const t = $("jd-a").value; $("jd-a").value = $("jd-b").value; $("jd-b").value = t; run();
    });
    $("jd-clear").addEventListener("click", () => {
      $("jd-a").value = ""; $("jd-b").value = ""; $("jd-ignore-order").checked = false; run(); $("jd-a").focus();
    });
    run();
  });
})();
