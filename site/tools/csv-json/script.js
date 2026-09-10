(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---- RFC 4180準拠の簡易CSVパーサ（状態機械） ----
  function parseCSV(text, delim) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    let i = 0;
    const n = text.length;
    while (i < n) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      } else {
        if (c === '"') { inQuotes = true; i++; continue; }
        if (c === delim) { row.push(field); field = ""; i++; continue; }
        if (c === "\r") { i++; continue; }
        if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
        field += c; i++; continue;
      }
    }
    if (inQuotes) throw new Error("引用符（\")が閉じていません");
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  function detectDelimiter(text) {
    const firstLine = text.split(/\r\n|\n/, 1)[0] || "";
    const counts = { ",": 0, "\t": 0, ";": 0 };
    let inQuotes = false;
    for (const c of firstLine) {
      if (c === '"') inQuotes = !inQuotes;
      else if (!inQuotes && c in counts) counts[c]++;
    }
    let best = ",", bestN = -1;
    for (const d of [",", "\t", ";"]) {
      if (counts[d] > bestN) { bestN = counts[d]; best = d; }
    }
    return bestN > 0 ? best : ",";
  }

  function convertValue(s, enabled) {
    if (!enabled) return s;
    if (s === "true") return true;
    if (s === "false") return false;
    if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(s)) return Number(s);
    return s;
  }

  function csvToJson(text, delim, useHeader, shape, typeConvert) {
    const rows = parseCSV(text, delim).filter((r, idx, arr) => !(r.length === 1 && r[0] === "" && idx === arr.length - 1));
    if (!rows.length) throw new Error("CSVが空です");
    let header = null, dataRows = rows;
    if (useHeader) { header = rows[0]; dataRows = rows.slice(1); }
    if (shape === "objects") {
      const width = header ? header.length : Math.max(0, ...rows.map((r) => r.length));
      const keys = header ? header.map((k, i) => (k === "" ? "col" + (i + 1) : k)) : Array.from({ length: width }, (_, i) => "col" + (i + 1));
      return dataRows.map((r) => {
        const obj = {};
        keys.forEach((k, i) => { obj[k] = convertValue(r[i] !== undefined ? r[i] : "", typeConvert); });
        return obj;
      });
    }
    return dataRows.map((r) => r.map((v) => convertValue(v, typeConvert)));
  }

  function csvEscape(v, delim) {
    let s = v === null || v === undefined ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
    if (s.indexOf(delim) !== -1 || s.indexOf('"') !== -1 || s.indexOf("\n") !== -1 || s.indexOf("\r") !== -1) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function jsonToCsv(text, delim) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("JSONの構文が正しくありません: " + e.message); }
    if (!Array.isArray(data)) throw new Error("最上位は配列である必要があります（例: [ {...}, {...} ]）");
    if (data.length === 0) return "";
    const isObjArray = data.every((r) => r !== null && typeof r === "object" && !Array.isArray(r));
    const lines = [];
    if (isObjArray) {
      const keys = [];
      data.forEach((r) => Object.keys(r).forEach((k) => { if (keys.indexOf(k) === -1) keys.push(k); }));
      lines.push(keys.map((k) => csvEscape(k, delim)).join(delim));
      data.forEach((r) => lines.push(keys.map((k) => csvEscape(r[k], delim)).join(delim)));
    } else {
      data.forEach((r) => {
        const arr = Array.isArray(r) ? r : [r];
        lines.push(arr.map((v) => csvEscape(v, delim)).join(delim));
      });
    }
    return lines.join("\r\n");
  }

  function delimName(d) {
    if (d === ",") return "カンマ";
    if (d === "\t") return "タブ";
    if (d === ";") return "セミコロン";
    return d;
  }

  function runCsvToJson() {
    const errEl = $("cj-csv-error");
    const detEl = $("cj-delim-detected");
    errEl.textContent = "";
    const text = $("cj-csv-input").value;
    if (text.trim() === "") { $("cj-json-output").value = ""; detEl.textContent = ""; return; }
    const sel = $("cj-delim").value;
    const delim = sel === "auto" ? detectDelimiter(text) : sel;
    detEl.textContent = "使用する区切り文字: " + delimName(delim) + (sel === "auto" ? "（自動判定）" : "（手動指定）");
    try {
      const useHeader = $("cj-header").checked;
      const shape = $("cj-shape").value;
      const typeConvert = $("cj-typeconvert").checked;
      const result = csvToJson(text, delim, useHeader, shape, typeConvert);
      $("cj-json-output").value = JSON.stringify(result, null, 2);
    } catch (e) {
      errEl.textContent = e.message;
      $("cj-json-output").value = "";
    }
  }

  function runJsonToCsv() {
    const errEl = $("cj-json-error");
    errEl.textContent = "";
    const text = $("cj-json-input").value;
    if (text.trim() === "") { $("cj-csv-output").value = ""; return; }
    const delim = $("cj-out-delim").value || ",";
    try {
      let csv = jsonToCsv(text, delim);
      if ($("cj-bom").checked) csv = String.fromCharCode(0xFEFF) + csv;
      $("cj-csv-output").value = csv;
    } catch (e) {
      errEl.textContent = e.message;
      $("cj-csv-output").value = "";
    }
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let text = String(reader.result);
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // 先頭のUTF-8 BOMを除去
      $("cj-csv-input").value = text;
      runCsvToJson();
    };
    reader.onerror = () => { $("cj-csv-error").textContent = "ファイルの読み込みに失敗しました"; };
    reader.readAsText(file, "utf-8");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const csvIds = ["cj-csv-input", "cj-delim", "cj-header", "cj-typeconvert", "cj-shape"];
    csvIds.forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "TEXTAREA" ? "input" : "change", tb.debounce(runCsvToJson, 120));
    });
    $("cj-csv-file").addEventListener("change", (e) => handleFile(e.target.files && e.target.files[0]));

    const jsonIds = ["cj-json-input", "cj-out-delim", "cj-bom"];
    jsonIds.forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "TEXTAREA" ? "input" : "change", tb.debounce(runJsonToCsv, 120));
    });

    runCsvToJson();
    runJsonToCsv();
  });
})();
