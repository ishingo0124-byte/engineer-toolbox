(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const START_YEAR = 1920;
  const MAX_YEAR = 2200;

  // 改元境界（wareki-converter / age-calculator と同じ定義）
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const JIKKAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const JUNISHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

  function eraLabel(era, wy) { return era.name + (wy === 1 ? "元年" : wy + "年"); }

  // その西暦年に含まれる和暦（改元年は2件になる）
  function gregorianYearToWareki(y) {
    const out = [];
    ERAS.forEach((era) => {
      const startY = era.start[0];
      const endY = era.end ? era.end[0] : Infinity;
      if (y >= startY && y <= endY) {
        const wy = y - era.base;
        if (wy >= 1) out.push(eraLabel(era, wy));
      }
    });
    return out;
  }

  function eto(y) {
    const jIdx = ((y - 4) % 10 + 10) % 10;
    const zIdx = ((y - 4) % 12 + 12) % 12;
    return JIKKAN[jIdx] + JUNISHI[zIdx];
  }

  function escHtml(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  function escAttr(s) { return escHtml(s).replace(/"/g, "&quot;"); }

  function buildTable(basisYear) {
    let out = '<table><thead><tr><th>西暦（生まれ年）</th><th>和暦</th><th>干支</th><th>誕生日後の年齢</th><th>誕生日前の年齢</th></tr></thead>';
    let decade = null, rows = "";
    const flush = () => {
      if (decade !== null) out += '<tbody class="nht-decade"><tr class="nht-decade-head"><th colspan="5">' + decade + '年代</th></tr>' + rows + "</tbody>";
    };
    for (let y = basisYear; y >= START_YEAR; y--) {
      const dec = Math.floor(y / 10) * 10;
      if (dec !== decade) { flush(); decade = dec; rows = ""; }
      const wareki = gregorianYearToWareki(y).join(" / ");
      const etoStr = eto(y);
      const afterAge = basisYear - y;
      const beforeAge = afterAge - 1;
      const afterText = afterAge >= 0 ? afterAge + "歳" : "-";
      const beforeText = beforeAge >= 0 ? beforeAge + "歳" : "-";
      const kw = tb.z2h([y + "年", wareki, etoStr, afterText, beforeText].join(" ")).toLowerCase();
      rows += '<tr data-kw="' + escAttr(kw) + '"><td>' + y + '年</td><td>' + escHtml(wareki || "-") + '</td><td>' + escHtml(etoStr)
        + '</td><td>' + afterText + '</td><td>' + beforeText + '</td></tr>';
    }
    flush();
    out += "</table>";
    return out;
  }

  function applyFilter() {
    const raw = tb.z2h($("nht-filter").value).toLowerCase().trim();
    const words = raw.split(/\s+/).filter(Boolean);
    document.querySelectorAll("#nht-table-wrap tbody.nht-decade").forEach((tbody) => {
      let any = false;
      Array.from(tbody.querySelectorAll("tr:not(.nht-decade-head)")).forEach((tr) => {
        const kw = tr.getAttribute("data-kw") || "";
        const hit = words.every((w) => kw.indexOf(w) >= 0);
        tr.hidden = !hit;
        if (hit) any = true;
      });
      tbody.hidden = !any;
    });
  }

  function rebuild() {
    const err = $("nht-error");
    err.textContent = "";
    const raw = tb.z2h($("nht-year").value).trim();
    const y = parseInt(raw, 10);
    if (!/^\d+$/.test(raw) || y < START_YEAR || y > MAX_YEAR) {
      err.textContent = "基準年は" + START_YEAR + "〜" + MAX_YEAR + "の範囲で西暦を入力してください。";
      $("nht-table-wrap").innerHTML = "";
      return;
    }
    $("nht-table-wrap").innerHTML = buildTable(y);
    applyFilter();
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("nht-year").value = String(new Date().getFullYear());
    $("nht-year").addEventListener("input", tb.debounce(rebuild, 200));
    $("nht-filter").addEventListener("input", applyFilter);
    $("nht-print").addEventListener("click", () => window.print());
    rebuild();
  });
})();
