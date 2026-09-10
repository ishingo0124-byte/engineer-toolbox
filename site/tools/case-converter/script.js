(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const TOKEN_RE = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g;

  function tokenize(rawLine) {
    let s = (window.tb ? tb.z2h(rawLine) : rawLine);
    s = s.replace(/[_\-.\s]+/g, " ").trim();
    if (s === "") return [];
    const tokens = [];
    s.split(" ").forEach((chunk) => {
      if (chunk === "") return;
      const matches = chunk.match(TOKEN_RE);
      // 英数字だけで全体をすき間なく分解できた場合のみ単語分割し、
      // 日本語など対象外の文字が混ざる場合はデータを欠落させないよう塊のまま扱う
      if (matches && matches.join("").length === chunk.length) {
        matches.forEach((m) => tokens.push(m));
      } else {
        tokens.push(chunk);
      }
    });
    return tokens;
  }

  function cap(t) {
    if (t.length === 0) return t;
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }

  const FORMATTERS = {
    camel: (tk) => (tk.length === 0 ? "" : tk[0].toLowerCase() + tk.slice(1).map(cap).join("")),
    pascal: (tk) => tk.map(cap).join(""),
    snake: (tk) => tk.map((t) => t.toLowerCase()).join("_"),
    kebab: (tk) => tk.map((t) => t.toLowerCase()).join("-"),
    constant: (tk) => tk.map((t) => t.toUpperCase()).join("_"),
    title: (tk) => tk.map(cap).join(" "),
    dot: (tk) => tk.map((t) => t.toLowerCase()).join("."),
  };
  const FORMAT_LABELS = {
    camel: "camelCase", pascal: "PascalCase", snake: "snake_case",
    kebab: "kebab-case", constant: "CONSTANT_CASE", title: "Title Case", dot: "dot.case",
  };
  const FORMAT_ORDER = ["camel", "pascal", "snake", "kebab", "constant", "title", "dot"];

  function detectFormat(raw) {
    const s = raw.trim();
    if (s === "") return "";
    if (/[^A-Za-z0-9_\-. ]/.test(s)) return "判定不可（英数字・区切り記号以外を含む）";
    if (/^[a-z0-9]+$/.test(s)) return "小文字・区切りなし";
    if (/^[A-Z0-9]+$/.test(s)) return "大文字・区切りなし";
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(s)) return "snake_case";
    if (/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(s)) return "CONSTANT_CASE";
    if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(s)) return "kebab-case";
    if (/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(s)) return "dot.case";
    if (/^[a-z][a-zA-Z0-9]*$/.test(s) && /[A-Z]/.test(s)) return "camelCase";
    if (/^[A-Z][a-zA-Z0-9]*$/.test(s)) return "PascalCase";
    if (/^[A-Za-z0-9]+( [A-Za-z0-9]+)+$/.test(s)) {
      const words = s.split(/\s+/);
      return words.every((w) => /^[A-Z]/.test(w)) ? "Title Case" : "スペース区切り（混在）";
    }
    return "混在／判定不可";
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function copyBtn(text) {
    const b = el("button", "copy-btn", "コピー");
    b.type = "button";
    b.setAttribute("data-copy-text", text);
    return b;
  }

  function run() {
    const err = $("cc-error");
    err.textContent = "";
    const raw = $("cc-input").value;
    const lines = raw.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");

    const listEl = $("cc-list");
    const tableWrap = $("cc-table-wrap");
    listEl.textContent = "";
    tableWrap.textContent = "";

    if (lines.length === 0) {
      listEl.appendChild(el("p", "hint", "変換したい単語を1行に1つずつ入力してください。"));
      $("cc-copy-all").setAttribute("data-copy-text", "");
      return;
    }

    const target = $("cc-target").value;
    const allTokens = lines.map((l) => tokenize(l));

    // 選択形式の一覧
    const targetValues = [];
    lines.forEach((line, i) => {
      const tokens = allTokens[i];
      const value = FORMATTERS[target](tokens);
      targetValues.push(value);
      const row = el("div", "cc-row");
      const src = el("span", "cc-src");
      src.textContent = line.trim();
      const detect = el("span", "cc-detect");
      detect.textContent = "(" + detectFormat(line) + ")";
      const arrow = el("span", "hint", "→");
      const val = el("span", "cc-val", value);
      row.appendChild(src);
      row.appendChild(detect);
      row.appendChild(arrow);
      row.appendChild(val);
      row.appendChild(copyBtn(value));
      listEl.appendChild(row);
    });
    $("cc-copy-all").setAttribute("data-copy-text", targetValues.join("\n"));

    // 一括変換表
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["入力", "検出形式"].concat(FORMAT_ORDER.map((k) => FORMAT_LABELS[k])).forEach((h) => {
      headRow.appendChild(el("th", null, h));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    lines.forEach((line, i) => {
      const tokens = allTokens[i];
      const tr = document.createElement("tr");
      tr.appendChild(el("td", "mono", line.trim()));
      tr.appendChild(el("td", null, detectFormat(line)));
      FORMAT_ORDER.forEach((k) => {
        tr.appendChild(el("td", "mono", FORMATTERS[k](tokens)));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("cc-input").addEventListener("input", run);
    $("cc-target").addEventListener("change", run);
    run();
  });
})();
