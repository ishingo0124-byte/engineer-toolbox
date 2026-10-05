(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 元号境界。wareki-converter と同じ値を使う
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  // back: 卒業年Gから、高校卒業年Hまで何年さかのぼるか
  const TYPES = {
    univ: { label: "大卒", back: 4 },
    master: { label: "院卒（修士）", back: 6 },
    hs: { label: "高卒", back: 0 },
    short: { label: "短大・専門卒", back: 2 }
  };
  const MIN_G = 1950, MAX_G = 2100;

  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
  function html(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  function toHalf(s) { return tb.z2h(String(s == null ? "" : s)).trim(); }
  function ymd(y, m, d) { return y + "年" + m + "月" + d + "日"; }
  function wareki(y, m, d) {
    const v = ymdNum(y, m, d);
    for (const era of ERAS) {
      const sv = ymdNum(era.start[0], era.start[1], era.start[2]);
      const ev = era.end ? ymdNum(era.end[0], era.end[1], era.end[2]) : Infinity;
      if (v >= sv && v <= ev) { const wy = y - era.base; return era.name + (wy === 1 ? "元年" : wy + "年") + m + "月" + d + "日"; }
    }
    return y < 1873 ? "―（明治6年より前）" : "―";
  }
  function waMonth(y, m) { return wareki(y, m, 1).replace(/1日$/, ""); }

  function parseGrad(raw) {
    const s = toHalf(raw).replace(/\s+/g, "").replace(/(年3月卒業|年卒|卒|年)$/, "");
    if (!/^\d{2}$|^\d{4}$/.test(s)) return null;
    return s.length === 2 ? 2000 + parseInt(s, 10) : parseInt(s, 10);
  }

  // 高校卒業年Hから各段階を組み立てる。ストレートの小学校入学は H-12年4月（満6歳の学年）
  function stages(G, typeKey) {
    const back = TYPES[typeKey].back, H = G - back;
    const rows = [
      ["小学校入学", H - 12, 4], ["小学校卒業", H - 6, 3],
      ["中学校入学", H - 6, 4], ["中学校卒業", H - 3, 3],
      ["高校入学", H - 3, 4], ["高校卒業", H, 3]
    ];
    if (typeKey === "univ") rows.push(["大学入学", H, 4], ["大学卒業", G, 3]);
    if (typeKey === "master") rows.push(["大学入学", H, 4], ["大学卒業", H + 4, 3], ["大学院（修士）入学", H + 4, 4], ["大学院（修士）修了", G, 3]);
    if (typeKey === "short") rows.push(["短大・専門学校入学", H, 4], ["短大・専門学校卒業", G, 3]);
    const bornY = H - 19;
    return { rows: rows, b1: bornY, b2: bornY + 1, H: H };
  }

  function buildTable(typeKey) {
    const isMaster = typeKey === "master", isHs = typeKey === "hs";
    let h = "<table><thead><tr><th>卒年</th><th>卒業</th><th>生まれた期間</th><th>小学校入学</th><th>中学校入学</th><th>高校入学</th>" +
      (isHs ? "" : "<th>" + (typeKey === "short" ? "短大・専門入学" : "大学入学") + "</th>") + (isMaster ? "<th>院入学</th>" : "") + "</tr></thead><tbody>";
    for (let G = 2024; G <= 2032; G++) {
      const s = stages(G, typeKey), H = s.H;
      h += "<tr><td>" + String(G).slice(2) + "卒</td><td class=\"mono\">" + G + "年3月</td><td class=\"mono\">" + s.b1 + "/4/2〜" + s.b2 + "/4/1</td>" +
        "<td class=\"mono\">" + (H - 12) + "年4月</td><td class=\"mono\">" + (H - 6) + "年4月</td><td class=\"mono\">" + (H - 3) + "年4月</td>" +
        (isHs ? "" : "<td class=\"mono\">" + H + "年4月</td>") + (isMaster ? "<td class=\"mono\">" + (H + 4) + "年4月</td>" : "") + "</tr>";
    }
    return h + "</tbody></table>";
  }

  function run() {
    const err = $("sh-error"), box = $("sh-result");
    err.textContent = "";
    const typeKey = $("sh-type").value;
    $("sh-table").innerHTML = buildTable(typeKey);
    const G = parseGrad($("sh-year").value);
    if (G === null) { err.textContent = "卒年は「27」または「2027」のように、2桁か4桁の数字で入力してください"; box.innerHTML = ""; return; }
    if (G < MIN_G || G > MAX_G) { err.textContent = "卒年は" + MIN_G + "〜" + MAX_G + "年の範囲で入力してください"; box.innerHTML = ""; return; }
    const t = TYPES[typeKey], s = stages(G, typeKey);
    const rows = [["生まれた期間（ストレート）", ymd(s.b1, 4, 2) + "〜" + ymd(s.b2, 4, 1), wareki(s.b1, 4, 2) + "〜" + wareki(s.b2, 4, 1)]]
      .concat(s.rows.map((r) => [r[0], r[1] + "年" + r[2] + "月", waMonth(r[1], r[2])]));
    box.innerHTML = "<p style=\"margin:0 0 8px\">" + G + "年3月卒（" + html(String(G).slice(2) + "卒") + "・" + html(t.label) + "）</p>" +
      "<table><thead><tr><th>項目</th><th>西暦</th><th>和暦</th></tr></thead><tbody>" +
      rows.map((r) => "<tr><td>" + html(r[0]) + "</td><td class=\"mono\">" + html(r[1]) + "</td><td>" + html(r[2]) + "</td></tr>").join("") +
      "</tbody></table><p class=\"hint\" style=\"margin:6px 0 0\">就職の場合、入社は一般に" + G + "年4月です。9月卒（秋入学・秋卒業）や海外の学校は対象外です。</p>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["sh-year", "sh-type"].forEach((id) => { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    run();
  });
})();
