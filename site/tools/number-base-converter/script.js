(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const DIGITS = { 2: "01", 8: "01234567", 10: "0123456789", 16: "0123456789abcdef" };

  function parseMagnitude(digits, base) {
    if (digits === "") throw new Error("数字がありません");
    const valid = new RegExp("^[" + DIGITS[base] + "]+$", "i");
    if (!valid.test(digits)) throw new Error((base === 10 ? "10" : base) + "進数として使えない文字が含まれています: " + digits);
    const prefix = base === 16 ? "0x" : base === 8 ? "0o" : base === 2 ? "0b" : "";
    return BigInt(prefix + digits.toLowerCase());
  }

  // text: 生の入力。defaultBase: 接頭辞が無いときに使う基数。
  // width: bigint互換のビット幅数値。signedMode: 接頭辞・符号無しの生入力を2の補数として解釈するか
  function parseValue(text, defaultBase, width, signedMode) {
    let s = tb.z2h(text).trim();
    if (s === "") throw new Error("値を入力してください");
    let neg = false;
    if (s[0] === "-" || s[0] === "+") { neg = s[0] === "-"; s = s.slice(1).trim(); }
    if (s === "") throw new Error("数字がありません");
    let base = defaultBase;
    let explicitPrefix = false;
    const m = s.match(/^0([xXbBoO])(.+)$/);
    if (m) {
      const t = m[1].toLowerCase();
      base = t === "x" ? 16 : t === "b" ? 2 : 8;
      s = m[2];
      explicitPrefix = true;
    }
    const magnitude = parseMagnitude(s, base);
    let value;
    if (neg) {
      value = -magnitude;
    } else if (signedMode && base !== 10 && !explicitPrefix) {
      // 符号なし・接頭辞なしの生入力 → 選択したビット幅内なら2の補数として解釈
      const w = BigInt(width);
      const limit = 1n << w;
      if (magnitude < limit) {
        const half = 1n << (w - 1n);
        value = magnitude >= half ? magnitude - limit : magnitude;
      } else {
        value = magnitude;
      }
    } else {
      value = magnitude;
    }
    return value;
  }

  function fitsForDisplay(value, width) {
    const w = BigInt(width);
    if (value >= 0n) return value < (1n << w);
    return value >= -(1n << (w - 1n));
  }

  function toBitsAtWidth(value, width) {
    const mask = (1n << BigInt(width)) - 1n;
    return value & mask; // BigIntのビット演算は無限精度の2の補数として定義されるため常に非負になる
  }

  function groupHex(s) {
    if (s.length % 2 === 1) s = "0" + s;
    const out = [];
    for (let i = 0; i < s.length; i += 2) out.push(s.slice(i, i + 2));
    return out.join(" ");
  }
  function groupBin(s) {
    const pad = (4 - (s.length % 4)) % 4;
    s = "0".repeat(pad) + s;
    const out = [];
    for (let i = 0; i < s.length; i += 4) out.push(s.slice(i, i + 4));
    return out.join(" ");
  }

  function bitPositions(unsignedBig, limit) {
    const out = [];
    let v = unsignedBig, i = 0;
    while (v > 0n && i < (limit || 4096)) {
      if (v & 1n) out.push(i);
      v >>= 1n;
      i++;
    }
    return out;
  }

  function bitLength(v) {
    const abs = v < 0n ? -v : v;
    return abs === 0n ? 0 : abs.toString(2).length;
  }

  function widthVal() { return Number($("nbc-width").value); }
  function signedOn() { return $("nbc-signed").value === "on"; }

  const FIELDS = { "nbc-dec": 10, "nbc-hex": 16, "nbc-oct": 8, "nbc-bin": 2 };

  function renderFields(value) {
    const width = widthVal();
    const fits = fitsForDisplay(value, width);
    let bits, hexStr, binStr, octStr, unsignedDecStr, overflowNote = "";
    if (fits) {
      bits = toBitsAtWidth(value, width);
      hexStr = bits.toString(16).padStart(width / 4, "0");
      binStr = bits.toString(2).padStart(width, "0");
      octStr = bits.toString(8).padStart(Math.ceil(width / 3), "0");
      unsignedDecStr = bits.toString(10);
      $("nbc-dec").value = value.toString(10);
      $("nbc-hex").value = hexStr;
      $("nbc-oct").value = octStr;
      $("nbc-bin").value = binStr;
    } else {
      const sign = value < 0n ? "-" : "";
      const abs = value < 0n ? -value : value;
      hexStr = abs.toString(16);
      binStr = abs.toString(2);
      octStr = abs.toString(8);
      unsignedDecStr = "―（" + width + "bitに収まらないため計算できません）";
      $("nbc-dec").value = value.toString(10);
      $("nbc-hex").value = sign + hexStr;
      $("nbc-oct").value = sign + octStr;
      $("nbc-bin").value = sign + binStr;
      overflowNote = "選択中の " + width + "bit の範囲を超えているため、2の補数表示ではなく符号＋絶対値で表示しています。より大きいビット幅を選ぶと2の補数表示になります。";
    }
    const sign = !fits && value < 0n ? "-" : "";
    $("nbc-out-hex").textContent = sign + groupHex(hexStr);
    $("nbc-out-bin").textContent = sign + groupBin(binStr);
    $("nbc-out-oct").textContent = sign + octStr;
    $("nbc-out-unsigned").textContent = unsignedDecStr;
    $("nbc-out-bitlen").textContent = bitLength(value) + " bit";
    const posList = fits ? bitPositions(bits, 4096) : bitPositions(value < 0n ? -value : value, 4096);
    $("nbc-out-positions").textContent = posList.length ? posList.join(", ") : "（なし・値は0です）";
    $("nbc-error").textContent = overflowNote;
    $("nbc-error").className = overflowNote ? "hint" : "error";
  }

  function run(sourceId) {
    const width = widthVal();
    const signed = signedOn();
    const errEl = $("nbc-error");
    try {
      const base = FIELDS[sourceId] || 10;
      const value = parseValue($(sourceId).value, base, width, signed);
      errEl.textContent = "";
      errEl.className = "error";
      renderFields(value);
    } catch (e) {
      errEl.textContent = e.message;
      errEl.className = "error";
    }
  }

  // ---- ビット演算電卓 ----
  function parseOperand(text, width, signed) {
    return parseValue(text, 10, width, signed);
  }

  function runCalc() {
    const errEl = $("nbc-calc-error");
    errEl.textContent = "";
    const width = widthVal();
    const w = BigInt(width);
    const mask = (1n << w) - 1n;
    const half = 1n << (w - 1n);
    const op = $("nbc-operator").value;
    try {
      const signed = signedOn();
      const a = toBitsAtWidth(parseOperand($("nbc-op-a").value, width, signed), width);
      let ua;
      if (op === "not") {
        ua = (~a) & mask;
      } else if (op === "shl" || op === "shr" || op === "ushr") {
        let n = tb.z2h($("nbc-shift").value).trim();
        if (!/^\d+$/.test(n)) throw new Error("シフト量は0以上の整数で入力してください");
        let shift = BigInt(n);
        if (shift < 0n) throw new Error("シフト量は0以上で入力してください");
        if (shift > w) shift = w; // 幅を超えるシフトは全ビット消える結果として扱う
        if (op === "shl") {
          ua = (a << shift) & mask;
        } else if (op === "ushr") {
          ua = a >> shift; // aは既に非負なので論理右シフトと同じ
        } else {
          const signedA = a >= half ? a - (1n << w) : a;
          ua = (signedA >> shift) & mask; // BigIntの>>は符号を保持する算術シフト
        }
      } else {
        const b = toBitsAtWidth(parseOperand($("nbc-op-b").value, width, signed), width);
        if (op === "and") ua = a & b;
        else if (op === "or") ua = a | b;
        else if (op === "xor") ua = a ^ b;
        else throw new Error("不明な演算です");
      }
      const signedVal = ua >= half ? ua - (1n << w) : ua;
      $("nbc-calc-hex").textContent = groupHex(ua.toString(16).padStart(width / 4, "0"));
      $("nbc-calc-bin").textContent = groupBin(ua.toString(2).padStart(width, "0"));
      $("nbc-calc-unsigned").textContent = ua.toString(10);
      $("nbc-calc-signed").textContent = signedVal.toString(10);
    } catch (e) {
      errEl.textContent = e.message;
      $("nbc-calc-hex").textContent = "";
      $("nbc-calc-bin").textContent = "";
      $("nbc-calc-unsigned").textContent = "";
      $("nbc-calc-signed").textContent = "";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    Object.keys(FIELDS).forEach((id) => {
      $(id).addEventListener("input", () => run(id));
    });
    ["nbc-width", "nbc-signed"].forEach((id) => $(id).addEventListener("change", () => run("nbc-dec")));
    run("nbc-dec");

    ["nbc-op-a", "nbc-op-b", "nbc-operator", "nbc-shift"].forEach((id) => $(id).addEventListener("input", runCalc));
    $("nbc-width").addEventListener("change", runCalc);
    $("nbc-signed").addEventListener("change", runCalc);
    runCalc();
  });
})();
