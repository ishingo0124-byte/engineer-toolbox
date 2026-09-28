(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let source = "seconds";

  function fmtNum(n) {
    if (!isFinite(n)) return "—";
    const r = Math.round(n * 1e6) / 1e6;
    return tb.fmt(r);
  }

  function parseSecondsInput(str) {
    const s = String(str).trim().replace(/,/g, "");
    if (s === "") return null;
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    return parseFloat(s);
  }

  function formatDHMS(totalSeconds) {
    const neg = totalSeconds < 0;
    let rem = Math.abs(totalSeconds);
    const days = Math.floor(rem / 86400);
    rem -= days * 86400;
    const hours = Math.floor(rem / 3600);
    rem -= hours * 3600;
    const minutes = Math.floor(rem / 60);
    rem -= minutes * 60;
    const pad2 = (n) => String(n).padStart(2, "0");
    let secStr = rem.toFixed(3).replace(/\.?0+$/, "");
    if (secStr === "" || secStr === "-0") secStr = "0";
    if (Number(secStr) < 10) secStr = "0" + secStr;
    return (neg ? "-" : "") + (days > 0 ? days + "日 " : "") + pad2(hours) + ":" + pad2(minutes) + ":" + secStr;
  }

  function parseDHMS(str) {
    const s = String(str).trim();
    const m = /^(-)?\s*(?:(\d+)\s*日\s*)?(\d+):([0-5]?\d):([0-5]?\d(?:\.\d+)?)$/.exec(s);
    if (!m) return null;
    const sign = m[1] ? -1 : 1;
    const days = m[2] ? parseInt(m[2], 10) : 0;
    const hours = parseInt(m[3], 10);
    const minutes = parseInt(m[4], 10);
    const seconds = parseFloat(m[5]);
    return sign * (days * 86400 + hours * 3600 + minutes * 60 + seconds);
  }

  const ISO_RE = /^(-)?P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

  function parseISO(str) {
    const s = String(str).trim();
    if (s === "") return null;
    const m = ISO_RE.exec(s);
    if (!m) return null;
    const sign = m[1], w = m[2], y = m[3], mo = m[4], d = m[5], h = m[6], mi = m[7], se = m[8];
    if (!w && !y && !mo && !d && !h && !mi && !se) return null;
    const hasT = /T/.test(s);
    if (hasT && !h && !mi && !se) return null;
    const approx = !!(y || mo);
    const days = (w ? parseFloat(w) * 7 : 0) + (y ? parseFloat(y) * 365 : 0) + (mo ? parseFloat(mo) * 30 : 0) + (d ? parseFloat(d) : 0);
    const total = days * 86400 + (h ? parseFloat(h) * 3600 : 0) + (mi ? parseFloat(mi) * 60 : 0) + (se ? parseFloat(se) : 0);
    return { seconds: (sign ? -1 : 1) * total, approx: approx };
  }

  function toISO(totalSeconds) {
    if (totalSeconds === 0) return "PT0S";
    const neg = totalSeconds < 0;
    let rem = Math.abs(totalSeconds);
    const days = Math.floor(rem / 86400);
    rem -= days * 86400;
    const hours = Math.floor(rem / 3600);
    rem -= hours * 3600;
    const minutes = Math.floor(rem / 60);
    rem -= minutes * 60;
    const seconds = Math.round(rem * 1000) / 1000;
    let out = (neg ? "-" : "") + "P";
    if (days > 0) out += days + "D";
    let t = "";
    if (hours > 0) t += hours + "H";
    if (minutes > 0) t += minutes + "M";
    if (seconds > 0) {
      let ss = seconds.toFixed(3).replace(/\.?0+$/, "");
      t += ss + "S";
    }
    if (t) out += "T" + t;
    if (out === "P" || out === "-P") out += "T0S";
    return out;
  }

  function render(totalSeconds, warn) {
    $("dc-warning").textContent = warn || "";
    if (document.activeElement !== $("dc-seconds")) $("dc-seconds").value = String(totalSeconds);
    if (document.activeElement !== $("dc-dhms")) $("dc-dhms").value = formatDHMS(totalSeconds);
    if (document.activeElement !== $("dc-iso")) $("dc-iso").value = toISO(totalSeconds);
    $("dc-ms").textContent = fmtNum(totalSeconds * 1000);
    $("dc-s").textContent = fmtNum(totalSeconds);
    $("dc-min").textContent = fmtNum(totalSeconds / 60);
    $("dc-hour").textContent = fmtNum(totalSeconds / 3600);
    $("dc-day").textContent = fmtNum(totalSeconds / 86400);
    $("dc-week").textContent = fmtNum(totalSeconds / 604800);
  }

  function run() {
    const err = $("dc-error");
    err.textContent = "";
    let totalSeconds = null;
    let warn = "";
    if (source === "seconds") {
      totalSeconds = parseSecondsInput($("dc-seconds").value);
      if (totalSeconds === null) { err.textContent = "秒数は数値で入力してください（例: 3900, -12.5）。"; return; }
    } else if (source === "dhms") {
      totalSeconds = parseDHMS($("dc-dhms").value);
      if (totalSeconds === null) { err.textContent = "「X日 HH:MM:SS」の形式で入力してください（例: 1日 02:03:04）。"; return; }
    } else if (source === "iso") {
      const r = parseISO($("dc-iso").value);
      if (r === null) { err.textContent = "ISO 8601 期間の形式で入力してください（例: PT1H30M, P1DT2H）。"; return; }
      totalSeconds = r.seconds;
      if (r.approx) warn = "注意: 年(Y)・月(M)は長さが不定なため、365日/30日として概算しています。";
    }
    render(totalSeconds, warn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("dc-seconds").addEventListener("input", () => { source = "seconds"; run(); });
    $("dc-dhms").addEventListener("input", () => { source = "dhms"; run(); });
    $("dc-iso").addEventListener("input", () => { source = "iso"; run(); });
    $("dc-seconds").value = "3900";
    source = "seconds";
    run();
  });
})();
