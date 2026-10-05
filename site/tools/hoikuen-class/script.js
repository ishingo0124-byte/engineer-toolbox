(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 元号境界。wareki-converter と同じ値を使う
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const MEIJI_LUNAR_LIMIT = "明治6年1月1日（1873-01-01）より前は旧暦（太陰太陽暦）のため対象外です。";
  const MAX_Y = 2200;

  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function validCalendarDate(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (m < 1 || m > 12) return false;
    return d >= 1 && d <= daysInMonth(y, m);
  }
  function html(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  function toHalf(s) { return tb.z2h(String(s == null ? "" : s)).trim(); }
  function gregorianDateToWareki(y, m, d) {
    const v = ymdNum(y, m, d);
    for (const era of ERAS) {
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      if (v >= sv && v <= ev) return { era: era.name, year: y - era.base };
    }
    return null;
  }
  // 年月だけの表示用。3月・4月には改元日が無いため、日付は1日固定で問題ない
  function waLabel(y, m) {
    const w = gregorianDateToWareki(y, m, 1);
    if (!w) return y < 1873 ? "対象外" : "―";
    return w.era + (w.year === 1 ? "元年" : w.year + "年") + m + "月";
  }
  function waYearLabel(y) { return waLabel(y, 4).replace(/4月$/, "") + "度"; }

  function parseBirthDate(raw) {
    const s = toHalf(raw).replace(/\s+/g, "");
    if (s === "") return { error: "生年月日を入力してください" };
    let m = s.match(/^(\d{3,4})[-\/年](\d{1,2})[-\/月](\d{1,2})日?$/);
    if (m) {
      const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), da = parseInt(m[3], 10);
      if (!validCalendarDate(y, mo, da)) return { error: "存在しない日付です" };
      if (y < 1873) return { error: MEIJI_LUNAR_LIMIT };
      if (y > MAX_Y) return { error: "年数が大きすぎます" };
      return { y: y, m: mo, d: da };
    }
    m = s.match(/^(明治|大正|昭和|平成|令和)(元|\d{1,3})年(\d{1,2})月(\d{1,2})日$/);
    if (m) {
      const era = ERAS.find((e) => e.name === m[1]);
      const wy = m[2] === "元" ? 1 : parseInt(m[2], 10);
      const mo = parseInt(m[3], 10), da = parseInt(m[4], 10);
      const gy = era.base + wy;
      if (!validCalendarDate(gy, mo, da)) return { error: "存在しない日付です" };
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      const v = ymdNum(gy, mo, da);
      if (v < sv || v > ev) return { error: m[1] + wy + "年" + mo + "月" + da + "日は存在しません（" + m[1] + "の期間外です）" };
      if (gy > MAX_Y) return { error: "年数が大きすぎます" };
      return { y: gy, m: mo, d: da };
    }
    return { error: "「2022-06-15」または「令和4年6月15日」の形式で入力してください" };
  }

  // 学校教育法第17条と年齢計算ニ関スル法律により、4月2日〜翌年4月1日生まれが同学年。
  // c = 学年区分の基準年（4月2日以降生まれはその年、1月1日〜4月1日生まれは前年）
  function cohortYear(y, m, d) { return (m * 100 + d) >= 402 ? y : y - 1; }

  function run() {
    const err = $("hc-error"), box = $("hc-result"), tbl = $("hc-table"), note = $("hc-note");
    err.textContent = ""; note.textContent = "";
    const b = parseBirthDate($("hc-birth").value);
    if (b.error) { err.textContent = b.error; box.innerHTML = ""; tbl.innerHTML = ""; return; }
    const c = cohortYear(b.y, b.m, b.d);
    const t = new Date();
    const nowFy = (t.getMonth() + 1) >= 4 ? t.getFullYear() : t.getFullYear() - 1;

    const early = (b.m * 100 + b.d) <= 401;
    const sum = [
      ["保育園 0歳児クラス（4月入園）", (c + 1) + "年4月", waLabel(c + 1, 4)],
      ["幼稚園 年少（3年保育）入園", (c + 4) + "年4月", waLabel(c + 4, 4)],
      ["幼稚園 年中（2年保育）入園", (c + 5) + "年4月", waLabel(c + 5, 4)],
      ["保育園・幼稚園 卒園（年長の修了）", (c + 7) + "年3月", waLabel(c + 7, 3)],
      ["小学校 入学", (c + 7) + "年4月", waLabel(c + 7, 4)]
    ];
    box.innerHTML = "<p style=\"margin:0 0 8px\">" + html(b.y + "年" + b.m + "月" + b.d + "日生まれ") + "（" + (early ? "早生まれ・1月1日〜4月1日生まれ" : "4月2日〜12月31日生まれ") + "）</p>" +
      "<table><thead><tr><th>節目</th><th>西暦</th><th>和暦</th></tr></thead><tbody>" +
      sum.map((r) => "<tr><td>" + html(r[0]) + "</td><td class=\"mono\">" + html(r[1]) + "</td><td>" + html(r[2]) + "</td></tr>").join("") + "</tbody></table>";

    let h = "<table><thead><tr><th>年度</th><th>期間</th><th>4/1時点の年齢</th><th>保育園</th><th>幼稚園</th><th>小学校</th></tr></thead><tbody>";
    for (let a = 0; a <= 6; a++) {
      const F = c + 1 + a;
      const hoi = a <= 5 ? a + "歳児クラス" + (a === 3 ? "（年少）" : a === 4 ? "（年中）" : a === 5 ? "（年長）" : "") : "卒園後";
      const you = a === 3 ? "年少（3歳児）" : a === 4 ? "年中（4歳児）" : a === 5 ? "年長（5歳児）" : (a < 3 ? "満3歳児・プレなど（園による）" : "卒園後");
      const sch = a === 6 ? "1年生" : "―";
      h += "<tr><td>" + F + "年度（" + html(waYearLabel(F)) + "）" + (F === nowFy ? "　←今年度" : "") + "</td><td class=\"mono\">" + F + "年4月〜" + (F + 1) + "年3月</td><td>" + a + "歳</td><td>" + hoi + "</td><td>" + you + "</td><td>" + sch + "</td></tr>";
    }
    tbl.innerHTML = h + "</tbody></table>";
    note.textContent = "生まれた年度（" + c + "年度）はまだ4月1日時点で生まれていないため、クラスの表には載せていません。年度の途中で入園する場合のクラスの呼び方は園によって違います。" +
      "保育園の0歳児クラスは、生後57日（産後8週）から預かる園、生後6か月以降や4月入園のみの園など、自治体や園で受け入れ時期が異なります。幼稚園の満3歳児入園（3歳の誕生日以降に年度途中で入る）の可否も園ごとに違うので、募集要項で確認してください。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("hc-birth").addEventListener("input", run);
    run();
  });
})();
