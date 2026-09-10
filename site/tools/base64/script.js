(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toUrlSafe(b64) {
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function encodeText(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    let b64 = btoa(bin);
    if ($("b64-urlsafe").checked) b64 = toUrlSafe(b64);
    if ($("b64-wrap").checked) b64 = b64.replace(/(.{76})/g, "$1\n").replace(/\n$/, "");
    return b64;
  }

  function decodeB64(input) {
    const s = input.replace(/\s+/g, "");
    if (s === "") return "";
    if (!/^[A-Za-z0-9+/\-_=]*$/.test(s)) throw new Error("Base64として使えない文字が含まれています");
    let std = s.replace(/-/g, "+").replace(/_/g, "/");
    const eqIdx = std.indexOf("=");
    if (eqIdx !== -1 && eqIdx < std.length - 2) throw new Error("パディング（=）の位置が不正です");
    std = std.replace(/=+$/, "");
    const rem = std.length % 4;
    if (rem === 1) throw new Error("Base64の長さが不正です（4の倍数である必要があります）");
    if (rem === 2) std += "==";
    else if (rem === 3) std += "=";
    let bin;
    try {
      bin = atob(std);
    } catch (e) {
      throw new Error("デコードに失敗しました（不正なBase64文字列です）");
    }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (e) {
      throw new Error("UTF-8として解釈できないバイト列です（テキスト以外のBase64データの可能性があります）");
    }
  }

  function runFromText() {
    const err = $("b64-error");
    try {
      $("b64-b64").value = encodeText($("b64-text").value);
      err.textContent = "";
    } catch (e) {
      err.textContent = "エンコードエラー: " + e.message;
    }
  }

  function runFromB64() {
    const err = $("b64-error");
    try {
      $("b64-text").value = decodeB64($("b64-b64").value);
      err.textContent = "";
    } catch (e) {
      err.textContent = "デコードエラー: " + e.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("b64-text").addEventListener("input", runFromText);
    $("b64-b64").addEventListener("input", runFromB64);
    $("b64-urlsafe").addEventListener("change", runFromText);
    $("b64-wrap").addEventListener("change", runFromText);
    $("b64-clear").addEventListener("click", () => {
      $("b64-text").value = "";
      $("b64-b64").value = "";
      $("b64-error").textContent = "";
      $("b64-text").focus();
    });
    runFromText();
  });
})();
