(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // JIS X 0201 半角カナ(U+FF61-FF9F, 63文字)と対応する全角(基本形)の並び
  const HALF_KANA = "｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰ" +
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀ" +
    "ﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐ" +
    "ﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ";
  const FULL_KANA = "。「」、・ヲァィゥェォャュョッー" +
    "アイウエオカキクケコサシスセソタ" +
    "チツテトナニヌネノハヒフヘホマミ" +
    "ムメモヤユヨラリルレロワン゛゜";

  // 濁点(ﾞ)・半濁点(ﾟ)が付く行。半角ベース文字 -> [濁音, 半濁音(あれば)]
  const DAKUTEN_PAIRS = [
    ["ｶ", "ガ"], ["ｷ", "ギ"], ["ｸ", "グ"], ["ｹ", "ゲ"], ["ｺ", "ゴ"], // カ行
    ["ｻ", "ザ"], ["ｼ", "ジ"], ["ｽ", "ズ"], ["ｾ", "ゼ"], ["ｿ", "ゾ"], // サ行
    ["ﾀ", "ダ"], ["ﾁ", "ヂ"], ["ﾂ", "ヅ"], ["ﾃ", "デ"], ["ﾄ", "ド"], // タ行
    ["ﾊ", "バ"], ["ﾋ", "ビ"], ["ﾌ", "ブ"], ["ﾍ", "ベ"], ["ﾎ", "ボ"], // ハ行(濁音)
    ["ｳ", "ヴ"] // ウ -> ヴ
  ];
  const HANDAKUTEN_PAIRS = [
    ["ﾊ", "パ"], ["ﾋ", "ピ"], ["ﾌ", "プ"], ["ﾍ", "ペ"], ["ﾎ", "ポ"] // ハ行(半濁音)
  ];
  const DAKUTEN_MAP = {}, HANDAKUTEN_MAP = {}, VOICED_TO_HALF = {}, HANDVOICED_TO_HALF = {};
  DAKUTEN_PAIRS.forEach(([half, full]) => { DAKUTEN_MAP[half] = full; VOICED_TO_HALF[full] = half; });
  HANDAKUTEN_PAIRS.forEach(([half, full]) => { HANDAKUTEN_MAP[half] = full; HANDVOICED_TO_HALF[full] = half; });
  const DAKUTEN_H = "ﾞ", HANDAKUTEN_H = "ﾟ";

  function halfKanaToFull(s) {
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i], next = s[i + 1];
      if (next === DAKUTEN_H && DAKUTEN_MAP[c]) { out += DAKUTEN_MAP[c]; i++; continue; }
      if (next === HANDAKUTEN_H && HANDAKUTEN_MAP[c]) { out += HANDAKUTEN_MAP[c]; i++; continue; }
      const idx = HALF_KANA.indexOf(c);
      out += idx >= 0 ? FULL_KANA[idx] : c;
    }
    return out;
  }
  function fullKanaToHalf(s) {
    let out = "";
    for (const c of s) {
      if (VOICED_TO_HALF[c]) { out += VOICED_TO_HALF[c] + DAKUTEN_H; continue; }
      if (HANDVOICED_TO_HALF[c]) { out += HANDVOICED_TO_HALF[c] + HANDAKUTEN_H; continue; }
      const idx = FULL_KANA.indexOf(c);
      out += idx >= 0 ? HALF_KANA[idx] : c;
    }
    return out;
  }

  function fullToHalfAlnumSymbol(s, opt) {
    return s.replace(/[！-～]/g, (ch) => {
      const code = ch.charCodeAt(0);
      const isAlnum = (code >= 0xFF10 && code <= 0xFF19) || (code >= 0xFF21 && code <= 0xFF3A) || (code >= 0xFF41 && code <= 0xFF5A);
      if (isAlnum && !opt.alnum) return ch;
      if (!isAlnum && !opt.symbol) return ch;
      return String.fromCharCode(code - 0xFEE0);
    });
  }
  function halfToFullAlnumSymbol(s, opt) {
    return s.replace(/[\x21-\x7E]/g, (ch) => {
      const code = ch.charCodeAt(0);
      const isAlnum = (code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
      if (isAlnum && !opt.alnum) return ch;
      if (!isAlnum && !opt.symbol) return ch;
      return String.fromCharCode(code + 0xFEE0);
    });
  }

  function convert(s, dir, opt) {
    if (dir === "f2h") {
      if (opt.kana) s = fullKanaToHalf(s);
      if (opt.alnum || opt.symbol) s = fullToHalfAlnumSymbol(s, opt);
      if (opt.space) s = s.replace(/　/g, " ");
    } else {
      if (opt.kana) s = halfKanaToFull(s);
      if (opt.alnum || opt.symbol) s = halfToFullAlnumSymbol(s, opt);
      if (opt.space) s = s.replace(/ /g, "　");
    }
    return s;
  }

  function run() {
    const opt = { alnum: $("zh-alnum").checked, symbol: $("zh-symbol").checked, space: $("zh-space").checked, kana: $("zh-kana").checked };
    const dir = $("zh-dir").value;
    $("zh-error").textContent = "";
    try {
      $("zh-output").value = convert($("zh-input").value, dir, opt);
    } catch (e) {
      $("zh-error").textContent = e.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["zh-input", "zh-dir", "zh-alnum", "zh-symbol", "zh-space", "zh-kana"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    $("zh-clear").addEventListener("click", () => { $("zh-input").value = ""; run(); $("zh-input").focus(); });
    $("zh-swap").addEventListener("click", () => {
      $("zh-dir").value = $("zh-dir").value === "f2h" ? "h2f" : "f2h";
      $("zh-input").value = $("zh-output").value;
      run();
    });
    run();
  });
})();
