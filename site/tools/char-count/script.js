(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const seg = ("Intl" in window && Intl.Segmenter) ? new Intl.Segmenter("ja", { granularity: "grapheme" }) : null;

  function graphemes(s) {
    if (!s) return 0;
    if (seg) { let n = 0; for (const _ of seg.segment(s)) n++; return n; }
    return Array.from(s).length;
  }
  function utf8Bytes(s) { return new TextEncoder().encode(s).length; }
  function sjisBytes(s) {
    // 概算: ASCII と半角カナ(U+FF61-FF9F) は 1 バイト、それ以外は 2 バイト
    let n = 0;
    for (const ch of s) {
      const c = ch.codePointAt(0);
      if (c < 0x80 || (c >= 0xff61 && c <= 0xff9f)) n += 1; else n += 2;
    }
    return n;
  }

  function run() {
    const s = $("cc-text").value;
    const noNl = s.replace(/\r?\n/g, "");
    const noWs = s.replace(/[\s　]/g, "");
    const all = graphemes(s);
    $("cc-all").textContent = tb.fmt(all);
    $("cc-nonl").textContent = tb.fmt(graphemes(noNl));
    $("cc-nows").textContent = tb.fmt(graphemes(noWs));
    $("cc-lines").textContent = tb.fmt(s === "" ? 0 : s.split(/\r?\n/).length);
    $("cc-paras").textContent = tb.fmt(s.trim() === "" ? 0 : s.trim().split(/\r?\n\s*\r?\n/).length);
    const words = s.match(/[A-Za-z0-9_'-]+/g);
    $("cc-words").textContent = tb.fmt(words ? words.length : 0);
    $("cc-utf8").textContent = tb.fmt(utf8Bytes(s)) + "（コードポイント " + tb.fmt(Array.from(s).length) + "）";
    $("cc-sjis").textContent = tb.fmt(sjisBytes(s));
    $("cc-genko").textContent = (graphemes(noNl) / 400).toFixed(2).replace(/\.?0+$/, "") + " 枚";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("cc-text").addEventListener("input", run);
    $("cc-clear").addEventListener("click", () => { $("cc-text").value = ""; run(); $("cc-text").focus(); });
    run();
  });
})();
