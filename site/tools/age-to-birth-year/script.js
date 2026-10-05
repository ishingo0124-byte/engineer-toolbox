(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 改元境界。wareki-converter と同じ値を使う（食い違うと変換結果がずれるため）
  const ERAS = [
    { name: "明治", base: 1867, start: [1873, 1, 1], end: [1912, 7, 29] },
    { name: "大正", base: 1911, start: [1912, 7, 30], end: [1926, 12, 24] },
    { name: "昭和", base: 1925, start: [1926, 12, 25], end: [1989, 1, 7] },
    { name: "平成", base: 1988, start: [1989, 1, 8], end: [2019, 4, 30] },
    { name: "令和", base: 2018, start: [2019, 5, 1], end: null }
  ];
  const STEM = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCH = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ANIMAL = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];
  const MIN_Y = 1000, MAX_Y = 2999;

  function mod(a, n) { return ((a % n) + n) % n; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function html(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  function toHalf(s) { return tb.z2h(String(s == null ? "" : s)).trim(); }

  // 干支は1月1日区切りの暦年で数える（西暦4年が甲子）
  function eto(y) {
    const i = mod(y - 4, 60);
    return { name: STEM[i % 10] + BRANCH[i % 12], branch: BRANCH[i % 12], animal: ANIMAL[i % 12] };
  }
  // その西暦年に含まれる和暦（改元年は2件）。範囲は明治6年（1873年）以降
  function warekiOfYear(y) {
    const out = [];
    ERAS.forEach((era) => {
      const endY = era.end ? era.end[0] : Infinity;
      if (y >= era.start[0] && y <= endY) {
        const wy = y - era.base;
        if (wy >= 1) {
          const kaigenStart = era.start[0] === y && era.start[1] * 100 + era.start[2] !== 101;
          const kaigenEnd = era.end && era.end[0] === y;
          let note = "";
          if (kaigenStart) note = era.start[1] + "月" + era.start[2] + "日〜";
          else if (kaigenEnd) note = "〜" + era.end[1] + "月" + era.end[2] + "日";
          out.push({ text: era.name + (wy === 1 ? "元年" : wy + "年"), note: note });
        }
      }
    });
    return out;
  }
  function warekiText(y, withNote) {
    const l = warekiOfYear(y);
    if (l.length === 0) return y < 1873 ? "―（明治6年より前）" : "―";
    return l.map((r) => r.text + (withNote && r.note && l.length > 1 ? "（" + r.note + "）" : "")).join("／");
  }

  function parseISODate(raw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((raw || "").trim());
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }
  function todayParts() { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; }
  function ymd(y, m, d) { return y + "年" + m + "月" + d + "日"; }

  // 誕生日を迎えた側: 生まれ年の1月1日〜基準日と同じ月日（2/29が無い年は2/28まで）
  // まだの側: 基準日の翌日〜12月31日（生まれ年はその前年）
  function ranges(base, age) {
    const y1 = base.y - age, y2 = base.y - age - 1;
    let endD = base.d;
    if (base.m === 2 && base.d === 29 && !isLeap(y1)) endD = 28;
    const passed = (base.m === 1 && endD === 1) ? ymd(y1, 1, 1) + "のみ" : ymd(y1, 1, 1) + "〜" + base.m + "月" + endD + "日";
    let notYet;
    if (base.m === 12 && base.d === 31) notYet = "該当なし（12月31日までに全員が誕生日を迎えています）";
    else {
      let sm, sd;
      if (base.m === 2 && base.d === 29) { sm = 3; sd = 1; }
      else { const nx = new Date(Date.UTC(y2, base.m - 1, base.d + 1)); sm = nx.getUTCMonth() + 1; sd = nx.getUTCDate(); }
      notYet = ymd(y2, sm, sd) + "〜" + y2 + "年12月31日";
    }
    return { passed: passed, notYet: notYet };
  }

  function row(label, y, range) {
    const e = eto(y);
    return "<tr><td>" + html(label) + "</td><td class=\"mono\">" + y + "年</td><td>" + html(warekiText(y, true)) + "</td><td>" +
      html(e.name + "（" + e.branch + "・" + e.animal + "年）") + "</td><td>" + html(range) + "</td></tr>";
  }

  function buildTable(baseY) {
    let h = "<table><thead><tr><th rowspan=\"2\">年齢</th><th colspan=\"3\">誕生日を迎えた後</th><th colspan=\"3\">誕生日を迎える前</th></tr><tr><th>西暦</th><th>和暦</th><th>干支</th><th>西暦</th><th>和暦</th><th>干支</th></tr></thead><tbody>";
    for (let a = 0; a <= 120; a++) {
      const c = (y) => "<td class=\"mono\">" + y + "年</td><td>" + html(warekiText(y, false)) + "</td><td>" + html(eto(y).name) + "</td>";
      h += "<tr><td>" + a + "歳</td>" + c(baseY - a) + c(baseY - a - 1) + "</tr>";
    }
    return h + "</tbody></table>";
  }

  function fail(msg) {
    $("a2b-error").textContent = msg;
    $("a2b-result").innerHTML = ""; $("a2b-table").innerHTML = ""; $("a2b-note").textContent = "";
  }

  function run() {
    $("a2b-error").textContent = "";
    const ageRaw = toHalf($("a2b-age").value).replace(/歳$/, "");
    if (!/^\d{1,3}$/.test(ageRaw)) return fail("年齢は0〜120の整数で入力してください");
    const age = parseInt(ageRaw, 10);
    if (age > 120) return fail("年齢は0〜120の範囲で入力してください");
    let base;
    const braw = $("a2b-base").value;
    if (!braw) base = todayParts();
    else { base = parseISODate(braw); if (!base) return fail("基準日が正しくありません"); }
    if (base.y < MIN_Y || base.y > MAX_Y) return fail("基準日の年は" + MIN_Y + "〜" + MAX_Y + "年の範囲で入力してください");

    const r = ranges(base, age);
    $("a2b-result").innerHTML = "<p style=\"margin:0 0 8px\">" + html(ymd(base.y, base.m, base.d)) + "時点で" + age + "歳の人は、次のどちらかです。</p>" +
      "<table><thead><tr><th>区分</th><th>生まれ年（西暦）</th><th>和暦</th><th>干支</th><th>生まれた日の範囲</th></tr></thead><tbody>" +
      row("今年の誕生日を迎えた後", base.y - age, r.passed) +
      row("今年の誕生日をまだ迎えていない", base.y - age - 1, r.notYet) +
      "</tbody></table>";
    $("a2b-note").textContent = "年齢は満年齢（誕生日の前日の終わりに1つ加わる数え方）で計算しています。数え年ではありません。" +
      ((base.m === 2 && (base.d === 28 || base.d === 29)) ? "基準日が2月28日・29日のときは、2月29日生まれの人の境目だけ解釈が分かれます（年単位の結果は変わりません）。" : "");
    $("a2b-table").innerHTML = buildTable(base.y);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["a2b-age", "a2b-base"].forEach((id) => { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    run();
  });
})();
