(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  const DAY = 86400000;
  const MIN_Y = 2000, MAX_Y = 2030;

  function mod(a, n) { return ((a % n) + n) % n; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // 日付 <-> 通算日（UTC、1970-01-01 = 0）
  function toDN(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / DAY); }
  function fromDN(dn) { const t = new Date(dn * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() }; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtDN(dn) { const o = fromDN(dn); return o.y + "-" + pad(o.m) + "-" + pad(o.d) + "（" + WD[o.dow] + "）"; }
  function mmdd(dn) { const o = fromDN(dn); return pad(o.m) + "-" + pad(o.d); }

  // 第 n 月曜日の日
  function nthMonday(y, m, n) {
    const dow1 = fromDN(toDN(y, m, 1)).dow;
    return 1 + mod(1 - dow1, 7) + (n - 1) * 7;
  }
  // 春分・秋分（1980〜2099年向けの近似式。実際の日付は国立天文台が計算し、前年2月の官報で告示される）
  function shunbun(y) { return Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4)); }
  function shubun(y) { return Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4)); }

  const cache = {};
  // 国民の祝日に関する法律に基づく、その年の休日（dn -> 名称）。2000〜2030年のみ
  function holidaysOf(y) {
    if (cache[y]) return cache[y];
    const map = new Map();
    const add = (m, d, name) => { map.set(toDN(y, m, d), name); };
    add(1, 1, "元日");
    add(1, nthMonday(y, 1, 2), "成人の日");
    add(2, 11, "建国記念の日");
    if (y >= 2020) add(2, 23, "天皇誕生日"); else if (y <= 2018) add(12, 23, "天皇誕生日");
    add(3, shunbun(y), "春分の日");
    add(4, 29, y >= 2007 ? "昭和の日" : "みどりの日");
    add(5, 3, "憲法記念日");
    if (y >= 2007) add(5, 4, "みどりの日");
    add(5, 5, "こどもの日");
    if (y === 2019) { add(5, 1, "休日（即位の日）"); add(10, 22, "休日（即位礼正殿の儀）"); }
    // 海の日
    if (y === 2020) add(7, 23, "海の日"); else if (y === 2021) add(7, 22, "海の日");
    else if (y <= 2002) add(7, 20, "海の日"); else add(7, nthMonday(y, 7, 3), "海の日");
    // 山の日
    if (y === 2020) add(8, 10, "山の日"); else if (y === 2021) add(8, 8, "山の日"); else if (y >= 2016) add(8, 11, "山の日");
    // 敬老の日
    if (y <= 2002) add(9, 15, "敬老の日"); else add(9, nthMonday(y, 9, 3), "敬老の日");
    add(9, shubun(y), "秋分の日");
    // 体育の日 / スポーツの日
    if (y === 2020) add(7, 24, "スポーツの日"); else if (y === 2021) add(7, 23, "スポーツの日");
    else add(10, nthMonday(y, 10, 2), y <= 2019 ? "体育の日" : "スポーツの日");
    add(11, 3, "文化の日");
    add(11, 23, "勤労感謝の日");

    const isSunday = (dn) => fromDN(dn).dow === 0;
    // 国民の休日: 前日と翌日がともに国民の祝日である平日（日曜は除く）
    const first = toDN(y, 1, 1), last = toDN(y, 12, 31);
    const base = new Set(map.keys());
    for (let dn = first + 1; dn < last; dn++) {
      if (!map.has(dn) && !isSunday(dn) && base.has(dn - 1) && base.has(dn + 1)) map.set(dn, "国民の休日");
    }
    // 振替休日: 祝日が日曜なら、その日以後で最も近い祝日でない日（2007年より前は翌日のみ）
    const sundays = Array.from(base).filter(isSunday).sort((a, b) => a - b);
    sundays.forEach((sun) => {
      let t = sun + 1;
      if (y >= 2007) { while (map.has(t)) t++; if (t <= last) map.set(t, "振替休日"); }
      else if (!map.has(t)) map.set(t, "振替休日");
    });
    cache[y] = map;
    return map;
  }
  function holidayName(dn) {
    const y = fromDN(dn).y;
    if (y < MIN_Y || y > MAX_Y) return null;
    return holidaysOf(y).get(dn) || null;
  }

  function isYearEnd(dn) { const o = fromDN(dn); return (o.m === 12 && o.d >= 29) || (o.m === 1 && o.d <= 3); }
  // 営業日か（土日・祝日・（任意）年末年始でない）
  function isBusiness(dn, yearEnd) {
    const o = fromDN(dn);
    if (o.dow === 0 || o.dow === 6) return false;
    if (holidayName(dn)) return false;
    if (yearEnd && isYearEnd(dn)) return false;
    return true;
  }

  function parseDate(val) {
    const mt = /^(\d{4,6})-(\d{2})-(\d{2})$/.exec(val || "");
    if (!mt) return { error: "日付を入力してください" };
    const y = parseInt(mt[1], 10), m = parseInt(mt[2], 10), d = parseInt(mt[3], 10);
    if (m < 1 || m > 12 || d < 1 || y < 1 || d > daysInMonth(y, m)) return { error: "存在しない日付です" };
    if (y < MIN_Y || y > MAX_Y) return { error: "祝日の計算は" + MIN_Y + "〜" + MAX_Y + "年のみ対応です（範囲外: " + y + "年）" };
    return { dn: toDN(y, m, d) };
  }

  // 期間内の集計（s <= e）。countFrom 以降 e まで
  function countRange(s, e, includeStart, yearEnd) {
    const from = includeStart ? s : s + 1;
    const r = { business: 0, cal: 0, weekend: 0, holiday: 0, yearEnd: 0, holList: [] };
    for (let dn = from; dn <= e; dn++) {
      r.cal++;
      const o = fromDN(dn);
      const name = holidayName(dn);
      if (name) r.holList.push({ dn: dn, name: name, weekend: o.dow === 0 || o.dow === 6 });
      if (o.dow === 0 || o.dow === 6) r.weekend++;
      else if (name) r.holiday++;
      else if (yearEnd && isYearEnd(dn)) r.yearEnd++;
      else r.business++;
    }
    return r;
  }

  function shift(base, n, dir, yearEnd) {
    let cur = base, cnt = 0;
    while (cnt < n) {
      cur += dir;
      const y = fromDN(cur).y;
      if (y < MIN_Y || y > MAX_Y) return { error: "結果が対応範囲（" + MIN_Y + "〜" + MAX_Y + "年）を超えます" };
      if (isBusiness(cur, yearEnd)) cnt++;
    }
    return { dn: cur };
  }

  function li(text) { const e = document.createElement("li"); e.textContent = text; return e; }

  function run1() {
    const err = $("bd-error1");
    err.textContent = "";
    ["bd-count", "bd-cal", "bd-we", "bd-hol", "bd-ye"].forEach((id) => { $(id).textContent = "-"; });
    const list = $("bd-hollist"); list.textContent = "";
    const a = parseDate($("bd-start").value), b = parseDate($("bd-end").value);
    if (a.error || b.error) { err.textContent = a.error || b.error; return; }
    let s = a.dn, e = b.dn, swapped = false;
    if (e < s) { const t = s; s = e; e = t; swapped = true; }
    const yearEnd = $("bd-yearend").checked, inc = $("bd-include").checked;
    const r = countRange(s, e, inc, yearEnd);
    $("bd-count").textContent = tb.fmt(r.business) + " 営業日" + (swapped ? "（開始日と終了日を入れ替えて計算）" : "");
    $("bd-cal").textContent = tb.fmt(r.cal) + " 日";
    $("bd-we").textContent = tb.fmt(r.weekend) + " 日";
    $("bd-hol").textContent = tb.fmt(r.holiday) + " 日";
    $("bd-ye").textContent = yearEnd ? tb.fmt(r.yearEnd) + " 日" : "（除外オプションなし）";
    const shown = r.holList.slice(0, 40);
    shown.forEach((h) => list.appendChild(li(fmtDN(h.dn) + " " + h.name + (h.weekend ? "（土日と重複）" : ""))));
    if (r.holList.length > shown.length) list.appendChild(li("ほか " + (r.holList.length - shown.length) + " 件"));
    if (!r.holList.length) list.appendChild(li("期間内に祝日はありません"));
  }

  function run2() {
    const err = $("bd-error2");
    err.textContent = "";
    ["bd-res", "bd-resdays", "bd-resbase"].forEach((id) => { $(id).textContent = "-"; });
    const a = parseDate($("bd-base").value);
    if (a.error) { err.textContent = a.error; return; }
    const ns = tb.z2h($("bd-n").value).trim();
    if (!/^\d+$/.test(ns)) { err.textContent = "Nは0以上の整数で入力してください"; return; }
    const n = parseInt(ns, 10);
    if (n > 5000) { err.textContent = "Nは5000以下で入力してください"; return; }
    const dir = parseInt($("bd-dir").value, 10), yearEnd = $("bd-yearend").checked;
    const r = shift(a.dn, n, dir, yearEnd);
    if (r.error) { err.textContent = r.error; return; }
    const name = holidayName(r.dn);
    $("bd-res").textContent = fmtDN(r.dn) + (name ? " " + name : "");
    $("bd-resdays").textContent = Math.abs(r.dn - a.dn) + " 日" + (dir > 0 ? "後" : "前");
    const bn = holidayName(a.dn), bo = fromDN(a.dn);
    $("bd-resbase").textContent = isBusiness(a.dn, yearEnd) ? "営業日（数えない）"
      : "休業日（" + (bn || (bo.dow === 0 || bo.dow === 6 ? "土日" : "年末年始")) + "）";
  }

  function run3() {
    const err = $("bd-error3"), ul = $("bd-yearlist");
    err.textContent = ""; ul.textContent = "";
    const ys = tb.z2h($("bd-year").value).trim();
    const y = /^\d+$/.test(ys) ? parseInt(ys, 10) : NaN;
    if (isNaN(y) || y < MIN_Y || y > MAX_Y) { err.textContent = "年は" + MIN_Y + "〜" + MAX_Y + "の数字で入力してください"; return; }
    const arr = Array.from(holidaysOf(y).entries()).sort((p, q) => p[0] - q[0]);
    arr.forEach((p) => ul.appendChild(li(fmtDN(p[0]) + " " + p[1])));
    ul.appendChild(li("合計 " + arr.length + " 日"));
  }

  // 自己テスト: 2024〜2026年の祝日（内閣府の公表一覧と同じ日付）
  const EXPECTED = {
    2024: "01-01 01-08 02-11 02-12 02-23 03-20 04-29 05-03 05-04 05-05 05-06 07-15 08-11 08-12 09-16 09-22 09-23 10-14 11-03 11-04 11-23",
    2025: "01-01 01-13 02-11 02-23 02-24 03-20 04-29 05-03 05-04 05-05 05-06 07-21 08-11 09-15 09-23 10-13 11-03 11-23 11-24",
    2026: "01-01 01-12 02-11 02-23 03-20 04-29 05-03 05-04 05-05 05-06 07-20 08-11 09-21 09-22 09-23 10-12 11-03 11-23"
  };
  function selfTest() {
    const bad = [];
    let total = 0;
    Object.keys(EXPECTED).forEach((y) => {
      const got = Array.from(holidaysOf(parseInt(y, 10)).keys()).sort((p, q) => p - q).map(mmdd).join(" ");
      total += EXPECTED[y].split(" ").length;
      if (got !== EXPECTED[y]) bad.push(y);
    });
    return { ok: bad.length === 0, bad: bad, total: total };
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["bd-yearend", "bd-include", "bd-start", "bd-end", "bd-base", "bd-n", "bd-dir", "bd-year"].forEach((id) => {
      $(id).addEventListener("input", () => { run1(); run2(); run3(); });
      $(id).addEventListener("change", () => { run1(); run2(); run3(); });
    });
    run1(); run2(); run3();
    const t = selfTest();
    $("bd-selftest").textContent = t.ok
      ? "祝日計算の自己テスト: 2024〜2026年の祝日" + t.total + "日が内閣府公表の一覧どおりであることを確認済みです。"
      : "祝日計算の自己テストに失敗しました（" + t.bad.join("・") + "年）。結果を内閣府の公表一覧で確認してください。";
    window.__bdSelfTest = t;
  });
})();
