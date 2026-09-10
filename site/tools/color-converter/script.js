(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // CSS拡張カラーキーワード 147色（SVG 1.1 / CSS Color Module Level 3 の named colors。
  // CSS Color Level 4 で追加された rebeccapurple・transparent は147色に含まれないため対象外）
  const NAMES = {
    aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff",
    beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff",
    blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00",
    chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c",
    cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9",
    darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f",
    darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3",
    deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff",
    firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", grey: "#808080",
    green: "#008000", greenyellow: "#adff2f", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c",
    indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899",
    lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6",
    magenta: "#ff00ff", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3",
    mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5",
    navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23",
    orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98",
    paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f",
    pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", red: "#ff0000",
    rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460",
    seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", silver: "#c0c0c0", skyblue: "#87ceeb",
    slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f",
    steelblue: "#4682b4", tan: "#d2b48c", teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347",
    turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff", whitesmoke: "#f5f5f5",
    yellow: "#ffff00", yellowgreen: "#9acd32"
  };
  const HEX_TO_NAME = {};
  Object.keys(NAMES).forEach((n) => {
    const h = NAMES[n];
    if (!(h in HEX_TO_NAME)) HEX_TO_NAME[h] = n; // 同じ色に複数名がある場合は先勝ち（gray系はgray/greyを別名として保持しない）
  });

  function toHalfWidth(s) {
    return String(s || "").replace(/[０-９．％]/g, (c) => {
      if (c === "．") return ".";
      if (c === "％") return "%";
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    });
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  // ---- パース ----
  function parseColor(raw) {
    const s = toHalfWidth(String(raw || "")).trim();
    if (s === "") return null;

    // HEX (#rgb #rgba #rrggbb #rrggbbaa)
    let m = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
    if (m) {
      let h = m[1];
      let r, g, b, a = 1;
      if (h.length === 3 || h.length === 4) {
        r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16);
        if (h.length === 4) a = parseInt(h[3] + h[3], 16) / 255;
      } else {
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
        if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
      }
      return { r, g, b, a };
    }

    // rgb() / rgba()
    m = /^rgba?\(\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*(?:[,\/]\s*([\d.]+%?)\s*)?\)$/i.exec(s);
    if (m) {
      const toC = (v) => v.endsWith("%") ? Math.round(parseFloat(v) * 2.55) : Math.round(parseFloat(v));
      const r = clamp(toC(m[1]), 0, 255), g = clamp(toC(m[2]), 0, 255), b = clamp(toC(m[3]), 0, 255);
      let a = 1;
      if (m[4] !== undefined) a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r, g, b, a: clamp(a, 0, 1) };
    }

    // hsl() / hsla()
    m = /^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,\/]\s*([\d.]+%?)\s*)?\)$/i.exec(s);
    if (m) {
      const h = ((parseFloat(m[1]) % 360) + 360) % 360;
      const sPct = clamp(parseFloat(m[2]), 0, 100);
      const lPct = clamp(parseFloat(m[3]), 0, 100);
      let a = 1;
      if (m[4] !== undefined) a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      const rgb = hslToRgb(h, sPct, lPct);
      return { r: rgb.r, g: rgb.g, b: rgb.b, a: clamp(a, 0, 1) };
    }

    // CSS 色名
    const nameKey = s.toLowerCase().replace(/[^a-z]/g, "");
    if (NAMES[nameKey]) {
      const hx = NAMES[nameKey];
      return { r: parseInt(hx.slice(1, 3), 16), g: parseInt(hx.slice(3, 5), 16), b: parseInt(hx.slice(5, 7), 16), a: 1 };
    }
    return null;
  }

  // ---- 変換 ----
  function rgbToHex(r, g, b, a) {
    const h2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    let hex = "#" + h2(r) + h2(g) + h2(b);
    if (a !== undefined && a < 1) hex += h2(Math.round(a * 255));
    return hex;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, sPct, lPct) {
    const s = sPct / 100, l = lPct / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hp >= 0 && hp < 1) { r1 = c; g1 = x; }
    else if (hp < 2) { r1 = x; g1 = c; }
    else if (hp < 3) { g1 = c; b1 = x; }
    else if (hp < 4) { g1 = x; b1 = c; }
    else if (hp < 5) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    const m = l - c / 2;
    return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
  }

  // WCAG 2.x 相対輝度・コントラスト比
  function relLuminance(r, g, b) {
    const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function contrastRatio(c1, c2) {
    const l1 = relLuminance(c1.r, c1.g, c1.b), l2 = relLuminance(c2.r, c2.g, c2.b);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function badge(label, pass) {
    return '<span class="cc-badge ' + (pass ? "pass" : "fail") + '">' + label + (pass ? " 適合" : " 不適合") + "</span>";
  }

  function rgbaCss(c) {
    return c.a < 1
      ? "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + round2(c.a) + ")"
      : "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";
  }
  function hslaCss(c, hsl) {
    const h = Math.round(hsl.h), s = Math.round(hsl.s), l = Math.round(hsl.l);
    return c.a < 1 ? "hsla(" + h + ", " + s + "%, " + l + "%, " + round2(c.a) + ")" : "hsl(" + h + ", " + s + "%, " + l + "%)";
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function cssColor(c) { return rgbaCss(c); }

  function buildScale(h, s, baseL) {
    const steps = [-80, -60, -40, -20, 0, 20, 40, 60, 80];
    return steps.map((pct) => {
      let l;
      if (pct === 0) l = baseL;
      else if (pct < 0) l = baseL * (1 + pct / 100); // 黒側へ
      else l = baseL + (100 - baseL) * (pct / 100); // 白側へ
      l = clamp(l, 0, 100);
      const rgb = hslToRgb(h, s, l);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    });
  }

  function run() {
    const err = $("cc-error");
    err.textContent = "";
    const raw = $("cc-input").value;
    const c = parseColor(raw);
    if (!c) {
      if (raw.trim() !== "") err.textContent = "色の形式を認識できません（例: #3b82f6 / rgb(59,130,246) / hsl(217,91%,60%) / royalblue）";
      $("cc-preview").style.background = "";
      ["cc-out-hex", "cc-out-rgb", "cc-out-hsl", "cc-out-lightness", "cc-out-name"].forEach((id) => $(id).textContent = "-");
      $("cc-names-hint").textContent = "";
      $("cc-badges").innerHTML = "";
      $("cc-out-ratio").textContent = "-";
      $("cc-scale").innerHTML = "";
      $("cc-comp-swatch").style.background = "";
      $("cc-comp-hex").textContent = "-";
      return;
    }
    const hsl = rgbToHsl(c.r, c.g, c.b);
    $("cc-preview").style.background = cssColor(c);
    $("cc-out-hex").textContent = rgbToHex(c.r, c.g, c.b, c.a);
    $("cc-out-rgb").textContent = rgbaCss(c);
    $("cc-out-hsl").textContent = hslaCss(c, hsl);
    $("cc-out-lightness").textContent = round2(hsl.l) + "%（HSLのL値。0%が黒、100%が白）";
    const exactHex = rgbToHex(c.r, c.g, c.b);
    const name = HEX_TO_NAME[exactHex];
    $("cc-out-name").textContent = name ? name : "（一致なし）";
    $("cc-names-hint").textContent = "CSS拡張カラーキーワード147色から完全一致した名前のみ表示します（近似色の推測はしません）。";

    // コントラスト
    const bgRaw = $("cc-bg").value;
    const bg = parseColor(bgRaw);
    if (bg) {
      $("cc-swatch-fg").style.background = cssColor(c);
      $("cc-swatch-bg").style.background = cssColor(bg);
      const ratio = contrastRatio(c, bg);
      $("cc-out-ratio").textContent = ratio.toFixed(2) + " : 1";
      $("cc-badges").innerHTML =
        badge("AA 通常文字(4.5以上)", ratio >= 4.5) +
        badge("AA 大きな文字(3.0以上)", ratio >= 3.0) +
        badge("AAA 通常文字(7.0以上)", ratio >= 7.0) +
        badge("AAA 大きな文字(4.5以上)", ratio >= 4.5);
    } else {
      $("cc-out-ratio").textContent = "-";
      $("cc-badges").innerHTML = "";
      if (bgRaw.trim() !== "") err.textContent = (err.textContent ? err.textContent + " / " : "") + "背景色の形式が正しくありません";
    }

    // 補色
    const compH = (hsl.h + 180) % 360;
    const compRgb = hslToRgb(compH, hsl.s, hsl.l);
    $("cc-comp-swatch").style.background = "rgb(" + compRgb.r + "," + compRgb.g + "," + compRgb.b + ")";
    $("cc-comp-hex").textContent = rgbToHex(compRgb.r, compRgb.g, compRgb.b);

    // 明暗バリエーション
    const scale = buildScale(hsl.h, hsl.s, hsl.l);
    $("cc-scale").innerHTML = scale.map((hex) => '<div style="background:' + hex + '" title="' + hex + '"></div>').join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("cc-input").addEventListener("input", run);
    $("cc-bg").addEventListener("input", run);
    $("cc-swap").addEventListener("click", () => {
      const a = $("cc-input").value, b = $("cc-bg").value;
      $("cc-input").value = b;
      $("cc-bg").value = a;
      run();
    });
    run();
  });
})();
