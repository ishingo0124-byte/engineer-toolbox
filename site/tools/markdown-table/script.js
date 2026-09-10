(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // East Asian Width（UAX #11）で Wide / Fullwidth に相当する主な範囲を表示幅2として扱う簡易判定
  function charWidth(cp) {
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||
      cp === 0x2329 || cp === 0x232a ||
      (cp >= 0x2e80 && cp <= 0x303e) ||
      (cp >= 0x3041 && cp <= 0x33ff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0xa000 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe4f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1faff) ||
      (cp >= 0x20000 && cp <= 0x3fffd)
    ) return 2;
    return 1;
  }

  function stringWidth(s) {
    let w = 0;
    for (const ch of String(s)) w += charWidth(ch.codePointAt(0));
    return w;
  }

  function padToWidth(text, width, align) {
    const w = stringWidth(text);
    const diff = Math.max(0, width - w);
    if (align === "r") return " ".repeat(diff) + text;
    if (align === "c") {
      const l = Math.floor(diff / 2), r = diff - l;
      return " ".repeat(l) + text + " ".repeat(r);
    }
    return text + " ".repeat(diff);
  }

  // ---- Markdown 表の行分割（\| は逃がす） ----
  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) {
      let bs = 0, i = s.length - 2;
      while (i >= 0 && s[i] === "\\") { bs++; i--; }
      if (bs % 2 === 0) s = s.slice(0, -1);
    }
    const cells = [];
    let cur = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
      if (c === "|") { cells.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    cells.push(cur.trim());
    return cells;
  }

  function isSeparatorLine(line) {
    const t = line.trim();
    if (t === "" || !/-/.test(t)) return false;
    if (!/^[:\-|\s]+$/.test(t)) return false;
    const cells = splitRow(t);
    return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
  }

  function detectAlign(cell) {
    const t = cell.trim();
    const left = t.startsWith(":");
    const right = t.endsWith(":");
    if (left && right) return "c";
    if (right) return "r";
    if (left) return "l";
    return "";
  }

  // ---- CSV/TSV/スペース区切りの解析（ダブルクォート対応） ----
  function parseDelimLine(line, delim) {
    if (delim === "space") return line.trim().split(/\s+/).filter((s) => s !== "");
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else cur += c;
      } else {
        if (c === '"' && cur === "") inQuotes = true;
        else if (c === delim) { cells.push(cur); cur = ""; }
        else cur += c;
      }
    }
    cells.push(cur);
    return cells;
  }

  function detectDelimiter(lines, mode) {
    if (mode === "tab") return "\t";
    if (mode === "space") return "space";
    if (mode === ",") return ",";
    if (lines.some((l) => l.indexOf("\t") >= 0)) return "\t";
    if (lines.some((l) => l.indexOf(",") >= 0)) return ",";
    return "space";
  }

  function csvEscape(s) {
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function run() {
    const err = $("mt-error");
    err.textContent = "";
    const raw = $("mt-input").value;
    const allLines = raw.split(/\r\n|\r|\n/);
    const nonEmpty = allLines.filter((l) => l.trim() !== "");

    if (nonEmpty.length === 0) {
      $("mt-md-out").value = "";
      $("mt-csv-out").value = "";
      return;
    }

    let sepIdx = -1;
    for (let i = 1; i < nonEmpty.length; i++) {
      if (isSeparatorLine(nonEmpty[i])) { sepIdx = i; break; }
    }

    let headerCells, dataRows, detectedAlign = [];
    if (sepIdx > 0 && nonEmpty[sepIdx - 1].indexOf("|") >= 0) {
      headerCells = splitRow(nonEmpty[sepIdx - 1]);
      detectedAlign = splitRow(nonEmpty[sepIdx]).map(detectAlign);
      dataRows = nonEmpty.slice(sepIdx + 1).map(splitRow);
    } else {
      const delim = detectDelimiter(nonEmpty, $("mt-delim").value);
      const rows = nonEmpty.map((l) => parseDelimLine(l, delim));
      headerCells = rows[0] || [];
      dataRows = rows.slice(1);
    }

    const colCount = Math.max(headerCells.length, 1, ...dataRows.map((r) => r.length));
    const padRow = (r) => {
      const c = r.slice();
      while (c.length < colCount) c.push("");
      return c;
    };
    headerCells = padRow(headerCells);
    dataRows = dataRows.map(padRow);

    const userAlign = $("mt-align").value.split(",").map((s) => s.trim().toLowerCase());
    const align = [];
    for (let i = 0; i < colCount; i++) {
      const u = userAlign[i];
      if (u === "l" || u === "c" || u === "r") align.push(u);
      else if (detectedAlign[i]) align.push(detectedAlign[i]);
      else align.push("");
    }

    // Markdown出力用（| をエスケープしたテキストで幅計算・整形）
    const escCell = (s) => String(s).replace(/\|/g, "\\|");
    const headerEsc = headerCells.map(escCell);
    const dataEsc = dataRows.map((r) => r.map(escCell));

    const colWidth = [];
    for (let i = 0; i < colCount; i++) {
      let w = Math.max(3, stringWidth(headerEsc[i]));
      dataEsc.forEach((r) => { w = Math.max(w, stringWidth(r[i])); });
      colWidth.push(w);
    }

    const buildLine = (cells) => "| " + cells.map((c, i) => padToWidth(c, colWidth[i], align[i])).join(" | ") + " |";
    const buildSep = () => "| " + colWidth.map((w, i) => {
      const a = align[i];
      if (a === "c") return ":" + "-".repeat(Math.max(1, w - 2)) + ":";
      if (a === "l") return ":" + "-".repeat(Math.max(1, w - 1));
      if (a === "r") return "-".repeat(Math.max(1, w - 1)) + ":";
      return "-".repeat(w);
    }).join(" | ") + " |";

    const mdLines = [buildLine(headerEsc), buildSep()].concat(dataEsc.map(buildLine));
    $("mt-md-out").value = mdLines.join("\n");

    const csvLines = [headerCells].concat(dataRows).map((r) => r.map(csvEscape).join(","));
    $("mt-csv-out").value = csvLines.join("\n");
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["mt-input", "mt-align"].forEach((id) => $(id).addEventListener("input", run));
    $("mt-delim").addEventListener("change", run);
    $("mt-delim").addEventListener("input", run);
    run();
  });
})();
