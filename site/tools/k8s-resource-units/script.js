(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const BINARY = [["Ki", Math.pow(1024, 1)], ["Mi", Math.pow(1024, 2)], ["Gi", Math.pow(1024, 3)], ["Ti", Math.pow(1024, 4)], ["Pi", Math.pow(1024, 5)], ["Ei", Math.pow(1024, 6)]];
  const DECIMAL = [["k", Math.pow(1000, 1)], ["M", Math.pow(1000, 2)], ["G", Math.pow(1000, 3)], ["T", Math.pow(1000, 4)], ["P", Math.pow(1000, 5)], ["E", Math.pow(1000, 6)]];
  const MILLI = [["m", 0.001]];
  const MEM_SUFFIXES = [...BINARY, ...DECIMAL, ...MILLI].sort((a, b) => b[0].length - a[0].length);
  const PAIR = [["k", "Ki"], ["M", "Mi"], ["G", "Gi"], ["T", "Ti"], ["P", "Pi"], ["E", "Ei"]]; // 対になる10進/2進接頭辞（比較表示用）
  const DEC_MULT = Object.fromEntries(DECIMAL);
  const BIN_MULT = Object.fromEntries(BINARY);

  function toHalfWidth(s) { return tb.z2h(String(s == null ? "" : s)); }
  function isNumeric(s) { return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s); }

  function fmtNum(n) {
    if (!isFinite(n)) return String(n);
    if (Number.isInteger(n)) return tb.fmt(n);
    const r = Math.round(n * 1e6) / 1e6;
    return tb.fmt(r);
  }

  function parseCpu(raw) {
    const s = toHalfWidth(raw).trim();
    if (s === "") throw new Error("値を入力してください");
    if (s.endsWith("m")) {
      const numPart = s.slice(0, -1);
      if (!isNumeric(numPart) || numPart === "") throw new Error("ミリコアの数値部分が不正です（例: 500m）");
      const milli = Number(numPart);
      return { cores: milli / 1000, milli: milli };
    }
    if (isNumeric(s)) {
      const cores = Number(s);
      return { cores: cores, milli: cores * 1000 };
    }
    if (/(Ki|Mi|Gi|Ti|Pi|Ei|[kMGTPE])$/.test(s)) {
      throw new Error("CPU には m（ミリコア）以外の単位は使えません。コア数（例: 0.5）かミリコア（例: 500m）で入力してください");
    }
    throw new Error("CPU はコア数（例: 1, 0.5）かミリコア（例: 500m, 100m）の形式で入力してください");
  }

  function parseMemory(raw) {
    const s = toHalfWidth(raw).trim();
    if (s === "") throw new Error("値を入力してください");
    for (const [suf, mult] of MEM_SUFFIXES) {
      if (s.endsWith(suf)) {
        const numPart = s.slice(0, s.length - suf.length);
        if (numPart !== "" && isNumeric(numPart)) {
          return { value: Number(numPart), suffix: suf, bytes: Number(numPart) * mult };
        }
      }
    }
    if (isNumeric(s)) return { value: Number(s), suffix: "", bytes: Number(s) };
    if (/K$/.test(s) && !/Ki$/.test(s)) {
      throw new Error("「K」（大文字）は無効な単位です。1000倍なら小文字の k、1024倍なら Ki を使ってください");
    }
    throw new Error("数値と単位（Ki/Mi/Gi/Ti/Pi/Ei、k/M/G/T/P/E、m のいずれか。単位なしはバイト）の形式で入力してください");
  }

  function runCpu() {
    const err = $("ku-cpu-error"), box = $("ku-cpu-result");
    err.textContent = ""; box.innerHTML = "";
    let r;
    try { r = parseCpu($("ku-cpu").value); } catch (e) { err.textContent = e.message; return; }
    box.innerHTML =
      '<dl class="result-grid">' +
      "<dt>コア数</dt><dd>" + fmtNum(r.cores) + "</dd>" +
      "<dt>ミリコア（m）</dt><dd>" + fmtNum(r.milli) + "m</dd>" +
      "</dl>";
  }

  function runMemory() {
    const err = $("ku-mem-error"), box = $("ku-mem-result");
    err.textContent = ""; box.innerHTML = "";
    let r;
    try { r = parseMemory($("ku-mem").value); } catch (e) { err.textContent = e.message; return; }
    const bytes = r.bytes;
    let html = '<dl class="result-grid">';
    html += "<dt>バイト</dt><dd>" + fmtNum(bytes) + "</dd>";
    BINARY.forEach(([suf, mult]) => { html += "<dt>" + suf + "</dt><dd>" + fmtNum(bytes / mult) + "</dd>"; });
    DECIMAL.forEach(([suf, mult]) => { html += "<dt>" + suf + "</dt><dd>" + fmtNum(bytes / mult) + "</dd>"; });
    html += "</dl>";
    box.innerHTML = html;

    let warn = "";
    if (r.suffix === "m") {
      warn = "小文字の m は「ミリバイト」（1/1000バイト）です。" + r.value + "m は " + fmtNum(bytes) + " バイトしかありません。" +
        r.value + "MiB のつもりなら " + r.value + "Mi、" + r.value + "MB のつもりなら " + r.value + "M と書いてください。";
    } else {
      const decPair = PAIR.find((p) => p[0] === r.suffix);
      const binPair = PAIR.find((p) => p[1] === r.suffix);
      if (decPair) {
        const altBytes = r.value * BIN_MULT[decPair[1]];
        const diffPct = ((altBytes - bytes) / bytes * 100);
        warn = "同じ数値 " + r.value + " を2進接頭辞 " + decPair[1] + "（1024ベース）として解釈すると " + fmtNum(altBytes) + " バイトになり、" + r.suffix + "（1000ベース）より約" + fmtNum(diffPct) + "%大きくなります。" + r.value + decPair[0] + " と " + r.value + decPair[1] + " は別の値です。";
      } else if (binPair) {
        const altBytes = r.value * DEC_MULT[binPair[0]];
        const diffPct = ((bytes - altBytes) / altBytes * 100);
        warn = "同じ数値 " + r.value + " を10進接頭辞 " + binPair[0] + "（1000ベース）として解釈すると " + fmtNum(altBytes) + " バイトになり、" + r.suffix + "（1024ベース）はそれより約" + fmtNum(diffPct) + "%大きい値です。" + r.value + binPair[0] + " と " + r.value + binPair[1] + " は別の値です。";
      }
    }
    if (warn) {
      const p = document.createElement("p");
      p.className = "hint";
      p.style.margin = "6px 0 0";
      p.textContent = warn;
      box.appendChild(p);
    }
  }

  function run() { runCpu(); runMemory(); }

  document.addEventListener("DOMContentLoaded", () => {
    $("ku-cpu").addEventListener("input", runCpu);
    $("ku-mem").addEventListener("input", runMemory);
    run();
  });
})();
