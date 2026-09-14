(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const DOW_JA = ["日", "月", "火", "水", "木", "金", "土"];
  const DOW_CHAR_TO_NUM = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
  const SEP = /[・,，、と]/;
  const HELP = "対応している書き方の例:「毎日3時」「毎週月曜9時30分」「平日18時」「毎月1日と15日0時」「5分おき」「毎時15分」「毎年1月1日」「週末12時」";

  function fail(msg) { throw new Error(msg); }

  function fullSet(min, max) {
    const s = new Set();
    for (let v = min; v <= max; v++) s.add(v);
    return s;
  }
  function stepSet(min, max, step) {
    const s = new Set();
    for (let v = min; v <= max; v += step) s.add(v);
    return s;
  }

  // 文字列中の最初の「N時」「N時M分」「N時半」を取り出し、その部分を除いた残り文字列を返す
  function extractTime(s) {
    const m = s.match(/(\d{1,2})時(半|(\d{1,2})分)?/);
    if (!m) return { hour: 0, minute: 0, rest: s, hadTime: false };
    const hour = parseInt(m[1], 10);
    let minute = 0;
    if (m[2] === "半") minute = 30;
    else if (m[3] !== undefined) minute = parseInt(m[3], 10);
    if (hour > 23) fail("「時」は0〜23で指定してください: " + m[0]);
    if (minute > 59) fail("「分」は0〜59で指定してください: " + m[0]);
    const rest = s.slice(0, m.index) + s.slice(m.index + m[0].length);
    return { hour, minute, rest, hadTime: true };
  }

  // "月水金" "月曜と木曜" "月・水・金" "土日" などから曜日番号の配列を得る
  function parseWeekdayGroup(rest) {
    if (rest === "") fail("曜日の指定がありません。" + HELP);
    if (rest === "土日" || rest === "週末") return [0, 6];
    const tokens = rest.split(SEP).filter(Boolean);
    if (tokens.length === 0) fail("曜日を認識できません: " + rest);
    const days = new Set();
    for (const t of tokens) {
      if (t === "土日" || t === "週末") { days.add(0); days.add(6); continue; }
      const core = t.replace(/曜日$/, "").replace(/曜$/, "");
      if (core === "") fail("曜日を認識できません: " + t);
      if (core.length === 1) {
        if (!(core in DOW_CHAR_TO_NUM)) fail("曜日を認識できません: " + t);
        days.add(DOW_CHAR_TO_NUM[core]);
      } else {
        for (const ch of core) {
          if (!(ch in DOW_CHAR_TO_NUM)) fail("曜日を認識できません: " + t);
          days.add(DOW_CHAR_TO_NUM[ch]);
        }
      }
    }
    if (days.size === 0) fail("曜日を認識できません: " + rest);
    return Array.from(days).sort((a, b) => a - b);
  }

  // "1日と15日" "1、15日" などから日付番号の配列を得る
  function parseDayOfMonthGroup(rest) {
    const tokens = rest.split(SEP).filter(Boolean);
    if (tokens.length === 0) fail("日付を認識できません: " + rest);
    const days = new Set();
    for (const t of tokens) {
      const m = t.match(/^(\d{1,2})日?$/);
      if (!m) fail("日付を認識できません: " + t);
      const d = parseInt(m[1], 10);
      if (d < 1 || d > 31) fail("日は1〜31で指定してください: " + t);
      days.add(d);
    }
    return Array.from(days).sort((a, b) => a - b);
  }

  function dailyPart(hour, minute) {
    return {
      minField: String(minute), hourField: String(hour), monField: "*",
      minSet: new Set([minute]), hourSet: new Set([hour]), monthSet: fullSet(1, 12),
    };
  }

  function parseSchedule(raw) {
    const z = ("tb" in window && tb.z2h) ? tb.z2h(raw) : raw;
    const s = String(z || "").trim().replace(/[\s　]+/g, "");
    if (s === "") fail("日本語で予定を入力してください。" + HELP);

    let m;

    // 「N分おき」
    m = s.match(/^(\d{1,3})分おき$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n < 1 || n > 59) fail("「〜分おき」は1〜59で指定してください: " + m[0]);
      return {
        minField: "*/" + n, hourField: "*", domField: "*", monField: "*", dowField: "*",
        minSet: stepSet(0, 59, n), hourSet: fullSet(0, 23), domSet: fullSet(1, 31),
        monthSet: fullSet(1, 12), dowSet: fullSet(0, 6),
        domRestricted: false, dowRestricted: false,
      };
    }

    // 「毎時N分」
    m = s.match(/^毎時(\d{1,2})分$/);
    if (m) {
      const min = parseInt(m[1], 10);
      if (min > 59) fail("「毎時」の分は0〜59で指定してください: " + m[0]);
      return {
        minField: String(min), hourField: "*", domField: "*", monField: "*", dowField: "*",
        minSet: new Set([min]), hourSet: fullSet(0, 23), domSet: fullSet(1, 31),
        monthSet: fullSet(1, 12), dowSet: fullSet(0, 6),
        domRestricted: false, dowRestricted: false,
      };
    }

    // 「毎年M月D日」（時刻は省略可・省略時は0時0分）
    m = s.match(/^毎年(\d{1,2})月(\d{1,2})日(.*)$/);
    if (m) {
      const month = parseInt(m[1], 10), day = parseInt(m[2], 10);
      if (month < 1 || month > 12) fail("月は1〜12で指定してください: " + m[0]);
      if (day < 1 || day > 31) fail("日は1〜31で指定してください: " + m[0]);
      let hour = 0, minute = 0;
      if (m[3]) {
        const t = extractTime(m[3]);
        if (!t.hadTime || t.rest !== "") fail("時刻の書き方を認識できません: " + m[3]);
        hour = t.hour; minute = t.minute;
      }
      return {
        minField: String(minute), hourField: String(hour), domField: String(day), monField: String(month), dowField: "*",
        minSet: new Set([minute]), hourSet: new Set([hour]), domSet: new Set([day]),
        monthSet: new Set([month]), dowSet: fullSet(0, 6),
        domRestricted: true, dowRestricted: false,
      };
    }

    // それ以外: まず時刻を取り出し、残りで 毎日／平日／週末・土日／毎週◯曜／毎月◯日 を判定する
    const t = extractTime(s);
    const body = t.rest;

    if (body === "毎日") {
      return Object.assign(dailyPart(t.hour, t.minute), {
        domField: "*", dowField: "*", domSet: fullSet(1, 31), dowSet: fullSet(0, 6),
        domRestricted: false, dowRestricted: false,
      });
    }
    if (body === "平日") {
      return Object.assign(dailyPart(t.hour, t.minute), {
        domField: "*", dowField: "1-5", domSet: fullSet(1, 31), dowSet: new Set([1, 2, 3, 4, 5]),
        domRestricted: false, dowRestricted: true,
      });
    }
    if (body === "週末" || body === "土日") {
      return Object.assign(dailyPart(t.hour, t.minute), {
        domField: "*", dowField: "0,6", domSet: fullSet(1, 31), dowSet: new Set([0, 6]),
        domRestricted: false, dowRestricted: true,
      });
    }
    if (body.indexOf("毎週") === 0) {
      const days = parseWeekdayGroup(body.slice(2));
      return Object.assign(dailyPart(t.hour, t.minute), {
        domField: "*", dowField: days.join(","), domSet: fullSet(1, 31), dowSet: new Set(days),
        domRestricted: false, dowRestricted: true,
      });
    }
    m = body.match(/^毎月(.+)日$/);
    if (m) {
      const days = parseDayOfMonthGroup(m[1] + "日");
      return Object.assign(dailyPart(t.hour, t.minute), {
        domField: days.join(","), dowField: "*", domSet: new Set(days), dowSet: fullSet(0, 6),
        domRestricted: true, dowRestricted: false,
      });
    }

    fail("入力された表現を解釈できませんでした。" + HELP);
  }

  function dayMatches(p, date) {
    const dom = date.getDate(), dow = date.getDay();
    if (p.domRestricted && p.dowRestricted) return p.domSet.has(dom) || p.dowSet.has(dow);
    if (p.domRestricted) return p.domSet.has(dom);
    if (p.dowRestricted) return p.dowSet.has(dow);
    return true;
  }

  function nextRuns(p, count, maxDays) {
    const now = new Date();
    const cur = new Date(now.getTime());
    cur.setSeconds(0, 0);
    cur.setMinutes(cur.getMinutes() + 1);
    const limit = new Date(cur.getTime());
    limit.setDate(limit.getDate() + maxDays);
    const limitTs = limit.getTime();
    const out = [];
    while (cur.getTime() <= limitTs && out.length < count) {
      if (p.monthSet.has(cur.getMonth() + 1) && dayMatches(p, cur) && p.hourSet.has(cur.getHours()) && p.minSet.has(cur.getMinutes())) {
        out.push(new Date(cur.getTime()));
      }
      cur.setMinutes(cur.getMinutes() + 1);
    }
    return out;
  }

  function fmtDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    const w = DOW_JA[d.getDay()];
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "（" + w + "） " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function describeMin(p) {
    if (p.minField === "*") return "毎分（0〜59分すべて）";
    if (p.minField.indexOf("*/") === 0) {
      const sample = Array.from(p.minSet).sort((a, b) => a - b).slice(0, 4).join(",");
      return p.minField.slice(2) + "分おき（" + sample + "…分）";
    }
    return Array.from(p.minSet).sort((a, b) => a - b).map((v) => v + "分").join("・");
  }
  function describeHour(p) {
    if (p.hourField === "*") return "毎時（0〜23時すべて）";
    return Array.from(p.hourSet).sort((a, b) => a - b).map((v) => v + "時").join("・");
  }
  function describeDom(p) {
    if (!p.domRestricted) return "すべての日";
    return Array.from(p.domSet).sort((a, b) => a - b).map((v) => v + "日").join("・");
  }
  function describeMon(p) {
    if (p.monthSet.size === 12) return "すべての月";
    return Array.from(p.monthSet).sort((a, b) => a - b).map((v) => v + "月").join("・");
  }
  function describeDow(p) {
    if (!p.dowRestricted) return "すべての曜日";
    return Array.from(p.dowSet).sort((a, b) => a - b).map((v) => DOW_JA[v] + "曜日").join("・");
  }

  function run() {
    const inputEl = $("cfs-input");
    const errEl = $("cfs-error");
    const cronEl = $("cfs-cron");
    const noteEl = $("cfs-note");
    const listEl = $("cfs-next-list");
    errEl.textContent = "";
    listEl.innerHTML = "";
    try {
      const p = parseSchedule(inputEl.value);
      cronEl.textContent = [p.minField, p.hourField, p.domField, p.monField, p.dowField].join(" ");
      $("cfs-min").textContent = describeMin(p);
      $("cfs-hour").textContent = describeHour(p);
      $("cfs-dom").textContent = describeDom(p);
      $("cfs-mon").textContent = describeMon(p);
      $("cfs-dow").textContent = describeDow(p);
      noteEl.textContent = (p.domRestricted && p.dowRestricted)
        ? "※「日」と「曜日」を両方指定しているため、どちらか一方に一致すれば実行されます（POSIX/Vixie cron の仕様）。"
        : "";
      const runs = nextRuns(p, 5, 366);
      if (runs.length === 0) {
        const li = document.createElement("li");
        li.textContent = "1年以内に条件を満たす日時が見つかりませんでした。";
        listEl.appendChild(li);
      } else {
        runs.forEach((d) => {
          const li = document.createElement("li");
          li.textContent = fmtDate(d);
          listEl.appendChild(li);
        });
      }
    } catch (e) {
      cronEl.textContent = "-";
      ["cfs-min", "cfs-hour", "cfs-dom", "cfs-mon", "cfs-dow"].forEach((id) => { $(id).textContent = "-"; });
      noteEl.textContent = "";
      errEl.textContent = e.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const debouncedRun = ("tb" in window && tb.debounce) ? tb.debounce(run, 150) : run;
    $("cfs-input").addEventListener("input", debouncedRun);
    document.querySelectorAll("[data-example]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("cfs-input").value = btn.getAttribute("data-example");
        run();
      });
    });
    run();
  });
})();
