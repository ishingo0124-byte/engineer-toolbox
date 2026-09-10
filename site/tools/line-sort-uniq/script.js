(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function plainCompare(a, b, nocase) {
    const x = nocase ? a.toLowerCase() : a;
    const y = nocase ? b.toLowerCase() : b;
    if (x === y) return 0;
    return x < y ? -1 : 1;
  }

  // 数字部分と非数字部分に分けて比較する自然順ソート（"file2" < "file10"）
  function naturalCompare(a, b, nocase) {
    const ca = a.match(/\d+|\D+/g) || [];
    const cb = b.match(/\d+|\D+/g) || [];
    const len = Math.max(ca.length, cb.length);
    for (let i = 0; i < len; i++) {
      const x = ca[i], y = cb[i];
      if (x === undefined) return -1;
      if (y === undefined) return 1;
      const xIsNum = /^\d+$/.test(x), yIsNum = /^\d+$/.test(y);
      if (xIsNum && yIsNum) {
        const nx = parseInt(x, 10), ny = parseInt(y, 10);
        if (nx !== ny) return nx - ny;
        if (x.length !== y.length) return x.length - y.length; // 先頭0の違いなど
      } else {
        const sx = nocase ? x.toLowerCase() : x;
        const sy = nocase ? y.toLowerCase() : y;
        if (sx !== sy) return sx < sy ? -1 : 1;
      }
    }
    return 0;
  }

  // 行全体を数値とみなして比較。数値化できない行は昇順・降順どちらでも常に末尾へ
  function numericCompare(a, b, desc) {
    const na = parseFloat(a), nb = parseFloat(b);
    const aNan = isNaN(na), bNan = isNaN(nb);
    if (aNan && bNan) return 0;
    if (aNan) return 1;
    if (bNan) return -1;
    return desc ? nb - na : na - nb;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 連続する同一行だけを1つにまとめる（実際の uniq コマンドと同じ仕様。全体の重複除去ではない）
  function dedupeConsecutive(lines) {
    const out = [];
    const counts = [];
    for (const line of lines) {
      if (out.length && out[out.length - 1] === line) {
        counts[counts.length - 1]++;
      } else {
        out.push(line);
        counts.push(1);
      }
    }
    return { out, counts };
  }

  function process(raw, opts) {
    let lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    if (raw === "") lines = [];
    const originalCount = lines.length;

    if (opts.trim) lines = lines.map((l) => l.trim());
    if (opts.blank) lines = lines.filter((l) => l !== "");
    const afterCleanCount = lines.length;

    switch (opts.order) {
      case "asc": lines.sort((a, b) => plainCompare(a, b, opts.nocase)); break;
      case "desc": lines.sort((a, b) => -plainCompare(a, b, opts.nocase)); break;
      case "natural-asc": lines.sort((a, b) => naturalCompare(a, b, opts.nocase)); break;
      case "natural-desc": lines.sort((a, b) => -naturalCompare(a, b, opts.nocase)); break;
      case "numeric-asc": lines.sort((a, b) => numericCompare(a, b, false)); break;
      case "numeric-desc": lines.sort((a, b) => numericCompare(a, b, true)); break;
      case "shuffle": lines = shuffle(lines.slice()); break;
      default: break;
    }

    let counts = null;
    let uniqRemoved = 0;
    if (opts.uniq) {
      const before = lines.length;
      const d = dedupeConsecutive(lines);
      lines = d.out;
      counts = d.counts;
      uniqRemoved = before - lines.length;
    }

    if (opts.reverse) {
      lines = lines.slice().reverse();
      if (counts) counts = counts.slice().reverse();
    }

    const finalCount = lines.length;
    const numWidth = String(finalCount).length;
    const outLines = lines.map((l, i) => {
      let prefix = "";
      if (counts && opts.count) prefix += String(counts[i]).padStart(4, " ") + " ";
      if (opts.linenum) prefix += String(i + 1).padStart(numWidth, " ") + ": ";
      return prefix + l;
    });

    return { text: outLines.join("\n"), originalCount, afterCleanCount, finalCount, uniqRemoved };
  }

  function run() {
    const errEl = $("lsu-error");
    errEl.textContent = "";
    const raw = $("lsu-input").value;
    const opts = {
      trim: $("lsu-trim").checked,
      blank: $("lsu-blank").checked,
      order: $("lsu-order").value,
      nocase: $("lsu-nocase").checked,
      uniq: $("lsu-uniq").checked,
      count: $("lsu-count").checked,
      reverse: $("lsu-reverse").checked,
      linenum: $("lsu-linenum").checked
    };
    let r;
    try {
      r = process(raw, opts);
    } catch (e) {
      errEl.textContent = "処理エラー: " + e.message;
      return;
    }
    $("lsu-output").textContent = r.text;
    const removedTotal = r.originalCount - r.finalCount;
    $("lsu-stats").textContent = "入力 " + tb.fmt(r.originalCount) + " 行 → 処理後 " + tb.fmt(r.finalCount) + " 行（" +
      tb.fmt(removedTotal) + " 行削除、うち重複削除 " + tb.fmt(r.uniqRemoved) + " 行）";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ids = ["lsu-input", "lsu-order", "lsu-nocase", "lsu-trim", "lsu-blank", "lsu-uniq", "lsu-count", "lsu-reverse", "lsu-linenum"];
    ids.forEach((id) => {
      const el = $(id);
      el.addEventListener("input", run);
      el.addEventListener("change", run);
    });
    run();
  });
})();
