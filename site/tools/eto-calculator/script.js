(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const STEM_KUN = ["きのえ", "きのと", "ひのえ", "ひのと", "つちのえ", "つちのと", "かのえ", "かのと", "みずのえ", "みずのと"];
  const STEM_ON = ["こう", "おつ", "へい", "てい", "ぼ", "き", "こう", "しん", "じん", "き"];
  const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const BRANCH_KUN = ["ね", "うし", "とら", "う", "たつ", "み", "うま", "ひつじ", "さる", "とり", "いぬ", "い"];
  const BRANCH_ON = ["し", "ちゅう", "いん", "ぼう", "しん", "し", "ご", "び", "しん", "ゆう", "じゅつ", "がい"];
  const ANIMAL = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];

  // 西暦年 = base + 和暦年。first/last は その元号が含まれる西暦年（改元年は両方の元号に含まれる）
  const ERAS = [
    { name: "明治", base: 1867, first: 1868, last: 1912 },
    { name: "大正", base: 1911, first: 1912, last: 1926 },
    { name: "昭和", base: 1925, first: 1926, last: 1989 },
    { name: "平成", base: 1988, first: 1989, last: 2019 },
    { name: "令和", base: 2018, first: 2019, last: Infinity }
  ];
  const MAX_Y = 9999;

  function mod(a, n) { return ((a % n) + n) % n; }
  // 西暦4年が甲子。1984年も甲子（60年周期）
  function etoIndex(y) { return mod(y - 4, 60); }
  function etoName(i) { return STEMS[i % 10] + BRANCHES[i % 12]; }
  function etoKun(i) { return STEM_KUN[i % 10] + BRANCH_KUN[i % 12]; }
  function etoOn(i) { return STEM_ON[i % 10] + BRANCH_ON[i % 12]; }

  function eraLabel(era, wy) { return era.name + (wy === 1 ? "元" : wy) + "年"; }
  function warekiList(y) {
    const out = [];
    ERAS.forEach((e) => { if (y >= e.first && y <= e.last) out.push(eraLabel(e, y - e.base)); });
    if (y === 1868) out.unshift("慶応4年");
    return out;
  }
  function warekiText(y) {
    const l = warekiList(y);
    if (!l.length) return "和暦なし（明治より前）";
    return l.join(" ／ ") + (y >= 1868 && y < 1873 ? "（旧暦の年とは少しずれます）" : "");
  }

  function parseYear(raw, allowGannen) {
    const s = tb.z2h(String(raw == null ? "" : raw)).trim().replace(/年$/, "");
    if (allowGannen && s === "元") return 1;
    if (!/^\d+$/.test(s)) return null;
    return parseInt(s, 10);
  }

  const FWD = ["et-g", "et-w", "et-eto", "et-kun", "et-on", "et-no", "et-stem", "et-branch", "et-risshun", "et-kanreki"];

  function runFwd() {
    const err = $("et-error");
    err.textContent = "";
    FWD.forEach((id) => { $(id).textContent = "-"; });
    const eraName = $("et-era").value;
    const n = parseYear($("et-year").value, eraName !== "西暦");
    if (n === null) { err.textContent = eraName === "西暦" ? "年は数字で入力してください" : "年は数字または「元年」で入力してください"; return; }
    let y;
    if (eraName === "西暦") {
      if (n < 1 || n > MAX_Y) { err.textContent = "西暦は1〜" + MAX_Y + "年の範囲で入力してください"; return; }
      y = n;
    } else {
      const era = ERAS.find((e) => e.name === eraName);
      if (n < 1) { err.textContent = "和暦の年は1（元年）以上で入力してください"; return; }
      const maxWy = era.last === Infinity ? MAX_Y - era.base : era.last - era.base;
      if (n > maxWy) { err.textContent = eraName + n + "年は存在しません（" + eraName + "は" + eraLabel(era, maxWy) + "までです）"; return; }
      y = era.base + n;
    }
    const i = etoIndex(y);
    const prev = mod(i - 1, 60);
    $("et-g").textContent = y + "年";
    $("et-w").textContent = warekiText(y);
    $("et-eto").textContent = etoName(i) + "年";
    $("et-kun").textContent = etoKun(i) + "（" + ANIMAL[i % 12] + "年）";
    $("et-on").textContent = etoOn(i);
    $("et-no").textContent = (i + 1) + " 番目（甲子が1番目・癸亥が60番目）";
    $("et-stem").textContent = STEMS[i % 10] + "（" + STEM_KUN[i % 10] + "／" + STEM_ON[i % 10] + "）";
    $("et-branch").textContent = BRANCHES[i % 12] + "（" + BRANCH_KUN[i % 12] + "／" + BRANCH_ON[i % 12] + "）";
    $("et-risshun").textContent = "立春（2月3〜5日ごろ）より前は前年の " + etoName(prev) + " とする流儀あり";
    $("et-kanreki").textContent = (y + 60) <= MAX_Y ? (y + 60) + "年（同じ " + etoName(i) + "）" : "-";
  }

  function runRev() {
    const err = $("et-error2"), box = $("et-rev");
    err.textContent = ""; box.textContent = "";
    const base = parseYear($("et-base").value, false);
    if (base === null || base < 1 || base > MAX_Y) { err.textContent = "基準年は1〜" + MAX_Y + "の数字で入力してください"; return; }
    const i = parseInt($("et-sel").value, 10);
    const y = base - mod(base - 4 - i, 60); // 基準年以前で直近の該当年
    const years = [y - 60, y, y + 60, y + 120].filter((v) => v >= 1 && v <= MAX_Y);
    const rows = years.map((v) => {
      const tag = v === y ? "直近（基準年以前）" : v < y ? "その前の周期" : v === y + 60 ? "次の周期" : "その次の周期";
      return "<div>" + tag + "：" + v + "年（" + warekiText(v) + "）</div>";
    });
    box.innerHTML = "<div><strong>" + etoName(i) + "（" + etoKun(i) + "）</strong></div>" + rows.join("");
    if (y < 1) box.innerHTML += '<p class="hint" style="margin:6px 0 0">基準年以前に該当年はありません（次の周期以降を表示）。</p>';
  }

  function run() { runFwd(); runRev(); }

  document.addEventListener("DOMContentLoaded", () => {
    const sel = $("et-sel");
    for (let i = 0; i < 60; i++) {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = (i + 1) + ". " + etoName(i) + "（" + etoKun(i) + "）";
      sel.appendChild(o);
    }
    sel.value = String(etoIndex(2026));
    $("et-base").value = String(new Date().getFullYear());
    ["et-era", "et-year", "et-sel", "et-base"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
