(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const BASE_WINDOW = 65535; // TCPウィンドウフィールドの最大値（スケールなし）
  const FIXED_WINDOW = 65536; // 「64KiB固定」として一般に言及されるウィンドウサイズ
  const MAX_SCALE = 14; // RFC 1323 が定める shift count の上限

  function readNum(id, { allowZero = false } = {}) {
    const raw = ("tb" in window && tb.z2h) ? tb.z2h($(id).value) : $(id).value;
    const s = raw.trim();
    if (s === "") throw new Error("値を入力してください");
    if (!/^[0-9]*\.?[0-9]+$/.test(s)) throw new Error("半角の数値で入力してください");
    const n = parseFloat(s);
    if (!isFinite(n)) throw new Error("数値が大きすぎます");
    if (n < 0) throw new Error("0以上の数値を入力してください");
    if (!allowZero && n === 0) throw new Error("0より大きい数値を入力してください");
    return n;
  }

  function bwToBps(value, unit) {
    const mult = { Kbps: 1e3, Mbps: 1e6, Gbps: 1e9 }[unit];
    return value * mult;
  }

  function fmtBytes(bytes) {
    const kib = bytes / 1024;
    const mib = kib / 1024;
    let extra;
    if (mib >= 1) extra = tb.fmt(Math.round(mib * 1000) / 1000) + " MiB";
    else extra = tb.fmt(Math.round(kib * 1000) / 1000) + " KiB";
    return tb.fmt(Math.round(bytes)) + " バイト（" + extra + "）";
  }

  function run() {
    const errEl = $("lb-error");
    errEl.textContent = "";
    try {
      const bwVal = readNum("lb-bw");
      const bwUnit = $("lb-bw-unit").value;
      const rttMs = readNum("lb-rtt", { allowZero: true });

      const bps = bwToBps(bwVal, bwUnit);
      const rttSec = rttMs / 1000;
      const bdpBits = bps * rttSec;
      const bdpBytes = bdpBits / 8;

      $("lb-bdp").textContent = fmtBytes(bdpBytes);
      $("lb-window").textContent = fmtBytes(bdpBytes) + " 以上";

      if (bdpBytes <= BASE_WINDOW) {
        $("lb-scale").textContent = "不要（n=0、無スケールの65,535バイトで足ります）";
      } else {
        let n = 0;
        while (n <= MAX_SCALE && BASE_WINDOW * Math.pow(2, n) < bdpBytes) n++;
        if (n > MAX_SCALE) {
          $("lb-scale").textContent = "n=14（上限）でも不足。最大ウィンドウ " + tb.fmt(BASE_WINDOW * Math.pow(2, MAX_SCALE)) + " バイトではBDPを満たせません";
        } else {
          const maxWindow = BASE_WINDOW * Math.pow(2, n);
          $("lb-scale").textContent = "2^" + n + "（n=" + n + "） → 最大ウィンドウ " + tb.fmt(maxWindow) + " バイト";
        }
      }

      if (rttSec === 0) {
        $("lb-fixed").textContent = "RTTが0のため制限なし（理論上は帯域をそのまま使えます）";
      } else {
        const maxBps = (FIXED_WINDOW * 8) / rttSec;
        let str;
        if (maxBps >= 1e9) str = tb.fmt(Math.round((maxBps / 1e9) * 1000) / 1000) + " Gbps";
        else if (maxBps >= 1e6) str = tb.fmt(Math.round((maxBps / 1e6) * 1000) / 1000) + " Mbps";
        else str = tb.fmt(Math.round((maxBps / 1e3) * 1000) / 1000) + " Kbps";
        $("lb-fixed").textContent = str;
      }
    } catch (e) {
      errEl.textContent = e.message;
      $("lb-bdp").textContent = $("lb-window").textContent = $("lb-scale").textContent = $("lb-fixed").textContent = "-";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["lb-bw", "lb-bw-unit", "lb-rtt"].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", run);
    });
    run();
  });
})();
