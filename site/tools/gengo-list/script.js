(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // first: 元年の西暦。start/end は [年,月,日]（end が null は継続中）、maxYear は最終年（null は上限なし）
  const ERAS = [
    { name: "明治", first: 1868, start: [1868, 10, 23], end: [1912, 7, 29], maxYear: 45 },
    { name: "大正", first: 1912, start: [1912, 7, 30], end: [1926, 12, 24], maxYear: 15 },
    { name: "昭和", first: 1926, start: [1926, 12, 25], end: [1989, 1, 7], maxYear: 64 },
    { name: "平成", first: 1989, start: [1989, 1, 8], end: [2019, 4, 30], maxYear: 31 },
    { name: "令和", first: 2019, start: [2019, 5, 1], end: null, maxYear: null }
  ];

  function ymdNum(a) { return a[0] * 10000 + a[1] * 100 + a[2]; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function half(s) { return window.tb.z2h(String(s == null ? "" : s)).trim(); }
  function label(era, y) { return era.name + (y === 1 ? "元年" : y + "年"); }
  function dateStr(a) { return a[0] + "年" + a[1] + "月" + a[2] + "日"; }
  function md(a) { return a[1] + "月" + a[2] + "日"; }
  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function eraByName(n) { return ERAS.find((e) => e.name === n); }

  // 西暦年に含まれる元号と年（改元年は2件）
  function yearToEras(y) {
    const out = [];
    ERAS.forEach((e) => {
      const endY = e.end ? e.end[0] : Infinity;
      if (y >= e.first && y <= endY) out.push({ era: e, year: y - e.first + 1 });
    });
    return out;
  }
  // 西暦の年月日に対応する元号（範囲外は null）
  function dateToEra(y, m, d) {
    const v = ymdNum([y, m, d]);
    for (const e of ERAS) {
      const ev = e.end ? ymdNum(e.end) : Infinity;
      if (v >= ymdNum(e.start) && v <= ev) return { era: e, year: y - e.first + 1 };
    }
    return null;
  }

  function setResult(boxId, errId, lines, notes, err) {
    const box = $(boxId), er = $(errId);
    er.textContent = err || "";
    if (err) { box.innerHTML = ""; return; }
    box.innerHTML = lines.map((l) => "<div>" + esc(l) + "</div>").join("") +
      notes.map((n) => '<p class="hint" style="margin:6px 0 0">' + esc(n) + "</p>").join("");
  }

  function parseYear(raw, allowGan) {
    const s = half(raw).replace(/年$/, "").trim();
    if (s === "") return { err: "年を入力してください" };
    if (allowGan && s === "元") return { v: 1 };
    if (!/^\d{1,4}$/.test(s)) return { err: "年は数字（4桁以内）で入力してください" };
    return { v: parseInt(s, 10) };
  }

  function runW2G() {
    const era = eraByName($("gl-era").value);
    const p = parseYear($("gl-wy").value, true);
    if (p.err) { setResult("gl-w2g-result", "gl-w2g-error", [], [], p.err); return; }
    const wy = p.v;
    if (wy < 1) { setResult("gl-w2g-result", "gl-w2g-error", [], [], "年は1以上（元年は1）で入力してください"); return; }
    const gy = era.first + wy - 1;
    const notes = [];
    const idx = ERAS.indexOf(era);
    if (era.maxYear !== null && wy > era.maxYear) {
      const next = ERAS[idx + 1];
      notes.push(era.name + wy + "年は存在しません。" + era.name + "は" + era.maxYear + "年（" + dateStr(era.end) + "まで）で、翌日から" + next.name + "元年です。");
      const alt = yearToEras(gy).map((r) => label(r.era, r.year));
      if (alt.length) notes.push("式で機械的に計算した西暦" + gy + "年は、" + alt.join(" / ") + "にあたります。");
      setResult("gl-w2g-result", "gl-w2g-error", ["注意: " + era.name + wy + "年はありません（式での計算値は西暦" + gy + "年）"], notes);
      return;
    }
    if (wy === 1) {
      if (idx === 0) notes.push("明治元年は、改元（1868-10-23）が旧暦の慶応4年1月1日に遡って適用された年です。月日を含む当時の資料は旧暦のため、新暦の月日とは一致しません。");
      else {
        const prev = ERAS[idx - 1];
        notes.push(label(era, 1) + "は" + md(era.start) + "から。同じ" + gy + "年の1月1日〜" + md(prev.end) + "は" + label(prev, prev.maxYear) + "です。");
      }
    }
    if (era.maxYear !== null && wy === era.maxYear) {
      const next = ERAS[idx + 1];
      notes.push(label(era, wy) + "は" + md(era.end) + "まで。その翌日から" + next.name + "元年（同じ" + gy + "年）です。");
    }
    if (era.name === "令和" && gy > new Date().getFullYear()) notes.push("将来の年です。令和が続くと仮定した換算です。");
    if (idx === 0 && wy <= 5) notes.push("明治5年までは旧暦の年です。西暦との対応は年単位の目安として使ってください。");
    setResult("gl-w2g-result", "gl-w2g-error", ["西暦 " + gy + "年"], notes);
  }

  function runG2W() {
    const p = parseYear($("gl-gy").value, false);
    if (p.err) { setResult("gl-g2w-result", "gl-g2w-error", [], [], p.err); return; }
    const y = p.v;
    const ms = half($("gl-gm").value), ds = half($("gl-gd").value);
    if ((ms === "") !== (ds === "")) { setResult("gl-g2w-result", "gl-g2w-error", [], [], "月と日はどちらも入力するか、どちらも空欄にしてください"); return; }
    const notes = [];
    if (ms === "") {
      const list = yearToEras(y);
      if (list.length === 0) {
        const msg = y < 1868
          ? "西暦" + y + "年は明治より前です（この表の対象は明治元年=1868年以降です）。"
          : "対応する元号がありません。";
        setResult("gl-g2w-result", "gl-g2w-error", ["注意: " + msg], []);
        return;
      }
      if (list.length > 1) {
        notes.push("改元の年なので、時期により元号が2通りあります。" + list[0].era.name + "は" + md(list[0].era.end) + "まで、" + list[1].era.name + "は" + md(list[1].era.start) + "からです。");
      }
      if (y === 1868) notes.push("1868年の前半は慶応4年です。明治元年は旧暦の慶応4年1月1日に遡って適用されました。");
      if (y >= 1868 && y <= 1872) notes.push("明治5年までは旧暦の年です。西暦との対応は年単位の目安として使ってください。");
      if (y > new Date().getFullYear()) notes.push("将来の年です。令和が続くと仮定した換算です。");
      setResult("gl-g2w-result", "gl-g2w-error", list.map((r) => label(r.era, r.year) + "（" + y + "年）"), notes);
      return;
    }
    if (!/^\d{1,2}$/.test(ms) || !/^\d{1,2}$/.test(ds)) { setResult("gl-g2w-result", "gl-g2w-error", [], [], "月・日は数字で入力してください"); return; }
    const m = parseInt(ms, 10), d = parseInt(ds, 10);
    if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) { setResult("gl-g2w-result", "gl-g2w-error", [], [], "存在しない日付です"); return; }
    const r = dateToEra(y, m, d);
    if (!r) {
      const msg = ymdNum([y, m, d]) < ymdNum(ERAS[0].start)
        ? "西暦" + y + "年" + m + "月" + d + "日は明治改元（1868-10-23）より前です。"
        : "対応する元号がありません。";
      setResult("gl-g2w-result", "gl-g2w-error", ["注意: " + msg], []);
      return;
    }
    if (y <= 1872) notes.push("明治5年までの資料は旧暦で書かれています。この換算は新暦の日付を当てはめたものです。");
    setResult("gl-g2w-result", "gl-g2w-error", [label(r.era, r.year) + m + "月" + d + "日"], notes);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["gl-era", "gl-wy"].forEach((id) => { $(id).addEventListener("input", runW2G); $(id).addEventListener("change", runW2G); });
    ["gl-gy", "gl-gm", "gl-gd"].forEach((id) => $(id).addEventListener("input", runG2W));
    runW2G(); runG2W();
  });
})();
