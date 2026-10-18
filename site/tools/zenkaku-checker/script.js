(function () {
  "use strict";

  const TYPES = [
    { id: "fwalnum", name: "全角英数", mark: null },
    { id: "fwspace", name: "全角スペース", mark: "□" },
    { id: "hwkana", name: "半角カナ", mark: null },
    { id: "nbsp", name: "NBSP", mark: "␣" },
    { id: "othersp", name: "その他の特殊空白", mark: "·" },
    { id: "zw", name: "ゼロ幅文字・BOM", mark: "▯" },
    { id: "fwsym", name: "全角記号", mark: null }
  ];

  // 半角カナ U+FF61〜FF9F(63字)に対応する全角。並びは Unicode の符号位置順
  const FULL_KANA = "。「」、・ヲァィゥェォャュョッー" +
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ" +
    "ヤユヨラリルレロワン゛゜";

  function classify(cp) {
    if ((cp >= 0xFF10 && cp <= 0xFF19) || (cp >= 0xFF21 && cp <= 0xFF3A) || (cp >= 0xFF41 && cp <= 0xFF5A)) return "fwalnum";
    if (cp === 0x3000) return "fwspace";
    if (cp >= 0xFF61 && cp <= 0xFF9F) return "hwkana";
    if (cp === 0x00A0) return "nbsp";
    if ((cp >= 0x2000 && cp <= 0x200A) || cp === 0x202F || cp === 0x205F || cp === 0x1680) return "othersp";
    if (cp === 0x200B || cp === 0x2060 || cp === 0xFEFF) return "zw";
    if ((cp >= 0xFF01 && cp <= 0xFF0F) || (cp >= 0xFF1A && cp <= 0xFF20) || (cp >= 0xFF3B && cp <= 0xFF40) || (cp >= 0xFF5B && cp <= 0xFF5E)) return "fwsym";
    return null;
  }
  function hex(cp) { return "U+" + cp.toString(16).toUpperCase().padStart(4, "0"); }

  // 解析: 行・桁(コードポイント単位, 1始まり)つきで検出結果を返す
  function analyze(text) {
    const lines = String(text == null ? "" : text).split(/\r\n|\r|\n/);
    const items = [], counts = {};
    TYPES.forEach((t) => { counts[t.id] = 0; });
    let halfAlnum = 0, total = 0;
    lines.forEach((line, li) => {
      let col = 0;
      for (const ch of line) {
        col++;
        const cp = ch.codePointAt(0);
        const t = classify(cp);
        if (t) {
          items.push({ type: t, line: li + 1, col: col, ch: ch, cp: cp });
          counts[t]++;
          total++;
        } else if ((cp >= 0x30 && cp <= 0x39) || (cp >= 0x41 && cp <= 0x5A) || (cp >= 0x61 && cp <= 0x7A)) {
          halfAlnum++;
        }
      }
    });
    return { lines: lines, items: items, counts: counts, total: total, halfAlnum: halfAlnum };
  }

  // 統一: sel = {種類id: true} の種類だけ変換。改行はそのまま保持
  function convertText(text, sel) {
    const cps = Array.from(String(text == null ? "" : text));
    const out = [], counts = {};
    TYPES.forEach((t) => { counts[t.id] = 0; });
    for (let i = 0; i < cps.length; i++) {
      const c = cps[i], cp = c.codePointAt(0), t = classify(cp);
      if (!t || !sel[t]) { out.push(c); continue; }
      counts[t]++;
      if (t === "fwalnum" || t === "fwsym") {
        out.push(String.fromCodePoint(cp - 0xFEE0));
      } else if (t === "fwspace" || t === "nbsp" || t === "othersp") {
        out.push(" ");
      } else if (t === "zw") {
        // 削除
      } else if (t === "hwkana") {
        const full = FULL_KANA[cp - 0xFF61];
        const next = cps[i + 1];
        const isLetter = cp >= 0xFF66 && cp <= 0xFF9D && cp !== 0xFF70;
        if (isLetter && (next === "ﾞ" || next === "ﾟ")) {
          const comp = (full + (next === "ﾞ" ? "゙" : "゚")).normalize("NFC");
          if (Array.from(comp).length === 1) { out.push(comp); counts[t]++; i++; continue; }
        }
        out.push(full);
      }
    }
    return { text: out.join(""), counts: counts };
  }

  const api = { TYPES: TYPES, FULL_KANA: FULL_KANA, classify: classify, analyze: analyze, convertText: convertText };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (typeof document === "undefined") return;

  // ---- 画面側（表示は textContent / DOM 生成のみ。innerHTML に入力を入れない） ----
  const $ = (id) => document.getElementById(id);

  function selection() {
    const sel = {};
    TYPES.forEach((t) => { sel[t.id] = $("zc-c-" + t.id).checked; });
    return sel;
  }

  function renderView(a) {
    const view = $("zc-view");
    view.textContent = "";
    const MAX = 2000;
    a.lines.slice(0, MAX).forEach((line, li) => {
      const div = document.createElement("div");
      div.className = "zc-line";
      const ln = document.createElement("span");
      ln.className = "zc-ln";
      ln.textContent = String(li + 1);
      div.appendChild(ln);
      let buf = "";
      const flush = () => { if (buf) { div.appendChild(document.createTextNode(buf)); buf = ""; } };
      for (const ch of line) {
        const cp = ch.codePointAt(0), t = classify(cp);
        if (!t) { buf += ch; continue; }
        flush();
        const sp = document.createElement("span");
        sp.className = "zc-m zc-t-" + t;
        const def = TYPES.find((x) => x.id === t);
        sp.textContent = def.mark ? def.mark : ch;
        sp.title = hex(cp) + " " + def.name;
        div.appendChild(sp);
      }
      flush();
      view.appendChild(div);
    });
    if (a.lines.length > MAX) {
      const p = document.createElement("div");
      p.className = "hint";
      p.textContent = "…表示は先頭 " + MAX + " 行までです（件数と位置の一覧は全体が対象です）。";
      view.appendChild(p);
    }
  }

  function renderPositions(a) {
    const box = $("zc-pos");
    box.textContent = "";
    const CAP = 60;
    let any = false;
    TYPES.forEach((t) => {
      const list = a.items.filter((x) => x.type === t.id);
      if (!list.length) return;
      any = true;
      const head = document.createElement("div");
      head.textContent = t.name + "（" + list.length + "件）";
      const pos = document.createElement("div");
      pos.className = "zc-pos";
      let s = list.slice(0, CAP).map((x) => x.line + "行" + x.col + "桁").join(", ");
      if (list.length > CAP) s += " …ほか " + (list.length - CAP) + " 件";
      pos.textContent = s;
      box.appendChild(head);
      box.appendChild(pos);
    });
    if (!any) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = "該当する文字はありません。";
      box.appendChild(p);
    }
  }

  function run() {
    const text = $("zc-in").value;
    const a = analyze(text);
    TYPES.forEach((t) => { $("zc-n-" + t.id).textContent = a.counts[t.id] + "件"; });
    const sum = $("zc-summary");
    if (text === "") {
      sum.textContent = "文章を貼り付けると、ここに結果が出ます。";
    } else if (a.total === 0) {
      sum.textContent = "対象の文字は見つかりませんでした（全 " + Array.from(text).length + " 文字を確認）。";
    } else {
      sum.textContent = "計 " + a.total + " 文字を検出しました。参考: 半角英数は " + a.halfAlnum + " 文字、全角英数は " + a.counts.fwalnum + " 文字です。";
    }
    renderView(a);
    renderPositions(a);
    const r = convertText(text, selection());
    $("zc-out").value = r.text;
    const n = TYPES.reduce((s, t) => s + r.counts[t.id], 0);
    $("zc-outinfo").textContent = n ? "チェックした種類の " + n + " 文字を変換した結果です。" : "変換される文字はありません。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("zc-in").addEventListener("input", run);
    TYPES.forEach((t) => $("zc-c-" + t.id).addEventListener("change", run));
    $("zc-apply").addEventListener("click", () => {
      $("zc-in").value = $("zc-out").value;
      run();
    });
    run();
  });
})();
