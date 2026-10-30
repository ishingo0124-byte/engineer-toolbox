(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 元号境界。sotsu-hayamihyo / wareki-converter と同じ値を使う
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const MIN_Y = 1950, MAX_Y = 2100; // 式の年の範囲
  const TABLE_FROM = 2025, TABLE_TO = 2032;

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
    return "―";
  }
  function waMonth(y, m) { return wareki(y, m, 1).replace(/1日$/, ""); }

  // 和暦の「元号+年」から西暦年を求める（年の途中の改元は考えず、その元号の最終年も含める）
  function eraYear(name, n) {
    for (const era of ERAS) { if (era.name === name) return era.base + n; }
    return null;
  }
  function validDate(y, m, d) {
    const t = new Date(Date.UTC(2000, m - 1, d));
    t.setUTCFullYear(y);
    return m >= 1 && m <= 12 && d >= 1 && t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
  }

  // 生年月日（西暦 2006-04-02 / 2006/4/2 / 20060402、和暦 平成18年4月2日）を [y, m, d] に。読めなければ null
  function parseBirth(raw) {
    const s = toHalf(raw).replace(/\s+/g, "");
    let m = s.match(/^(明治|大正|昭和|平成|令和)(元|\d{1,2})年?(\d{1,2})月(\d{1,2})日?$/);
    if (m) {
      const n = m[2] === "元" ? 1 : parseInt(m[2], 10);
      const y = eraYear(m[1], n);
      return [y, parseInt(m[3], 10), parseInt(m[4], 10)];
    }
    m = s.match(/^(\d{4})[-\/.年](\d{1,2})[-\/.月](\d{1,2})日?$/) || s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
    return null;
  }

  // 式の年（2027 / 2027年 / 2027年1月 / 令和9年）を西暦年に。読めなければ null
  function parseYear(raw) {
    const s = toHalf(raw).replace(/\s+/g, "");
    let m = s.match(/^(明治|大正|昭和|平成|令和)(元|\d{1,2})年?(?:1月)?$/);
    if (m) return eraYear(m[1], m[2] === "元" ? 1 : parseInt(m[2], 10));
    m = s.match(/^(\d{4})(?:年(?:1月)?)?$/);
    if (m) return parseInt(m[1], 10);
    return null;
  }

  // 式の年Yの対象: (Y-21)年4月2日 〜 (Y-20)年4月1日 生まれ（Y-1年度に20歳になる人）
  function target(Y) { return { b1: Y - 21, b2: Y - 20 }; }
  // 生年月日 → 式の年。4月2日以降は +21、1月1日〜4月1日は +20
  function ceremonyYear(y, m, d) { return ymdNum(y, m, d) >= ymdNum(y, 4, 2) ? y + 21 : y + 20; }

  // 成人の日。2000年以降は1月の第2月曜日、1999年以前は1月15日
  function seijinNoHi(Y) {
    if (Y < 2000) return 15;
    const dow = new Date(Date.UTC(2000, 0, 1)); // 曜日計算用（年は下で設定）
    dow.setUTCFullYear(Y);
    const first = (1 - dow.getUTCDay() + 7) % 7 + 1;
    return first + 7;
  }

  function buildTable() {
    let h = "<table><thead><tr><th>式の年</th><th>成人の日（参考）</th><th>対象の生年月日（西暦）</th><th>対象の生年月日（和暦）</th></tr></thead><tbody>";
    for (let Y = TABLE_FROM; Y <= TABLE_TO; Y++) {
      const t = target(Y), nd = seijinNoHi(Y);
      h += "<tr><td class=\"mono\">" + Y + "年1月</td><td class=\"mono\">" + Y + "年1月" + nd + "日</td>" +
        "<td class=\"mono\">" + ymd(t.b1, 4, 2) + "〜" + ymd(t.b2, 4, 1) + "</td>" +
        "<td>" + wareki(t.b1, 4, 2) + "〜" + wareki(t.b2, 4, 1) + "</td></tr>";
    }
    return h + "</tbody></table>";
  }

  function rowsTable(title, rows) {
    return "<p style=\"margin:0 0 8px\">" + html(title) + "</p>" +
      "<table><thead><tr><th>項目</th><th>西暦</th><th>和暦</th></tr></thead><tbody>" +
      rows.map((r) => "<tr><td>" + html(r[0]) + "</td><td class=\"mono\">" + html(r[1]) + "</td><td>" + html(r[2]) + "</td></tr>").join("") +
      "</tbody></table>";
  }

  function rangeRow(Y) {
    const t = target(Y);
    return ["対象の生年月日", ymd(t.b1, 4, 2) + "〜" + ymd(t.b2, 4, 1), wareki(t.b1, 4, 2) + "〜" + wareki(t.b2, 4, 1)];
  }

  function runBirth() {
    const err = $("sjh-birth-error"), box = $("sjh-birth-result");
    err.textContent = "";
    const raw = $("sjh-birth").value;
    if (!toHalf(raw)) { box.innerHTML = ""; return; }
    const b = parseBirth(raw);
    if (b === null || !validDate(b[0], b[1], b[2])) {
      err.textContent = "生年月日は「2006-04-02」「2006年4月2日」「平成18年4月2日」のように入力してください（存在する日付だけ読み取ります）";
      box.innerHTML = ""; return;
    }
    const y = b[0], m = b[1], d = b[2];
    if (y < 1900 || y > 2079) { err.textContent = "生まれ年は1900〜2079年の範囲で入力してください"; box.innerHTML = ""; return; }
    const Y = ceremonyYear(y, m, d);
    const early = ymdNum(y, m, d) < ymdNum(y, 4, 2); // 1月1日〜4月1日生まれ（早生まれ）
    const ageJan1 = ymdNum(y + 20, m, d) <= ymdNum(Y, 1, 1) ? 20 : 19;
    const nd = seijinNoHi(Y);
    const rows = [
      ["式の年（1月）", Y + "年1月", waMonth(Y, 1)],
      rangeRow(Y),
      ["20歳の誕生日", ymd(y + 20, m, d), wareki(y + 20, m, d)],
      ["20歳になる年度", (Y - 1) + "年度（" + (Y - 1) + "年4月1日〜" + Y + "年3月31日）", "―"],
      ["式の年の1月1日時点の年齢", ageJan1 + "歳", "―"],
      ["成人の日（参考）", ymd(Y, 1, nd), wareki(Y, 1, nd)]
    ];
    box.innerHTML = rowsTable(ymd(y, m, d) + "生まれ（" + (early ? "早生まれ" : "4月2日以降の生まれ") + "）は、" + Y + "年（" + waMonth(Y, 1).replace(/1月$/, "") + "）1月の式の対象です", rows) +
      "<p class=\"hint\" style=\"margin:6px 0 0\">式の日や会場、対象の学年は自治体が決めます。お住まいの自治体の案内で確認してください。</p>";
  }

  function runYear() {
    const err = $("sjh-year-error"), box = $("sjh-year-result");
    err.textContent = "";
    const raw = $("sjh-year").value;
    if (!toHalf(raw)) { box.innerHTML = ""; return; }
    const Y = parseYear(raw);
    if (Y === null || Y < MIN_Y || Y > MAX_Y) {
      err.textContent = "式の年は「2027」「2027年」「令和9年」のように、" + MIN_Y + "〜" + MAX_Y + "年の範囲で入力してください";
      box.innerHTML = ""; return;
    }
    const nd = seijinNoHi(Y);
    const rows = [
      rangeRow(Y),
      ["20歳になる年度", (Y - 1) + "年度", "―"],
      ["成人の日（参考）", ymd(Y, 1, nd), wareki(Y, 1, nd)]
    ];
    box.innerHTML = rowsTable(Y + "年（" + waMonth(Y, 1).replace(/1月$/, "") + "）1月の式の対象", rows) +
      "<p class=\"hint\" style=\"margin:6px 0 0\">成人の日の前後に開く自治体は多いものの、日程は自治体ごとに違います。</p>";
  }

  function run() {
    $("sjh-table").innerHTML = buildTable();
    runBirth();
    runYear();
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["sjh-birth", "sjh-year"].forEach((id) => { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    run();
  });
})();
