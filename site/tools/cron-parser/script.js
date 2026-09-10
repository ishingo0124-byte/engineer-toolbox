(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const MONTH_MAP = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  const DOW_MAP = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
  const DOW_JA = ["日", "月", "火", "水", "木", "金", "土"];

  function toHalfWidth(s) {
    return String(s || "").replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
  }

  function resolveVal(token, nameMap) {
    const t = token.trim();
    if (nameMap && Object.prototype.hasOwnProperty.call(nameMap, t)) return nameMap[t];
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    return null;
  }

  function parseField(raw, min, max, nameMap, isDow, label) {
    const upper = raw.toUpperCase();
    if (upper === "") throw new Error(label + "フィールドが空です");
    const out = new Set();
    for (const part of upper.split(",")) {
      if (part === "") throw new Error(label + "の形式が正しくありません: 空の要素があります");
      let rangePart = part, step = 1;
      if (part.indexOf("/") >= 0) {
        const bits = part.split("/");
        if (bits.length !== 2) throw new Error(label + "のステップ指定が正しくありません: " + part);
        rangePart = bits[0];
        if (!/^\d+$/.test(bits[1].trim())) throw new Error(label + "のステップは正の整数にしてください: " + part);
        step = parseInt(bits[1], 10);
        if (!Number.isInteger(step) || step <= 0) {
          throw new Error(label + "のステップは正の整数にしてください: " + part);
        }
      }
      let lo, hi;
      if (rangePart === "*") {
        lo = min; hi = max;
      } else if (rangePart.indexOf("-") >= 0) {
        const rb = rangePart.split("-");
        if (rb.length !== 2) throw new Error(label + "の範囲指定が正しくありません: " + part);
        lo = resolveVal(rb[0], nameMap);
        hi = resolveVal(rb[1], nameMap);
        if (lo === null || hi === null) throw new Error(label + "の値が不正です: " + part);
        if (lo > hi) throw new Error(label + "の範囲は開始 <= 終了にしてください: " + part);
      } else {
        lo = hi = resolveVal(rangePart, nameMap);
        if (lo === null) throw new Error(label + "の値が不正です: " + part);
      }
      if (lo < min || hi > max) throw new Error(label + "の値は " + min + "〜" + max + " の範囲にしてください: " + part);
      for (let v = lo; v <= hi; v += step) out.add(isDow ? (v % 7) : v);
    }
    return out;
  }

  function parseCron(exprRaw) {
    const s = toHalfWidth(exprRaw).trim().replace(/\s+/g, " ");
    if (s === "") throw new Error("cron 式を入力してください");
    const fields = s.split(" ");
    if (fields.length !== 5) throw new Error("フィールドは「分 時 日 月 曜日」の5個が必要です（入力は " + fields.length + " 個）");
    const minSet = parseField(fields[0], 0, 59, null, false, "分");
    const hourSet = parseField(fields[1], 0, 23, null, false, "時");
    const domSet = parseField(fields[2], 1, 31, null, false, "日");
    const monthSet = parseField(fields[3], 1, 12, MONTH_MAP, false, "月");
    const dowSet = parseField(fields[4], 0, 7, DOW_MAP, true, "曜日");
    return {
      minSet, hourSet, domSet, monthSet, dowSet,
      domRestricted: fields[2].trim() !== "*",
      dowRestricted: fields[4].trim() !== "*",
    };
  }

  function dayMatches(p, date) {
    const dom = date.getDate(), dow = date.getDay();
    if (p.domRestricted && p.dowRestricted) return p.domSet.has(dom) || p.dowSet.has(dow);
    if (p.domRestricted) return p.domSet.has(dom);
    if (p.dowRestricted) return p.dowSet.has(dow);
    return true;
  }

  function describe(p) {
    const minArr = Array.from(p.minSet).sort((a, b) => a - b);
    const hourArr = Array.from(p.hourSet).sort((a, b) => a - b);
    let timePart;
    if (p.minSet.size === 1 && p.hourSet.size === 1) {
      timePart = hourArr[0] + "時" + String(minArr[0]).padStart(2, "0") + "分";
    } else if (p.hourSet.size === 24 && p.minSet.size === 60) {
      timePart = "毎分";
    } else if (p.hourSet.size === 24) {
      timePart = "毎時 " + minArr.join("・") + "分";
    } else if (p.minSet.size === 60) {
      timePart = hourArr.join("・") + "時台の毎分";
    } else {
      timePart = hourArr.join("・") + "時の " + minArr.join("・") + "分";
    }

    let dayPart;
    if (!p.domRestricted && !p.dowRestricted) {
      dayPart = "毎日";
    } else if (p.domRestricted && !p.dowRestricted) {
      dayPart = Array.from(p.domSet).sort((a, b) => a - b).join("・") + "日";
    } else if (!p.domRestricted && p.dowRestricted) {
      dayPart = "毎週 " + Array.from(p.dowSet).sort((a, b) => a - b).map((d) => DOW_JA[d] + "曜日").join("・");
    } else {
      dayPart = Array.from(p.domSet).sort((a, b) => a - b).join("・") + "日、または"
        + Array.from(p.dowSet).sort((a, b) => a - b).map((d) => DOW_JA[d] + "曜日").join("・") + "（どちらかに一致）";
    }

    let monthPart = "";
    if (p.monthSet.size !== 12) monthPart = Array.from(p.monthSet).sort((a, b) => a - b).join("・") + "月の";

    return monthPart + dayPart + " " + timePart + " に実行";
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
    const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "（" + w + "） " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function run() {
    const exprEl = $("cr-expr");
    const errEl = $("cr-error");
    const descEl = $("cr-desc");
    const noteEl = $("cr-daydow-note");
    const listEl = $("cr-next-list");
    errEl.textContent = "";
    listEl.innerHTML = "";
    try {
      const p = parseCron(exprEl.value);
      descEl.textContent = describe(p);
      noteEl.textContent = (p.domRestricted && p.dowRestricted)
        ? "※ 「日」と「曜日」を両方指定しているため、どちらか一方に一致すれば実行されます（POSIX/Vixie cron の仕様）。"
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
        if (runs.length < 5) {
          const li = document.createElement("li");
          li.textContent = "（これ以降、1年以内に条件を満たす日時は見つかりませんでした）";
          listEl.appendChild(li);
        }
      }
    } catch (e) {
      descEl.textContent = "-";
      noteEl.textContent = "";
      errEl.textContent = e.message;
    }
  }

  function fillSelect(sel, min, max, labelFn) {
    const optAll = document.createElement("option");
    optAll.value = "*"; optAll.textContent = "* (すべて)";
    sel.appendChild(optAll);
    for (let v = min; v <= max; v++) {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = labelFn ? labelFn(v) : String(v);
      sel.appendChild(opt);
    }
  }

  function setupGenerator() {
    fillSelect($("cr-g-min"), 0, 59, (v) => v + "分");
    fillSelect($("cr-g-hour"), 0, 23, (v) => v + "時");
    fillSelect($("cr-g-day"), 1, 31, (v) => v + "日");
    fillSelect($("cr-g-month"), 1, 12, (v) => v + "月");
    fillSelect($("cr-g-week"), 0, 6, (v) => DOW_JA[v] + "曜日");
    $("cr-g-min").value = "15";
    $("cr-g-hour").value = "3";
    $("cr-g-day").value = "*";
    $("cr-g-month").value = "*";
    $("cr-g-week").value = "*";
    $("cr-g-apply").addEventListener("click", () => {
      const expr = [$("cr-g-min").value, $("cr-g-hour").value, $("cr-g-day").value, $("cr-g-month").value, $("cr-g-week").value].join(" ");
      $("cr-expr").value = expr;
      run();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupGenerator();
    const debouncedRun = ("tb" in window && tb.debounce) ? tb.debounce(run, 150) : run;
    $("cr-expr").addEventListener("input", debouncedRun);
    run();
  });
})();
