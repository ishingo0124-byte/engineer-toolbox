(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MIN_YEAR = 1873;
  const MAX_YEAR = 2200;
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  const DAY_MS = 86400000;
  // 早見表は平年（2月が28日）の2025年を基準に数える
  const REF_YEAR = 2025;
  const SEKKU = {
    girl: { who: "女の子", name: "桃の節句（ひな祭り）", m: 3, d: 3 },
    boy: { who: "男の子", name: "端午の節句", m: 5, d: 5 }
  };

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
  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }
  function daysBetween(y1, m1, d1, y2, m2, d2) { return Math.round((utc(y2, m2, d2) - utc(y1, m1, d1)) / DAY_MS); }

  function parseBirth(raw) {
    const s = tb.z2h(String(raw == null ? "" : raw)).replace(/[\s　]/g, "");
    if (s === "") return { error: "生年月日（または出産予定日）を入力してください。" };
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
      }
    } else {
      return { error: "「2026-02-25」「2026/2/25」「令和8年2月25日」のような形で入力してください。" };
    }
    if (month === null) return { error: "月と日まで入力してください（年だけでは節句の前後が決まりません）。" };
    if (year < MIN_YEAR || year > MAX_YEAR) return { error: "生まれ年は" + MIN_YEAR + "〜" + MAX_YEAR + "年の範囲で入力してください。" };
    if (!validDate(year, month, day)) return { error: "存在しない日付です。" };
    return { year: year, month: month, day: day };
  }

  function sekkuLine(y, sk, days, tagText) {
    const wd = WEEK[new Date(utc(y, sk.m, sk.d)).getUTCDay()];
    const wa = warekiAt(y, sk.m, sk.d);
    return "<div><strong>" + tagText + "：" + y + "年" + sk.m + "月" + sk.d + "日（" + wa + "・" + wd + "曜日）</strong>　" +
      (days === 0 ? "生まれた当日" : "生後" + days + "日") + "</div>";
  }

  function remark(days) {
    if (days === 0) return "節句の当日に生まれた場合は、この年を初節句に数えるか翌年にするかが家庭で分かれます。";
    if (days <= 30) return "生後1か月以内（30日以内）です。母子の体調を考えて翌年に回す家庭も多いとされます。";
    if (days <= 60) return "生後2か月以内（60日以内）です。体調や準備の都合で、翌年にする家庭もあります。";
    return "この年に行う場合も、翌年に回す場合も、日数の上では選べます。";
  }

  function run() {
    const err = $("hzk-error"), box = $("hzk-result"), note = $("hzk-note");
    err.textContent = ""; box.innerHTML = ""; note.textContent = "";
    const p = parseBirth($("hzk-birth").value);
    if (p.error) { err.textContent = p.error; return; }
    const sk = $("hzk-sex").value === "boy" ? SEKKU.boy : SEKKU.girl;
    const dThis = daysBetween(p.year, p.month, p.day, p.year, sk.m, sk.d);
    const dNext = daysBetween(p.year, p.month, p.day, p.year + 1, sk.m, sk.d);
    let html = '<div class="hint">' + sk.who + "の初節句は" + sk.name + "で、" + sk.m + "月" + sk.d + "日です。</div>";
    if (dThis >= 0) {
      html += sekkuLine(p.year, sk, dThis, "生まれた年");
      html += sekkuLine(p.year + 1, sk, dNext, "翌年");
      note.textContent = remark(dThis);
    } else {
      html += sekkuLine(p.year + 1, sk, dNext, "翌年（最初の節句）");
      note.textContent = "生まれた年の" + sk.name + "は、生まれる前に過ぎています。最初の節句は翌年です。";
    }
    box.innerHTML = html;
  }

  // 生まれ月別の早見表（平年基準）
  function rangeText(a, b) { return a === b ? String(a) : a + "〜" + b; }
  function monthCell(month, sk) {
    const n = dim(REF_YEAR, month);
    const same = [], next = [];
    let today = false;
    for (let d = 1; d <= n; d++) {
      const dThis = daysBetween(REF_YEAR, month, d, REF_YEAR, sk.m, sk.d);
      const dNext = daysBetween(REF_YEAR, month, d, REF_YEAR + 1, sk.m, sk.d);
      if (dThis > 0) same.push({ d: d, days: dThis, nextDays: dNext });
      else if (dThis === 0) today = true;
      else next.push({ d: d, days: dNext });
    }
    const lines = [];
    const partial = month === sk.m;
    if (same.length) {
      const mn = same[same.length - 1].days, mx = same[0].days;
      const label = partial ? "1〜" + same[same.length - 1].d + "日生まれ" : "";
      let line = (label ? label + "：" : "") + "同年は生後" + rangeText(mn, mx) + "日";
      const nmn = same[same.length - 1].nextDays, nmx = same[0].nextDays;
      line += "／翌年は生後" + rangeText(nmn, nmx) + "日";
      if (mn <= 30) line += '<br><span class="hint">生後1か月以内になる日があり、翌年に回す家庭も多い</span>';
      else if (mn <= 60) line += '<br><span class="hint">生後1〜2か月。体調しだいで同年か翌年</span>';
      lines.push(line);
    }
    if (today) lines.push(sk.d + "日生まれ：節句の当日（生後0日）。同年か翌年かは家庭で分かれる");
    if (next.length) {
      const first = next[0], last = next[next.length - 1];
      const label = partial ? (first.d + (last.d === n ? "日以降生まれ" : "〜" + last.d + "日生まれ")) : "";
      lines.push((label ? label + "：" : "") + "翌年のみ。生後" + rangeText(last.days, first.days) + "日");
    }
    return lines.join("<br>");
  }

  function buildTable() {
    let h = "<table><thead><tr><th>生まれ月</th><th>女の子（3月3日 桃の節句）</th><th>男の子（5月5日 端午の節句）</th></tr></thead><tbody>";
    for (let m = 1; m <= 12; m++) {
      h += "<tr><td>" + m + "月</td><td>" + monthCell(m, SEKKU.girl) + "</td><td>" + monthCell(m, SEKKU.boy) + "</td></tr>";
    }
    return h + "</tbody></table>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("hzk-table-wrap").innerHTML = buildTable();
    ["hzk-birth", "hzk-sex"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
