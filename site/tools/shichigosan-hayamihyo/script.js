(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MIN_YEAR = 1873;
  const MAX_YEAR = 2200;
  const TABLE_FROM = 2016;
  const TABLE_TO = 2026;

  // 改元境界（wareki-converter と同じ定義）
  const ERAS = [
    { name: "明治", key: "M", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", key: "T", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", key: "S", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", key: "H", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", key: "R", base: 2018, start: [2019, 5, 1], end: null }
  ];

  function ymd(y, m, d) { return y * 10000 + m * 100 + d; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function dim(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function validDate(y, m, d) {
    return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && m >= 1 && m <= 12 && d >= 1 && d <= dim(y, m);
  }
  function eraLabel(era, wy) { return era.name + (wy === 1 ? "元年" : wy + "年"); }

  // 西暦の年月日 -> 和暦ラベル（範囲外は空文字）
  function warekiAt(y, m, d) {
    const v = ymd(y, m, d);
    for (let i = 0; i < ERAS.length; i++) {
      const e = ERAS[i];
      const sv = ymd(e.start[0], e.start[1], e.start[2]);
      const ev = e.end ? ymd(e.end[0], e.end[1], e.end[2]) : Infinity;
      if (v >= sv && v <= ev) return eraLabel(e, y - e.base);
    }
    return "";
  }
  // 西暦の年 -> その年に含まれる和暦（改元年は2件）
  function warekiOfYear(y) {
    const out = [];
    ERAS.forEach((e) => {
      const endY = e.end ? e.end[0] : Infinity;
      if (y >= e.start[0] && y <= endY && y - e.base >= 1) out.push(eraLabel(e, y - e.base));
    });
    return out;
  }

  // 入力文字列 -> {year, month, day}（月日は無ければ null）または {error}
  function parseBirth(raw) {
    const s = tb.z2h(String(raw == null ? "" : raw)).replace(/[\s　]/g, "");
    if (s === "") return { error: "生まれ年か生年月日を入力してください。" };
    let year, month = null, day = null, m;
    if ((m = s.match(/^(\d{4})(?:[-\/.年](\d{1,2})[-\/.月](\d{1,2})日?)?年?$/))) {
      year = parseInt(m[1], 10);
      if (m[2]) { month = parseInt(m[2], 10); day = parseInt(m[3], 10); }
    } else if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) {
      year = parseInt(m[1], 10); month = parseInt(m[2], 10); day = parseInt(m[3], 10);
    } else if ((m = s.match(/^(明治|大正|昭和|平成|令和|[MTSHRmtshr])(元|\d{1,2})(?:年|[.\-\/])?(?:(\d{1,2})(?:月|[.\-\/])(\d{1,2})日?)?$/))) {
      const nm = m[1];
      const era = ERAS.find((e) => e.name === nm || e.key === nm.toUpperCase());
      const wy = m[2] === "元" ? 1 : parseInt(m[2], 10);
      if (wy < 1) return { error: "和暦の年は1以上（元年）で入力してください。" };
      year = era.base + wy;
      if (m[3]) {
        month = parseInt(m[3], 10); day = parseInt(m[4], 10);
        if (!validDate(year, month, day)) return { error: "存在しない日付です。" };
        if (warekiAt(year, month, day).indexOf(era.name) !== 0) {
          return { error: era.name + wy + "年" + month + "月" + day + "日は存在しません。元号の境目を確認してください。" };
        }
      } else {
        const endY = era.end ? era.end[0] : Infinity;
        if (year < era.start[0] || year > endY) return { error: era.name + wy + "年は存在しません。" };
      }
    } else {
      return { error: "「2023」「2023-06-10」「令和5年6月10日」のような形で入力してください。" };
    }
    if (year < MIN_YEAR || year > MAX_YEAR) return { error: "生まれ年は" + MIN_YEAR + "〜" + MAX_YEAR + "年の範囲で入力してください。" };
    if (month !== null && !validDate(year, month, day)) return { error: "存在しない日付です。" };
    return { year: year, month: month, day: day };
  }

  // 秋（11月15日ごろ）の時点での学年。diff = 祝う年 - 小学校入学年
  function gradeLabel(diff) {
    if (diff >= 0) return "小学" + (diff + 1) + "年生の秋";
    if (diff === -1) return "幼稚園の年長の秋";
    if (diff === -2) return "幼稚園の年中の秋";
    if (diff === -3) return "幼稚園の年少の秋";
    return "年少になる前の年";
  }

  function cell(Y, age, p, enrollYear) {
    let h = "<strong>" + Y + "年</strong>（" + warekiAt(Y, 11, 15) + "）";
    if (p.month !== null) {
      const afterNov15 = ymd(0, p.month, p.day) > ymd(0, 11, 15);
      const a = Y - p.year - (afterNov15 ? 1 : 0);
      h += '<br><span class="hint">11月15日時点で満' + a + "歳・" + gradeLabel(Y - enrollYear) + "</span>";
    }
    return h;
  }

  function run() {
    const err = $("shh-error"), box = $("shh-result"), note = $("shh-note");
    err.textContent = ""; box.innerHTML = ""; note.textContent = "";
    const p = parseBirth($("shh-birth").value);
    if (p.error) { err.textContent = p.error; return; }
    let enroll = 0;
    if (p.month !== null) {
      // 4月2日以降生まれはその年、4月1日以前生まれは前の年が基準（小学校入学は基準年+7年）
      enroll = (p.month > 4 || (p.month === 4 && p.day >= 2)) ? p.year + 7 : p.year + 6;
    }
    const rows = [
      { age: 3, who: "男の子・女の子" },
      { age: 5, who: "男の子" },
      { age: 7, who: "女の子" }
    ];
    let html = '<table><thead><tr><th>歳</th><th>一般的には</th><th>満年齢で祝う年</th><th>数え年で祝う年</th></tr></thead><tbody>';
    rows.forEach((r) => {
      html += "<tr><td>" + r.age + "歳</td><td>" + r.who + "</td><td>" + cell(p.year + r.age, r.age, p, enroll) +
        "</td><td>" + cell(p.year + r.age - 1, r.age, p, enroll) + "</td></tr>";
    });
    html += "</tbody></table>";
    box.innerHTML = html;
    if (p.month === null) {
      note.textContent = "生年月日まで入力すると、11月15日時点の満年齢と学年も出ます。1月1日〜4月1日生まれ（早生まれ）は、同じ生まれ年でも学年が1つ前になります。";
    } else if (p.month < 4 || (p.month === 4 && p.day === 1)) {
      note.textContent = "早生まれ（1月1日〜4月1日生まれ）です。学年は同じ生まれ年の4月2日以降の子より1つ上になります。満年齢で祝う年は誕生日を迎えて満3・5・7歳になる年です。";
    } else if (ymd(0, p.month, p.day) > ymd(0, 11, 15)) {
      note.textContent = "11月16日以降の生まれなので、満年齢の年でも11月15日の時点では、まだ1つ手前の年齢です。";
    } else {
      note.textContent = "満年齢で祝う年は、誕生日を迎えて満3・5・7歳になる年です。数え年で祝う年は、その1年前になります。";
    }
  }

  function buildTable() {
    let h = '<table><thead><tr><th rowspan="2">生まれ年</th><th colspan="2">3歳</th><th colspan="2">5歳</th><th colspan="2">7歳</th></tr>' +
      "<tr><th>満</th><th>数え</th><th>満</th><th>数え</th><th>満</th><th>数え</th></tr></thead><tbody>";
    for (let b = TABLE_FROM; b <= TABLE_TO; b++) {
      h += "<tr><td>" + b + "年（" + warekiOfYear(b).join("／") + "）</td>";
      [3, 5, 7].forEach((a) => { h += "<td>" + (b + a) + "年</td><td>" + (b + a - 1) + "年</td>"; });
      h += "</tr>";
    }
    return h + "</tbody></table>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("shh-table-wrap").innerHTML = buildTable();
    $("shh-birth").addEventListener("input", run);
    run();
  });
})();
