(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 元号境界。wareki-converter と同じ値を使う（食い違うと変換結果がずれるため）
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const MEIJI_LUNAR_LIMIT = "明治6年1月1日（1873-01-01）より前は旧暦（太陰太陽暦）のため対象外です。";

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function validCalendarDate(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > daysInMonth(y, m)) return false;
    return true;
  }
  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
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
  function toHalf(s) { return tb.z2h(String(s == null ? "" : s)).trim(); }

  // "2013-04-05" "2013/4/5" "2013年4月5日" 形式、または和暦「平成25年4月5日」形式を解釈する
  function parseBirthDate(raw) {
    const s = toHalf(raw).replace(/\s+/g, "");
    if (s === "") return { error: "生年月日を入力してください" };
    let m = s.match(/^(\d{3,4})[-\/年](\d{1,2})[-\/月](\d{1,2})日?$/);
    if (m) {
      const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), da = parseInt(m[3], 10);
      if (!validCalendarDate(y, mo, da)) return { error: "存在しない日付です" };
      if (y < 1873) return { error: MEIJI_LUNAR_LIMIT };
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
      return { y: gy, m: mo, d: da };
    }
    return { error: "「2013-04-05」または「平成25年4月5日」の形式で入力してください" };
  }

  function parseExtra(raw) {
    const s = toHalf(raw);
    if (s === "") return 0;
    if (!/^\d{1,2}$/.test(s)) return null;
    return parseInt(s, 10);
  }

  // 学校教育法第17条「満6歳に達した日の翌日以後における最初の学年の初め」＋
  // 年齢計算ニ関スル法律（誕生日の前日に加齢）により、4/2生まれ〜翌年4/1生まれが同学年になる。
  // このため「その年の4/2以降生まれ」はその年を、「4/1以前生まれ」は前年を学年区分の基準年（cohort）とする。
  function cohortYear(y, m, d) {
    const md = m * 100 + d;
    return md >= 402 ? y : y - 1;
  }
  function elementaryEntryYear(y, m, d) { return cohortYear(y, m, d) + 7; }

  function buildStages(birth, extra) {
    const E = elementaryEntryYear(birth.y, birth.m, birth.d);
    const isHayaumare = (birth.m * 100 + birth.d) <= 401; // 早生まれ:1/1〜4/1生まれ
    return {
      E: E,
      isHayaumare: isHayaumare,
      stages: [
        { name: "幼稚園入園（3年保育・年少）", y: E - 3, m: 4 },
        { name: "幼稚園入園（2年保育・年中）", y: E - 2, m: 4 },
        { name: "幼稚園卒園", y: E, m: 3 },
        { name: "小学校入学", y: E, m: 4 },
        { name: "小学校卒業", y: E + 6, m: 3 },
        { name: "中学校入学", y: E + 6, m: 4 },
        { name: "中学校卒業", y: E + 9, m: 3 },
        { name: "高校入学", y: E + 9, m: 4 },
        { name: "高校卒業", y: E + 12, m: 3 },
        { name: "大学入学（4年制）", y: E + 12 + extra, m: 4 },
        { name: "大学卒業（4年制）", y: E + 16 + extra, m: 3 },
        { name: "短大・専門学校入学（2年制）", y: E + 12 + extra, m: 4 },
        { name: "短大・専門学校卒業（2年制）", y: E + 14 + extra, m: 3 }
      ]
    };
  }

  function html(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function run() {
    const err = $("syt-error"), box = $("syt-result"), note = $("syt-hayami-note"), pre = $("syt-resume-text");
    err.textContent = ""; note.textContent = "";
    const birth = parseBirthDate($("syt-birth").value);
    if (birth.error) { err.textContent = birth.error; box.innerHTML = ""; pre.textContent = ""; return; }
    const extra = parseExtra($("syt-extra").value);
    if (extra === null || extra < 0) { err.textContent = "浪人・留年の年数は0以上の整数で入力してください"; box.innerHTML = ""; pre.textContent = ""; return; }
    if (birth.y + extra > 2300) { err.textContent = "年数が大きすぎます"; return; }

    const r = buildStages(birth, extra);
    note.textContent = r.isHayaumare
      ? "この生年月日は早生まれ（1月1日〜4月1日生まれ）です。同じ年の4月2日以降生まれの子より1学年上になります。"
      : "この生年月日は早生まれではありません（4月2日〜12月31日生まれ）。";

    const rows = r.stages.map((s) =>
      "<tr><td>" + html(s.name) + "</td><td class=\"mono\">" + s.y + "年" + s.m + "月</td><td class=\"mono\">" + html(waLabel(s.y, s.m)) + "</td></tr>"
    ).join("");
    box.innerHTML = '<table><thead><tr><th>区分</th><th>西暦</th><th>和暦</th></tr></thead><tbody>' + rows + '</tbody></table>';

    const st = r.stages;
    const line = (i) => waLabel(st[i].y, st[i].m);
    pre.textContent = [
      line(0) + "　○○幼稚園　入園",
      line(2) + "　○○幼稚園　卒園",
      line(3) + "　○○小学校　入学",
      line(4) + "　○○小学校　卒業",
      line(5) + "　○○中学校　入学",
      line(6) + "　○○中学校　卒業",
      line(7) + "　○○高等学校　入学",
      line(8) + "　○○高等学校　卒業",
      line(9) + "　○○大学　入学",
      line(10) + "　○○大学　卒業"
    ].join("\n");
  }

  const REV_TABLE = {
    elementary: { offset: 0, dur: 6 },
    jhs: { offset: 6, dur: 3 },
    hs: { offset: 9, dur: 3 },
    univ4: { offset: 12, dur: 4 },
    univ2: { offset: 12, dur: 2 }
  };
  function runReverse() {
    const err = $("syt-rev-error"), box = $("syt-rev-result");
    err.textContent = ""; box.textContent = "";
    const stage = $("syt-rev-stage").value;
    const raw = toHalf($("syt-rev-year").value);
    if (!/^\d{4}$/.test(raw)) { err.textContent = "卒業年は西暦4桁で入力してください"; return; }
    const G = parseInt(raw, 10);
    const t = REV_TABLE[stage];
    const E = G - t.offset - t.dur;
    const cohort = E - 7;
    if (cohort < 1866 || cohort > 2200) { err.textContent = "対応範囲外の年です"; return; }
    box.innerHTML = "<div>" + html(cohort) + "年4月2日 〜 " + html(cohort + 1) + "年4月1日 生まれ</div>" +
      '<p class="hint" style="margin:6px 0 0">和暦では ' + html(waLabel(cohort, 4)) + "2日 〜 " + html(waLabel(cohort + 1, 4)) + "1日 生まれです。</p>";
  }

  function run2() { run(); runReverse(); }

  document.addEventListener("DOMContentLoaded", () => {
    ["syt-birth", "syt-extra"].forEach((id) => $(id).addEventListener("input", run));
    ["syt-rev-stage", "syt-rev-year"].forEach((id) => {
      $(id).addEventListener("input", runReverse);
      $(id).addEventListener("change", runReverse);
    });
    run2();
  });
})();
