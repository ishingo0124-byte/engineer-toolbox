(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // base: 西暦年 = base + 和暦年。start/end は対応する西暦の [年,月,日]（end が null の元号は現在も継続中）
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const MEIJI_LUNAR_LIMIT = "明治6年1月1日（1873-01-01）より前は旧暦（太陰太陽暦）のため対象外です。";

  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function validCalendarDate(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > daysInMonth(y, m)) return false;
    return true;
  }

  function toHalf(s) { return tb.z2h(String(s == null ? "" : s)).trim(); }
  function parseYearField(raw, allowGannen) {
    const s = toHalf(raw);
    if (allowGannen && (s === "元年" || s === "元")) return 1;
    if (!/^\d+$/.test(s)) return null;
    return parseInt(s, 10);
  }
  function parseOptionalInt(raw) {
    const s = toHalf(raw);
    if (s === "") return { present: false, value: null };
    if (!/^\d+$/.test(s)) return { present: true, value: NaN };
    return { present: true, value: parseInt(s, 10) };
  }

  function eraLabel(era, wy) { return era.name + (wy === 1 ? "元年" : wy + "年"); }

  // 西暦(年のみ) -> その年に含まれる和暦(1件 or 改元年なら2件)
  function gregorianYearToWareki(y) {
    const out = [];
    ERAS.forEach((era) => {
      const startY = era.start[0];
      const endY = era.end ? era.end[0] : Infinity;
      if (y >= startY && y <= endY) {
        const wy = y - era.base;
        if (wy >= 1) out.push({ era: era.name, year: wy });
      }
    });
    return out;
  }
  // 西暦の年月日 -> 和暦（1件、範囲外は null）
  function gregorianDateToWareki(y, m, d) {
    const v = ymdNum(y, m, d);
    for (const era of ERAS) {
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      if (v >= sv && v <= ev) return { era: era.name, year: y - era.base };
    }
    return null;
  }
  function warekiToGregorianYear(eraName, wy) {
    const era = ERAS.find((e) => e.name === eraName);
    if (!era) return null;
    return era.base + wy;
  }
  function warekiDateToGregorian(eraName, wy, m, d) {
    const era = ERAS.find((e) => e.name === eraName);
    if (!era) return { error: "元号が不正です" };
    if (wy < 1) return { error: "年は1以上（元年）で入力してください" };
    const gy = era.base + wy;
    if (!validCalendarDate(gy, m, d)) return { error: "存在しない日付です" };
    const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
    const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
    const v = ymdNum(gy, m, d);
    if (v < sv || v > ev) {
      const actual = gregorianDateToWareki(gy, m, d);
      const hint = actual ? "その日付は " + eraLabel(ERAS.find((e) => e.name === actual.era), actual.year) + "（西暦" + gy + "年" + m + "月" + d + "日）にあたります。" : (gy < 1873 ? MEIJI_LUNAR_LIMIT : "対応範囲外の日付です。");
      return { error: eraName + wy + "年" + m + "月" + d + "日は存在しません。" + hint };
    }
    return { gy: gy, m: m, d: d };
  }

  function runG2W() {
    const box = $("wc-g2w-result"), err = $("wc-g2w-error");
    box.textContent = ""; err.textContent = "";
    const y = parseYearField($("wc-gy").value, false);
    if (y === null || !Number.isInteger(y)) { err.textContent = "西暦年は数字で入力してください"; return; }
    const mo = parseOptionalInt($("wc-gm").value), da = parseOptionalInt($("wc-gd").value);
    if ((mo.present !== da.present)) { err.textContent = "月と日はどちらも入力するか、どちらも空欄にしてください"; return; }
    if (mo.present && (isNaN(mo.value) || isNaN(da.value))) { err.textContent = "月・日は数字で入力してください"; return; }

    if (!mo.present) {
      const list = gregorianYearToWareki(y);
      if (list.length === 0) {
        err.textContent = y < 1873 ? MEIJI_LUNAR_LIMIT : "対応する元号がありません（対応範囲外です）";
        return;
      }
      box.innerHTML = list.map((r) => "<div>" + html(eraLabel(ERAS.find((e) => e.name === r.era), r.year)) + "</div>").join("") +
        (list.length > 1 ? '<p class="hint" style="margin:6px 0 0">この年は改元があったため、時期により2通りの和暦があります。</p>' : "");
      return;
    }
    if (!validCalendarDate(y, mo.value, da.value)) { err.textContent = "存在しない日付です"; return; }
    const w = gregorianDateToWareki(y, mo.value, da.value);
    if (!w) { err.textContent = y < 1873 ? MEIJI_LUNAR_LIMIT : "対応範囲外の日付です"; return; }
    box.textContent = eraLabel(ERAS.find((e) => e.name === w.era), w.year) + mo.value + "月" + da.value + "日";
  }

  function runW2G() {
    const box = $("wc-w2g-result"), err = $("wc-w2g-error");
    box.textContent = ""; err.textContent = "";
    const eraName = $("wc-era").value;
    const wy = parseYearField($("wc-wy").value, true);
    if (wy === null) { err.textContent = "和暦年は数字または「元年」で入力してください"; return; }
    const mo = parseOptionalInt($("wc-wm").value), da = parseOptionalInt($("wc-wd").value);
    if (mo.present !== da.present) { err.textContent = "月と日はどちらも入力するか、どちらも空欄にしてください"; return; }
    if (mo.present && (isNaN(mo.value) || isNaN(da.value))) { err.textContent = "月・日は数字で入力してください"; return; }

    if (wy < 1) { err.textContent = "年は1以上（元年）で入力してください"; return; }

    if (!mo.present) {
      const gy = warekiToGregorianYear(eraName, wy);
      if (gy === null || gy < 1873) { err.textContent = MEIJI_LUNAR_LIMIT; return; }
      // 元号ごとの最大年チェック（年のみ入力時）
      const era = ERAS.find((e) => e.name === eraName);
      const maxWy = era.end ? era.end[0] - era.base : wy;
      if (wy > maxWy) { err.textContent = eraName + wy + "年は存在しません（" + eraName + "は" + eraLabel(era, maxWy) + "までです）"; return; }
      box.textContent = "西暦 " + gy + "年";
      return;
    }
    const r = warekiDateToGregorian(eraName, wy, mo.value, da.value);
    if (r.error) { err.textContent = r.error; return; }
    box.textContent = "西暦 " + r.gy + "年" + r.m + "月" + r.d + "日";
  }

  function html(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function run() { runG2W(); runW2G(); }

  document.addEventListener("DOMContentLoaded", () => {
    ["wc-gy", "wc-gm", "wc-gd"].forEach((id) => $(id).addEventListener("input", runG2W));
    ["wc-era", "wc-wy", "wc-wm", "wc-wd"].forEach((id) => {
      $(id).addEventListener("input", runW2G);
      $(id).addEventListener("change", runW2G);
    });
    run();
  });
})();
