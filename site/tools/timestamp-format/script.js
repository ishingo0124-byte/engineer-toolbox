(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const DAY_MS = 86400000;
  const WD_JA = ["日", "月", "火", "水", "木", "金", "土"];
  const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WD_EN_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MO_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MO_EN_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function pad(n, len) { return String(n).padStart(len || 2, "0"); }

  // 指定したUTC年月日時分秒(+ms)が「実在する暦日」かどうかをラウンドトリップで確認しつつ、
  // 与えられたオフセット(分)を差し引いてUTCエポックミリ秒を求める
  function buildUtcMs(y, mo, d, h, mi, s, ms, offsetMin) {
    const baseMs = Date.UTC(y, mo - 1, d, h, mi, s, ms || 0);
    const check = new Date(baseMs);
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d ||
        check.getUTCHours() !== h || check.getUTCMinutes() !== mi || check.getUTCSeconds() !== s) {
      throw new Error("存在しない日時です（日付・時刻の値を確認してください）");
    }
    return baseMs - offsetMin * 60000;
  }

  function parseOffset(str) {
    if (!str) return null;
    if (/^Z$/i.test(str)) return 0;
    const m = str.match(/^([+-])(\d{2}):?(\d{2})$/);
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
  }

  function parseRfc2822Offset(str) {
    if (!str) return null;
    const u = str.toUpperCase();
    if (u === "GMT" || u === "UT" || u === "Z") return 0;
    const m = str.match(/^([+-])(\d{2})(\d{2})$/);
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
  }

  function parseInput(raw, assumedOffsetMin) {
    const s = tb.z2h(raw).trim();
    if (s === "") throw new Error("日時を入力してください");

    // 1) エポック秒 / ミリ秒（整数のみ）
    if (/^-?\d+$/.test(s)) {
      const n = BigInt(s);
      const digits = (n < 0n ? -n : n).toString().length;
      const isMs = digits >= 12;
      const ms = isMs ? Number(n) : Number(n) * 1000;
      if (!Number.isFinite(ms)) throw new Error("値が大きすぎます");
      return ms;
    }

    // 2) ISO 8601 / RFC 3339（区切りは T または半角スペース、オフセット省略可）
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/i);
    if (m) {
      const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], se = +m[6];
      const ms = m[7] ? Math.round(parseFloat("0." + m[7]) * 1000) : 0;
      const off = m[8] ? parseOffset(m[8]) : assumedOffsetMin;
      if (off === null) throw new Error("タイムゾーンオフセットの形式が正しくありません");
      return buildUtcMs(y, mo, d, h, mi, se, ms, off);
    }

    // 3) "YYYY/MM/DD HH:MM[:SS]"（日付のみも可）
    m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const y = +m[1], mo = +m[2], d = +m[3], h = m[4] ? +m[4] : 0, mi = m[5] ? +m[5] : 0, se = m[6] ? +m[6] : 0;
      return buildUtcMs(y, mo, d, h, mi, se, 0, assumedOffsetMin);
    }

    // 4) RFC 2822 "Thu, 10 Sep 2026 15:04:05 +0900"（曜日省略可）
    m = s.match(/^(?:[A-Za-z]{3},\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s*(\S+)?$/);
    if (m) {
      const monIdx = MO_EN.findIndex((mo) => mo.toLowerCase() === m[2].toLowerCase());
      if (monIdx === -1) throw new Error("月の表記（Jan〜Dec）が正しくありません");
      const d = +m[1], y = +m[3], h = +m[4], mi = +m[5], se = m[6] ? +m[6] : 0;
      const off = m[7] ? parseRfc2822Offset(m[7]) : assumedOffsetMin;
      if (off === null) throw new Error("タイムゾーンオフセットの形式が正しくありません");
      return buildUtcMs(y, monIdx + 1, d, h, mi, se, 0, off);
    }

    // 5) フォールバック（ブラウザの標準パーサ）
    const fallback = new Date(s);
    if (!isNaN(fallback.getTime())) return fallback.getTime();

    throw new Error("認識できない日時形式です");
  }

  function excelSerial(utcMs) {
    const epoch = Date.UTC(1899, 11, 31); // 1899-12-31 00:00 UTC = シリアル値 0
    const mar1900 = Date.UTC(1900, 2, 1);
    const days = (utcMs - epoch) / DAY_MS;
    return utcMs >= mar1900 ? days + 1 : days; // Excelの1900年閏年バグ（存在しない2/29を1日分カウント）を再現
  }

  function isoWeekInfo(y, mo, d) {
    const date = new Date(Date.UTC(y, mo - 1, d));
    const dayNum = (date.getUTCDay() + 6) % 7; // 月=0 … 日=6
    date.setUTCDate(date.getUTCDate() - dayNum + 3); // その週の木曜日
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const fDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - fDayNum + 3);
    const week = 1 + Math.round((date - firstThursday) / (7 * DAY_MS));
    return { isoYear: date.getUTCFullYear(), week: week };
  }

  function strftime(fmt, utcMs) {
    const dJst = new Date(utcMs + 9 * 3600 * 1000);
    const Y = dJst.getUTCFullYear(), Mo = dJst.getUTCMonth() + 1, D = dJst.getUTCDate();
    const H = dJst.getUTCHours(), Mi = dJst.getUTCMinutes(), S = dJst.getUTCSeconds();
    const Wd = dJst.getUTCDay();
    const doy = Math.floor((Date.UTC(Y, Mo - 1, D) - Date.UTC(Y, 0, 1)) / DAY_MS) + 1;
    const h12 = H % 12 === 0 ? 12 : H % 12;
    const map = {
      Y: String(Y), y: pad(Y % 100), m: pad(Mo), d: pad(D), e: String(D).padStart(2, " "),
      H: pad(H), I: pad(h12), M: pad(Mi), S: pad(S), p: H < 12 ? "AM" : "PM",
      a: WD_EN[Wd], A: WD_EN_FULL[Wd], b: MO_EN[Mo - 1], B: MO_EN_FULL[Mo - 1],
      j: pad(doy, 3), z: "+0900", Z: "JST", u: String(Wd === 0 ? 7 : Wd), w: String(Wd),
      "%": "%"
    };
    return fmt.replace(/%([A-Za-z%])/g, (whole, c) => (c in map ? map[c] : whole));
  }

  let currentUtcMs = null;

  function render(utcMs) {
    if (!Number.isFinite(utcMs) || Math.abs(utcMs) > 8640000000000000) {
      throw new Error("日時としての範囲外です（JavaScriptのDateで扱える範囲 ±100,000,000日 を超えています）");
    }
    currentUtcMs = utcMs;
    const dUtc = new Date(utcMs);
    const dJst = new Date(utcMs + 9 * 3600 * 1000);
    const Yj = dJst.getUTCFullYear(), Mj = dJst.getUTCMonth() + 1, Dj = dJst.getUTCDate();
    const Hj = dJst.getUTCHours(), Mij = dJst.getUTCMinutes(), Sj = dJst.getUTCSeconds();
    const Wdj = dJst.getUTCDay();

    $("tf-iso-z").textContent = dUtc.toISOString();
    $("tf-iso-jst").textContent = `${Yj}-${pad(Mj)}-${pad(Dj)}T${pad(Hj)}:${pad(Mij)}:${pad(Sj)}+09:00`;
    $("tf-rfc3339").textContent = `${dUtc.getUTCFullYear()}-${pad(dUtc.getUTCMonth() + 1)}-${pad(dUtc.getUTCDate())}T${pad(dUtc.getUTCHours())}:${pad(dUtc.getUTCMinutes())}:${pad(dUtc.getUTCSeconds())}+00:00`;
    $("tf-rfc2822").textContent = `${WD_EN[Wdj]}, ${pad(Dj)} ${MO_EN[Mj - 1]} ${Yj} ${pad(Hj)}:${pad(Mij)}:${pad(Sj)} +0900`;
    $("tf-epoch").textContent = tb.fmt(Math.floor(utcMs / 1000));
    $("tf-excel").textContent = excelSerial(utcMs).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    $("tf-ja").textContent = `${Yj}年${Mj}月${Dj}日（${WD_JA[Wdj]}）`;
    $("tf-weekday").textContent = `${WD_JA[Wdj]}曜日`;
    const doy = Math.floor((Date.UTC(Yj, Mj - 1, Dj) - Date.UTC(Yj, 0, 1)) / DAY_MS) + 1;
    $("tf-yday").textContent = `${doy}日目`;
    const iw = isoWeekInfo(Yj, Mj, Dj);
    $("tf-isoweek").textContent = `${iw.isoYear}-W${pad(iw.week)}`;

    renderStrftime();
    $("tf-s1").textContent = strftime("%Y-%m-%d %H:%M:%S", utcMs);
    $("tf-s2").textContent = strftime("%a, %d %b %Y %H:%M:%S %z", utcMs);
    $("tf-s3").textContent = strftime("%Y年%m月%d日(%a) %H時%M分", utcMs);
    $("tf-s4").textContent = strftime("%Y/%m/%d", utcMs);
  }

  function renderStrftime() {
    if (currentUtcMs === null) return;
    const fmt = $("tf-strftime").value;
    $("tf-strftime-out").textContent = fmt ? strftime(fmt, currentUtcMs) : "";
  }

  function assumedOffset() { return parseInt($("tf-tz").value, 10) * 60; }

  function runFromText() {
    const errEl = $("tf-error");
    errEl.textContent = "";
    try {
      const utcMs = parseInput($("tf-input").value, assumedOffset());
      render(utcMs);
      const d = new Date(utcMs + assumedOffset() * 60000);
      $("tf-picker").value = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    } catch (e) {
      errEl.textContent = e.message;
    }
  }

  function runFromPicker() {
    const errEl = $("tf-error");
    errEl.textContent = "";
    const v = $("tf-picker").value;
    if (!v) return;
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) { errEl.textContent = "日時の形式が正しくありません"; return; }
    try {
      const utcMs = buildUtcMs(+m[1], +m[2], +m[3], +m[4], +m[5], m[6] ? +m[6] : 0, 0, assumedOffset());
      render(utcMs);
      $("tf-input").value = new Date(utcMs).toISOString();
    } catch (e) {
      errEl.textContent = e.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("tf-input").addEventListener("input", tb.debounce(runFromText, 120));
    $("tf-tz").addEventListener("change", runFromText);
    $("tf-picker").addEventListener("input", runFromPicker);
    $("tf-strftime").addEventListener("input", renderStrftime);
    runFromText();
  });
})();
