(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toHalfWidth(s) {
    return String(s || "").replace(/[０-９Ａ-Ｆａ-ｆ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  // 区切り文字（: - . 全角同等・空白）を取り除き12桁16進なら6バイト配列を返す
  function parseMac(line) {
    const raw = line.trim();
    if (raw === "") return null;
    const half = toHalfWidth(raw);
    const cleaned = half.replace(/[:\-.　\s]/g, "");
    if (!/^[0-9a-fA-F]{12}$/.test(cleaned)) return { error: raw };
    const bytes = [];
    for (let i = 0; i < 6; i++) bytes.push(parseInt(cleaned.substr(i * 2, 2), 16));
    return { original: raw, bytes: bytes };
  }

  function hex2(n, upper) {
    const h = n.toString(16).padStart(2, "0");
    return upper ? h.toUpperCase() : h;
  }

  function fmtColon(bytes, upper) {
    return bytes.map((b) => hex2(b, upper)).join(":");
  }

  function fmtHyphen(bytes, upper) {
    return bytes.map((b) => hex2(b, upper)).join("-");
  }

  function fmtCiscoDot(bytes) {
    const h = bytes.map((b) => hex2(b, false));
    return h[0] + h[1] + "." + h[2] + h[3] + "." + h[4] + h[5];
  }

  function fmtNoSep(bytes, upper) {
    return bytes.map((b) => hex2(b, upper)).join("");
  }

  function classify(bytes) {
    const b0 = bytes[0];
    const isAllFF = bytes.every((b) => b === 0xff);
    const isAllZero = bytes.every((b) => b === 0);
    const ig = b0 & 0x01; // I/Gビット: 0=ユニキャスト, 1=マルチキャスト
    const ul = (b0 & 0x02) >> 1; // U/Lビット: 0=ユニバーサル(製造時割当), 1=ローカル管理
    let kind = ig === 0 ? "ユニキャスト" : "マルチキャスト";
    if (isAllFF) kind = "マルチキャスト（ブロードキャスト）";
    if (isAllZero) kind += "（全ビット0）";
    const admin = ul === 0 ? "ユニバーサル管理(UAA)" : "ローカル管理(LAA)";
    return kind + " / " + admin;
  }

  function eui64(bytes) {
    const b = bytes.slice();
    b[0] = (b[0] ^ 0x02) & 0xff; // U/Lビットを反転
    const full = [b[0], b[1], b[2], 0xff, 0xfe, b[3], b[4], b[5]];
    const h = full.map((x) => hex2(x, false));
    return h[0] + h[1] + ":" + h[2] + h[3] + ":" + h[4] + h[5] + ":" + h[6] + h[7];
  }

  function setError(msg) {
    $("maf-error").textContent = msg || "";
  }

  function run() {
    const lines = $("maf-input").value.split("\n");
    const tbody = $("maf-tbody");
    tbody.innerHTML = "";
    const bad = [];
    let shown = 0;

    for (const line of lines) {
      const parsed = parseMac(line);
      if (parsed === null) continue;
      if (parsed.error) { bad.push(parsed.error); continue; }
      const bytes = parsed.bytes;
      const cells = [
        parsed.original,
        fmtColon(bytes, false),
        fmtColon(bytes, true),
        fmtHyphen(bytes, false),
        fmtHyphen(bytes, true),
        fmtCiscoDot(bytes),
        fmtNoSep(bytes, false),
        classify(bytes),
        eui64(bytes),
      ];
      const tr = document.createElement("tr");
      cells.forEach((text, idx) => {
        const td = document.createElement("td");
        if (idx > 0) td.className = "mono";
        td.textContent = text;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      shown++;
    }

    setError(bad.length ? "MACアドレスとして読み取れない行: " + bad.join(", ") : "");
    $("maf-result-wrap").style.display = shown === 0 ? "none" : "";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("maf-input").addEventListener("input", run);
    run();
  });
})();
