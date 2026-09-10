(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const REV_IDS = ["umk-tu-r", "umk-tu-w", "umk-tu-x", "umk-tg-r", "umk-tg-w", "umk-tg-x", "umk-to-r", "umk-to-w", "umk-to-x"];

  function toHalfWidth(s) {
    return String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  function complement3(x) { return x ^ 7; } // 3ビット内でのビット反転（0-7）

  function digit(r, w, x) { return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0); }

  function symDigit(d) {
    return (d & 4 ? "r" : "-") + (d & 2 ? "w" : "-") + (d & 1 ? "x" : "-");
  }

  function parseUmask(raw) {
    const s = toHalfWidth(String(raw || "").trim());
    if (!/^[0-7]{1,4}$/.test(s)) return null;
    // 3桁 or 4桁のみ意味が一意に定まるため受け付ける。1〜2桁は先頭を0で埋めて3桁として解釈する。
    let str = s;
    if (str.length < 3) str = str.padStart(3, "0");
    if (str.length === 4) str = str.slice(1); // 特殊ビット用の4桁目は新規作成権限には影響しないため無視
    return { u: parseInt(str[0], 10), g: parseInt(str[1], 10), o: parseInt(str[2], 10) };
  }

  function computeNew(baseDigit, u) {
    return baseDigit & complement3(u);
  }

  function renderForward() {
    const err = $("umk-error");
    err.textContent = "";
    const u = parseUmask($("umk-umask").value);
    if (!u) {
      err.textContent = "umaskは0〜7の数字を3桁（または4桁）で入力してください（例: 022, 0022）";
      return;
    }
    const fu = computeNew(6, u.u), fg = computeNew(6, u.g), fo = computeNew(6, u.o);
    const du = computeNew(7, u.u), dg = computeNew(7, u.g), doo = computeNew(7, u.o);
    $("umk-file-octal").textContent = "" + fu + fg + fo;
    $("umk-file-sym").textContent = "-" + symDigit(fu) + symDigit(fg) + symDigit(fo);
    $("umk-dir-octal").textContent = "" + du + dg + doo;
    $("umk-dir-sym").textContent = "d" + symDigit(du) + symDigit(dg) + symDigit(doo);
  }

  function renderReverse() {
    const g = (id) => $(id).checked;
    const tu = digit(g("umk-tu-r"), g("umk-tu-w"), g("umk-tu-x"));
    const tg = digit(g("umk-tg-r"), g("umk-tg-w"), g("umk-tg-x"));
    const to = digit(g("umk-to-r"), g("umk-to-w"), g("umk-to-x"));
    const uu = complement3(tu), ug = complement3(tg), uo = complement3(to);
    const umaskStr = "" + uu + ug + uo;
    $("umk-rev-umask").textContent = umaskStr;
    const fu = computeNew(6, uu), fg = computeNew(6, ug), fo = computeNew(6, uo);
    const fileOctal = "" + fu + fg + fo;
    const fileSym = "-" + symDigit(fu) + symDigit(fg) + symDigit(fo);
    $("umk-rev-file").textContent = fileOctal + "（" + fileSym + "）";
  }

  function run() {
    renderForward();
    renderReverse();
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("umk-umask").addEventListener("input", run);
    REV_IDS.forEach((id) => $(id).addEventListener("input", run));
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("umk-umask").value = btn.getAttribute("data-preset");
        run();
      });
    });
    run();
  });
})();
