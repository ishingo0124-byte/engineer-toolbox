(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const WD_JA = ["日", "月", "火", "水", "木", "金", "土"];
  const WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MAX_Y = 9999;
  // base: 西暦年 = base + 和暦年。start/end は西暦の [年,月,日]
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];

  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // 先発グレゴリオ暦（1582年以前もグレゴリオ暦の規則をそのまま延長）での曜日。UTC で計算し、タイムゾーンの影響を受けない
  function utcDate(y, m, d) { const t = new Date(0); t.setUTCFullYear(y, m - 1, d); t.setUTCHours(0, 0, 0, 0); return t; }
  function weekday(y, m, d) { return utcDate(y, m, d).getUTCDay(); }
  function dayOfYear(y, m, d) { return Math.round((utcDate(y, m, d) - utcDate(y, 1, 1)) / 86400000) + 1; }

  function eraLabel(era, wy) { return era.name + (wy === 1 ? "元" : wy) + "年"; }
  function warekiOf(y, m, d, full) {
    const v = ymdNum(y, m, d);
    for (const era of ERAS) {
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      if (v >= sv && v <= ev) return eraLabel(era, y - era.base) + (full === false ? "" : m + "月" + d + "日");
    }
    return null;
  }
  function parseNum(raw, allowGannen) {
    const s = tb.z2h(String(raw == null ? "" : raw)).trim();
    if (allowGannen && (s === "元" || s === "元年")) return 1;
    if (!/^\d+$/.test(s)) return NaN;
    return parseInt(s.replace(/年$/, ""), 10);
  }

  function findSame(y, m, d, wd, dir) {
    const out = [];
    for (let yy = y + dir, n = 0; yy >= 1 && yy <= MAX_Y && n < 1200 && out.length < 3; yy += dir, n++) {
      if (d > daysInMonth(yy, m)) continue;
      if (weekday(yy, m, d) === wd) out.push(yy);
    }
    return out;
  }
  function yearListText(list, m, d) {
    if (!list.length) return "（範囲内にありません）";
    return list.map((yy) => { const w = warekiOf(yy, m, d, false); return yy + "年" + (w ? "（" + w + "）" : ""); }).join("、");
  }

  function clear() {
    ["dw-wd", "dw-g", "dw-w", "dw-doy", "dw-prev", "dw-next"].forEach((id) => { $(id).textContent = "-"; });
    $("dw-notes").textContent = "";
  }

  function run() {
    const err = $("dw-error");
    err.textContent = "";
    clear();
    const eraName = $("dw-era").value;
    const n = parseNum($("dw-y").value, eraName !== "西暦");
    const m = parseNum($("dw-m").value, false), d = parseNum($("dw-d").value, false);
    if (isNaN(n) || isNaN(m) || isNaN(d)) { err.textContent = "年・月・日は数字で入力してください" + (eraName !== "西暦" ? "（年は「元」も可）" : ""); return; }
    let y;
    if (eraName === "西暦") {
      y = n;
      if (y < 1 || y > MAX_Y) { err.textContent = "西暦は1〜" + MAX_Y + "年の範囲で入力してください"; return; }
    } else {
      const era = ERAS.find((e) => e.name === eraName);
      if (n < 1) { err.textContent = "和暦の年は1（元年）以上で入力してください"; return; }
      if (eraName === "明治" && n < 6) { err.textContent = "明治5年12月2日までは旧暦（太陰太陽暦）です。明治6年1月1日（1873-01-01）から太陽暦なので、それ以前は西暦で入力してください。"; return; }
      y = era.base + n;
    }
    if (m < 1 || m > 12) { err.textContent = "月は1〜12で入力してください"; return; }
    if (d < 1 || d > daysInMonth(y, m)) { err.textContent = y + "年" + m + "月には" + d + "日がありません（" + y + "年" + m + "月は" + daysInMonth(y, m) + "日までです）"; return; }
    let wareki = warekiOf(y, m, d);
    if (eraName !== "西暦") {
      const era = ERAS.find((e) => e.name === eraName);
      const v = ymdNum(y, m, d);
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      if (v < sv || v > ev) {
        err.textContent = eraName + (n === 1 ? "元" : n) + "年" + m + "月" + d + "日は存在しません" + (wareki ? "（その日付は " + wareki + " にあたります）" : "") + "。";
        return;
      }
    }
    const wd = weekday(y, m, d);
    $("dw-wd").textContent = WD_JA[wd] + "曜日（" + WD_EN[wd] + "）";
    $("dw-g").textContent = y + "年" + m + "月" + d + "日";
    $("dw-w").textContent = wareki || (y < 1873 ? "（明治6年より前は対象外）" : "（対象外）");
    const doy = dayOfYear(y, m, d);
    $("dw-doy").textContent = doy + " 日目（この年は" + (isLeap(y) ? 366 : 365) + "日）";
    $("dw-prev").textContent = yearListText(findSame(y, m, d, wd, -1).reverse(), m, d);
    $("dw-next").textContent = yearListText(findSame(y, m, d, wd, 1), m, d);

    const notes = [];
    const v = ymdNum(y, m, d);
    if (v < 15821015) notes.push("1582年10月15日より前は、グレゴリオ暦の規則を過去へ延長した「先発グレゴリオ暦」で計算しています。当時の欧州で使われていたユリウス暦の日付とは数日ずれます（1582年10月5〜14日は史実では存在しませんが、先発グレゴリオ暦としては計算できます）。");
    if (v < 18730101) notes.push("日本では明治5年12月2日（1872年12月31日）まで旧暦（太陰太陽暦）で、翌日が明治6年1月1日です。明治5年以前の旧暦の日付をそのまま入れても、太陽暦の日付とは別物になります。ここでの西暦はグレゴリオ暦の日付として扱っています。");
    $("dw-notes").textContent = notes.join(" ");
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["dw-era", "dw-y", "dw-m", "dw-d"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    $("dw-today").addEventListener("click", () => {
      const t = new Date();
      $("dw-era").value = "西暦";
      $("dw-y").value = t.getFullYear(); $("dw-m").value = t.getMonth() + 1; $("dw-d").value = t.getDate();
      run();
    });
    run();
  });
})();
