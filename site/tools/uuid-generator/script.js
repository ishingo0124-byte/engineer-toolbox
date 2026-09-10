(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const JST_OFFSET_MS = 9 * 3600 * 1000;

  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtJST(ms) {
    const d = new Date(ms + JST_OFFSET_MS);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " +
      pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + "." + String(ms % 1000).padStart(3, "0") + " JST";
  }

  function bytesToGroups(bytes) {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)];
  }

  function formatUuid(bytes, upper, hyphen) {
    const g = bytesToGroups(bytes);
    let s = hyphen ? g.join("-") : g.join("");
    return upper ? s.toUpperCase() : s;
  }

  function randomBytes(n) {
    const b = new Uint8Array(n);
    crypto.getRandomValues(b);
    return b;
  }

  function generateV4() {
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 9562 (10xx)
    return bytes;
  }

  function generateV7(nowMs) {
    const bytes = new Uint8Array(16);
    let t = BigInt(Math.trunc(nowMs));
    for (let i = 5; i >= 0; i--) {
      bytes[i] = Number(t & 0xffn);
      t >>= 8n;
    }
    const rand = randomBytes(10);
    for (let i = 0; i < 10; i++) bytes[6 + i] = rand[i];
    bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 9562 (10xx)
    return bytes;
  }

  function parseCount(raw) {
    const s = tb.z2h(raw).trim();
    if (!/^\d+$/.test(s)) throw new Error("個数は1〜100の整数で入力してください");
    const n = parseInt(s, 10);
    if (n < 1 || n > 100) throw new Error("個数は1〜100の範囲で入力してください");
    return n;
  }

  function runGenerate() {
    const err = $("ug-error");
    err.textContent = "";
    let count;
    try {
      count = parseCount($("ug-count").value);
    } catch (e) {
      err.textContent = e.message;
      $("ug-output").value = "";
      return;
    }
    const version = $("ug-version").value;
    const upper = $("ug-upper").checked;
    const hyphen = !$("ug-nohyphen").checked;
    const lines = [];
    const baseMs = Date.now();
    for (let i = 0; i < count; i++) {
      const bytes = version === "v7" ? generateV7(baseMs + i) : generateV4();
      lines.push(formatUuid(bytes, upper, hyphen));
    }
    $("ug-output").value = lines.join("\n");
  }

  function variantLabel(nibbleChar) {
    const v = parseInt(nibbleChar, 16);
    if (v >= 0x0 && v <= 0x7) return "0xxx（NCS互換・予約領域）";
    if (v >= 0x8 && v <= 0xb) return "10xx（RFC 9562 / RFC 4122 標準）";
    if (v === 0xc || v === 0xd) return "110x（Microsoft COM/GUID・予約領域）";
    return "111x（将来のための予約領域）";
  }

  function runParse() {
    const err = $("ug-parse-error");
    const resultEl = $("ug-parse-result");
    err.textContent = "";
    resultEl.hidden = true;
    const raw = $("ug-parse").value.trim();
    if (raw === "") return;
    const stripped = raw.replace(/[{}]/g, "").replace(/-/g, "").toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(stripped)) {
      err.textContent = "UUIDの形式が不正です（16進数32文字、ハイフンの有無は問いません）";
      return;
    }
    const norm = stripped.slice(0, 8) + "-" + stripped.slice(8, 12) + "-" + stripped.slice(12, 16) + "-" + stripped.slice(16, 20) + "-" + stripped.slice(20, 32);
    const versionChar = stripped[12];
    const variantChar = stripped[16];
    $("ug-p-norm").textContent = norm;
    $("ug-p-version").textContent = "version " + versionChar + "（16進1桁で表現。標準は1〜8）";
    $("ug-p-variant").textContent = variantLabel(variantChar);

    if (versionChar === "7") {
      const tsHex = stripped.slice(0, 12);
      const ms = parseInt(tsHex, 16);
      $("ug-p-time").textContent = fmtJST(ms) + "（epoch ms: " + ms + "）";
    } else {
      $("ug-p-time").textContent = "(v7ではないため時刻情報は埋め込まれていません)";
    }
    resultEl.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ug-generate").addEventListener("click", runGenerate);
    $("ug-version").addEventListener("change", runGenerate);
    $("ug-count").addEventListener("input", runGenerate);
    $("ug-upper").addEventListener("change", runGenerate);
    $("ug-nohyphen").addEventListener("change", runGenerate);
    $("ug-parse").addEventListener("input", runParse);
    runGenerate();
    runParse();
  });
})();
