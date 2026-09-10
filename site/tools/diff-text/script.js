(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // 改行コードを統一し、末尾の改行1つ分は行数に数えない（多くのdiffツールと同じ扱い）
  function splitLines(text) {
    const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (t === "") return [];
    const body = t.endsWith("\n") ? t.slice(0, -1) : t;
    return body.split("\n");
  }

  function normalizeLine(s, ignoreWs, ignoreCase) {
    let r = s;
    if (ignoreWs) r = r.replace(/\s+/g, "");
    if (ignoreCase) r = r.toLowerCase();
    return r;
  }

  // Myers の O(ND) 差分アルゴリズム。ステップ数が stepLimit を超えたら null を返し、
  // 呼び出し側で簡易フォールバックに切り替えることで、大きく異なる巨大テキストでも固まらないようにする。
  function myers(a, b, stepLimit) {
    const N = a.length, M = b.length;
    if (N === 0 && M === 0) return [];
    const MAX = N + M;
    const OFFSET = MAX;
    const v = new Int32Array(2 * MAX + 1);
    const trace = [];
    let steps = 0;
    let found = false;
    outer:
    for (let d = 0; d <= MAX; d++) {
      trace.push(v.slice());
      for (let k = -d; k <= d; k += 2) {
        steps++;
        if (steps > stepLimit) return null;
        let x;
        if (k === -d || (k !== d && v[k - 1 + OFFSET] < v[k + 1 + OFFSET])) {
          x = v[k + 1 + OFFSET];
        } else {
          x = v[k - 1 + OFFSET] + 1;
        }
        let y = x - k;
        while (x < N && y < M && a[x] === b[y]) { x++; y++; }
        v[k + OFFSET] = x;
        if (x >= N && y >= M) { found = true; break outer; }
      }
    }
    if (!found) return null;
    const ops = [];
    let cx = N, cy = M;
    for (let d = trace.length - 1; d >= 0 && (cx > 0 || cy > 0); d--) {
      const vv = trace[d];
      const k = cx - cy;
      let prevK;
      if (k === -d || (k !== d && vv[k - 1 + OFFSET] < vv[k + 1 + OFFSET])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }
      const prevX = vv[prevK + OFFSET];
      const prevY = prevX - prevK;
      while (cx > prevX && cy > prevY) {
        ops.push({ type: "equal", aIdx: cx - 1, bIdx: cy - 1 });
        cx--; cy--;
      }
      if (d > 0) {
        if (cx === prevX) { ops.push({ type: "insert", bIdx: cy - 1 }); cy--; }
        else { ops.push({ type: "delete", aIdx: cx - 1 }); cx--; }
      }
    }
    ops.reverse();
    return ops;
  }

  // フォールバック：共通の先頭・共通の末尾だけをO(N+M)で見つけ、残りはまとめて置換扱いにする
  function fallbackDiff(a, b) {
    const N = a.length, M = b.length;
    let pre = 0;
    while (pre < N && pre < M && a[pre] === b[pre]) pre++;
    let sufA = N, sufB = M;
    while (sufA > pre && sufB > pre && a[sufA - 1] === b[sufB - 1]) { sufA--; sufB--; }
    const ops = [];
    for (let i = 0; i < pre; i++) ops.push({ type: "equal", aIdx: i, bIdx: i });
    for (let i = pre; i < sufA; i++) ops.push({ type: "delete", aIdx: i });
    for (let j = pre; j < sufB; j++) ops.push({ type: "insert", bIdx: j });
    for (let i = 0; i < N - sufA; i++) ops.push({ type: "equal", aIdx: sufA + i, bIdx: sufB + i });
    return ops;
  }

  function diffArrays(a, b, stepLimit) {
    const r = myers(a, b, stepLimit);
    if (r) return { ops: r, exact: true };
    return { ops: fallbackDiff(a, b), exact: false };
  }

  function charDiff(oldStr, newStr) {
    const a = Array.from(oldStr);
    const b = Array.from(newStr);
    const { ops } = diffArrays(a, b, 150000);
    const pieces = [];
    for (const op of ops) {
      const ch = op.type === "insert" ? b[op.bIdx] : a[op.aIdx];
      const last = pieces[pieces.length - 1];
      if (last && last.type === op.type) last.text += ch;
      else pieces.push({ type: op.type, text: ch });
    }
    return pieces;
  }

  function renderCharDiff(pieces, side) {
    let html = "";
    for (const p of pieces) {
      if (p.type === "equal") html += escapeHtml(p.text);
      else if (p.type === "delete" && side === "old") html += "<del>" + escapeHtml(p.text) + "</del>";
      else if (p.type === "insert" && side === "new") html += "<ins>" + escapeHtml(p.text) + "</ins>";
    }
    return html;
  }

  // 連続する delete/insert のブロックを、位置順にペアリングして「変更行」としてまとめる
  function groupOps(ops) {
    const rows = [];
    let i = 0;
    while (i < ops.length) {
      const op = ops[i];
      if (op.type === "equal") { rows.push({ kind: "ctx", aIdx: op.aIdx, bIdx: op.bIdx }); i++; continue; }
      const dels = [], inss = [];
      let j = i;
      while (j < ops.length && ops[j].type !== "equal") {
        if (ops[j].type === "delete") dels.push(ops[j].aIdx); else inss.push(ops[j].bIdx);
        j++;
      }
      const pairCount = Math.min(dels.length, inss.length);
      for (let p = 0; p < pairCount; p++) rows.push({ kind: "chg", aIdx: dels[p], bIdx: inss[p] });
      for (let p = pairCount; p < dels.length; p++) rows.push({ kind: "del", aIdx: dels[p] });
      for (let p = pairCount; p < inss.length; p++) rows.push({ kind: "ins", bIdx: inss[p] });
      i = j;
    }
    return rows;
  }

  function renderRows(rows, aLines, bLines) {
    let html = "";
    let added = 0, removed = 0, changed = 0, unchanged = 0;
    for (const r of rows) {
      if (r.kind === "ctx") {
        unchanged++;
        html += '<div class="dt-row"><span class="dt-sign"> </span><span class="dt-txt">' + escapeHtml(aLines[r.aIdx]) + "</span></div>";
      } else if (r.kind === "del") {
        removed++;
        html += '<div class="dt-row dt-del"><span class="dt-sign">-</span><span class="dt-txt">' + escapeHtml(aLines[r.aIdx]) + "</span></div>";
      } else if (r.kind === "ins") {
        added++;
        html += '<div class="dt-row dt-add"><span class="dt-sign">+</span><span class="dt-txt">' + escapeHtml(bLines[r.bIdx]) + "</span></div>";
      } else if (r.kind === "chg") {
        changed++;
        const oldStr = aLines[r.aIdx], newStr = bLines[r.bIdx];
        const pieces = (oldStr.length + newStr.length > 4000) ? null : charDiff(oldStr, newStr);
        const oldHtml = pieces ? renderCharDiff(pieces, "old") : escapeHtml(oldStr);
        const newHtml = pieces ? renderCharDiff(pieces, "new") : escapeHtml(newStr);
        html += '<div class="dt-row dt-del"><span class="dt-sign">-</span><span class="dt-txt">' + oldHtml + "</span></div>";
        html += '<div class="dt-row dt-add"><span class="dt-sign">+</span><span class="dt-txt">' + newHtml + "</span></div>";
      }
    }
    return { html, added, removed, changed, unchanged };
  }

  function buildUnified(ops, aLines, bLines, context) {
    let an = 0, bn = 0;
    const items = [];
    for (const op of ops) {
      const aBefore = an, bBefore = bn;
      if (op.type === "equal") { an++; bn++; items.push({ type: "equal", aBefore, bBefore, text: aLines[op.aIdx] }); }
      else if (op.type === "delete") { an++; items.push({ type: "delete", aBefore, bBefore, text: aLines[op.aIdx] }); }
      else { bn++; items.push({ type: "insert", aBefore, bBefore, text: bLines[op.bIdx] }); }
    }
    const changeIdx = [];
    items.forEach((it, i) => { if (it.type !== "equal") changeIdx.push(i); });
    if (changeIdx.length === 0) return "差分はありません。\n";
    const ranges = [];
    for (const ci of changeIdx) {
      const start = Math.max(0, ci - context);
      const end = Math.min(items.length - 1, ci + context);
      if (ranges.length && start <= ranges[ranges.length - 1].end + 1) {
        ranges[ranges.length - 1].end = Math.max(ranges[ranges.length - 1].end, end);
      } else {
        ranges.push({ start, end });
      }
    }
    let out = "--- a\n+++ b\n";
    for (const r of ranges) {
      const slice = items.slice(r.start, r.end + 1);
      const first = items[r.start];
      const aCount = slice.filter((it) => it.type !== "insert").length;
      const bCount = slice.filter((it) => it.type !== "delete").length;
      const aStart = aCount > 0 ? first.aBefore + 1 : first.aBefore;
      const bStart = bCount > 0 ? first.bBefore + 1 : first.bBefore;
      out += "@@ -" + aStart + "," + aCount + " +" + bStart + "," + bCount + " @@\n";
      for (const it of slice) {
        const prefix = it.type === "equal" ? " " : it.type === "delete" ? "-" : "+";
        out += prefix + it.text + "\n";
      }
    }
    return out;
  }

  function run() {
    const errEl = $("dt-error");
    errEl.textContent = "";
    const leftText = $("dt-left").value;
    const rightText = $("dt-right").value;
    const ignoreWs = $("dt-ws").checked;
    const ignoreCase = $("dt-case").checked;

    const aLines = splitLines(leftText);
    const bLines = splitLines(rightText);
    const aNorm = aLines.map((l) => normalizeLine(l, ignoreWs, ignoreCase));
    const bNorm = bLines.map((l) => normalizeLine(l, ignoreWs, ignoreCase));

    const { ops, exact } = diffArrays(aNorm, bNorm, 3000000);
    if (!exact) {
      errEl.textContent = "差分が非常に大きいため、共通の先頭・末尾以外は変更部分としてまとめて簡易表示しています。";
    }

    const rows = groupOps(ops);
    const { html, added, removed, changed, unchanged } = renderRows(rows, aLines, bLines);
    $("dt-diff").innerHTML = html || '<p class="hint">両方とも空です。</p>';
    $("dt-stats").textContent = "追加 " + tb.fmt(added) + " 行 / 削除 " + tb.fmt(removed) + " 行 / 変更 " + tb.fmt(changed) + " 行 / 一致 " + tb.fmt(unchanged) + " 行";
    $("dt-unified").textContent = buildUnified(ops, aLines, bLines, 3);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const debouncedRun = tb.debounce(run, 120);
    ["dt-left", "dt-right"].forEach((id) => $(id).addEventListener("input", debouncedRun));
    ["dt-ws", "dt-case"].forEach((id) => $(id).addEventListener("change", run));
    run();
  });
})();
