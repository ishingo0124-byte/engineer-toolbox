(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const ALL_ENCODINGS = ["utf-8", "shift_jis", "euc-jp", "windows-1252"];
  const encodeTableCache = new Map();

  // enc の文字→バイト列 逆引き表を、TextDecoder で全バイト列を総当たりデコードして作る
  // （TextEncoder は utf-8 以外の書き込みに未対応のため。WHATWG Encoding Standard 準拠）
  function buildEncodeTable(enc) {
    if (encodeTableCache.has(enc)) return encodeTableCache.get(enc);
    const map = new Map();
    let dec;
    try { dec = new TextDecoder(enc, { fatal: true }); } catch (e) { encodeTableCache.set(enc, map); return map; }
    for (let b = 0; b <= 0xff; b++) {
      try {
        const s = dec.decode(new Uint8Array([b]));
        if (s.length === 1 && !map.has(s)) map.set(s, [b]);
      } catch (e) { /* この1バイト単体では無効（先頭バイトの可能性） */ }
    }
    for (let b1 = 0x80; b1 <= 0xff; b1++) {
      for (let b2 = 0x00; b2 <= 0xff; b2++) {
        try {
          const s = dec.decode(new Uint8Array([b1, b2]));
          if (s.length === 1 && !map.has(s)) map.set(s, [b1, b2]);
        } catch (e) { /* 無効な2バイト列 */ }
      }
    }
    encodeTableCache.set(enc, map);
    return map;
  }

  function encodeAs(enc, str) {
    if (enc === "utf-8") return { bytes: Array.from(new TextEncoder().encode(str)), lost: false };
    const table = buildEncodeTable(enc);
    const bytes = [];
    let lost = false;
    for (const ch of str) {
      const m = table.get(ch);
      if (m) bytes.push.apply(bytes, m);
      else { bytes.push(0x3f); lost = true; } // '?' で代替＝情報欠落
    }
    return { bytes: bytes, lost: lost };
  }

  function decodeAs(enc, bytes) {
    const dec = new TextDecoder(enc, { fatal: false });
    const s = dec.decode(new Uint8Array(bytes));
    return { text: s, lost: s.indexOf("�") !== -1 };
  }

  // 「日本語らしさ」の簡易スコア。ひらがな > カタカナ > 漢字 > 全角記号の順に加点し、
  // U+FFFD（デコード失敗）や、ひらがなが皆無なのに半角カナ・全角英数だけが浮いている
  // （UTF-8をShift_JISと誤読した典型パターン）を減点する。
  function jpScore(s) {
    if (!s) return -Infinity;
    let score = 0, total = 0, hira = 0, sus = 0;
    for (const ch of s) {
      total++;
      const c = ch.codePointAt(0);
      if (ch === "�") { score -= 4; continue; }
      if (c >= 0x3040 && c <= 0x309f) { score += 3; hira++; continue; }
      if ((c >= 0x30a0 && c <= 0x30ff) || (c >= 0x31f0 && c <= 0x31ff)) { score += 2; continue; }
      if (c >= 0x4e00 && c <= 0x9fff) { score += 1; continue; }
      if (c >= 0x3000 && c <= 0x303f) { score += 1; continue; }
      if (c >= 0xff61 && c <= 0xff9f) { score += 0.2; sus++; continue; }
      if (c >= 0xff01 && c <= 0xff5e) { score -= 1.5; sus++; continue; }
      if (c < 0x09 || (c >= 0x0e && c < 0x20)) { score -= 2; continue; }
    }
    if (hira === 0 && sus > 0) score -= sus * 1.2;
    return total === 0 ? -Infinity : score / total;
  }

  function detectFromText(garbled) {
    const results = [{ label: "変換なし（そのまま）", text: garbled, lost: false, score: jpScore(garbled) }];
    ALL_ENCODINGS.forEach((wrong) => {
      ALL_ENCODINGS.forEach((correct) => {
        if (wrong === correct) return;
        const enc = encodeAs(wrong, garbled);
        const dec = decodeAs(correct, enc.bytes);
        results.push({ label: wrong + " → " + correct, text: dec.text, lost: enc.lost || dec.lost, score: jpScore(dec.text) });
      });
    });
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  function detectFromHex(hex) {
    const clean = hex.replace(/[^0-9a-fA-F]/g, "");
    const bytes = [];
    for (let i = 0; i + 1 < clean.length; i += 2) bytes.push(parseInt(clean.slice(i, i + 2), 16));
    const oddNibble = clean.length % 2 !== 0;
    const results = ALL_ENCODINGS.map((enc) => {
      const dec = decodeAs(enc, bytes);
      return { label: enc, text: dec.text, lost: dec.lost, score: jpScore(dec.text) };
    });
    results.sort((a, b) => b.score - a.score);
    return { bytes: bytes, results: results, oddNibble: oddNibble };
  }

  function render(results, note) {
    const table = $("ed-table"), tbody = $("ed-rows"), summary = $("ed-summary"), err = $("ed-error");
    err.textContent = "";
    tbody.innerHTML = "";
    if (!results || results.length === 0) {
      table.hidden = true;
      summary.textContent = note || "";
      return;
    }
    table.hidden = false;
    summary.textContent = note || "候補を「日本語らしさ」スコアが高い順に表示します。";
    results.forEach((r, i) => {
      const tr = document.createElement("tr");
      const tdLabel = document.createElement("td"); tdLabel.textContent = (i === 0 ? "① " : "") + r.label;
      const tdText = document.createElement("td"); tdText.className = "mono"; tdText.textContent = r.text === "" ? "（空）" : r.text;
      const tdStatus = document.createElement("td"); tdStatus.textContent = r.lost ? "⚠ 一部復元できず" : "";
      const tdBtn = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "copy-btn"; btn.textContent = "コピー";
      btn.setAttribute("data-copy-text", r.text);
      tdBtn.appendChild(btn);
      tr.appendChild(tdLabel); tr.appendChild(tdText); tr.appendChild(tdStatus); tr.appendChild(tdBtn);
      tbody.appendChild(tr);
    });
  }

  function run() {
    const raw = $("ed-input").value;
    const hexMode = $("ed-mode-hex").checked;
    if (raw.trim() === "") { render([], "文字列（または16進ダンプ）を入力してください。"); return; }
    if (hexMode) {
      const clean = raw.replace(/[^0-9a-fA-F]/g, "");
      if (clean.length === 0) { $("ed-error").textContent = "有効な16進数が見つかりません。"; render([], ""); return; }
      const r = detectFromHex(raw);
      let note = tb.fmt(r.bytes.length) + " バイトとして解釈しました。";
      if (r.oddNibble) note += "（末尾に桁が1つ余っていたため無視しました）";
      render(r.results, note);
    } else {
      render(detectFromText(raw), null);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ed-input").addEventListener("input", run);
    $("ed-mode-text").addEventListener("change", run);
    $("ed-mode-hex").addEventListener("change", run);
    $("ed-clear").addEventListener("click", () => { $("ed-input").value = ""; run(); $("ed-input").focus(); });
    run();
  });
})();
