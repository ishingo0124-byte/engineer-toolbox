(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const JST_OFFSET_MS = 9 * 3600 * 1000;

  function pad(n) { return String(n).padStart(2, "0"); }

  function fmtUTC(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " +
      pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " UTC";
  }
  function fmtJST(ms) {
    const d = new Date(ms + JST_OFFSET_MS);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " +
      pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " JST";
  }
  function fmtISO(ms) {
    return new Date(ms).toISOString();
  }

  function nowTick() {
    const nowMs = Date.now();
    $("ut-now-sec").textContent = String(Math.floor(nowMs / 1000));
    $("ut-now-ms").textContent = String(nowMs);
  }

  function parseEpochInput(raw) {
    const s = tb.z2h(raw).trim();
    if (s === "") throw new Error("値を入力してください");
    if (!/^-?\d+$/.test(s)) throw new Error("整数で入力してください（小数・数字以外の文字は使えません）");
    return BigInt(s);
  }

  function runEpoch() {
    const errEl = $("ut-epoch-error");
    const detectEl = $("ut-detect");
    errEl.textContent = "";
    detectEl.textContent = "";
    let n;
    try {
      n = parseEpochInput($("ut-epoch").value);
    } catch (e) {
      errEl.textContent = e.message;
      $("ut-jst").textContent = $("ut-utc").textContent = $("ut-iso").textContent = "";
      return;
    }
    const unit = $("ut-unit").value;
    const digits = (n < 0n ? -n : n).toString().length;
    let isMs;
    if (unit === "sec") isMs = false;
    else if (unit === "ms") isMs = true;
    else isMs = digits >= 12; // 自動判定: 10桁前後=秒、13桁前後=ミリ秒 とみなす

    let detectMsg = "桁数: " + digits + "桁 → " + (isMs ? "ミリ秒" : "秒") + "として判定しました";
    if (unit === "auto") detectMsg += "（自動判定。10桁=秒、13桁=ミリ秒が典型例。単位セレクタで手動指定も可能）";
    else detectMsg += "（手動指定）";

    const ms = isMs ? n : n * 1000n;
    const msNum = Number(ms);
    if (!Number.isFinite(msNum) || Math.abs(msNum) > 8640000000000000) {
      errEl.textContent = "日時としての範囲外です（JavaScriptのDateで扱える範囲 ±100,000,000日 を超えています）";
      $("ut-jst").textContent = $("ut-utc").textContent = $("ut-iso").textContent = "";
      detectEl.textContent = detectMsg;
      return;
    }
    $("ut-jst").textContent = fmtJST(msNum);
    $("ut-utc").textContent = fmtUTC(msNum);
    $("ut-iso").textContent = fmtISO(msNum);

    const sec = isMs ? n / 1000n : n;
    if (sec > 2147483647n || sec < -2147483648n) {
      detectMsg += "／⚠ 32bit符号付き整数の範囲（-2147483648〜2147483647）を超えています（2038年問題の影響を受ける環境に注意）。";
    }
    detectEl.textContent = detectMsg;
  }

  function runDatetime() {
    const errEl = $("ut-datetime-error");
    errEl.textContent = "";
    const v = $("ut-datetime").value;
    if (!v) {
      $("ut-back-sec").textContent = "0";
      $("ut-back-ms").textContent = "0";
      return;
    }
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) {
      errEl.textContent = "日時の形式が正しくありません";
      return;
    }
    const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], s = m[6] ? +m[6] : 0;
    const utcMs = Date.UTC(y, mo - 1, d, h, mi, s) - JST_OFFSET_MS;
    if (!Number.isFinite(utcMs)) {
      errEl.textContent = "日時が不正です";
      return;
    }
    $("ut-back-sec").textContent = tb.fmt(Math.floor(utcMs / 1000));
    $("ut-back-ms").textContent = tb.fmt(utcMs);
  }

  document.addEventListener("DOMContentLoaded", () => {
    nowTick();
    setInterval(nowTick, 1000);
    $("ut-epoch").addEventListener("input", runEpoch);
    $("ut-unit").addEventListener("change", runEpoch);
    $("ut-datetime").addEventListener("input", runDatetime);
    runEpoch();
    runDatetime();
  });
})();
