(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MS_DAY = 86400000;
  const WD = ["日", "月", "火", "水", "木", "金", "土"];

  function parseISODate(raw) {
    const s = (raw || "").trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    // Date.UTC はオーバーフローを自動で繰り上げるため、往復して不正日付（2/30 等）を弾く
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }

  function weekdayJa(dt) { return WD[dt.getUTCDay()] + "曜日"; }

  function fmtDate(dt) {
    return dt.getUTCFullYear() + "-" + String(dt.getUTCMonth() + 1).padStart(2, "0") + "-" + String(dt.getUTCDate()).padStart(2, "0");
  }

  // 暦どおりの年・月・日の差（a <= b を想定）
  function calendarDiff(a, b) {
    let y = b.getUTCFullYear() - a.getUTCFullYear();
    let m = b.getUTCMonth() - a.getUTCMonth();
    let d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) {
      m -= 1;
      const prevMonthLastDay = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate();
      d += prevMonthLastDay;
    }
    if (m < 0) { y -= 1; m += 12; }
    return { y: y, m: m, d: d };
  }

  function addMonthsClamped(y, m1to12, d, n) {
    const totalMonth = (y * 12 + (m1to12 - 1)) + n;
    const ny = Math.floor(totalMonth / 12);
    const nm0 = totalMonth - ny * 12; // 0-11
    const daysInMonth = new Date(Date.UTC(ny, nm0 + 1, 0)).getUTCDate();
    const nd = Math.min(d, daysInMonth);
    return new Date(Date.UTC(ny, nm0, nd));
  }

  function setAll(ids, text) { ids.forEach((id) => { $(id).textContent = text; }); }

  function runDiff() {
    const err = $("df-error1");
    err.textContent = "";
    const s = parseISODate($("df-start").value);
    const e = parseISODate($("df-end").value);
    const resultIds = ["df-days", "df-weeks", "df-ymd", "df-start-wd", "df-end-wd", "df-weekdays", "df-weekend", "df-holicount"];
    if (!s || !e) {
      err.textContent = "開始日・終了日を正しく入力してください。";
      setAll(resultIds, "-");
      return;
    }

    const reversed = s > e;
    const early = reversed ? e : s;
    const late = reversed ? s : e;
    const rawDays = Math.round((late.getTime() - early.getTime()) / MS_DAY);
    const include = $("df-include").checked;
    const total = include ? rawDays + 1 : rawDays;

    $("df-days").textContent = tb.fmt(total) + " 日" + (reversed ? "（終了日が開始日より前のため、符号を無視した日数を表示しています）" : "");
    const weeks = Math.floor(total / 7);
    const remDays = total - weeks * 7;
    $("df-weeks").textContent = tb.fmt(weeks) + " 週 " + remDays + " 日";

    const ymd = calendarDiff(early, late);
    $("df-ymd").textContent = ymd.y + " 年 " + ymd.m + " ヶ月 " + ymd.d + " 日";

    $("df-start-wd").textContent = weekdayJa(s);
    $("df-end-wd").textContent = weekdayJa(e);

    // 祝日リストの読み込み（不正な行・期間外は自動的に無視）
    const holidaySet = new Set();
    ($("df-holidays").value || "").split(/\r?\n/).forEach((line) => {
      const dt = parseISODate(line);
      if (dt) holidaySet.add(fmtDate(dt));
    });

    let weekdayCount = 0, weekendCount = 0, holidayInRange = 0;
    for (let t = early.getTime(); t <= late.getTime(); t += MS_DAY) {
      const dt = new Date(t);
      const dow = dt.getUTCDay();
      const isWeekend = dow === 0 || dow === 6;
      const isHoliday = holidaySet.has(fmtDate(dt));
      if (isWeekend) weekendCount++;
      if (isHoliday) holidayInRange++;
      if (!isWeekend && !isHoliday) weekdayCount++;
    }
    $("df-weekdays").textContent = tb.fmt(weekdayCount) + " 日";
    $("df-weekend").textContent = tb.fmt(weekendCount) + " 日";
    $("df-holicount").textContent = tb.fmt(holidayInRange) + " 日";
  }

  function runShift() {
    const err = $("df-error2");
    err.textContent = "";
    const base = parseISODate($("df-base").value);
    const nText = tb.z2h($("df-n").value);
    const n = /^-?\d+$/.test((nText || "").trim()) ? parseInt(nText, 10) : NaN;

    if (!base) {
      err.textContent = "基準日を正しく入力してください。";
      $("df-result-date").textContent = "-"; $("df-result-wd").textContent = "-";
      return;
    }
    if (!Number.isFinite(n)) {
      err.textContent = "加減する数は整数で入力してください。";
      $("df-result-date").textContent = "-"; $("df-result-wd").textContent = "-";
      return;
    }

    const unit = $("df-unit").value;
    let result;
    if (unit === "day") {
      result = new Date(base.getTime() + n * MS_DAY);
    } else if (unit === "week") {
      result = new Date(base.getTime() + n * 7 * MS_DAY);
    } else {
      result = addMonthsClamped(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), n);
    }
    $("df-result-date").textContent = fmtDate(result);
    $("df-result-wd").textContent = weekdayJa(result);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["df-start", "df-end", "df-holidays"].forEach((id) => {
      $(id).addEventListener("input", runDiff);
      $(id).addEventListener("change", runDiff);
    });
    $("df-include").addEventListener("change", runDiff);
    ["df-base", "df-n"].forEach((id) => {
      $(id).addEventListener("input", runShift);
      $(id).addEventListener("change", runShift);
    });
    $("df-unit").addEventListener("change", runShift);
    runDiff();
    runShift();
  });
})();
