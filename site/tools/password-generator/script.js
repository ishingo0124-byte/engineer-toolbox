(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digit: "0123456789",
    symbol: "!@#$%^&*()-_=+[]{};:,.<>/?"
  };
  // 紛らわしい文字: 数字の0/1、英大文字O/I、英小文字l、縦棒|
  const CONFUSING = "0O1lI|";

  // crypto.getRandomValues + 棄却法（rejection sampling）で剰余バイアスを避けた
  // [0, maxExclusive) の一様乱数を得る。
  function randomInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("invalid range");
    }
    if (maxExclusive > 0xFFFFFFFF) throw new Error("range too large");
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive; // 2^32 を超えない最大の maxExclusive の倍数
    const buf = new Uint32Array(1);
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % maxExclusive;
  }

  function uniqueChars(s) {
    return Array.from(new Set(Array.from(s))).join("");
  }

  function filterConfusing(s, exclude) {
    if (!exclude) return s;
    return Array.from(s).filter((c) => CONFUSING.indexOf(c) === -1).join("");
  }

  function buildCategories() {
    const exclude = $("pg-exclude").checked;
    const custom = $("pg-customsymbol").value.trim();
    const symbolSet = custom ? uniqueChars(custom) : SETS.symbol;
    const cats = [];
    if ($("pg-upper").checked) cats.push({ name: "upper", chars: filterConfusing(SETS.upper, exclude) });
    if ($("pg-lower").checked) cats.push({ name: "lower", chars: filterConfusing(SETS.lower, exclude) });
    if ($("pg-digit").checked) cats.push({ name: "digit", chars: filterConfusing(SETS.digit, exclude) });
    if ($("pg-symbol").checked) cats.push({ name: "symbol", chars: filterConfusing(symbolSet, exclude) });
    // 各カテゴリで文字が0個になった場合（除外設定でカテゴリが空になった等）はカテゴリごと除く
    return cats.filter((c) => c.chars.length > 0);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function generateOne(length, categories, combined) {
    const chars = [];
    // 選んだ文字種を最低1文字ずつ含める
    for (const c of categories) {
      chars.push(c.chars[randomInt(c.chars.length)]);
    }
    while (chars.length < length) {
      chars.push(combined[randomInt(combined.length)]);
    }
    return shuffle(chars).join("");
  }

  function run() {
    const err = $("pg-error");
    const listEl = $("pg-list");
    const entropyEl = $("pg-entropy");
    err.textContent = "";
    const length = parseInt($("pg-length").value, 10);
    $("pg-length-val").textContent = String(length);

    let categories;
    try {
      categories = buildCategories();
    } catch (e) {
      categories = [];
    }
    if (categories.length === 0) {
      err.textContent = "文字種を1つ以上選んでください（除外設定により文字が残らない組み合わせも不可です）。";
      listEl.innerHTML = "";
      entropyEl.textContent = "";
      return;
    }
    const combined = uniqueChars(categories.map((c) => c.chars).join(""));
    if (categories.length > length) {
      err.textContent = "長さが短すぎます。選んだ文字種の数（" + categories.length + "種類）以上の長さを指定してください。";
      listEl.innerHTML = "";
      entropyEl.textContent = "";
      return;
    }

    const rows = [];
    for (let i = 0; i < 5; i++) {
      const pw = generateOne(length, categories, combined);
      rows.push(
        '<dt>候補 ' + (i + 1) + '</dt><dd><span id="pg-pw-' + i + '" class="mono">' + escapeHtml(pw) +
        '</span><button type="button" class="copy-btn" data-copy-target="pg-pw-' + i + '">コピー</button></dd>'
      );
    }
    listEl.innerHTML = rows.join("");

    const bitsPerChar = Math.log2(combined.length);
    const entropy = length * bitsPerChar;
    entropyEl.textContent = "文字種の数: " + combined.length + "、長さ: " + length + " 文字 → 理論エントロピーの目安 約 " +
      entropy.toFixed(1) + " bit（各文字種を最低1文字含める制約があるため、厳密な一様分布よりわずかに小さくなります）。";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("pg-length").addEventListener("input", run);
    ["pg-upper", "pg-lower", "pg-digit", "pg-symbol", "pg-exclude"].forEach((id) => $(id).addEventListener("change", run));
    $("pg-customsymbol").addEventListener("input", run);
    $("pg-generate").addEventListener("click", run);
    run();
  });
})();
