(function () {
  "use strict";

  // 代表的な不可視・紛らわしい文字の名前（Unicode 文字名 / 通称）
  const NAMES = {
    0x0000: "NULL（NUL）", 0x0009: "タブ（TAB）", 0x000A: "改行（LF）", 0x000D: "復帰（CR）",
    0x0020: "半角スペース（SPACE）", 0x007F: "DELETE",
    0x00A0: "NBSP（改行しない空白 NO-BREAK SPACE）", 0x00AD: "ソフトハイフン（SOFT HYPHEN）",
    0x1680: "OGHAM SPACE MARK",
    0x2000: "EN QUAD", 0x2001: "EM QUAD", 0x2002: "EN SPACE", 0x2003: "EM SPACE",
    0x2004: "THREE-PER-EM SPACE", 0x2005: "FOUR-PER-EM SPACE", 0x2006: "SIX-PER-EM SPACE",
    0x2007: "FIGURE SPACE", 0x2008: "PUNCTUATION SPACE", 0x2009: "THIN SPACE", 0x200A: "HAIR SPACE",
    0x200B: "ZWSP（幅ゼロの空白 ZERO WIDTH SPACE）", 0x200C: "ZWNJ（ZERO WIDTH NON-JOINER）",
    0x200D: "ZWJ（ZERO WIDTH JOINER）", 0x200E: "LRM（LEFT-TO-RIGHT MARK）", 0x200F: "RLM（RIGHT-TO-LEFT MARK）",
    0x2028: "LINE SEPARATOR", 0x2029: "PARAGRAPH SEPARATOR", 0x202F: "NNBSP（NARROW NO-BREAK SPACE）",
    0x205F: "MEDIUM MATHEMATICAL SPACE", 0x2060: "WORD JOINER",
    0x3000: "全角スペース（IDEOGRAPHIC SPACE）",
    0xFEFF: "BOM（ZERO WIDTH NO-BREAK SPACE）", 0xFFFD: "置換文字（REPLACEMENT CHARACTER）"
  };

  function hex2(b) { return (b < 16 ? "0" : "") + b.toString(16).toUpperCase(); }
  function cpHex(cp) { let s = cp.toString(16).toUpperCase(); while (s.length < 4) s = "0" + s; return "U+" + s; }

  // 入力文字列 -> バイト配列。失敗時は { error }
  function parseBytes(raw) {
    let s = String(raw == null ? "" : raw);
    s = s.replace(/[０-９Ａ-Ｆａ-ｆ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    s = s.replace(/&#x/gi, " ").replace(/\\x/gi, " ").replace(/0x/gi, " ").replace(/%/g, " ")
      .replace(/[<>,;:\-_|\[\](){}"'\s　]+/g, " ").trim();
    if (s === "") return { bytes: [] };
    const bytes = [];
    const toks = s.split(" ");
    for (const t of toks) {
      if (!/^[0-9a-fA-F]+$/.test(t)) return { error: "16進数として読めない文字列があります: 「" + t.slice(0, 20) + "」" };
      if (t.length % 2 !== 0) return { error: "桁数が奇数です: 「" + t.slice(0, 20) + "」（1バイトは2桁で書きます）" };
      for (let i = 0; i < t.length; i += 2) bytes.push(parseInt(t.substr(i, 2), 16));
    }
    return { bytes: bytes };
  }

  // UTF-8 デコード（RFC 3629 / Unicode の well-formed 表に準拠）。
  // items: { start, len, cp } または { start, len, err }
  function decodeUtf8(bytes) {
    const items = [];
    const n = bytes.length;
    let i = 0;
    const isCont = (b) => b >= 0x80 && b <= 0xBF;
    while (i < n) {
      const b0 = bytes[i];
      if (b0 <= 0x7F) { items.push({ start: i, len: 1, cp: b0 }); i += 1; continue; }
      if (b0 <= 0xBF) { items.push({ start: i, len: 1, err: "継続バイト（0x80〜0xBF）が先頭に来ています。直前のバイトが足りないか、途中から切り出した可能性があります" }); i += 1; continue; }
      if (b0 === 0xC0 || b0 === 0xC1) { items.push({ start: i, len: 1, err: "0x" + hex2(b0) + " は過長表現（本来1バイトで書ける文字を2バイトで書く形）の先頭で、UTF-8 では使えません" }); i += 1; continue; }
      if (b0 >= 0xF5) { items.push({ start: i, len: 1, err: "0x" + hex2(b0) + " は UTF-8 のバイト列に現れない値です（U+10FFFF を超える範囲の先頭）" }); i += 1; continue; }
      let need, lo = 0x80, hi = 0xBF, cp;
      if (b0 <= 0xDF) { need = 1; cp = b0 & 0x1F; }
      else if (b0 <= 0xEF) {
        need = 2; cp = b0 & 0x0F;
        if (b0 === 0xE0) lo = 0xA0;
        if (b0 === 0xED) hi = 0x9F;
      } else {
        need = 3; cp = b0 & 0x07;
        if (b0 === 0xF0) lo = 0x90;
        if (b0 === 0xF4) hi = 0x8F;
      }
      let j = 1, bad = null;
      for (; j <= need; j++) {
        const pos = i + j;
        if (pos >= n) { bad = "データがここで終わっています。0x" + hex2(b0) + " で始まる文字は全部で " + (need + 1) + " バイト必要ですが、" + (j + 1) + " バイト目が足りません（途中切れ）"; break; }
        const b = bytes[pos];
        const l = j === 1 ? lo : 0x80, h = j === 1 ? hi : 0xBF;
        if (b < l || b > h) {
          if (j === 1 && isCont(b)) {
            if (b0 === 0xE0 || b0 === 0xF0) bad = "過長表現です。0x" + hex2(b0) + " の次が 0x" + hex2(b) + " だと、より短いバイト数で書ける文字を長く書いたことになります";
            else if (b0 === 0xED) bad = "U+D800〜U+DFFF（サロゲート範囲）に当たります。UTF-8 では表せない値です";
            else bad = "U+10FFFF を超える値になります（0xF4 の次は 0x80〜0x8F のみ）";
          } else bad = "継続バイト（0x80〜0xBF）が来るはずの位置に 0x" + hex2(b) + " があります";
          break;
        }
        cp = (cp << 6) | (b & 0x3F);
      }
      if (bad) {
        // 有効だった先頭部分（最大部分列）までを1つのエラーとして消費。壊れた位置は i + j
        items.push({ start: i, len: j, err: bad, errAt: i + j });
        i += j;
      } else {
        items.push({ start: i, len: need + 1, cp: cp });
        i += need + 1;
      }
    }
    return items;
  }

  function encodeUtf8Cp(cp) {
    if (cp < 0x80) return [cp];
    if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
    if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
    return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
  }
  function utf16Units(cp) {
    if (cp < 0x10000) return [cp];
    const v = cp - 0x10000;
    return [0xD800 + (v >> 10), 0xDC00 + (v & 0x3FF)];
  }
  function fmtBytes(arr, f) {
    const h = arr.map(hex2);
    switch (f) {
      case "0x": return h.map((x) => "0x" + x).join(" ");
      case "bs": return h.map((x) => "\\x" + x).join("");
      case "pct": return h.map((x) => "%" + x).join("");
      case "angle": return h.map((x) => "<0x" + x + ">").join("");
      case "cont": return h.join("");
      default: return h.join(" ");
    }
  }
  // 文字列 -> { utf8, utf16, cps, lone }
  function encodeString(str) {
    const utf8 = [], utf16 = [], cps = [], lone = [];
    for (const ch of str) {
      const cp = ch.codePointAt(0);
      cps.push(cp);
      if (cp >= 0xD800 && cp <= 0xDFFF) { lone.push(cp); utf16.push(cp >> 8, cp & 0xFF); continue; }
      encodeUtf8Cp(cp).forEach((b) => utf8.push(b));
      utf16Units(cp).forEach((u) => { utf16.push(u >> 8, u & 0xFF); });
    }
    return { utf8: utf8, utf16: utf16, cps: cps, lone: lone };
  }

  function isCtl(cp) { return cp < 0x20 || (cp >= 0x7F && cp < 0xA0); }
  function charLabel(cp) {
    if (NAMES[cp]) return NAMES[cp];
    if (isCtl(cp)) return "制御文字";
    return "";
  }
  function showChar(cp) {
    if (NAMES[cp] || isCtl(cp)) return "（不可視）";
    return String.fromCodePoint(cp);
  }

  const api = { parseBytes: parseBytes, decodeUtf8: decodeUtf8, encodeString: encodeString, fmtBytes: fmtBytes, cpHex: cpHex };
  if (typeof document === "undefined") { if (typeof module !== "undefined") module.exports = api; return; }

  const $ = (id) => document.getElementById(id);
  const MAX_ROWS = 300;

  function runDecode() {
    const err = $("ub-d-error"), rows = $("ub-d-rows"), out = $("ub-d-text"), sum = $("ub-d-summary");
    err.textContent = ""; rows.innerHTML = ""; out.value = ""; sum.textContent = "";
    const p = parseBytes($("ub-hex").value);
    if (p.error) { err.textContent = p.error; return; }
    if (p.bytes.length === 0) { sum.textContent = "バイト列を入力してください。"; return; }
    const items = decodeUtf8(p.bytes);
    let text = "", bad = 0, chars = 0;
    const frag = document.createDocumentFragment();
    items.forEach((it, idx) => {
      if (it.err) { bad++; text += "�"; } else { chars++; text += String.fromCodePoint(it.cp); }
      if (idx >= MAX_ROWS) return;
      const tr = document.createElement("tr");
      const bs = p.bytes.slice(it.start, it.start + it.len).map(hex2).join(" ");
      const pos = it.err
        ? (it.errAt != null ? (it.errAt + 1) + " バイト目で破損" : (it.start + 1) + " バイト目")
        : (it.start + 1) + (it.len > 1 ? "〜" + (it.start + it.len) : "") + " バイト目";
      const cells = it.err
        ? [pos, bs, "—", "—", "不正: " + it.err]
        : [pos, bs, cpHex(it.cp), showChar(it.cp), charLabel(it.cp)];
      cells.forEach((c, k) => {
        const td = document.createElement("td");
        td.textContent = c;
        if (it.err) td.className = "ub-bad";
        if (k === 4) td.style.whiteSpace = "normal";
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });
    rows.appendChild(frag);
    out.value = text;
    sum.textContent = p.bytes.length + " バイト → " + chars + " 文字" + (bad ? "、不正な箇所 " + bad + " 件（表の赤字を参照）" : "、すべて正しい UTF-8 です") + (items.length > MAX_ROWS ? "。表は先頭 " + MAX_ROWS + " 件のみ表示" : "");
  }

  function runEncode() {
    const err = $("ub-e-error");
    err.textContent = "";
    const s = $("ub-text").value;
    if (s === "") { $("ub-e-u8").textContent = ""; $("ub-e-u16").textContent = ""; $("ub-e-cp").textContent = ""; return; }
    const r = encodeString(s);
    const f = $("ub-fmt").value;
    $("ub-e-u8").textContent = fmtBytes(r.utf8, f);
    $("ub-e-u16").textContent = fmtBytes(r.utf16, f);
    $("ub-e-cp").textContent = r.cps.length > 60 ? r.cps.slice(0, 60).map(cpHex).join(" ") + " …（先頭60文字分）" : r.cps.map(cpHex).join(" ");
    if (r.lone.length) err.textContent = "対になっていないサロゲート（" + r.lone.map(cpHex).join(", ") + "）が含まれています。UTF-8 には変換できないため UTF-8 欄から除いています。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ub-hex").addEventListener("input", runDecode);
    $("ub-text").addEventListener("input", runEncode);
    $("ub-fmt").addEventListener("change", runEncode);
    runDecode(); runEncode();
  });
})();
