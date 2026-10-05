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
  // offset: 小学校入学から数えて何年後にその学校へ入るか。dur: 修業年限
  const TYPES = {
    elementary: { label: "小学校", offset: 0, dur: 6 },
    jhs: { label: "中学校", offset: 6, dur: 3 },
    hs: { label: "高校", offset: 9, dur: 3 },
    univ4: { label: "大学", offset: 12, dur: 4 },
    univ2: { label: "短大・専門学校", offset: 12, dur: 2 }
  };
  const MIN_Y = 1900, MAX_Y = 2200;

  function ymdNum(y, m, d) { return y * 10000 + m * 100 + d; }
  function html(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
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

  function parseISODate(raw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((raw || "").trim());
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }
  function todayParts() { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; }

  function fillGrades() {
    const t = TYPES[$("gc-type").value];
    const sel = $("gc-grade"), prev = parseInt(sel.value, 10) || 1;
    let h = "";
    for (let g = 1; g <= t.dur; g++) h += "<option value=\"" + g + "\">" + g + "年生</option>";
    sel.innerHTML = h;
    sel.value = String(Math.min(prev, t.dur));
    if (!$("gc-grade").dataset.init) { $("gc-grade").dataset.init = "1"; if ($("gc-type").value === "univ4") sel.value = String(t.dur); }
  }

  function fail(msg) { $("gc-error").textContent = msg; $("gc-result").innerHTML = ""; $("gc-note").textContent = ""; }

  function run() {
    $("gc-error").textContent = "";
    const t = TYPES[$("gc-type").value];
    const grade = parseInt($("gc-grade").value, 10);
    if (!(grade >= 1 && grade <= t.dur)) return fail("学年を選んでください");
    let base;
    const braw = $("gc-base").value;
    if (!braw) base = todayParts();
    else { base = parseISODate(braw); if (!base) return fail("基準日が正しくありません"); }
    if (base.y < MIN_Y || base.y > MAX_Y) return fail("基準日の年は" + MIN_Y + "〜" + MAX_Y + "年の範囲で入力してください");

    // 年度は4月1日始まり。1〜3月は前年度
    const fy = base.m >= 4 ? base.y : base.y - 1;
    const entry = fy - (grade - 1);      // この学校への入学年（4月）
    const grad = entry + t.dur;          // 卒業年（3月）
    const E = entry - t.offset;          // 小学校入学年（ストレート前提）
    const b1y = E - 7, b2y = E - 6;      // 生まれ期間: b1y年4月2日 〜 b2y年4月1日
    const age = 6 + t.offset + (grade - 1);

    const rows = [
      ["今の年度", fy + "年度（" + fy + "年4月〜" + (fy + 1) + "年3月）", waMonth(fy, 4).replace(/4月$/, "") + "度"],
      ["入学", entry + "年4月", waMonth(entry, 4)],
      ["卒業（予定）", grad + "年3月", waMonth(grad, 3)],
      ["生まれた期間（ストレート）", ymd(b1y, 4, 2) + "〜" + ymd(b2y, 4, 1), wareki(b1y, 4, 2) + "〜" + wareki(b2y, 4, 1)]
    ];
    $("gc-result").innerHTML = "<p style=\"margin:0 0 8px\">" + html(t.label) + grade + "年生（" + html(base.y + "年" + base.m + "月" + base.d + "日") + "時点）</p>" +
      "<table><thead><tr><th>項目</th><th>西暦</th><th>和暦</th></tr></thead><tbody>" +
      rows.map((r) => "<tr><td>" + html(r[0]) + "</td><td class=\"mono\">" + html(r[1]) + "</td><td>" + html(r[2]) + "</td></tr>").join("") +
      "</tbody></table>" +
      "<p class=\"hint\" style=\"margin:6px 0 0\">この期間の生まれの人が同じ学年になります。うち " + b1y + "年4月2日〜12月31日生まれが" + b1y + "年生まれ、" + b2y + "年1月1日〜4月1日生まれが" + b2y + "年生まれ（早生まれ）です。この年度の4月1日時点の年齢は" + age + "歳です。</p>";
    $("gc-note").textContent = "ストレートで進学した場合の計算です。浪人・留年・休学・飛び入学は反映していません。大学が6年制の学部や、4年制の専門学校・定時制高校などは修業年限が違うため対象外です。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    fillGrades();
    $("gc-type").addEventListener("change", () => { fillGrades(); run(); });
    ["gc-grade", "gc-base"].forEach((id) => { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    run();
  });
})();
