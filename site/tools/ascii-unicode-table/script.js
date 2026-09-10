(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MAX_CHARS = 500;

  // 見た目が同じで違う文字の早見表
  const WEIRD = {
    0x0020: "半角スペース（基準）",
    0x00A0: "改行禁止スペース（NBSP）",
    0x1680: "オガム文字スペース",
    0x2000: "アンスペース",
    0x2001: "エムスペース",
    0x2002: "enスペース",
    0x2003: "emスペース",
    0x2004: "3分の1emスペース",
    0x2005: "4分の1emスペース",
    0x2006: "6分の1emスペース",
    0x2007: "数字スペース",
    0x2008: "句読点スペース",
    0x2009: "薄いスペース",
    0x200A: "髪の毛スペース",
    0x200B: "ゼロ幅スペース（ZWSP・不可視）",
    0x200C: "ゼロ幅非接合子（ZWNJ・不可視）",
    0x200D: "ゼロ幅接合子（ZWJ・不可視）",
    0x202F: "狭い改行禁止スペース",
    0x205F: "中間数学スペース",
    0x2060: "単語結合子（不可視）",
    0x3000: "全角スペース（半角と混同注意）",
    0xFEFF: "ゼロ幅非改行スペース／BOM（不可視）",
    0x00AD: "ソフトハイフン（通常は不可視）",
    0x002D: "ハイフンマイナス（半角・基準）",
    0x2010: "ハイフン",
    0x2011: "改行禁止ハイフン",
    0x2012: "フィギュアダッシュ",
    0x2013: "enダッシュ",
    0x2014: "emダッシュ",
    0x2015: "水平線",
    0x2212: "マイナス記号（数式用）",
    0x30FC: "長音記号（カタカナ・ハイフンと混同注意）",
    0xFF0D: "全角ハイフンマイナス",
    0xFF70: "半角カタカナ長音記号",
  };

  const CONTROL_NAMES = {
    0: ["NUL", "ヌル文字"], 1: ["SOH", "見出し開始"], 2: ["STX", "テキスト開始"], 3: ["ETX", "テキスト終了"],
    4: ["EOT", "伝送終了"], 5: ["ENQ", "問い合わせ"], 6: ["ACK", "肯定応答"], 7: ["BEL", "警告音"],
    8: ["BS", "バックスペース"], 9: ["HT", "水平タブ"], 10: ["LF", "改行（ラインフィード）"], 11: ["VT", "垂直タブ"],
    12: ["FF", "改ページ"], 13: ["CR", "復帰（キャリッジリターン）"], 14: ["SO", "シフトアウト"], 15: ["SI", "シフトイン"],
    16: ["DLE", "データリンクエスケープ"], 17: ["DC1", "装置制御1（XON）"], 18: ["DC2", "装置制御2"], 19: ["DC3", "装置制御3（XOFF）"],
    20: ["DC4", "装置制御4"], 21: ["NAK", "否定応答"], 22: ["SYN", "同期"], 23: ["ETB", "伝送ブロック終了"],
    24: ["CAN", "取り消し"], 25: ["EM", "メディア終了"], 26: ["SUB", "置換"], 27: ["ESC", "エスケープ"],
    28: ["FS", "フィールド区切り"], 29: ["GS", "グループ区切り"], 30: ["RS", "レコード区切り"], 31: ["US", "ユニット区切り"],
    127: ["DEL", "削除"],
  };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function utf8Hex(ch) {
    const bytes = new TextEncoder().encode(ch);
    return Array.from(bytes).map((b) => "0x" + b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
  }

  function utf16Hex(ch) {
    const units = [];
    for (let i = 0; i < ch.length; i++) {
      units.push("U+" + ch.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0"));
    }
    return units.join(" ");
  }

  function classify(cp, ch) {
    if (Object.prototype.hasOwnProperty.call(WEIRD, cp)) {
      return { label: WEIRD[cp], weird: true };
    }
    if (cp <= 0x1f || cp === 0x7f) {
      const c = CONTROL_NAMES[cp];
      return { label: "ASCII制御文字" + (c ? "（" + c[0] + "：" + c[1] + "）" : ""), weird: false };
    }
    if (cp <= 0x7f) {
      if (/[0-9A-Za-z]/.test(ch)) return { label: "ASCII英数字", weird: false };
      return { label: "ASCII記号", weird: false };
    }
    try {
      if (/\p{Cf}/u.test(ch)) return { label: "書式文字（ゼロ幅など・不可視の可能性）", weird: false };
      if (/\p{M}/u.test(ch)) return { label: "結合文字（ダイアクリティカルマーク）", weird: false };
    } catch (e) { /* 古いブラウザでは \p{} 未対応。以降の判定にフォールバック */ }
    if ((cp >= 0x3041 && cp <= 0x3096) || (cp >= 0x309d && cp <= 0x309f)) return { label: "ひらがな", weird: false };
    if ((cp >= 0x30a1 && cp <= 0x30fa) || (cp >= 0x30fd && cp <= 0x30ff)) return { label: "カタカナ", weird: false };
    if (cp >= 0xff66 && cp <= 0xff9d) return { label: "半角カタカナ", weird: false };
    if ((cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x20000 && cp <= 0x2a6df) || (cp >= 0xf900 && cp <= 0xfaff)) {
      return { label: "漢字（CJK統合漢字）", weird: false };
    }
    try {
      if (/\p{Emoji_Presentation}/u.test(ch) || (cp >= 0x1f1e6 && cp <= 0x1f1ff)) return { label: "絵文字", weird: false };
    } catch (e) { /* ignore */ }
    if ((cp >= 0x2600 && cp <= 0x27bf) || (cp >= 0x1f300 && cp <= 0x1faff)) return { label: "絵文字", weird: false };
    try {
      if (/\p{L}/u.test(ch)) return { label: "文字（ラテン系・その他言語）", weird: false };
      if (/\p{N}/u.test(ch)) return { label: "数字（Unicode Number）", weird: false };
      if (/\p{P}/u.test(ch) || /\p{S}/u.test(ch)) return { label: "記号・句読点", weird: false };
    } catch (e) { /* ignore */ }
    return { label: "その他のUnicode文字", weird: false };
  }

  function buildForwardTable(text) {
    const wrap = $("au-table-wrap");
    wrap.textContent = "";
    const err = $("au-error");
    err.textContent = "";
    if (text === "") {
      wrap.appendChild(el("p", "hint", "上に文字列を入力すると、1文字ごとの詳細がここに表示されます。"));
      return;
    }
    const chars = Array.from(text);
    let truncated = false;
    let list = chars;
    if (chars.length > MAX_CHARS) {
      list = chars.slice(0, MAX_CHARS);
      truncated = true;
    }
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["文字", "コードポイント", "10進", "UTF-8バイト", "UTF-16", "種別"].forEach((h) => hr.appendChild(el("th", null, h)));
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    list.forEach((ch) => {
      const cp = ch.codePointAt(0);
      const info = classify(cp, ch);
      const tr = document.createElement("tr");
      if (info.weird) tr.className = "au-weird";
      const dispCh = cp <= 0x20 || (cp >= 0x7f && cp <= 0xa0) || (info.label.indexOf("不可視") >= 0) ? "␣" : ch;
      tr.appendChild(el("td", "au-ch mono", dispCh));
      tr.appendChild(el("td", "mono", "U+" + cp.toString(16).toUpperCase().padStart(4, "0")));
      tr.appendChild(el("td", "mono", String(cp)));
      tr.appendChild(el("td", "mono", utf8Hex(ch)));
      tr.appendChild(el("td", "mono", utf16Hex(ch) + (ch.length > 1 ? "（サロゲートペア）" : "")));
      tr.appendChild(el("td", "au-cat", info.label));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    if (truncated) {
      wrap.appendChild(el("p", "hint", "入力が長いため先頭" + MAX_CHARS + "文字のみ表示しています。"));
    }
  }

  // ---- 逆変換（コード → 文字） ----
  const TOKEN_RE = /U\+([0-9A-Fa-f]{2,6})|\\u\{([0-9A-Fa-f]{1,6})\}|\\u([0-9A-Fa-f]{4})|&#x([0-9A-Fa-f]+);|&#(\d+);/gi;

  function isByteSequence(line) {
    const parts = line.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0) return null;
    const bytes = [];
    for (const p of parts) {
      if (!/^(0x)?[0-9A-Fa-f]{2}$/.test(p)) return null;
      bytes.push(parseInt(p.replace(/^0x/i, ""), 16));
    }
    return bytes;
  }

  function decodeLine(line) {
    const trimmed = line.trim();
    if (trimmed === "") return null;
    const bytes = isByteSequence(trimmed);
    if (bytes) {
      try {
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
        return { ok: true, text: decoded, mode: "UTF-8バイト列として解釈" };
      } catch (e) {
        return { ok: false, text: "", mode: "UTF-8バイト列として不正です" };
      }
    }
    let m;
    let out = "";
    let found = false;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(line)) !== null) {
      found = true;
      if (m[1] !== undefined) out += String.fromCodePoint(parseInt(m[1], 16));
      else if (m[2] !== undefined) out += String.fromCodePoint(parseInt(m[2], 16));
      else if (m[3] !== undefined) out += String.fromCharCode(parseInt(m[3], 16));
      else if (m[4] !== undefined) out += String.fromCodePoint(parseInt(m[4], 16));
      else if (m[5] !== undefined) out += String.fromCodePoint(parseInt(m[5], 10));
    }
    if (found) return { ok: true, text: out, mode: "コード表記として解釈" };
    // どの形式にも一致しない場合はそのまま文字列とみなす
    return { ok: true, text: line, mode: "そのまま文字列として解釈" };
  }

  function copyBtn(text) {
    const b = el("button", "copy-btn", "コピー");
    b.type = "button";
    b.setAttribute("data-copy-text", text);
    return b;
  }

  function buildReverse(text) {
    const wrap = $("au-reverse-out");
    wrap.textContent = "";
    const lines = text.split(/\r\n|\r|\n/);
    let any = false;
    lines.forEach((line) => {
      const r = decodeLine(line);
      if (r === null) return;
      any = true;
      const row = el("div", "au-reverse-row");
      row.appendChild(el("span", "au-src mono", line.trim()));
      row.appendChild(el("span", "hint", "→ (" + r.mode + ")"));
      row.appendChild(el("span", "au-val", r.ok ? r.text : "（復元できません）"));
      if (r.ok) row.appendChild(copyBtn(r.text));
      wrap.appendChild(row);
    });
    if (!any) wrap.appendChild(el("p", "hint", "復元したいコード表記を入力してください。"));
  }

  function buildAsciiTable() {
    const wrap = $("au-ascii-wrap");
    if (wrap.dataset.built === "1") return;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["10進", "16進", "文字／略称", "説明"].forEach((h) => hr.appendChild(el("th", null, h)));
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (let i = 0; i <= 127; i++) {
      const tr = document.createElement("tr");
      tr.appendChild(el("td", "mono", String(i)));
      tr.appendChild(el("td", "mono", "0x" + i.toString(16).toUpperCase().padStart(2, "0")));
      if (i < 32 || i === 127) {
        const c = CONTROL_NAMES[i];
        tr.appendChild(el("td", "au-ch mono", c ? c[0] : "?"));
        tr.appendChild(el("td", null, c ? c[1] : "制御文字"));
      } else if (i === 32) {
        tr.appendChild(el("td", "au-ch mono", "SP"));
        tr.appendChild(el("td", null, "半角スペース"));
      } else {
        const ch = String.fromCharCode(i);
        tr.appendChild(el("td", "au-ch mono", ch));
        tr.appendChild(el("td", null, /[0-9A-Za-z]/.test(ch) ? "英数字" : "記号"));
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    wrap.dataset.built = "1";
  }

  function run() {
    buildForwardTable($("au-input").value);
    buildReverse($("au-reverse-input").value);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildAsciiTable();
    // 不可視・紛らわしい文字を含む例文は \u エスケープで確実に指定する
    if ($("au-input").value === "") {
      $("au-input").value =
        "AbZ09 \u3042\u3044\u30A2\u30A4\u65E5 \uD83D\uDE00 caf\u00E9" +
        " A\u00A0B A-B A\u2011B A\u2212B A\u3000B\u200B";
    }
    $("au-input").addEventListener("input", run);
    $("au-reverse-input").addEventListener("input", run);
    run();
  });
})();
