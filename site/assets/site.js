/* 共通ヘルパ。各ツールの script.js から window.tb.* で使う */
(function () {
  "use strict";
  const tb = {};
  tb.copy = function (text, btn) {
    const done = () => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = "コピー済み";
      btn.classList.add("done");
      setTimeout(() => { btn.textContent = old; btn.classList.remove("done"); }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  };
  tb.fmt = function (n) {
    if (typeof n === "bigint") return n.toLocaleString("ja-JP");
    if (!isFinite(n)) return String(n);
    return Number(n).toLocaleString("ja-JP");
  };
  tb.debounce = function (fn, ms) {
    let t; return function () { clearTimeout(t); const a = arguments, s = this; t = setTimeout(() => fn.apply(s, a), ms || 150); };
  };
  // 全角数字・記号を半角へ
  tb.z2h = function (s) {
    return String(s).replace(/[０-９Ａ-Ｚａ-ｚ．／：－]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/　/g, " ");
  };
  window.tb = tb;

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".copy-btn");
    if (!b) return;
    const id = b.getAttribute("data-copy-target");
    let text = b.getAttribute("data-copy-text");
    if (!text && id) {
      const el = document.getElementById(id);
      if (el) text = ("value" in el && el.tagName !== "DIV") ? el.value : el.textContent;
    }
    if (text != null) tb.copy(text.trim(), b);
  });
})();
