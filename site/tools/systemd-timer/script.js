(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const WD_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const WD_JP = ["月", "火", "水", "木", "金", "土", "日"];
  const WD_TABLE = { mon: 0, monday: 0, tue: 1, tues: 1, tuesday: 1, wed: 2, wednesday: 2, thu: 3, thur: 3, thurs: 3, thursday: 3, fri: 4, friday: 4, sat: 5, saturday: 5, sun: 6, sunday: 6 };
  const MONTH_NAMES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const DOW_NAMES = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const YEAR_MIN = 1970, YEAR_MAX = 2999;

  function toHalfWidth(s) {
    return String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  function lookupWeekday(s) {
    s = s.trim().toLowerCase();
    return WD_TABLE.hasOwnProperty(s) ? WD_TABLE[s] : null;
  }

  function parseWeekdayField(tok) {
    if (!tok) return [0, 1, 2, 3, 4, 5, 6];
    const parts = tok.split(",");
    const set = new Set();
    for (const part of parts) {
      if (part.includes("..")) {
        const [a, b] = part.split("..");
        const ai = lookupWeekday(a), bi = lookupWeekday(b);
        if (ai == null || bi == null) throw new Error("曜日の指定が正しくありません: " + part);
        if (ai > bi) throw new Error("曜日の範囲はMonからSunの順で指定してください: " + part);
        for (let i = ai; i <= bi; i++) set.add(i);
      } else {
        const idx = lookupWeekday(part);
        if (idx == null) throw new Error("曜日の指定が正しくありません（例: Mon, Mon..Fri, Sat,Sun）: " + part);
        set.add(idx);
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  function parseNumField(tok, min, max, label) {
    const parts = String(tok).split(",");
    const set = new Set();
    for (let part of parts) {
      part = part.trim();
      if (part === "") throw new Error(label + "の指定が空です");
      let step = null, base = part;
      const si = part.indexOf("/");
      if (si >= 0) {
        base = part.slice(0, si);
        step = parseInt(part.slice(si + 1), 10);
        if (!Number.isInteger(step) || step <= 0) throw new Error(label + "のステップ値が正しくありません: " + part);
      }
      let lo, hi;
      if (base === "*") {
        lo = min; hi = max; if (step == null) step = 1;
      } else if (base.includes("..")) {
        const [a, b] = base.split("..");
        lo = parseInt(a, 10); hi = parseInt(b, 10);
        if (!Number.isInteger(lo) || !Number.isInteger(hi)) throw new Error(label + "の範囲指定が正しくありません: " + part);
        if (step == null) step = 1;
      } else {
        lo = parseInt(base, 10);
        if (!Number.isInteger(lo)) throw new Error(label + "の値が正しくありません: " + part);
        hi = step != null ? max : lo;
        if (step == null) step = 1;
      }
      if (lo < min || hi > max || lo > hi) throw new Error(label + "の値が範囲外です（" + min + "〜" + max + "）: " + part);
      for (let v = lo; v <= hi; v += step) set.add(v);
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  const SHORTCUTS = {
    minutely: "*-*-* *:*:00", hourly: "*-*-* *:00:00", daily: "*-*-* 00:00:00", midnight: "*-*-* 00:00:00",
    weekly: "Mon *-*-* 00:00:00", monthly: "*-*-01 00:00:00",
    quarterly: "*-01,04,07,10-01 00:00:00", semiannually: "*-01,07-01 00:00:00", "semi-annually": "*-01,07-01 00:00:00",
    yearly: "*-01-01 00:00:00", annually: "*-01-01 00:00:00",
  };

  function parseOnCalendar(raw) {
    raw = toHalfWidth(String(raw || "")).trim();
    if (!raw) throw new Error("OnCalendar式を入力してください");
    const lower = raw.toLowerCase();
    if (SHORTCUTS.hasOwnProperty(lower)) raw = SHORTCUTS[lower];
    const tokens = raw.split(/\s+/).filter(Boolean);
    let weekdayTok = null, dateTok = null, timeTok = null;
    if (tokens.length && /^[A-Za-z]+(?:\.\.[A-Za-z]+)?(?:,[A-Za-z]+(?:\.\.[A-Za-z]+)?)*$/.test(tokens[0])) {
      weekdayTok = tokens.shift();
    }
    if (tokens.length === 2) { dateTok = tokens[0]; timeTok = tokens[1]; }
    else if (tokens.length === 1) { if (tokens[0].includes(":")) timeTok = tokens[0]; else dateTok = tokens[0]; }
    else if (tokens.length === 0) { /* 両方デフォルト */ }
    else throw new Error("形式を解釈できません（スペース区切りが多すぎます）");

    if (!dateTok) dateTok = "*-*-*";
    if (!timeTok) timeTok = "00:00:00";

    let yearField, monthField, dayField;
    if (dateTok === "*") { yearField = "*"; monthField = "*"; dayField = "*"; }
    else {
      const dparts = dateTok.split("-");
      if (dparts.length === 3) { [yearField, monthField, dayField] = dparts; }
      else if (dparts.length === 2) { yearField = "*"; [monthField, dayField] = dparts; }
      else throw new Error("日付の形式が正しくありません（例: *-*-*, 2024-01-01, 01-01）: " + dateTok);
    }
    const tparts = timeTok.split(":");
    let hourField, minField, secField;
    if (tparts.length === 3) { [hourField, minField, secField] = tparts; }
    else if (tparts.length === 2) { [hourField, minField] = tparts; secField = "00"; }
    else throw new Error("時刻の形式が正しくありません（例: 03:15:00, 09:00）: " + timeTok);

    const weekdayIdx = parseWeekdayField(weekdayTok);
    const years = parseNumField(yearField, YEAR_MIN, YEAR_MAX, "年");
    const months = parseNumField(monthField, 1, 12, "月");
    const days = parseNumField(dayField, 1, 31, "日");
    const hours = parseNumField(hourField, 0, 23, "時");
    const minutes = parseNumField(minField, 0, 59, "分");
    const seconds = parseNumField(secField, 0, 59, "秒");
    return { weekdayIdx, weekdayRestricted: !!weekdayTok, years, months, days, hours, minutes, seconds };
  }

  function findNextOccurrences(spec, fromDate, count) {
    const results = [];
    let d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const maxDays = 366 * 30;
    const yearSet = new Set(spec.years), monthSet = new Set(spec.months), daySet = new Set(spec.days), wdSet = new Set(spec.weekdayIdx);
    for (let i = 0; i < maxDays && results.length < count; i++) {
      const year = d.getFullYear(), month = d.getMonth() + 1, day = d.getDate();
      if (yearSet.has(year) && monthSet.has(month) && daySet.has(day)) {
        const ourIdx = (d.getDay() + 6) % 7;
        if (wdSet.has(ourIdx)) {
          outer:
          for (const h of spec.hours) {
            for (const m of spec.minutes) {
              for (const s of spec.seconds) {
                const cand = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, s, 0);
                if (cand.getTime() > fromDate.getTime()) {
                  results.push(cand);
                  if (results.length >= count) break outer;
                }
              }
            }
          }
        }
      }
      d.setDate(d.getDate() + 1);
    }
    return results;
  }

  function p2(n) { return String(n).padStart(2, "0"); }

  function fmtDate(d) {
    const idx = (d.getDay() + 6) % 7;
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "(" + WD_JP[idx] + ") " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }

  function arrayToFieldStr(arr, min, max, rangeSep, opts) {
    opts = opts || {};
    const allowStarStep = opts.allowStarStep !== false;
    const pad = opts.pad || 0;
    const p = (n) => (pad ? String(n).padStart(pad, "0") : String(n));
    if (arr.length === (max - min + 1)) return "*";
    if (arr.length >= 2) {
      const step = arr[1] - arr[0];
      let isArith = true;
      for (let i = 2; i < arr.length; i++) if (arr[i] - arr[i - 1] !== step) { isArith = false; break; }
      if (isArith && step >= 1) {
        if (arr[arr.length - 1] + step > max) {
          return (arr[0] === min && allowStarStep ? "*" : p(arr[0])) + "/" + step;
        }
        if (step === 1) return p(arr[0]) + rangeSep + p(arr[arr.length - 1]);
      }
    }
    return arr.map(p).join(",");
  }

  function ourToCronDow(i) { return (i + 1) % 7; } // 0=Mon..6=Sun -> cronの0=Sun..6=Sat

  function onCalendarToCron(spec) {
    const reasons = [];
    if (!(spec.seconds.length === 1 && spec.seconds[0] === 0)) reasons.push("秒の指定（0以外、または複数の値）はcronで表現できません（cronは分単位のため）");
    if (spec.years.length !== (YEAR_MAX - YEAR_MIN + 1)) reasons.push("年の指定はcronに存在しないフィールドのため表現できません");
    const dateRestricted = spec.months.length < 12 || spec.days.length < 31;
    const wdRestricted = spec.weekdayIdx.length < 7;
    if (dateRestricted && wdRestricted) reasons.push("曜日と日付を同時に指定するとAND条件になり、OR条件で解釈されるcronでは正確に表現できません");
    if (reasons.length) return { ok: false, reasons };
    const minuteTok = arrayToFieldStr(spec.minutes, 0, 59, "-");
    const hourTok = arrayToFieldStr(spec.hours, 0, 23, "-");
    let domTok = "*", monTok = "*", dowTok = "*";
    if (dateRestricted) {
      domTok = arrayToFieldStr(spec.days, 1, 31, "-");
      monTok = arrayToFieldStr(spec.months, 1, 12, "-");
    }
    if (wdRestricted) {
      const cronDow = spec.weekdayIdx.map(ourToCronDow).sort((a, b) => a - b);
      dowTok = arrayToFieldStr(cronDow, 0, 6, "-");
    }
    return { ok: true, cron: minuteTok + " " + hourTok + " " + domTok + " " + monTok + " " + dowTok };
  }

  function fieldSummary(arr, allCount, unit, allWord) {
    if (arr.length >= allCount) return allWord;
    let contig = arr.length > 1;
    for (let i = 1; i < arr.length && contig; i++) if (arr[i] !== arr[i - 1] + 1) contig = false;
    if (contig) return arr[0] + unit + "〜" + arr[arr.length - 1] + unit;
    if (arr.length > 10) return arr.length + "個の" + unit;
    return arr.map((v) => v + unit).join("・");
  }

  function describe(spec) {
    const weekdayText = spec.weekdayIdx.length >= 7
      ? "指定なし（毎日）"
      : spec.weekdayIdx.map((i) => WD_JP[i]).join("・") + "曜日";
    const yearText = spec.years.length >= (YEAR_MAX - YEAR_MIN + 1) ? "指定なし（毎年）" : spec.years.join("・") + "年";
    const monthText = fieldSummary(spec.months, 12, "月", "指定なし（毎月）");
    const dayText = fieldSummary(spec.days, 31, "日", "指定なし（毎日）");
    const hStr = spec.hours.length === 24 ? "*" : spec.hours.map(p2).join(",");
    const mStr = spec.minutes.length === 60 ? "*" : spec.minutes.map(p2).join(",");
    const sStr = spec.seconds.length === 60 ? "*" : spec.seconds.map(p2).join(",");
    const timeText = hStr + ":" + mStr + ":" + sStr;
    return { weekdayText, yearText, monthText, dayText, timeText };
  }

  function runOnCalendar() {
    const err = $("stm-oncal-error");
    err.textContent = "";
    const listEl = $("stm-next-list");
    listEl.innerHTML = "";
    let spec;
    try {
      spec = parseOnCalendar($("stm-oncal").value);
    } catch (e) {
      err.textContent = e.message;
      ["stm-desc-weekday", "stm-desc-year", "stm-desc-month", "stm-desc-day", "stm-desc-time", "stm-cron-equiv"].forEach((id) => { $(id).textContent = "-"; });
      return;
    }
    const d = describe(spec);
    $("stm-desc-weekday").textContent = d.weekdayText;
    $("stm-desc-year").textContent = d.yearText;
    $("stm-desc-month").textContent = d.monthText;
    $("stm-desc-day").textContent = d.dayText;
    $("stm-desc-time").textContent = d.timeText;

    const cronResult = onCalendarToCron(spec);
    $("stm-cron-equiv").textContent = cronResult.ok ? cronResult.cron : "cron では表現不可（" + cronResult.reasons.join("／") + "）";

    const now = new Date();
    const occ = findNextOccurrences(spec, now, 5);
    if (occ.length === 0) {
      const li = document.createElement("li");
      li.textContent = "今後30年以内に条件を満たす日時が見つかりませんでした";
      listEl.appendChild(li);
    } else {
      occ.forEach((dt) => {
        const li = document.createElement("li");
        li.textContent = fmtDate(dt);
        listEl.appendChild(li);
      });
    }
  }

  // ---- cron -> OnCalendar ----
  function preprocessNames(tok, table) {
    return tok.replace(/[A-Za-z]{3}/g, (m) => {
      const v = table[m.toLowerCase()];
      return v == null ? m : String(v);
    });
  }

  function parseCronField(tok, min, max, label) {
    const parts = String(tok).split(",");
    const set = new Set();
    for (let part of parts) {
      part = part.trim();
      if (part === "") throw new Error(label + "の指定が空です");
      let step = null, base = part;
      const si = part.indexOf("/");
      if (si >= 0) {
        base = part.slice(0, si);
        step = parseInt(part.slice(si + 1), 10);
        if (!Number.isInteger(step) || step <= 0) throw new Error(label + "のステップ値が正しくありません: " + part);
      }
      let lo, hi;
      if (base === "*") { lo = min; hi = max; if (step == null) step = 1; }
      else if (base.includes("-")) {
        const [a, b] = base.split("-");
        lo = parseInt(a, 10); hi = parseInt(b, 10);
        if (!Number.isInteger(lo) || !Number.isInteger(hi)) throw new Error(label + "の範囲指定が正しくありません: " + part);
        if (step == null) step = 1;
      } else {
        lo = parseInt(base, 10);
        if (!Number.isInteger(lo)) throw new Error(label + "の値が正しくありません: " + part);
        hi = step != null ? max : lo;
        if (step == null) step = 1;
      }
      if (lo < min || hi > max || lo > hi) throw new Error(label + "の値が範囲外です（" + min + "〜" + max + "）: " + part);
      for (let v = lo; v <= hi; v += step) set.add(v);
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  const CRON_SHORTCUTS = {
    "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *",
    "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *",
  };

  function parseCron(raw) {
    raw = toHalfWidth(String(raw || "")).trim();
    if (!raw) throw new Error("cron式を入力してください");
    const lower = raw.toLowerCase();
    if (CRON_SHORTCUTS.hasOwnProperty(lower)) raw = CRON_SHORTCUTS[lower];
    const fields = raw.split(/\s+/).filter(Boolean);
    if (fields.length !== 5) throw new Error("cronは5フィールド（分 時 日 月 曜日）で指定してください");
    let [mi, ho, dom, mon, dow] = fields;
    mon = preprocessNames(mon, MONTH_NAMES);
    dow = preprocessNames(dow, DOW_NAMES);
    const minutes = parseCronField(mi, 0, 59, "分");
    const hours = parseCronField(ho, 0, 23, "時");
    const doms = parseCronField(dom, 1, 31, "日");
    const mons = parseCronField(mon, 1, 12, "月");
    let dows = parseCronField(dow, 0, 7, "曜日");
    dows = Array.from(new Set(dows.map((v) => (v === 7 ? 0 : v)))).sort((a, b) => a - b);
    return { minutes, hours, doms, mons, dows };
  }

  function cronToOnCalendar(c) {
    const domFull = c.doms.length === 31;
    const monFull = c.mons.length === 12;
    const dowFull = c.dows.length === 7;
    const dateRestricted = !(domFull && monFull);
    const dowRestricted = !dowFull;
    const orAmbiguous = dateRestricted && dowRestricted;

    const hourTok = arrayToFieldStr(c.hours, 0, 23, "..", { allowStarStep: false, pad: 2 });
    const minTok = arrayToFieldStr(c.minutes, 0, 59, "..", { allowStarStep: false, pad: 2 });
    const timeSpec = hourTok + ":" + minTok + ":00";

    let dateSpec = "*-*-*";
    if (dateRestricted) {
      const monTok = monFull ? "*" : arrayToFieldStr(c.mons, 1, 12, "..");
      const domTok = domFull ? "*" : arrayToFieldStr(c.doms, 1, 31, "..");
      dateSpec = "*-" + monTok + "-" + domTok;
    }
    let weekdaySpec = "";
    if (dowRestricted) {
      const ourIdx = c.dows.map((d) => (d + 6) % 7).sort((a, b) => a - b);
      weekdaySpec = ourIdx.map((i) => WD_NAMES[i]).join(",") + " ";
    }
    return { oncalendar: weekdaySpec + dateSpec + " " + timeSpec, orAmbiguous };
  }

  function runCron() {
    const err = $("stm-cron-error");
    err.textContent = "";
    const note = $("stm-cron-note");
    note.textContent = "";
    let c;
    try {
      c = parseCron($("stm-cron").value);
    } catch (e) {
      err.textContent = e.message;
      $("stm-oncal-equiv").textContent = "-";
      return;
    }
    const r = cronToOnCalendar(c);
    $("stm-oncal-equiv").textContent = r.oncalendar;
    if (r.orAmbiguous) {
      note.textContent = "注意: cronの日(dom)と曜日(dow)はどちらも「*」でない場合はOR条件（どちらか一致）で実行されますが、systemdのOnCalendarは日付と曜日を常にAND条件（両方一致）で解釈します。そのため上記のOnCalendar式は厳密には同じ条件を表せていません。日付・曜日のどちらか一方を*にできないか検討してください。";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("stm-oncal").addEventListener("input", runOnCalendar);
    $("stm-cron").addEventListener("input", runCron);
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("stm-oncal").value = btn.getAttribute("data-preset");
        runOnCalendar();
      });
    });
    runOnCalendar();
    runCron();
  });
})();
