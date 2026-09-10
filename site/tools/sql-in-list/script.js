(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ORACLE_LIMIT = 1000;

  function splitValues(text, mode) {
    const norm = text.replace(/\r\n/g, "\n");
    let tokens;
    if (mode === "newline") {
      tokens = norm.split("\n");
    } else if (mode === "comma") {
      tokens = norm.split(",");
    } else if (mode === "tab") {
      tokens = norm.split("\t");
    } else if (mode === "space") {
      tokens = norm.split(/\s+/);
    } else {
      // 自動判定: 複数行あれば1行1値、単一行ならカンマ→タブ→空白の順で区切りを推測
      const lines = norm.split("\n").map((s) => s.trim()).filter((s) => s !== "");
      if (lines.length > 1) {
        tokens = lines;
      } else {
        const single = lines[0] || "";
        if (single.indexOf(",") !== -1) tokens = single.split(",");
        else if (single.indexOf("\t") !== -1) tokens = single.split("\t");
        else tokens = single.split(/\s+/);
      }
    }
    return tokens.map((s) => s.trim()).filter((s) => s !== "");
  }

  function isNumericToken(s) {
    const t = tb.z2h(s).trim();
    return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t);
  }

  function escSql(v) { return "'" + v.replace(/'/g, "''") + "'"; }
  function escBackslashQuote(v) {
    return "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + "'";
  }

  function quoteToken(v, format, forceMode) {
    const numeric = forceMode === "number" ? true : forceMode === "string" ? false : isNumericToken(v);
    if (numeric) return tb.z2h(v).trim(); // 数値として出力する場合は全角→半角のみ行いそのまま出力
    if (format === "sql" || format === "pgarray") return escSql(v);
    if (format === "json") return JSON.stringify(v);
    if (format === "python" || format === "js") return escBackslashQuote(v);
    return v; // csv: 生の値をそのまま
  }

  function dedupe(arr) {
    const seen = new Set();
    const out = [];
    arr.forEach((v) => { if (!seen.has(v)) { seen.add(v); out.push(v); } });
    return out;
  }

  function chunk(arr, n) {
    if (!n || n <= 0) return [arr];
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  }

  function buildOutput(quotedTokens, format, perLine) {
    if (format === "csv") return quotedTokens.join(", ");
    const chunks = chunk(quotedTokens, perLine);
    const lines = chunks.map((c) => c.join(", "));
    const wrap = (open, close) => (lines.length === 1 ? open + lines[0] + close : open + "\n  " + lines.join(",\n  ") + "\n" + close);
    if (format === "sql") return wrap("IN (", ")");
    if (format === "pgarray") return wrap("ARRAY[", "]");
    return wrap("[", "]"); // json / python / js
  }

  function run() {
    const errEl = $("sil-error");
    const countEl = $("sil-count");
    errEl.textContent = "";
    const text = $("sil-input").value;
    const format = $("sil-format").value;
    const splitMode = $("sil-split").value;
    const numericMode = $("sil-numeric").value;
    const dedupeOn = $("sil-dedupe").checked;
    let perLine = parseInt(tb.z2h($("sil-perline").value).trim(), 10);
    if (!Number.isFinite(perLine) || perLine < 0) perLine = 0;

    let tokens = splitValues(text, splitMode);
    const rawCount = tokens.length;
    if (dedupeOn) tokens = dedupe(tokens);

    if (tokens.length === 0) {
      $("sil-output").value = "";
      countEl.textContent = "";
      return;
    }
    const quoted = tokens.map((t) => quoteToken(t, format, numericMode));
    $("sil-output").value = buildOutput(quoted, format, perLine);

    let msg = tokens.length + "件";
    if (dedupeOn && rawCount !== tokens.length) msg += "（重複除去前: " + rawCount + "件）";
    if (tokens.length > ORACLE_LIMIT) msg += " ／ 注意: OracleのIN句上限（1000件）を超えています";
    countEl.textContent = msg;
    countEl.className = tokens.length > ORACLE_LIMIT ? "error" : "hint";
  }

  // ---- 逆変換 ----
  function splitTopLevelCommas(s) {
    const out = [];
    let cur = "";
    let q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === "\\" && i + 1 < s.length) { cur += c + s[i + 1]; i++; continue; }
        cur += c;
        if (c === q) {
          if (s[i + 1] === q) { cur += s[++i]; } // ダブルクォートによるエスケープ（SQL方式 ''）
          else q = null;
        }
        continue;
      }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === ",") { out.push(cur); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim() !== "" || out.length) out.push(cur);
    return out;
  }

  function unquoteToken(raw) {
    const s = raw.trim();
    if (s.length >= 2 && ((s[0] === "'" && s[s.length - 1] === "'") || (s[0] === '"' && s[s.length - 1] === '"'))) {
      const qc = s[0];
      let inner = s.slice(1, -1);
      if (qc === "'") inner = inner.replace(/''/g, "'").replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      else inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      inner = inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
      return inner;
    }
    return s;
  }

  function reverseConvert(text) {
    let s = text.trim();
    s = s.replace(/^(in|array)\s*/i, "").trim();
    if ((s[0] === "(" && s[s.length - 1] === ")") || (s[0] === "[" && s[s.length - 1] === "]")) {
      s = s.slice(1, -1);
    }
    const rawTokens = splitTopLevelCommas(s).map((t) => t.trim()).filter((t) => t !== "");
    return rawTokens.map(unquoteToken);
  }

  function runReverse() {
    const text = $("sil-rev-input").value;
    if (text.trim() === "") { $("sil-rev-output").value = ""; return; }
    $("sil-rev-output").value = reverseConvert(text).join("\n");
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["sil-input", "sil-split", "sil-format", "sil-numeric", "sil-perline"].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", tb.debounce(run, 100));
    });
    $("sil-dedupe").addEventListener("change", run);
    run();

    $("sil-rev-input").addEventListener("input", tb.debounce(runReverse, 100));
    runReverse();
  });
})();
