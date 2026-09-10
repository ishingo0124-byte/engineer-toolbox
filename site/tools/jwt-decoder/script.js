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

  // Base64URL（RFC 4648 §5）をUTF-8文字列としてデコードする（自作。atob+TextDecoder）
  function base64UrlDecodeToText(seg, label) {
    if (seg === "") throw new Error(label + "が空です");
    if (!/^[A-Za-z0-9\-_]+$/.test(seg)) {
      throw new Error(label + "にBase64URLとして使えない文字が含まれています");
    }
    let std = seg.replace(/-/g, "+").replace(/_/g, "/");
    const rem = std.length % 4;
    if (rem === 1) throw new Error(label + "の長さが不正です");
    if (rem === 2) std += "==";
    else if (rem === 3) std += "=";
    let bin;
    try {
      bin = atob(std);
    } catch (e) {
      throw new Error(label + "のBase64デコードに失敗しました");
    }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (e) {
      throw new Error(label + "がUTF-8として解釈できません");
    }
  }

  function formatDuration(sec) {
    sec = Math.round(sec);
    const abs = Math.abs(sec);
    const days = Math.floor(abs / 86400);
    const hours = Math.floor((abs % 86400) / 3600);
    const mins = Math.floor((abs % 3600) / 60);
    const secs = abs % 60;
    const parts = [];
    if (days > 0) parts.push(days + "日");
    if (days > 0 || hours > 0) parts.push(hours + "時間");
    if (days === 0 && (hours > 0 || mins > 0)) parts.push(mins + "分");
    if (days === 0 && hours === 0) parts.push(secs + "秒");
    return parts.join("");
  }

  function claimTimeInfo(claimSec, nowMs, futureLabel, pastLabel) {
    if (typeof claimSec !== "number" || !isFinite(claimSec)) return null;
    const ms = claimSec * 1000;
    const diffSec = (ms - nowMs) / 1000;
    const dateStr = fmtJST(ms) + " / " + fmtUTC(ms);
    let statusStr;
    if (diffSec >= 0) statusStr = futureLabel + "（あと" + formatDuration(diffSec) + "）";
    else statusStr = pastLabel + "（" + formatDuration(diffSec) + "前）";
    return { dateStr, statusStr, expired: diffSec < 0 };
  }

  function run() {
    const errEl = $("jd-error");
    const resultEl = $("jd-result");
    const statusEl = $("jd-status");
    const warnEl = $("jd-alg-warn");
    errEl.textContent = "";
    resultEl.hidden = true;
    statusEl.hidden = true;
    warnEl.hidden = true;
    $("jd-header").value = "";
    $("jd-payload").value = "";

    const raw = $("jd-token").value.trim();
    if (raw === "") return;

    const parts = raw.split(".");
    if (parts.length !== 3) {
      errEl.textContent = "JWTの形式が不正です（ヘッダー.ペイロード.署名 の3つのドット区切りが必要です。現在 " + parts.length + " 個の部分があります）";
      return;
    }

    let headerText, payloadText;
    try {
      headerText = base64UrlDecodeToText(parts[0], "ヘッダー");
      payloadText = base64UrlDecodeToText(parts[1], "ペイロード");
      if (parts[2] === "") {
        // 署名なし（alg=none 等）でも表示自体は続行するが、後段で警告する
      }
    } catch (e) {
      errEl.textContent = e.message;
      return;
    }

    let header, payload;
    try {
      header = JSON.parse(headerText);
    } catch (e) {
      errEl.textContent = "ヘッダーが正しいJSONではありません: " + e.message;
      return;
    }
    try {
      payload = JSON.parse(payloadText);
    } catch (e) {
      errEl.textContent = "ペイロードが正しいJSONではありません: " + e.message;
      return;
    }

    $("jd-header").value = JSON.stringify(header, null, 2);
    $("jd-payload").value = JSON.stringify(payload, null, 2);

    const alg = (header && typeof header.alg === "string") ? header.alg : "(不明)";
    $("jd-alg").textContent = alg;
    $("jd-typ").textContent = (header && header.typ) ? String(header.typ) : "(なし)";

    if (typeof alg === "string" && alg.toLowerCase() === "none") {
      warnEl.hidden = false;
      warnEl.textContent = "警告: alg が \"none\" です。署名なしトークンとして扱われるアルゴリズムで、サーバー側の検証実装に不備があるとペイロードを自由に書き換えたトークンがそのまま受理されてしまう既知の脆弱性（CVE-2015-9235 等で知られる \"alg: none\" 攻撃）があります。受信側では alg を許可リストで固定し、none を拒否する実装が必要です。";
    }

    const nowMs = Date.now();
    const expInfo = claimTimeInfo(payload && payload.exp, nowMs, "有効", "期限切れ");
    const nbfInfo = claimTimeInfo(payload && payload.nbf, nowMs, "有効開始前", "有効開始済み");
    const iatInfo = claimTimeInfo(payload && payload.iat, nowMs, "未来の発行日時", "発行済み");

    $("jd-exp").textContent = expInfo ? expInfo.dateStr + " — " + expInfo.statusStr : "(exp クレームなし)";
    $("jd-nbf").textContent = nbfInfo ? nbfInfo.dateStr + " — " + nbfInfo.statusStr : "(nbf クレームなし)";
    $("jd-iat").textContent = iatInfo ? iatInfo.dateStr : "(iat クレームなし)";

    resultEl.hidden = false;

    if (expInfo) {
      statusEl.hidden = false;
      if (expInfo.expired) {
        statusEl.textContent = "期限切れです（exp を " + formatDuration(Math.abs((payload.exp * 1000 - nowMs) / 1000)) + "過ぎています）";
        statusEl.style.color = "var(--err)";
      } else {
        statusEl.textContent = "有効期限内です（あと " + formatDuration((payload.exp * 1000 - nowMs) / 1000) + "）";
        statusEl.style.color = "var(--ok)";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("jd-token").addEventListener("input", run);
    $("jd-clear").addEventListener("click", () => {
      $("jd-token").value = "";
      run();
    });
    run();
  });
})();
