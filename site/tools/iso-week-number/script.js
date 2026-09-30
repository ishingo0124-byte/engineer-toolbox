(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  const MAX_Y = 9999;
  const DAY = 86400000;

  function mod(a, n) { return ((a % n) + n) % n; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // 日付 <-> 通算日（UTC、1970-01-01 = 0）。タイムゾーンの影響を受けない
  function toDN(y, m, d) { const t = new Date(0); t.setUTCFullYear(y, m - 1, d); t.setUTCHours(0, 0, 0, 0); return Math.round(t.getTime() / DAY); }
  function fromDN(dn) { const t = new Date(dn * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() }; }
  function pad(n, w) { return String(n).padStart(w, "0"); }
  function fmtDN(dn) { const o = fromDN(dn); return pad(o.y, 4) + "-" + pad(o.m, 2) + "-" + pad(o.d, 2) + "（" + WD[o.dow] + "）"; }

  // ISO 8601: 週は月曜始まり。その週の木曜日が属する年が ISO 年
  function isoOf(dn) {
    const dowMon = mod(fromDN(dn).dow - 1, 7); // 月=0 … 日=6
    const thu = dn + 3 - dowMon;
    const y = fromDN(thu).y;
    return { year: y, week: Math.floor((thu - toDN(y, 1, 1)) / 7) + 1, dowMon: dowMon, monday: dn - dowMon };
  }
  function weeksInYear(y) { return isoOf(toDN(y, 12, 28)).week; } // 12月28日は必ず最終週に入る

  function parseNum(raw) {
    const s = tb.z2h(String(raw == null ? "" : raw)).trim();
    return /^\d+$/.test(s) ? parseInt(s, 10) : NaN;
  }

  function runFwd() {
    const err = $("iw-error");
    err.textContent = "";
    ["iw-code", "iw-week", "iw-wd", "iw-range", "iw-weeks", "iw-us", "iw-usrange"].forEach((id) => { $(id).textContent = "-"; });
    $("iw-note").textContent = "";
    const mt = /^(\d{4,6})-(\d{2})-(\d{2})$/.exec($("iw-date").value);
    if (!mt) { err.textContent = "日付を入力してください"; return; }
    const y = parseInt(mt[1], 10), m = parseInt(mt[2], 10), d = parseInt(mt[3], 10);
    if (y < 1 || y > MAX_Y) { err.textContent = "年は1〜" + MAX_Y + "の範囲で入力してください"; return; }
    if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) { err.textContent = "存在しない日付です"; return; }
    const dn = toDN(y, m, d);
    const iso = isoOf(dn);
    $("iw-code").textContent = pad(iso.year, 4) + "-W" + pad(iso.week, 2) + "-" + (iso.dowMon + 1);
    $("iw-week").textContent = "ISO " + iso.year + "年 第" + iso.week + "週";
    $("iw-wd").textContent = WD[fromDN(dn).dow] + "曜日（ISO の曜日番号 " + (iso.dowMon + 1) + "）";
    $("iw-range").textContent = fmtDN(iso.monday) + " 〜 " + fmtDN(iso.monday + 6);
    $("iw-weeks").textContent = iso.year + "年は " + weeksInYear(iso.year) + " 週";
    // 米国式: 日曜始まり、1月1日を含む週が第1週（Excel の WEEKNUM 既定と同じ数え方）
    const jan1Dow = fromDN(toDN(y, 1, 1)).dow; // 日=0
    const doy = dn - toDN(y, 1, 1) + 1;
    const us = Math.floor((doy - 1 + jan1Dow) / 7) + 1;
    $("iw-us").textContent = y + "年 第" + us + "週";
    const sunday = dn - fromDN(dn).dow;
    $("iw-usrange").textContent = fmtDN(sunday) + " 〜 " + fmtDN(sunday + 6);
    const notes = [];
    if (iso.year !== y) notes.push("暦の年（" + y + "年）と ISO 年（" + iso.year + "年）が異なる日です。週の木曜日が属する年がその週の年になるため、年末年始はこうしたずれが起きます。");
    else if (us !== iso.week) notes.push("ISO 週（第" + iso.week + "週）と米国式（第" + us + "週）で番号が異なります。週の開始曜日と「第1週」の決め方が違うためです。");
    if (fromDN(sunday).y !== fromDN(sunday + 6).y) notes.push("米国式の番号は、年をまたぐ週を暦年の中で数えたものです（Excel の WEEKNUM 既定と同じ）。カレンダーアプリによっては、この週を翌年の第1週と表示します。");
    $("iw-note").textContent = notes.join(" ");
  }

  function runRev() {
    const err = $("iw-error2");
    err.textContent = "";
    ["iw-r-date", "iw-r-range", "iw-r-weeks"].forEach((id) => { $(id).textContent = "-"; });
    const y = parseNum($("iw-y").value), w = parseNum($("iw-w").value), dd = parseInt($("iw-dd").value, 10);
    if (isNaN(y) || isNaN(w)) { err.textContent = "年と週番号は数字で入力してください"; return; }
    if (y < 1 || y > MAX_Y) { err.textContent = "年は1〜" + MAX_Y + "の範囲で入力してください"; return; }
    const total = weeksInYear(y);
    if (w < 1 || w > total) { err.textContent = y + "年は " + total + " 週までです（第" + w + "週はありません）"; return; }
    const jan4 = toDN(y, 1, 4);
    const week1Mon = jan4 - mod(fromDN(jan4).dow - 1, 7); // 1月4日を含む週が第1週
    const mon = week1Mon + (w - 1) * 7;
    $("iw-r-date").textContent = fmtDN(mon + dd - 1);
    $("iw-r-range").textContent = fmtDN(mon) + " 〜 " + fmtDN(mon + 6);
    $("iw-r-weeks").textContent = y + "年は " + total + " 週";
  }

  function run() { runFwd(); runRev(); }

  document.addEventListener("DOMContentLoaded", () => {
    $("iw-date").addEventListener("input", run);
    $("iw-date").addEventListener("change", run);
    ["iw-y", "iw-w", "iw-dd"].forEach((id) => { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    $("iw-today").addEventListener("click", () => {
      const t = new Date();
      $("iw-date").value = t.getFullYear() + "-" + pad(t.getMonth() + 1, 2) + "-" + pad(t.getDate(), 2);
      run();
    });
    run();
  });
})();
