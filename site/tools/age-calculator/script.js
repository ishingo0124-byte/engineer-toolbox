(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MS_DAY = 86400000;

  // 改元境界（wareki-converter と同じ定義）。base: 西暦年 = base + 和暦年。end が null の元号は現在も継続中。
  const ERAS = [
    { name: "明治", abbr: "M", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", abbr: "T", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", abbr: "S", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", abbr: "H", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", abbr: "R", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const MEIJI_LUNAR_LIMIT = "明治6年1月1日（1873-01-01）より前は旧暦（太陰太陽暦）のため対象外です。";

  const JIKKAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const JUNISHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const JUNISHI_ANIMAL = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];
  // [開始月, 開始日, 終了月, 終了日, 名称]。やぎ座のように年をまたぐ場合は開始>終了として扱う。
  const SEIZA = [
    [1, 20, 2, 18, "みずがめ座"], [2, 19, 3, 20, "うお座"], [3, 21, 4, 19, "おひつじ座"],
    [4, 20, 5, 20, "おうし座"], [5, 21, 6, 21, "ふたご座"], [6, 22, 7, 22, "かに座"],
    [7, 23, 8, 22, "しし座"], [8, 23, 9, 22, "おとめ座"], [9, 23, 10, 23, "てんびん座"],
    [10, 24, 11, 22, "さそり座"], [11, 23, 12, 21, "いて座"], [12, 22, 1, 19, "やぎ座"]
  ];

  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
  function eraLabel(era, wy) { return era.name + (wy === 1 ? "元年" : wy + "年"); }

  function parseISODate(raw) {
    const s = (raw || "").trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // 暦どおりの年・月・日の差（a <= b を想定。date-diff と同じ借り下がり方式）
  function calendarDiff(a, b) {
    let y = b.getUTCFullYear() - a.getUTCFullYear();
    let mo = b.getUTCMonth() - a.getUTCMonth();
    let d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) {
      mo -= 1;
      const prevMonthLastDay = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate();
      d += prevMonthLastDay;
    }
    if (mo < 0) { y -= 1; mo += 12; }
    return { y: y, m: mo, d: d };
  }

  function gregorianDateToWareki(y, m, d) {
    const v = ymdNum(y, m, d);
    for (const era of ERAS) {
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      if (v >= sv && v <= ev) return { era: era.name, year: y - era.base };
    }
    return null;
  }

  function warekiToResult(eraName, wy, m, d) {
    const era = ERAS.find((e) => e.name === eraName);
    if (!era) return { error: "元号が正しくありません" };
    if (!(wy >= 1)) return { error: "年は1以上（元年）で入力してください" };
    const gy = era.base + wy;
    const dt = new Date(Date.UTC(gy, m - 1, d));
    if (dt.getUTCFullYear() !== gy || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return { error: "存在しない日付です" };
    const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
    const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
    const v = ymdNum(gy, m, d);
    if (v < sv || v > ev) {
      const actual = gregorianDateToWareki(gy, m, d);
      const hint = actual ? "実際は " + eraLabel(ERAS.find((e) => e.name === actual.era), actual.year) + "（西暦" + gy + "年" + m + "月" + d + "日）にあたります。"
        : (gy < 1873 ? MEIJI_LUNAR_LIMIT : "対応範囲外の日付です。");
      return { error: eraName + wy + "年" + m + "月" + d + "日は存在しません。" + hint };
    }
    return { y: gy, m: m, d: d };
  }

  // 和暦テキストの解析（例:「昭和60年3月4日」「S60.3.4」「H1/1/8」「令和元年5月1日」）
  function parseWarekiText(raw) {
    const s = tb.z2h(String(raw == null ? "" : raw)).trim();
    if (!s) return null;
    let m = s.match(/^(明治|大正|昭和|平成|令和)\s*(元|\d+)\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?\s*$/);
    if (m) return warekiToResult(m[1], m[2] === "元" ? 1 : parseInt(m[2], 10), parseInt(m[3], 10), parseInt(m[4], 10));
    m = s.match(/^([MTSHRmtshr])\s*[.\-\/]?\s*(元|\d+)[.\-\/](\d{1,2})[.\-\/](\d{1,2})\s*$/);
    if (m) {
      const era = ERAS.find((e) => e.abbr === m[1].toUpperCase());
      if (!era) return { error: "元号の記号はM/T/S/H/Rのいずれかで入力してください" };
      return warekiToResult(era.name, m[2] === "元" ? 1 : parseInt(m[2], 10), parseInt(m[3], 10), parseInt(m[4], 10));
    }
    return { error: "和暦の形式を認識できません（例:昭和60年3月4日、S60.3.4）" };
  }

  function eto(y) {
    const jIdx = ((y - 4) % 10 + 10) % 10;
    const zIdx = ((y - 4) % 12 + 12) % 12;
    return { jikkan: JIKKAN[jIdx], junishi: JUNISHI[zIdx], animal: JUNISHI_ANIMAL[zIdx] };
  }

  function seizaOf(m, d) {
    const v = m * 100 + d;
    for (const [sm, sd, em, ed, name] of SEIZA) {
      const sv = sm * 100 + sd, ev = em * 100 + ed;
      if (sv <= ev) { if (v >= sv && v <= ev) return name; }
      else if (v >= sv || v <= ev) return name;
    }
    return "";
  }

  function setResults(ids, text) { ids.forEach((id) => { $(id).textContent = text; }); }

  const RESULT_IDS = ["ac-mannen", "ac-kazoe", "ac-wareki", "ac-eto", "ac-junishi", "ac-seiza", "ac-days", "ac-next"];

  function run() {
    const err = $("ac-error");
    err.textContent = "";
    $("ac-feb29-note").textContent = "";

    let by, bm, bd;
    const parsedW = parseWarekiText($("ac-bwareki").value);
    if (parsedW) {
      if (parsedW.error) { err.textContent = parsedW.error; setResults(RESULT_IDS, "-"); return; }
      by = parsedW.y; bm = parsedW.m; bd = parsedW.d;
    } else {
      const bdt = parseISODate($("ac-bdate").value);
      if (!bdt) { err.textContent = "生年月日を正しく入力してください。"; setResults(RESULT_IDS, "-"); return; }
      by = bdt.getUTCFullYear(); bm = bdt.getUTCMonth() + 1; bd = bdt.getUTCDate();
    }

    if (!$("ac-refdate").value) $("ac-refdate").value = todayISO();
    const ref = parseISODate($("ac-refdate").value);
    if (!ref) { err.textContent = "基準日を正しく入力してください。"; setResults(RESULT_IDS, "-"); return; }

    const birth = new Date(Date.UTC(by, bm - 1, bd));
    if (birth.getTime() > ref.getTime()) { err.textContent = "基準日は生年月日と同じか、それより後の日付にしてください。"; setResults(RESULT_IDS, "-"); return; }

    const diff = calendarDiff(birth, ref);
    $("ac-mannen").textContent = diff.y + "歳" + diff.m + "ヶ月" + diff.d + "日";
    $("ac-kazoe").textContent = (ref.getUTCFullYear() - by + 1) + "歳";

    const wareki = gregorianDateToWareki(by, bm, bd);
    $("ac-wareki").textContent = wareki
      ? eraLabel(ERAS.find((e) => e.name === wareki.era), wareki.year) + bm + "月" + bd + "日"
      : (by < 1873 ? "旧暦のため対象外" : "対応範囲外");

    const e = eto(by);
    $("ac-eto").textContent = e.jikkan + e.junishi;
    $("ac-junishi").textContent = e.junishi + "（" + e.animal + "）";
    $("ac-seiza").textContent = seizaOf(bm, bd);

    const daysSince = Math.round((ref.getTime() - birth.getTime()) / MS_DAY);
    $("ac-days").textContent = tb.fmt(daysSince) + "日";

    // 次の誕生日（2/29生まれがうるう年でない年に来る場合、Date.UTC の繰り上げでそのまま3/1になる）
    let candidate = new Date(Date.UTC(ref.getUTCFullYear(), bm - 1, bd));
    const isToday = candidate.getTime() === ref.getTime();
    if (!isToday && candidate.getTime() < ref.getTime()) {
      candidate = new Date(Date.UTC(ref.getUTCFullYear() + 1, bm - 1, bd));
    }
    if (isToday) {
      $("ac-next").textContent = "本日が誕生日です";
    } else {
      const daysToNext = Math.round((candidate.getTime() - ref.getTime()) / MS_DAY);
      $("ac-next").textContent = tb.fmt(daysToNext) + "日後（" + candidate.getUTCFullYear() + "年" + (candidate.getUTCMonth() + 1) + "月" + candidate.getUTCDate() + "日）";
    }
    if (bm === 2 && bd === 29 && (candidate.getUTCMonth() !== 1 || candidate.getUTCDate() !== 29)) {
      $("ac-feb29-note").textContent = candidate.getUTCFullYear() + "年はうるう年ではないため、2月29日の代わりに3月1日を誕生日相当日として計算しています。";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!$("ac-refdate").value) $("ac-refdate").value = todayISO();
    ["ac-bdate", "ac-bwareki", "ac-refdate"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
