(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------------------------------------------------------------------
   * MD5 (RFC 1321) — 純JS自作実装。WebCrypto は MD5 を提供しないため。
   * 入力は Uint8Array（バイト列）、出力は小文字16進文字列（32桁）。
   * ------------------------------------------------------------------- */
  const MD5_K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];
  const MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  function rotl32(x, n) { return (x << n) | (x >>> (32 - n)); }

  function md5Pad(bytes) {
    const origLen = bytes.length;
    let newLen = origLen + 1;
    while (newLen % 64 !== 56) newLen++;
    const padded = new Uint8Array(newLen + 8);
    padded.set(bytes, 0);
    padded[origLen] = 0x80;
    const bitLen = BigInt(origLen) * 8n;
    const view = new DataView(padded.buffer);
    view.setUint32(newLen, Number(bitLen & 0xffffffffn), true);
    view.setUint32(newLen + 4, Number((bitLen >> 32n) & 0xffffffffn), true);
    return padded;
  }

  function md5(bytes) {
    const msg = md5Pad(bytes);
    const view = new DataView(msg.buffer);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const chunks = msg.length / 64;
    const M = new Uint32Array(16);
    for (let c = 0; c < chunks; c++) {
      for (let j = 0; j < 16; j++) M[j] = view.getUint32(c * 64 + j * 4, true);
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + MD5_K[i] + M[g]) | 0;
        A = D; D = C; C = B;
        B = (B + rotl32(F, MD5_S[i])) | 0;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
  }

  function toHexLE(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n >>> 0, true);
    let s = "";
    for (let i = 0; i < 4; i++) s += b[i].toString(16).padStart(2, "0");
    return s;
  }

  /* ---------------------------------------------------------------------
   * SHA-1 / SHA-256 / SHA-512 は WebCrypto (crypto.subtle.digest) を使用。
   * ------------------------------------------------------------------- */
  function bufToHex(buffer) {
    const b = new Uint8Array(buffer);
    let s = "";
    for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
    return s;
  }
  async function subtleHex(algo, buffer) {
    const d = await crypto.subtle.digest(algo, buffer);
    return bufToHex(d);
  }

  function applyCase(hex) { return $("hg-upper").checked ? hex.toUpperCase() : hex; }

  let textToken = 0;
  let textHashes = null;
  let fileHashes = null;

  async function computeText() {
    const token = ++textToken;
    const err = $("hg-error");
    err.textContent = "";
    const text = $("hg-text").value;
    const bytes = new TextEncoder().encode(text);
    try {
      const md5hex = md5(bytes);
      const [sha1, sha256, sha512] = await Promise.all([
        subtleHex("SHA-1", bytes.buffer),
        subtleHex("SHA-256", bytes.buffer),
        subtleHex("SHA-512", bytes.buffer)
      ]);
      if (token !== textToken) return; // 入力中に古い計算結果が返ってきた場合は破棄
      textHashes = { md5: md5hex, sha1: sha1, sha256: sha256, sha512: sha512 };
      renderText();
    } catch (e) {
      if (token !== textToken) return;
      err.textContent = "計算エラー: " + e.message + "（crypto.subtle は https もしくは localhost が必要です）";
    }
  }

  function renderText() {
    if (!textHashes) return;
    $("hg-md5").textContent = applyCase(textHashes.md5);
    $("hg-sha1").textContent = applyCase(textHashes.sha1);
    $("hg-sha256").textContent = applyCase(textHashes.sha256);
    $("hg-sha512").textContent = applyCase(textHashes.sha512);
  }

  async function computeFile(file) {
    $("hg-file-result").hidden = false;
    $("hg-filename").textContent = file.name + "（" + tb.fmt(file.size) + " バイト）";
    $("hg-fileprogress").textContent = "計算中…";
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const md5hex = md5(bytes);
    const [sha1, sha256, sha512] = await Promise.all([
      subtleHex("SHA-1", buf),
      subtleHex("SHA-256", buf),
      subtleHex("SHA-512", buf)
    ]);
    fileHashes = { md5: md5hex, sha1: sha1, sha256: sha256, sha512: sha512 };
    renderFile();
    $("hg-fileprogress").textContent = "計算完了（このファイルはサーバーに送信していません）";
  }

  function renderFile() {
    if (!fileHashes) return;
    $("hg-fmd5").textContent = applyCase(fileHashes.md5);
    $("hg-fsha1").textContent = applyCase(fileHashes.sha1);
    $("hg-fsha256").textContent = applyCase(fileHashes.sha256);
    $("hg-fsha512").textContent = applyCase(fileHashes.sha512);
  }

  function selfTest() {
    // 実装の正しさを既知のテストベクタで自己検証する（開発時の確認用。失敗時はconsoleに出すのみ）。
    try {
      const emptyMd5 = md5(new Uint8Array(0));
      if (emptyMd5 !== "d41d8cd98f00b204e9800998ecf8427e") {
        console.error("[hash-generator] MD5('') 自己検証に失敗:", emptyMd5);
      }
      const abcMd5 = md5(new TextEncoder().encode("abc"));
      if (abcMd5 !== "900150983cd24fb0d6963f7d28e17f72") {
        console.error("[hash-generator] MD5('abc') 自己検証に失敗:", abcMd5);
      }
      if (window.crypto && crypto.subtle) {
        subtleHex("SHA-256", new TextEncoder().encode("abc").buffer).then((h) => {
          if (h !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") {
            console.error("[hash-generator] SHA-256('abc') 自己検証に失敗:", h);
          }
        }).catch(() => { /* ignore */ });
      }
    } catch (e) { /* 自己検証自体の失敗は無視（本体の動作には影響しない） */ }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("hg-text").addEventListener("input", computeText);
    $("hg-upper").addEventListener("change", () => { renderText(); renderFile(); });
    $("hg-file").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      computeFile(f).catch((err) => { $("hg-fileprogress").textContent = "エラー: " + err.message; });
    });
    computeText();
    selfTest();
  });
})();
