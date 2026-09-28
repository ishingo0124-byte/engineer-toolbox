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

  function toHalf(s) { return tb.z2h(String(s == null ? "" : s)).trim(); }
  function html(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }

  // 年のみを対象にした西暦→和暦（改元があった年は2通り表示。年単位の慣習なので日付までは扱わない）
  function gregorianYearToWareki(y) {
    const out = [];
    ERAS.forEach((era) => {
      const startY = era.start[0];
      const endY = era.end ? era.end[0] : Infinity;
      if (y >= startY && y <= endY) {
        const wy = y - era.base;
        if (wy >= 1) out.push({ era: era.name, year: wy });
      }
    });
    return out;
  }
  function waLabel(y) {
    if (y < 1873) return "対象外";
    const list = gregorianYearToWareki(y);
    if (list.length === 0) return "―";
    return list.map((r) => r.era + (r.year === 1 ? "元年" : r.year + "年")).join("/");
  }

  // "1990" "1990年" や「平成2年」「令和元年」を西暦年に変換する
  function parseBirthYear(raw) {
    const s = toHalf(raw).replace(/\s+/g, "");
    if (s === "") return { error: "生まれ年を入力してください" };
    let m = s.match(/^(\d{3,4})年?$/);
    if (m) {
      const y = parseInt(m[1], 10);
      if (y < 1873) return { error: "明治6年（1873年）より前は太陰太陽暦（旧暦）のため対象外です。" };
      if (y > 2200) return { error: "対応範囲外の年です。" };
      return { y: y };
    }
    m = s.match(/^(明治|大正|昭和|平成|令和)(元|\d{1,3})年$/);
    if (m) {
      const era = ERAS.find((e) => e.name === m[1]);
      const wy = m[2] === "元" ? 1 : parseInt(m[2], 10);
      if (wy < 1) return { error: "年は1以上（元年）で入力してください" };
      const maxWy = era.end ? era.end[0] - era.base : Infinity;
      if (wy > maxWy) return { error: m[1] + wy + "年は存在しません（" + m[1] + "は" + maxWy + "年までです）" };
      return { y: era.base + wy };
    }
    return { error: "「1990」または「平成2年」の形式で入力してください" };
  }

  const MALE_AGES = [25, 42, 61];
  const FEMALE_AGES = [19, 33, 37, 61];
  const TOSHIWAI = [
    ["還暦", 61], ["古希", 70], ["喜寿", 77], ["傘寿", 80], ["米寿", 88], ["卒寿", 90], ["白寿", 99], ["百寿", 100]
  ];

  function yakudoshiRows(birthYear, sex) {
    const ages = sex === "female" ? FEMALE_AGES : MALE_AGES;
    return ages.map((A) => ({
      A: A,
      pre: birthYear + (A - 1) - 1,
      main: birthYear + A - 1,
      post: birthYear + (A + 1) - 1
    }));
  }
  function toshiwaiRows(birthYear) {
    return TOSHIWAI.map(([name, age]) => ({
      name: name, age: age,
      kazoeYear: birthYear + age - 1,
      manYear: birthYear + age
    }));
  }

  function mark(y, thisYear) {
    return y === thisYear ? " <strong class=\"ok\">← 今年</strong>" : "";
  }
  function cell(y, thisYear) {
    return html(y) + "年（" + html(waLabel(y)) + "）" + mark(y, thisYear);
  }

  function run() {
    const err = $("ty-error");
    err.textContent = "";
    const birth = parseBirthYear($("ty-birth").value);
    const sex = $("ty-sex").value;
    const thisYear = new Date().getFullYear();

    if (birth.error) {
      err.textContent = birth.error;
      $("ty-yaku-result").innerHTML = ""; $("ty-toshiwai-result").innerHTML = "";
    } else {
      const yr = yakudoshiRows(birth.y, sex);
      $("ty-yaku-result").innerHTML = '<table><thead><tr><th>年齢（数え年）</th><th>前厄</th><th>本厄</th><th>後厄</th></tr></thead><tbody>' +
        yr.map((r) => "<tr><td>" + r.A + "歳</td><td>" + cell(r.pre, thisYear) + "</td><td>" + cell(r.main, thisYear) + "</td><td>" + cell(r.post, thisYear) + "</td></tr>").join("") +
        "</tbody></table>";

      const tr = toshiwaiRows(birth.y);
      $("ty-toshiwai-result").innerHTML = '<table><thead><tr><th>名称</th><th>年齢</th><th>数え年で祝う場合</th><th>満年齢で祝う場合</th></tr></thead><tbody>' +
        tr.map((r) => "<tr><td>" + html(r.name) + "</td><td>" + r.age + "歳</td><td>" + cell(r.kazoeYear, thisYear) + "</td><td>" + cell(r.manYear, thisYear) + "</td></tr>").join("") +
        "</tbody></table>";
    }

    $("ty-thisyear-label").textContent = "今年（" + thisYear + "年）の厄年は何年生まれ？（" + (sex === "female" ? "女性" : "男性") + "）";
    const ages = sex === "female" ? FEMALE_AGES : MALE_AGES;
    const rows = [];
    ages.forEach((A) => {
      [["前厄", A - 1], ["本厄", A], ["後厄", A + 1]].forEach(([label, age]) => {
        rows.push({ A: A, label: label, birthYear: thisYear - age + 1 });
      });
    });
    $("ty-thisyear-result").innerHTML = '<table><thead><tr><th>年齢</th><th>区分</th><th>生まれ年</th></tr></thead><tbody>' +
      rows.map((r) => "<tr><td>" + r.A + "歳</td><td>" + html(r.label) + "</td><td>" + html(r.birthYear) + "年（" + html(waLabel(r.birthYear)) + "）</td></tr>").join("") +
      "</tbody></table>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["ty-birth", "ty-sex"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
