(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function sizeToBytes(value, unit, base) {
    const k = base === 1024 ? 1024 : 1000;
    const mult = { B: 1, KB: k, MB: k * k, GB: k * k * k, TB: k * k * k * k }[unit];
    return value * mult;
  }

  function speedToBps(value, unit) {
    // 回線速度は常に1000進（SI接頭辞）で計算する
    const mult = { bps: 1, Kbps: 1e3, Mbps: 1e6, Gbps: 1e9 }[unit];
    return value * mult;
  }

  function bpsToStr(bps) {
    if (!isFinite(bps)) return "-";
    if (bps >= 1e9) return tb.fmt(Math.round((bps / 1e9) * 1000) / 1000) + " Gbps";
    if (bps >= 1e6) return tb.fmt(Math.round((bps / 1e6) * 1000) / 1000) + " Mbps";
    if (bps >= 1e3) return tb.fmt(Math.round((bps / 1e3) * 1000) / 1000) + " Kbps";
    return tb.fmt(Math.round(bps * 1000) / 1000) + " bps";
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds)) return "-";
    if (seconds < 0) return "-";
    let s = Math.round(seconds * 100) / 100;
    const days = Math.floor(s / 86400); s -= days * 86400;
    const hours = Math.floor(s / 3600); s -= hours * 3600;
    const mins = Math.floor(s / 60); s -= mins * 60;
    const secs = Math.round(s * 100) / 100;
    const parts = [];
    if (days > 0) parts.push(days + "日");
    if (hours > 0 || days > 0) parts.push(hours + "時間");
    if (mins > 0 || hours > 0 || days > 0) parts.push(mins + "分");
    parts.push(secs + "秒");
    return parts.join("");
  }

  function readNum(id) {
    const v = $(id).value;
    if (v === "") return NaN;
    return parseFloat(v);
  }

  function currentSizeBytes() {
    const size = readNum("bw-size");
    const unit = $("bw-size-unit").value;
    const base = parseInt($("bw-size-base").value, 10);
    if (!isFinite(size) || size < 0) throw new Error("ファイルサイズは0以上の数値を入力してください");
    return sizeToBytes(size, unit, base);
  }

  function runTransfer() {
    const errEl = $("bw-error1");
    errEl.textContent = "";
    try {
      const sizeBytes = currentSizeBytes();
      const speed = readNum("bw-speed");
      const speedUnit = $("bw-speed-unit").value;
      const eff = readNum("bw-efficiency");
      if (!isFinite(speed) || speed <= 0) throw new Error("回線速度は0より大きい数値を入力してください");
      if (!isFinite(eff) || eff <= 0 || eff > 100) throw new Error("実効効率は1〜100の数値を入力してください");
      const speedBps = speedToBps(speed, speedUnit);
      const idealSec = (sizeBytes * 8) / speedBps;
      const realSec = idealSec / (eff / 100);
      $("bw-ideal").textContent = formatDuration(idealSec);
      $("bw-real").textContent = formatDuration(realSec) + "（効率" + eff + "%として計算）";
      $("bw-detail").textContent =
        tb.fmt(Math.round(idealSec * 1000) / 1000) + " 秒 / " +
        tb.fmt(Math.round((idealSec / 60) * 1000) / 1000) + " 分 / " +
        tb.fmt(Math.round((idealSec / 3600) * 1000) / 1000) + " 時間";
    } catch (e) {
      errEl.textContent = e.message;
      $("bw-ideal").textContent = $("bw-real").textContent = $("bw-detail").textContent = "";
    }
  }

  function runReverse() {
    const errEl = $("bw-error2");
    errEl.textContent = "";
    try {
      const sizeBytes = currentSizeBytes();
      const hours = readNum("bw-target-hours");
      const eff = readNum("bw-efficiency");
      if (!isFinite(hours) || hours <= 0) throw new Error("目標時間は0より大きい数値を入力してください");
      if (!isFinite(eff) || eff <= 0 || eff > 100) throw new Error("実効効率は1〜100の数値を入力してください");
      const seconds = hours * 3600;
      const requiredBps = (sizeBytes * 8) / seconds;
      const requiredBpsEff = requiredBps / (eff / 100);
      $("bw-req-speed").textContent = bpsToStr(requiredBps);
      $("bw-req-speed-eff").textContent = bpsToStr(requiredBpsEff);
    } catch (e) {
      errEl.textContent = e.message;
      $("bw-req-speed").textContent = $("bw-req-speed-eff").textContent = "";
    }
  }

  function runMonthly() {
    const errEl = $("bw-error3");
    errEl.textContent = "";
    try {
      const monthly = readNum("bw-monthly");
      const unit = $("bw-monthly-unit").value;
      const base = parseInt($("bw-size-base").value, 10);
      if (!isFinite(monthly) || monthly < 0) throw new Error("月間転送量は0以上の数値を入力してください");
      const bytes = sizeToBytes(monthly, unit, base);
      const DAYS_PER_MONTH = 30;
      const secondsInMonth = DAYS_PER_MONTH * 86400;
      const avgBps = (bytes * 8) / secondsInMonth;
      $("bw-avg").textContent = bpsToStr(avgBps);
    } catch (e) {
      errEl.textContent = e.message;
      $("bw-avg").textContent = "";
    }
  }

  function runAll() { runTransfer(); runReverse(); runMonthly(); }

  document.addEventListener("DOMContentLoaded", () => {
    ["bw-size", "bw-size-unit", "bw-size-base", "bw-speed", "bw-speed-unit", "bw-efficiency"].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", runAll);
    });
    ["bw-target-hours"].forEach((id) => $(id).addEventListener("input", runReverse));
    ["bw-monthly", "bw-monthly-unit"].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", runMonthly);
    });
    runAll();
  });
})();
