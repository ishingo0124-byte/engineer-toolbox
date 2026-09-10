(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object") {
      const out = {};
      Object.keys(v).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).forEach((k) => { out[k] = sortDeep(v[k]); });
      return out;
    }
    return v;
  }

  // 文字列中に残った \uXXXX を可読な文字に変換する（二重エンコードされたJSONの中身などを読みやすくする用途）
  function unescapeUnicode(text) {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (m, hex) => {
      const ch = String.fromCharCode(parseInt(hex, 16));
      if (ch === '"' || ch === "\\") return m; // JSONの構造を壊さないよう保持
      return ch;
    });
  }

  function positionToLineCol(text, pos) {
    let line = 1, col = 1;
    for (let i = 0; i < pos && i < text.length; i++) {
      if (text[i] === "\n") { line++; col = 1; } else { col++; }
    }
    return { line, col };
  }

  function parseErrorDetail(input, err) {
    const msg = err.message || String(err);
    let m = msg.match(/position (\d+)/i);
    if (m) {
      const { line, col } = positionToLineCol(input, parseInt(m[1], 10));
      return line + "行目 " + col + "列目付近: " + msg;
    }
    m = msg.match(/line (\d+) column (\d+)/i);
    if (m) return m[1] + "行目 " + m[2] + "列目付近: " + msg;
    return msg;
  }

  function run() {
    const input = $("jf-input").value;
    const out = $("jf-output");
    const status = $("jf-status");
    if (input.trim() === "") {
      out.textContent = "";
      status.textContent = "";
      status.className = "hint";
      return;
    }
    let data;
    try {
      data = JSON.parse(input);
    } catch (e) {
      out.textContent = "";
      status.textContent = "JSON エラー: " + parseErrorDetail(input, e);
      status.className = "error";
      return;
    }
    if ($("jf-sort").checked) data = sortDeep(data);
    const mode = $("jf-mode").value;
    let text;
    if (mode === "minify") {
      text = JSON.stringify(data);
    } else {
      const indentSel = $("jf-indent").value;
      const indent = indentSel === "tab" ? "\t" : Number(indentSel);
      text = JSON.stringify(data, null, indent);
    }
    if ($("jf-unescape").checked) text = unescapeUnicode(text);
    out.textContent = text;
    const bytes = new TextEncoder().encode(text).length;
    status.textContent = "妥当な JSON です（" + tb.fmt(bytes) + " バイト）";
    status.className = "ok";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("jf-input").addEventListener("input", run);
    ["jf-mode", "jf-indent", "jf-sort", "jf-unescape"].forEach((id) => $(id).addEventListener("change", run));
    $("jf-clear").addEventListener("click", () => { $("jf-input").value = ""; run(); $("jf-input").focus(); });
    run();
  });
})();
