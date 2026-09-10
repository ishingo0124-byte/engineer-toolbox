(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ============================================================
   * QRコード エンコーダ（ISO/IEC 18004 準拠、外部ライブラリ不使用）
   * 対応範囲: バージョン1〜10、誤り訂正レベル L/M/Q/H、
   *           数字モード・バイトモード（UTF-8）、マスクパターン0〜7から最適選択。
   * ============================================================ */

  // ---- GF(256): 原始多項式 x^8+x^4+x^3+x^2+1 (0x11D) ----
  const GF_EXP = new Array(512);
  const GF_LOG = new Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();
  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }
  function polyMulGF(a, b) {
    const result = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) result[i + j] ^= gfMul(a[i], b[j]);
    return result;
  }
  function rsGeneratorPoly(n) {
    let g = [1];
    for (let i = 0; i < n; i++) g = polyMulGF(g, [1, GF_EXP[i]]);
    return g;
  }
  // Reed-Solomon誤り訂正符号を計算（多項式のGF(256)上でのユークリッド除算）
  function rsEncode(dataCodewords, eccCount) {
    const gen = rsGeneratorPoly(eccCount);
    const msg = dataCodewords.concat(new Array(eccCount).fill(0));
    for (let i = 0; i < dataCodewords.length; i++) {
      const coef = msg[i];
      if (coef !== 0) for (let j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(gen[j], coef);
    }
    return msg.slice(dataCodewords.length);
  }

  // ---- バージョン1〜10の容量・ブロック構成テーブル ----
  const CAP = {
    1: { L: { data: 19, ecc: 7, blocks: [[1, 19]] }, M: { data: 16, ecc: 10, blocks: [[1, 16]] }, Q: { data: 13, ecc: 13, blocks: [[1, 13]] }, H: { data: 9, ecc: 17, blocks: [[1, 9]] } },
    2: { L: { data: 34, ecc: 10, blocks: [[1, 34]] }, M: { data: 28, ecc: 16, blocks: [[1, 28]] }, Q: { data: 22, ecc: 22, blocks: [[1, 22]] }, H: { data: 16, ecc: 28, blocks: [[1, 16]] } },
    3: { L: { data: 55, ecc: 15, blocks: [[1, 55]] }, M: { data: 44, ecc: 26, blocks: [[1, 44]] }, Q: { data: 34, ecc: 18, blocks: [[2, 17]] }, H: { data: 26, ecc: 22, blocks: [[2, 13]] } },
    4: { L: { data: 80, ecc: 20, blocks: [[1, 80]] }, M: { data: 64, ecc: 18, blocks: [[2, 32]] }, Q: { data: 48, ecc: 26, blocks: [[2, 24]] }, H: { data: 36, ecc: 16, blocks: [[4, 9]] } },
    5: { L: { data: 108, ecc: 26, blocks: [[1, 108]] }, M: { data: 86, ecc: 24, blocks: [[2, 43]] }, Q: { data: 62, ecc: 18, blocks: [[2, 15], [2, 16]] }, H: { data: 46, ecc: 22, blocks: [[2, 11], [2, 12]] } },
    6: { L: { data: 136, ecc: 18, blocks: [[2, 68]] }, M: { data: 108, ecc: 16, blocks: [[4, 27]] }, Q: { data: 76, ecc: 24, blocks: [[4, 19]] }, H: { data: 60, ecc: 28, blocks: [[4, 15]] } },
    7: { L: { data: 156, ecc: 20, blocks: [[2, 78]] }, M: { data: 124, ecc: 18, blocks: [[4, 31]] }, Q: { data: 88, ecc: 18, blocks: [[2, 14], [4, 15]] }, H: { data: 66, ecc: 26, blocks: [[4, 13], [1, 14]] } },
    8: { L: { data: 194, ecc: 24, blocks: [[2, 97]] }, M: { data: 154, ecc: 22, blocks: [[2, 38], [2, 39]] }, Q: { data: 110, ecc: 22, blocks: [[4, 18], [2, 19]] }, H: { data: 86, ecc: 26, blocks: [[4, 14], [2, 15]] } },
    9: { L: { data: 232, ecc: 30, blocks: [[2, 116]] }, M: { data: 182, ecc: 22, blocks: [[3, 36], [2, 37]] }, Q: { data: 132, ecc: 20, blocks: [[4, 16], [4, 17]] }, H: { data: 100, ecc: 24, blocks: [[4, 12], [4, 13]] } },
    10: { L: { data: 274, ecc: 18, blocks: [[2, 68], [2, 69]] }, M: { data: 216, ecc: 26, blocks: [[4, 43], [1, 44]] }, Q: { data: 154, ecc: 24, blocks: [[6, 19], [2, 20]] }, H: { data: 122, ecc: 28, blocks: [[6, 15], [2, 16]] } }
  };
  const REMAINDER_BITS = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0 };
  const ALIGN_POSITIONS = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  const EC_LEVEL_BITS = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

  function BitBuffer() { this.bits = []; }
  BitBuffer.prototype.put = function (val, len) { for (let i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1); };

  function countBitsLen(mode, version) {
    if (mode === "numeric") return version <= 9 ? 10 : 12;
    return version <= 9 ? 8 : 16; // byte mode
  }
  function utf8Bytes(str) { return Array.from(new TextEncoder().encode(str)); }
  function detectMode(text) { return /^[0-9]+$/.test(text) ? "numeric" : "byte"; }
  function dataBitLength(mode, text) {
    if (mode === "numeric") {
      const n = text.length, groups = Math.floor(n / 3), rem = n % 3;
      return groups * 10 + (rem === 2 ? 7 : rem === 1 ? 4 : 0);
    }
    return utf8Bytes(text).length * 8;
  }
  function chooseVersion(text, level, maxVersion) {
    const mode = detectMode(text);
    for (let v = 1; v <= maxVersion; v++) {
      const capBits = CAP[v][level].data * 8;
      const req = 4 + countBitsLen(mode, v) + dataBitLength(mode, text);
      if (req <= capBits) return { version: v, mode };
    }
    return null;
  }
  function buildDataBits(text, mode, version) {
    const bb = new BitBuffer();
    if (mode === "numeric") {
      bb.put(0b0001, 4);
      bb.put(text.length, countBitsLen("numeric", version));
      let i = 0;
      while (i < text.length) {
        const rem = text.length - i;
        if (rem >= 3) { bb.put(parseInt(text.substr(i, 3), 10), 10); i += 3; }
        else if (rem === 2) { bb.put(parseInt(text.substr(i, 2), 10), 7); i += 2; }
        else { bb.put(parseInt(text.substr(i, 1), 10), 4); i += 1; }
      }
    } else {
      const bytes = utf8Bytes(text);
      bb.put(0b0100, 4);
      bb.put(bytes.length, countBitsLen("byte", version));
      for (const b of bytes) bb.put(b, 8);
    }
    return bb.bits;
  }
  function finalizeCodewords(bits, version, level) {
    const capBits = CAP[version][level].data * 8;
    const bb = bits.slice();
    const termLen = Math.min(4, capBits - bb.length);
    for (let i = 0; i < termLen; i++) bb.push(0);
    while (bb.length % 8 !== 0) bb.push(0);
    const codewords = [];
    for (let i = 0; i < bb.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bb[i + j];
      codewords.push(byte);
    }
    const padBytes = [0xec, 0x11];
    let pi = 0;
    while (codewords.length < CAP[version][level].data) { codewords.push(padBytes[pi % 2]); pi++; }
    return codewords;
  }
  function interleave(dataCodewords, version, level) {
    const cap = CAP[version][level];
    const blocks = [];
    let idx = 0;
    for (const [cnt, size] of cap.blocks) {
      for (let i = 0; i < cnt; i++) {
        const data = dataCodewords.slice(idx, idx + size);
        idx += size;
        blocks.push({ data, ecc: rsEncode(data, cap.ecc) });
      }
    }
    const maxDataLen = Math.max.apply(null, blocks.map((b) => b.data.length));
    const out = [];
    for (let i = 0; i < maxDataLen; i++) for (const b of blocks) if (i < b.data.length) out.push(b.data[i]);
    for (let i = 0; i < cap.ecc; i++) for (const b of blocks) out.push(b.ecc[i]);
    return out;
  }
  function codewordsToBits(codewords, version) {
    const bits = [];
    for (const c of codewords) for (let i = 7; i >= 0; i--) bits.push((c >>> i) & 1);
    for (let i = 0; i < REMAINDER_BITS[version]; i++) bits.push(0);
    return bits;
  }

  // ---- フォーマット情報・バージョン情報（BCH符号） ----
  function computeFormatBits(levelBits, maskPattern) {
    const data = (levelBits << 3) | maskPattern;
    let d = data << 10;
    const gen = 0b10100110111; // 生成多項式 (次数10)
    for (let i = 14; i >= 10; i--) if ((d >> i) & 1) d ^= gen << (i - 10);
    const withEcc = (data << 10) | d;
    return withEcc ^ 0b101010000010010; // マスク定数
  }
  function computeVersionBits(version) {
    let d = version << 12;
    const gen = 0b1111100100101; // 生成多項式 (次数12)
    for (let i = 17; i >= 12; i--) if ((d >> i) & 1) d ^= gen << (i - 12);
    return (version << 12) | d;
  }

  // ---- マスクパターン ----
  const MASK_FUNCS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ];

  const FINDER = [
    [1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 1], [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1]
  ];

  function buildMatrix(version, level, dataCodewordsInterleaved) {
    const size = 17 + 4 * version;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(0));
    const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));

    function drawFinderWithSeparator(top, left) {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = top + dr, c = left + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const val = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) ? FINDER[dr][dc] : 0;
          matrix[r][c] = val; isFunc[r][c] = true;
        }
      }
    }
    drawFinderWithSeparator(0, 0);
    drawFinderWithSeparator(0, size - 7);
    drawFinderWithSeparator(size - 7, 0);

    for (let i = 8; i <= size - 9; i++) {
      matrix[6][i] = i % 2 === 0 ? 1 : 0; isFunc[6][i] = true;
      matrix[i][6] = i % 2 === 0 ? 1 : 0; isFunc[i][6] = true;
    }

    const pos = ALIGN_POSITIONS[version];
    if (pos.length > 0) {
      const n = pos.length;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
          const cr = pos[i], cc = pos[j];
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const r = cr + dr, c = cc + dc;
              const dist = Math.max(Math.abs(dr), Math.abs(dc));
              matrix[r][c] = dist !== 1 ? 1 : 0; isFunc[r][c] = true;
            }
          }
        }
      }
    }

    matrix[size - 8][8] = 1; isFunc[size - 8][8] = true; // ダークモジュール

    for (let i = 0; i <= 8; i++) { isFunc[8][i] = true; isFunc[i][8] = true; }
    for (let i = 0; i < 8; i++) { isFunc[8][size - 1 - i] = true; isFunc[size - 1 - i][8] = true; }
    if (version >= 7) {
      for (let r = size - 11; r <= size - 9; r++) for (let c = 0; c <= 5; c++) isFunc[r][c] = true;
      for (let c = size - 11; c <= size - 9; c++) for (let r = 0; r <= 5; r++) isFunc[r][c] = true;
    }

    const bits = codewordsToBits(dataCodewordsInterleaved, version);

    function placeWithMask(maskPattern) {
      const m = matrix.map((row) => row.slice());
      let bitIndex = 0, dir = -1, col = size - 1;
      while (col > 0) {
        if (col === 6) col--;
        for (let count = 0; count < size; count++) {
          const row = dir === -1 ? size - 1 - count : count;
          for (let c = 0; c < 2; c++) {
            const x = col - c;
            if (!isFunc[row][x]) {
              const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
              bitIndex++;
              const flip = MASK_FUNCS[maskPattern](row, x) ? 1 : 0;
              m[row][x] = bit ^ flip;
            }
          }
        }
        dir = -dir; col -= 2;
      }
      return m;
    }

    function penalty(m) {
      let total = 0;
      for (let r = 0; r < size; r++) {
        let runColor = m[r][0], runLen = 1;
        for (let c = 1; c < size; c++) {
          if (m[r][c] === runColor) runLen++;
          else { if (runLen >= 5) total += 3 + (runLen - 5); runColor = m[r][c]; runLen = 1; }
        }
        if (runLen >= 5) total += 3 + (runLen - 5);
      }
      for (let c = 0; c < size; c++) {
        let runColor = m[0][c], runLen = 1;
        for (let r = 1; r < size; r++) {
          if (m[r][c] === runColor) runLen++;
          else { if (runLen >= 5) total += 3 + (runLen - 5); runColor = m[r][c]; runLen = 1; }
        }
        if (runLen >= 5) total += 3 + (runLen - 5);
      }
      for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
          const v = m[r][c];
          if (m[r][c + 1] === v && m[r + 1][c] === v && m[r + 1][c + 1] === v) total += 3;
        }
      }
      const patternA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
      const patternB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      function matchAt(arr, idx, pat) { for (let i = 0; i < pat.length; i++) if (arr[idx + i] !== pat[i]) return false; return true; }
      for (let r = 0; r < size; r++) {
        const row = m[r];
        for (let c = 0; c <= size - 11; c++) if (matchAt(row, c, patternA) || matchAt(row, c, patternB)) total += 40;
      }
      for (let c = 0; c < size; c++) {
        const colArr = m.map((row) => row[c]);
        for (let r = 0; r <= size - 11; r++) if (matchAt(colArr, r, patternA) || matchAt(colArr, r, patternB)) total += 40;
      }
      let dark = 0;
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
      const percent = (dark * 100) / (size * size);
      const prevMultiple = Math.floor(percent / 5) * 5;
      const d1 = Math.abs(prevMultiple - 50) / 5, d2 = Math.abs(prevMultiple + 5 - 50) / 5;
      total += Math.min(d1, d2) * 10;
      return total;
    }

    let chosenMask = 0, chosenMatrix = null, bestScore = Infinity;
    for (let mp = 0; mp < 8; mp++) {
      const mm = placeWithMask(mp);
      const score = penalty(mm);
      if (score < bestScore) { bestScore = score; chosenMask = mp; chosenMatrix = mm; }
    }

    const levelBits = EC_LEVEL_BITS[level];
    const fmt = computeFormatBits(levelBits, chosenMask);
    const fmtBitAt = (i) => (fmt >> (14 - i)) & 1;
    for (let i = 0; i <= 5; i++) chosenMatrix[i][8] = fmtBitAt(i);
    chosenMatrix[7][8] = fmtBitAt(6);
    chosenMatrix[8][8] = fmtBitAt(7);
    chosenMatrix[8][7] = fmtBitAt(8);
    for (let i = 9; i <= 14; i++) chosenMatrix[8][14 - i] = fmtBitAt(i);
    for (let i = 0; i <= 7; i++) chosenMatrix[8][size - 1 - i] = fmtBitAt(i);
    for (let i = 8; i <= 14; i++) chosenMatrix[size - 15 + i][8] = fmtBitAt(i);

    if (version >= 7) {
      const verBits = computeVersionBits(version);
      const verBitAt = (i) => (verBits >> i) & 1;
      for (let i = 0; i < 18; i++) {
        const row1 = size - 11 + (i % 3), col1 = Math.floor(i / 3);
        chosenMatrix[row1][col1] = verBitAt(i);
        const row2 = Math.floor(i / 3), col2 = size - 11 + (i % 3);
        chosenMatrix[row2][col2] = verBitAt(i);
      }
    }
    return { matrix: chosenMatrix, size, mask: chosenMask };
  }

  function encodeQR(text, level) {
    const chosen = chooseVersion(text, level, 10);
    if (!chosen) return null;
    const dataBits = buildDataBits(text, chosen.mode, chosen.version);
    const codewords = finalizeCodewords(dataBits, chosen.version, level);
    const interleaved = interleave(codewords, chosen.version, level);
    const built = buildMatrix(chosen.version, level, interleaved);
    return { version: chosen.version, mode: chosen.mode, level, mask: built.mask, matrix: built.matrix, size: built.size };
  }

  /* ============================================================
   * 描画（Canvas / SVG）
   * ============================================================ */
  function renderCanvas(canvas, res, cell, margin) {
    const total = res.size + margin * 2;
    canvas.width = total * cell;
    canvas.height = total * cell;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < res.size; r++) {
      for (let c = 0; c < res.size; c++) {
        if (res.matrix[r][c]) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
  }

  function buildSvg(res, cell, margin) {
    const total = res.size + margin * 2;
    const px = total * cell;
    let path = "";
    for (let r = 0; r < res.size; r++) {
      for (let c = 0; c < res.size; c++) {
        if (res.matrix[r][c]) {
          const x = (c + margin) * cell, y = (r + margin) * cell;
          path += "M" + x + "," + y + "h" + cell + "v" + cell + "h" + -cell + "z";
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + px + " " + px + '" width="' + px + '" height="' + px + '">' +
      '<rect width="' + px + '" height="' + px + '" fill="#ffffff"/>' +
      '<path d="' + path + '" fill="#000000"/></svg>';
  }

  /* ============================================================
   * Wi-Fi 接続文字列
   * ============================================================ */
  function escWifi(s) {
    return String(s).replace(/([\\;,:"])/g, "\\$1");
  }
  function buildWifiString(ssid, pass, type, hidden) {
    let s = "WIFI:T:" + (type === "nopass" ? "nopass" : type) + ";S:" + escWifi(ssid) + ";";
    if (type !== "nopass") s += "P:" + escWifi(pass) + ";";
    if (hidden) s += "H:true;";
    s += ";";
    return s;
  }

  /* ============================================================
   * UI
   * ============================================================ */
  function updateModePanels() {
    const mode = $("qr-mode").value;
    $("qr-panel-text").classList.toggle("active", mode === "text");
    $("qr-panel-wifi").classList.toggle("active", mode === "wifi");
  }

  function currentPayload() {
    const mode = $("qr-mode").value;
    if (mode === "wifi") {
      const ssid = $("qr-wifi-ssid").value;
      const pass = $("qr-wifi-pass").value;
      const type = $("qr-wifi-type").value;
      const hidden = $("qr-wifi-hidden").checked;
      const s = buildWifiString(ssid, pass, type, hidden);
      $("qr-wifi-preview").textContent = ssid ? s : "-";
      return ssid.trim() === "" ? "" : s;
    }
    return $("qr-text").value;
  }

  function run() {
    const err = $("qr-error");
    err.textContent = "";
    const text = currentPayload();
    const level = $("qr-eclevel").value;
    const cell = parseInt($("qr-cellsize").value, 10);
    const margin = parseInt($("qr-margin").value, 10);
    $("qr-cellsize-val").textContent = String(cell);
    $("qr-margin-val").textContent = String(margin);

    if (!text || text.trim() === "") {
      err.textContent = "内容を入力してください。";
      $("qr-info").textContent = "";
      $("qr-svg-preview").innerHTML = "";
      $("qr-svg-code").value = "";
      const c = $("qr-canvas"); c.width = 1; c.height = 1;
      $("qr-download").style.pointerEvents = "none";
      return;
    }

    const res = encodeQR(text, level);
    if (!res) {
      err.textContent = "データが大きすぎます（バージョン10・57×57モジュールの上限を超えました）。文字数を減らすか、誤り訂正レベルをLに下げてください。";
      $("qr-info").textContent = "";
      $("qr-svg-preview").innerHTML = "";
      $("qr-svg-code").value = "";
      const c = $("qr-canvas"); c.width = 1; c.height = 1;
      $("qr-download").style.pointerEvents = "none";
      return;
    }

    renderCanvas($("qr-canvas"), res, cell, margin);
    const svg = buildSvg(res, cell, margin);
    $("qr-svg-preview").innerHTML = svg;
    $("qr-svg-code").value = svg;

    const bytes = new TextEncoder().encode(text).length;
    $("qr-info").textContent =
      "バージョン " + res.version + "（" + res.size + "×" + res.size + "モジュール）、" +
      "モード: " + (res.mode === "numeric" ? "数字" : "バイト(UTF-8, " + bytes + "バイト)") +
      "、誤り訂正: " + level + "、マスクパターン: " + res.mask;

    try {
      const url = $("qr-canvas").toDataURL("image/png");
      $("qr-download").href = url;
      $("qr-download").style.pointerEvents = "auto";
    } catch (e) { /* ignore */ }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const debouncedRun = window.tb && window.tb.debounce ? window.tb.debounce(run, 150) : run;
    $("qr-mode").addEventListener("change", () => { updateModePanels(); run(); });
    $("qr-text").addEventListener("input", debouncedRun);
    ["qr-wifi-ssid", "qr-wifi-pass"].forEach((id) => $(id).addEventListener("input", debouncedRun));
    ["qr-wifi-type", "qr-wifi-hidden", "qr-eclevel"].forEach((id) => $(id).addEventListener("change", run));
    ["qr-cellsize", "qr-margin"].forEach((id) => $(id).addEventListener("input", run));
    updateModePanels();
    run();
  });
})();
