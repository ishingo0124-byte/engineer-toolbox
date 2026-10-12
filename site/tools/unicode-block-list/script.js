(function () {
  "use strict";

  // [開始, 終了, Blocks.txt の英語名, 日本語の呼び名]
  const BLOCKS = [
    [0x0000, 0x007F, "Basic Latin", "基本ラテン（ASCII）"],
    [0x0080, 0x00FF, "Latin-1 Supplement", "ラテン1補助"],
    [0x0100, 0x017F, "Latin Extended-A", "ラテン拡張A"],
    [0x0180, 0x024F, "Latin Extended-B", "ラテン拡張B"],
    [0x0250, 0x02AF, "IPA Extensions", "国際音声記号拡張"],
    [0x0300, 0x036F, "Combining Diacritical Marks", "結合用ダイアクリティカルマーク"],
    [0x0370, 0x03FF, "Greek and Coptic", "ギリシャ文字・コプト文字"],
    [0x0400, 0x04FF, "Cyrillic", "キリル文字"],
    [0x0590, 0x05FF, "Hebrew", "ヘブライ文字"],
    [0x0600, 0x06FF, "Arabic", "アラビア文字"],
    [0x0E00, 0x0E7F, "Thai", "タイ文字"],
    [0x1100, 0x11FF, "Hangul Jamo", "ハングル字母"],
    [0x1E00, 0x1EFF, "Latin Extended Additional", "ラテン拡張追加"],
    [0x2000, 0x206F, "General Punctuation", "一般句読点"],
    [0x2070, 0x209F, "Superscripts and Subscripts", "上付き・下付き文字"],
    [0x20A0, 0x20CF, "Currency Symbols", "通貨記号"],
    [0x2100, 0x214F, "Letterlike Symbols", "文字様記号"],
    [0x2190, 0x21FF, "Arrows", "矢印"],
    [0x2200, 0x22FF, "Mathematical Operators", "数学記号"],
    [0x2300, 0x23FF, "Miscellaneous Technical", "その他の技術用記号"],
    [0x2460, 0x24FF, "Enclosed Alphanumerics", "囲み英数字"],
    [0x2500, 0x257F, "Box Drawing", "罫線素片"],
    [0x25A0, 0x25FF, "Geometric Shapes", "幾何学模様"],
    [0x2600, 0x26FF, "Miscellaneous Symbols", "その他の記号"],
    [0x2700, 0x27BF, "Dingbats", "装飾記号"],
    [0x2E80, 0x2EFF, "CJK Radicals Supplement", "CJK部首補助"],
    [0x2F00, 0x2FDF, "Kangxi Radicals", "康熙部首"],
    [0x3000, 0x303F, "CJK Symbols and Punctuation", "CJKの記号及び句読点"],
    [0x3040, 0x309F, "Hiragana", "ひらがな"],
    [0x30A0, 0x30FF, "Katakana", "カタカナ"],
    [0x3100, 0x312F, "Bopomofo", "注音字母"],
    [0x3130, 0x318F, "Hangul Compatibility Jamo", "ハングル互換字母"],
    [0x31F0, 0x31FF, "Katakana Phonetic Extensions", "カタカナ音声拡張"],
    [0x3200, 0x32FF, "Enclosed CJK Letters and Months", "囲みCJK文字・月"],
    [0x3300, 0x33FF, "CJK Compatibility", "CJK互換"],
    [0x3400, 0x4DBF, "CJK Unified Ideographs Extension A", "CJK統合漢字拡張A"],
    [0x4E00, 0x9FFF, "CJK Unified Ideographs", "CJK統合漢字"],
    [0xAC00, 0xD7AF, "Hangul Syllables", "ハングル音節"],
    [0xD800, 0xDB7F, "High Surrogates", "上位サロゲート"],
    [0xDC00, 0xDFFF, "Low Surrogates", "下位サロゲート"],
    [0xE000, 0xF8FF, "Private Use Area", "私用領域"],
    [0xF900, 0xFAFF, "CJK Compatibility Ideographs", "CJK互換漢字"],
    [0xFE00, 0xFE0F, "Variation Selectors", "異体字選択子"],
    [0xFE30, 0xFE4F, "CJK Compatibility Forms", "CJK互換形"],
    [0xFF00, 0xFFEF, "Halfwidth and Fullwidth Forms", "半角・全角形"],
    [0xFFF0, 0xFFFF, "Specials", "特殊用途文字"],
    [0x1F100, 0x1F1FF, "Enclosed Alphanumeric Supplement", "囲み英数字補助（国旗用の地域識別文字を含む）"],
    [0x1F300, 0x1F5FF, "Miscellaneous Symbols and Pictographs", "その他の記号と絵文字"],
    [0x1F600, 0x1F64F, "Emoticons", "顔文字（絵文字）"],
    [0x1F680, 0x1F6FF, "Transport and Map Symbols", "交通・地図記号（絵文字）"],
    [0x1F900, 0x1F9FF, "Supplemental Symbols and Pictographs", "補助記号と絵文字"],
    [0x1FA70, 0x1FAFF, "Symbols and Pictographs Extended-A", "記号と絵文字拡張A"],
    [0x20000, 0x2A6DF, "CJK Unified Ideographs Extension B", "CJK統合漢字拡張B"],
    [0xE0100, 0xE01EF, "Variation Selectors Supplement", "異体字選択子補助"]
  ];

  const PAGE = 256;

  function hex(cp, min) { let s = cp.toString(16).toUpperCase(); while (s.length < (min || 4)) s = "0" + s; return s; }
  function cpHex(cp) { return "U+" + hex(cp); }
  function rangeText(b) { return cpHex(b[0]) + "〜" + cpHex(b[1]); }
  function findBlock(cp) {
    let lo = 0, hi = BLOCKS.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, b = BLOCKS[mid];
      if (cp < b[0]) hi = mid - 1; else if (cp > b[1]) lo = mid + 1; else return b;
    }
    return null;
  }
  function jsEsc(cp) { return cp <= 0xFFFF ? "\\u" + hex(cp) : "\\u{" + hex(cp) + "}"; }
  function utf8Hex(cp) {
    if (cp >= 0xD800 && cp <= 0xDFFF) return "（UTF-8 では表せません）";
    let a;
    if (cp < 0x80) a = [cp];
    else if (cp < 0x800) a = [0xC0 | (cp >> 6), 0x80 | (cp & 63)];
    else if (cp < 0x10000) a = [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
    else a = [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
    return a.map((x) => hex(x, 2)).join(" ");
  }
  function utf16Hex(cp) {
    if (cp < 0x10000) return hex(cp);
    const v = cp - 0x10000;
    return hex(0xD800 + (v >> 10)) + " " + hex(0xDC00 + (v & 0x3FF));
  }
  function regexExamples(b) {
    const s = hex(b[0]), e = hex(b[1]);
    const rows = [["u フラグ付き（全域で使える）", "/[\\u{" + s + "}-\\u{" + e + "}]/u"]];
    if (b[1] <= 0xFFFF) rows.push(["u フラグなし（BMP のみ）", "/[\\u" + s + "-\\u" + e + "]/"]);
    else rows.push(["u フラグなし", "BMP 外のため範囲指定できません（サロゲートペアになる）"]);
    rows.push(["全文字がこのブロック", "/^[\\u{" + s + "}-\\u{" + e + "}]+$/u"]);
    return rows;
  }

  const api = { BLOCKS: BLOCKS, findBlock: findBlock, regexExamples: regexExamples, utf8Hex: utf8Hex, utf16Hex: utf16Hex, cpHex: cpHex };
  if (typeof document === "undefined") { if (typeof module !== "undefined") module.exports = api; return; }

  const $ = (id) => document.getElementById(id);
  const state = { block: BLOCKS.filter((b) => b[2] === "Hiragana")[0], page: 0, cp: null };

  let reCn = null, reCtl = null, reMark = null;
  try { reCn = /^\p{Cn}$/u; reCtl = /^[\p{Cc}\p{Cf}\p{Z}\p{Cs}\p{Co}]$/u; reMark = /^\p{M}$/u; } catch (e) { /* 古いブラウザ */ }
  const GC = ["Lu", "Ll", "Lt", "Lm", "Lo", "Mn", "Mc", "Me", "Nd", "Nl", "No", "Pc", "Pd", "Ps", "Pe", "Pi", "Pf", "Po", "Sm", "Sc", "Sk", "So", "Zs", "Zl", "Zp", "Cc", "Cf", "Cs", "Co", "Cn"];
  function category(cp) {
    const ch = String.fromCodePoint(cp);
    for (const g of GC) {
      try { if (new RegExp("^\\p{gc=" + g + "}$", "u").test(ch)) return g; } catch (e) { return ""; }
    }
    return "";
  }
  function cellInfo(cp) {
    const ch = String.fromCodePoint(cp);
    if (cp >= 0xD800 && cp <= 0xDFFF) return { text: "—", dim: true };
    if (reCn && reCn.test(ch)) return { text: "·", dim: true };
    if (reCtl && reCtl.test(ch)) return { text: "—", dim: true };
    if (reMark && reMark.test(ch)) return { text: "◌" + ch, dim: false };
    return { text: ch, dim: false };
  }

  function el(tag, text, cls) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function addRow(dl, k, v) { dl.appendChild(el("dt", k)); const dd = el("dd"); dd.appendChild(el("span", v)); dl.appendChild(dd); }

  function renderQuery() {
    const rows = $("ubl-q-rows"), err = $("ubl-q-error");
    rows.innerHTML = ""; err.textContent = "";
    const q = $("ubl-q").value;
    if (q === "") return;
    let n = 0;
    for (const ch of q) {
      if (n >= 100) { err.textContent = "先頭100文字までを表示しています。"; break; }
      n++;
      const cp = ch.codePointAt(0);
      const b = findBlock(cp);
      const tr = el("tr");
      const shown = (cp <= 0x20 || (cp >= 0x7F && cp < 0xA0) || cp === 0xA0 || cp === 0x3000 || cp === 0xFEFF || (cp >= 0x2000 && cp <= 0x200F)) ? "（不可視）" : (cp >= 0xD800 && cp <= 0xDFFF ? "（孤立サロゲート）" : ch);
      tr.appendChild(el("td", shown));
      tr.appendChild(el("td", cpHex(cp)));
      tr.appendChild(el("td", b ? b[2] + "（" + b[3] + "）" : "この一覧にないブロック", "n"));
      tr.appendChild(el("td", b ? rangeText(b) : "—"));
      rows.appendChild(tr);
    }
  }

  function renderList() {
    const body = $("ubl-rows");
    body.innerHTML = "";
    const f = tb.z2h($("ubl-filter").value).toLowerCase().trim().replace(/^u\+/, "");
    let shown = 0;
    BLOCKS.forEach((b) => {
      const hay = (b[2] + " " + b[3] + " " + hex(b[0]) + " " + hex(b[1])).toLowerCase();
      let hit = f === "" || hay.indexOf(f) >= 0;
      if (!hit && /^[0-9a-f]{1,6}$/.test(f)) { const v = parseInt(f, 16); hit = v >= b[0] && v <= b[1]; }
      if (!hit) return;
      shown++;
      const tr = el("tr");
      tr.appendChild(el("td", rangeText(b)));
      tr.appendChild(el("td", b[2] + "（" + b[3] + "）", "n"));
      tr.appendChild(el("td", tb.fmt(b[1] - b[0] + 1)));
      const td = el("td");
      const btn = el("button", "表示", "ghost");
      btn.type = "button";
      btn.addEventListener("click", () => { state.block = b; state.page = 0; state.cp = null; renderBlock(); $("ubl-sel").scrollIntoView({ block: "nearest" }); });
      td.appendChild(btn); tr.appendChild(td);
      body.appendChild(tr);
    });
    $("ubl-count").textContent = shown + " / " + BLOCKS.length + " ブロックを表示中。";
  }

  function renderDetail() {
    const dl = $("ubl-detail");
    dl.innerHTML = "";
    if (state.cp == null) { dl.style.display = "none"; return; }
    dl.style.display = "";
    const cp = state.cp;
    const g = category(cp);
    addRow(dl, "コードポイント", cpHex(cp));
    addRow(dl, "UTF-8", utf8Hex(cp));
    addRow(dl, "UTF-16", utf16Hex(cp));
    addRow(dl, "JavaScript", jsEsc(cp));
    addRow(dl, "HTML", "&#x" + hex(cp, 1) + ";");
    if (g) addRow(dl, "一般カテゴリ", g);
  }

  function renderBlock() {
    const b = state.block;
    const total = b[1] - b[0] + 1;
    const pages = Math.ceil(total / PAGE);
    if (state.page >= pages) state.page = pages - 1;
    if (state.page < 0) state.page = 0;
    $("ubl-sel").textContent = b[2] + "（" + b[3] + "）  " + rangeText(b) + "  " + tb.fmt(total) + " コードポイント";
    $("ubl-page").textContent = "ページ " + (state.page + 1) + " / " + pages;
    $("ubl-prev").disabled = state.page === 0;
    $("ubl-next").disabled = state.page >= pages - 1;
    const grid = $("ubl-grid");
    grid.innerHTML = "";
    const from = b[0] + state.page * PAGE, to = Math.min(b[1], from + PAGE - 1);
    const frag = document.createDocumentFragment();
    for (let cp = from; cp <= to; cp++) {
      const info = cellInfo(cp);
      const c = el("button", info.text, "ubl-cell" + (info.dim ? " dim" : "") + (cp === state.cp ? " sel" : ""));
      c.type = "button";
      c.title = cpHex(cp);
      c.setAttribute("aria-label", cpHex(cp));
      c.addEventListener("click", () => { state.cp = cp; renderBlock(); });
      frag.appendChild(c);
    }
    grid.appendChild(frag);
    renderDetail();
    const re = $("ubl-re");
    re.innerHTML = "";
    regexExamples(b).forEach((r) => {
      re.appendChild(el("dt", r[0]));
      const dd = el("dd"); dd.appendChild(el("span", r[1]));
      if (r[1].charAt(0) === "/") {
        const cb = el("button", "コピー", "ghost copy-btn"); cb.type = "button"; cb.setAttribute("data-copy-text", r[1]); dd.appendChild(cb);
      }
      re.appendChild(dd);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ubl-q").addEventListener("input", renderQuery);
    $("ubl-filter").addEventListener("input", renderList);
    $("ubl-prev").addEventListener("click", () => { state.page--; renderBlock(); });
    $("ubl-next").addEventListener("click", () => { state.page++; renderBlock(); });
    renderQuery(); renderList(); renderBlock();
  });
})();
