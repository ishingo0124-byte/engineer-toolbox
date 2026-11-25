(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const ERA_ALIAS = { M: "明治", T: "大正", S: "昭和", H: "平成", R: "令和" };

  // [年数, 名前, 別名・ほかの呼び方]。英国式の伝統的な一覧として広く知られるものを中心に、日本で使われる呼び名を併記
  const ROWS = [
    [1, "紙婚式", "ペーパー婚式"],
    [2, "藁婚式", "綿婚式（英国式は綿）"],
    [3, "革婚式", "皮婚式、菓子婚式"],
    [4, "花婚式", "書籍婚式、花実婚式"],
    [5, "木婚式", ""],
    [6, "鉄婚式", "砂糖婚式とする表もあります"],
    [7, "銅婚式", "毛織物婚式"],
    [8, "青銅婚式", "ゴム婚式"],
    [9, "陶器婚式", "柳婚式"],
    [10, "アルミ婚式", "錫婚式（英国式は錫）"],
    [11, "鋼鉄婚式", ""],
    [12, "絹婚式", "亜麻婚式"],
    [13, "レース婚式", ""],
    [14, "象牙婚式", ""],
    [15, "水晶婚式", "クリスタル婚式"],
    [20, "磁器婚式", "陶磁器婚式"],
    [25, "銀婚式", ""],
    [30, "真珠婚式", ""],
    [35, "珊瑚婚式", "翡翠婚式とする表もあります"],
    [40, "ルビー婚式", ""],
    [45, "サファイア婚式", ""],
    [50, "金婚式", ""],
    [55, "エメラルド婚式", ""],
    [60, "ダイヤモンド婚式", "60年とする表が多い"],
    [75, "ダイヤモンド婚式", "75年とする表もあります"]
  ];
  const NAME_OF = {};
  ROWS.forEach((r) => { NAME_OF[r[0]] = r[1]; });

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function dim(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function ymd(o) { return o.y * 10000 + o.m * 100 + o.d; }
  function dayNum(o) { return Math.floor(Date.UTC(o.y, o.m - 1, o.d) / 86400000); }
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  function weekday(o) { return WD[new Date(Date.UTC(o.y, o.m - 1, o.d)).getUTCDay()]; }

  function validDate(y, m, d) {
    return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && m >= 1 && m <= 12 && d >= 1 && d <= dim(y, m);
  }

  function waLabel(o) {
    const v = ymd(o);
    for (const era of ERAS) {
      const sv = era.start[0] * 10000 + era.start[1] * 100 + era.start[2];
      const ev = era.end ? era.end[0] * 10000 + era.end[1] * 100 + era.end[2] : Infinity;
      if (v >= sv && v <= ev) { const wy = o.y - era.base; return era.name + (wy === 1 ? "元" : wy) + "年"; }
    }
    return "";
  }
  function dateText(o) {
    const wa = waLabel(o);
    return o.y + "年" + o.m + "月" + o.d + "日（" + (wa ? wa + "・" : "") + weekday(o) + "曜日）";
  }

  // 西暦・和暦のどちらでも読む。失敗時は {error}
  function parseDate(raw) {
    const s = tb.z2h(String(raw == null ? "" : raw)).replace(/\s+/g, "");
    let m = /^(\d{4})[-\/.年](\d{1,2})[-\/.月](\d{1,2})日?$/.exec(s);
    if (m) {
      const o = { y: +m[1], m: +m[2], d: +m[3] };
      if (!validDate(o.y, o.m, o.d)) return { error: "存在しない日付です" };
      if (o.y < 1873) return { error: "1873年（明治6年）より前の日付は対象外です" };
      return o;
    }
    m = /^(明治|大正|昭和|平成|令和|[MTSHR])(元|\d{1,2})年(\d{1,2})月(\d{1,2})日?$/i.exec(s);
    if (m) {
      const en = ERA_ALIAS[m[1].toUpperCase()] || m[1];
      const era = ERAS.find((e) => e.name === en);
      const wy = m[2] === "元" ? 1 : +m[2];
      if (wy < 1) return { error: "和暦の年は1以上（元年）で入力してください" };
      const o = { y: era.base + wy, m: +m[3], d: +m[4] };
      if (!validDate(o.y, o.m, o.d)) return { error: "存在しない日付です" };
      const sv = era.start[0] * 10000 + era.start[1] * 100 + era.start[2];
      const ev = era.end ? era.end[0] * 10000 + era.end[1] * 100 + era.end[2] : Infinity;
      if (ymd(o) < sv || ymd(o) > ev) return { error: en + wy + "年" + o.m + "月" + o.d + "日は存在しません。元号の始まりと終わりを確かめてください" };
      return o;
    }
    return { error: "日付は「2001-10-10」「2001年10月10日」「平成13年10月10日」のように入力してください" };
  }

  function todayObj() {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
  }

  // 結婚日 w の n 周年の日付。2月29日結婚で平年なら mode に従う
  function anniv(w, n, mode) {
    const y = w.y + n;
    if (w.m === 2 && w.d === 29 && !isLeap(y)) return mode === "mar1" ? { y: y, m: 3, d: 1 } : { y: y, m: 2, d: 28 };
    return { y: y, m: w.m, d: w.d };
  }

  function label(n) {
    return NAME_OF[n] ? n + "周年（" + NAME_OF[n] + "）" : n + "周年";
  }

  function tableHtml() {
    const rows = ROWS.map((r) =>
      '<tr data-year="' + r[0] + '"><td>' + r[0] + "年</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>").join("");
    return "<h3>結婚記念日の名前の一覧（1年〜75年）</h3>" +
      "<p>英国式の伝統的な一覧として広く知られる呼び名を中心に、日本で使われる別名を並べました。年数は結婚から満何年かで、結婚1周年が1年です。表にない年（16〜19年など）には、一般的な名前がありません。呼び名は国や資料によってゆれがあります。</p>" +
      "<table><thead><tr><th>年数</th><th>名前</th><th>別名・ゆれ</th></tr></thead><tbody>" + rows + "</tbody></table>";
  }

  function run() {
    const err = $("kk-error"), box = $("kk-result");
    err.textContent = ""; box.innerHTML = "";
    const w = parseDate($("kk-wed").value);
    if (w.error) { err.textContent = "結婚した日: " + w.error; return; }
    const baseRaw = String($("kk-base").value == null ? "" : $("kk-base").value).trim();
    let b;
    if (baseRaw === "") b = todayObj();
    else { b = parseDate(baseRaw); if (b.error) { err.textContent = "基準日: " + b.error; return; } }
    if (ymd(b) < ymd(w)) { err.textContent = "結婚した日が基準日より後になっています。日付を確かめてください"; return; }

    const mode = $("kk-leap").value === "mar1" ? "mar1" : "feb28";
    let n = b.y - w.y;
    if (ymd(anniv(w, n, mode)) > ymd(b)) n--;
    const last = anniv(w, n, mode);
    const next = anniv(w, n + 1, mode);
    const since = dayNum(b) - dayNum(last);
    const total = dayNum(b) - dayNum(w);
    const until = dayNum(next) - dayNum(b);

    let html = '<dl class="result-grid">';
    function row(k, v) { html += "<dt>" + esc(k) + "</dt><dd><span>" + esc(v) + "</span></dd>"; }
    row("結婚した日", dateText(w));
    row("基準日", dateText(b) + (baseRaw === "" ? "（今日）" : ""));
    if (n === 0) {
      row("経過", "結婚から" + total + "日（まだ1周年前です）");
    } else if (since === 0) {
      row("経過", "ちょうど満" + n + "年（結婚から" + total + "日）");
      row("今日", "結婚" + label(n) + "の記念日です");
    } else {
      row("経過", "満" + n + "年と" + since + "日（結婚から" + total + "日）");
      row("直近の記念日", dateText(last) + " 結婚" + label(n));
    }
    row("次の記念日", dateText(next) + " 結婚" + label(n + 1));
    row("次まで", until + "日");
    if (!NAME_OF[n + 1]) row("メモ", (n + 1) + "周年は一般的な名前のある記念日ではありません");

    const upcoming = ROWS.map((r) => r[0]).filter((y) => y > n + 1).slice(0, 3);
    if (upcoming.length) {
      upcoming.forEach((y) => {
        const a = anniv(w, y, mode);
        row("次の節目", y + "年 " + NAME_OF[y] + "：" + dateText(a));
      });
    }
    if (w.m === 2 && w.d === 29) {
      row("2月29日の扱い", "閏年でない年は" + (mode === "mar1" ? "3月1日" : "2月28日") + "として数えています");
    }
    html += "</dl>";
    box.innerHTML = html;

    document.querySelectorAll("#kk-table tr[data-year]").forEach((tr) => {
      const y = +tr.getAttribute("data-year");
      tr.classList.toggle("kk-now", n >= 1 && y === n);
      tr.classList.toggle("kk-next", y === n + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("kk-table").innerHTML = tableHtml();
    ["kk-wed", "kk-base"].forEach((id) => $(id).addEventListener("input", run));
    $("kk-leap").addEventListener("change", run);
    run();
  });
})();
