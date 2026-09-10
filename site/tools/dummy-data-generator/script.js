(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---- 簡易PRNG（mulberry32）。シード指定時に毎回同じ乱数列を再現するために使用 ----
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t |= 0; t = (t + 0x6D2B79F5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStringToInt(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  function makeRng(seedText) {
    const s = tb.z2h(String(seedText || "")).trim();
    if (s === "") return Math.random; // シード未指定時はMath.random（再現不可・暗号用途ではない一般的な擬似乱数）
    const numeric = /^-?\d+$/.test(s) ? (parseInt(s, 10) >>> 0) : hashStringToInt(s);
    return mulberry32(numeric);
  }

  // ---- 架空の人名・地名などのデータ（実在の人物・企業を示すものではありません） ----
  const SURNAMES = [
    { k: "佐藤", h: "さとう", r: "Sato" }, { k: "鈴木", h: "すずき", r: "Suzuki" }, { k: "高橋", h: "たかはし", r: "Takahashi" },
    { k: "田中", h: "たなか", r: "Tanaka" }, { k: "伊藤", h: "いとう", r: "Ito" }, { k: "渡辺", h: "わたなべ", r: "Watanabe" },
    { k: "山本", h: "やまもと", r: "Yamamoto" }, { k: "中村", h: "なかむら", r: "Nakamura" }, { k: "小林", h: "こばやし", r: "Kobayashi" },
    { k: "加藤", h: "かとう", r: "Kato" }, { k: "吉田", h: "よしだ", r: "Yoshida" }, { k: "山田", h: "やまだ", r: "Yamada" },
    { k: "佐々木", h: "ささき", r: "Sasaki" }, { k: "松本", h: "まつもと", r: "Matsumoto" }, { k: "井上", h: "いのうえ", r: "Inoue" },
    { k: "木村", h: "きむら", r: "Kimura" }, { k: "林", h: "はやし", r: "Hayashi" }, { k: "斎藤", h: "さいとう", r: "Saito" },
    { k: "清水", h: "しみず", r: "Shimizu" }, { k: "山口", h: "やまぐち", r: "Yamaguchi" },
  ];
  const GIVEN_MALE = [
    { k: "太郎", h: "たろう", r: "Taro" }, { k: "一郎", h: "いちろう", r: "Ichiro" }, { k: "健太", h: "けんた", r: "Kenta" },
    { k: "翔太", h: "しょうた", r: "Shota" }, { k: "大輔", h: "だいすけ", r: "Daisuke" }, { k: "拓也", h: "たくや", r: "Takuya" },
    { k: "直樹", h: "なおき", r: "Naoki" }, { k: "健一", h: "けんいち", r: "Kenichi" }, { k: "誠", h: "まこと", r: "Makoto" },
    { k: "浩二", h: "こうじ", r: "Koji" }, { k: "陽太", h: "ようた", r: "Yota" }, { k: "亮", h: "りょう", r: "Ryo" },
  ];
  const GIVEN_FEMALE = [
    { k: "花子", h: "はなこ", r: "Hanako" }, { k: "由美", h: "ゆみ", r: "Yumi" }, { k: "陽子", h: "ようこ", r: "Yoko" },
    { k: "さくら", h: "さくら", r: "Sakura" }, { k: "美咲", h: "みさき", r: "Misaki" }, { k: "愛", h: "あい", r: "Ai" },
    { k: "真由美", h: "まゆみ", r: "Mayumi" }, { k: "彩", h: "あや", r: "Aya" }, { k: "美優", h: "みゆ", r: "Miyu" },
    { k: "優花", h: "ゆうか", r: "Yuka" },
  ];
  // 都道府県＋代表的な市区（実在の組み合わせ）。番地以下はダミーで自動生成する
  const PREFECTURES = [
    ["北海道", "札幌市中央区"], ["青森県", "青森市"], ["岩手県", "盛岡市"], ["宮城県", "仙台市青葉区"],
    ["秋田県", "秋田市"], ["山形県", "山形市"], ["福島県", "福島市"], ["茨城県", "水戸市"],
    ["栃木県", "宇都宮市"], ["群馬県", "前橋市"], ["埼玉県", "さいたま市大宮区"], ["千葉県", "千葉市中央区"],
    ["東京都", "新宿区"], ["神奈川県", "横浜市中区"], ["新潟県", "新潟市中央区"], ["富山県", "富山市"],
    ["石川県", "金沢市"], ["福井県", "福井市"], ["山梨県", "甲府市"], ["長野県", "長野市"],
    ["岐阜県", "岐阜市"], ["静岡県", "静岡市葵区"], ["愛知県", "名古屋市中区"], ["三重県", "津市"],
    ["滋賀県", "大津市"], ["京都府", "京都市中京区"], ["大阪府", "大阪市中央区"], ["兵庫県", "神戸市中央区"],
    ["奈良県", "奈良市"], ["和歌山県", "和歌山市"], ["鳥取県", "鳥取市"], ["島根県", "松江市"],
    ["岡山県", "岡山市北区"], ["広島県", "広島市中区"], ["山口県", "山口市"], ["徳島県", "徳島市"],
    ["香川県", "高松市"], ["愛媛県", "松山市"], ["高知県", "高知市"], ["福岡県", "福岡市博多区"],
    ["佐賀県", "佐賀市"], ["長崎県", "長崎市"], ["熊本県", "熊本市中央区"], ["大分県", "大分市"],
    ["宮崎県", "宮崎市"], ["鹿児島県", "鹿児島市"], ["沖縄県", "那覇市"],
  ];
  const TOWN_WORDS = ["本町", "栄町", "旭町", "緑が丘", "中央", "春日町", "大手町", "若葉町", "曙町", "浜町", "桜ヶ丘", "新町"];
  const COMPANY_WORDS = ["太陽", "未来", "青空", "大地", "光", "風", "緑", "新星", "陽光", "共栄", "東西", "福光", "富士", "第一", "中央"];
  const COMPANY_SUFFIX = ["商事", "工業", "システム", "フーズ", "物流", "ホールディングス", "サービス", "商会"];
  const COMPANY_FORM = ["株式会社", "合同会社"];

  function fmtDate(d) {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function fmtDateTime(d) {
    const p = (n) => String(n).padStart(2, "0");
    return fmtDate(d) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  function calcAge(birth, refDate) {
    let age = refDate.getFullYear() - birth.getFullYear();
    const m = refDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) age--;
    return age;
  }
  function uuidV4(rng) {
    const b = new Array(16);
    for (let i = 0; i < 16; i++) b[i] = Math.floor(rng() * 256);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = b.map((x) => x.toString(16).padStart(2, "0"));
    return h[0] + h[1] + h[2] + h[3] + "-" + h[4] + h[5] + "-" + h[6] + h[7] + "-" + h[8] + h[9] + "-" + h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
  }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function digits(rng, n) { let s = ""; for (let i = 0; i < n; i++) s += Math.floor(rng() * 10); return s; }

  function genRow(index, rng, refDate) {
    const surname = pick(rng, SURNAMES);
    const isMale = rng() < 0.5;
    const given = pick(rng, isMale ? GIVEN_MALE : GIVEN_FEMALE);
    const age = 18 + Math.floor(rng() * 72); // 18〜89歳
    const y = refDate.getFullYear() - age;
    const m = 1 + Math.floor(rng() * 12);
    const daysInMonth = new Date(y, m, 0).getDate();
    const d = 1 + Math.floor(rng() * daysInMonth);
    const birth = new Date(y, m - 1, d);
    const emailLocal = (given.r + "." + surname.r).toLowerCase().replace(/[^a-z.]/g, "") + (100 + Math.floor(rng() * 900));
    const emailDomain = rng() < 0.5 ? "example.com" : "example.jp";
    const mobile = rng() < 0.6;
    const phone = mobile ? "090-" + digits(rng, 4) + "-" + digits(rng, 4) : "03-" + digits(rng, 4) + "-" + digits(rng, 4);
    const postal = String(100 + Math.floor(rng() * 900)) + "-" + digits(rng, 4);
    const pref = pick(rng, PREFECTURES);
    const city = pref[1] + pick(rng, TOWN_WORDS) + (1 + Math.floor(rng() * 5)) + "-" + (1 + Math.floor(rng() * 20)) + "-" + (1 + Math.floor(rng() * 10));
    const company = pick(rng, COMPANY_FORM) + pick(rng, COMPANY_WORDS) + pick(rng, COMPANY_SUFFIX);
    const dtOffsetMs = Math.floor(rng() * 365 * 3) * 86400000 + Math.floor(rng() * 86400) * 1000;
    const dt = new Date(refDate.getTime() - dtOffsetMs);
    return {
      id: index + 1,
      name_kanji: surname.k + " " + given.k,
      name_kana: surname.h + " " + given.h,
      name_romaji: given.r + " " + surname.r,
      gender: isMale ? "男性" : "女性",
      birthdate: fmtDate(birth),
      age: calcAge(birth, refDate),
      email: emailLocal + "@" + emailDomain,
      phone,
      postal,
      prefecture: pref[0],
      city,
      company,
      uuid: uuidV4(rng),
      price: 100 + Math.floor(rng() * 49900),
      datetime: fmtDateTime(dt),
    };
  }

  const COLUMNS = [
    "id", "name_kanji", "name_kana", "name_romaji", "gender", "birthdate", "age",
    "email", "phone", "postal", "prefecture", "city", "company", "uuid", "price", "datetime",
  ];

  function csvEscape(v) {
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toCsv(rows, cols) {
    const lines = [cols.join(",")];
    rows.forEach((r) => lines.push(cols.map((c) => csvEscape(r[c])).join(",")));
    return lines.join("\r\n");
  }
  function toJson(rows, cols) {
    return JSON.stringify(rows.map((r) => {
      const o = {};
      cols.forEach((c) => { o[c] = r[c]; });
      return o;
    }), null, 2);
  }
  const NUMERIC_COLS = new Set(["id", "age", "price"]);
  function sqlEscape(v) { return "'" + String(v).replace(/'/g, "''") + "'"; }
  function toSql(rows, cols, table) {
    const safeTable = /^[A-Za-z_][A-Za-z0-9_]*$/.test(table) ? table : "`" + table.replace(/`/g, "") + "`";
    const header = "INSERT INTO " + safeTable + " (" + cols.join(", ") + ") VALUES";
    const values = rows.map((r) => "  (" + cols.map((c) => (NUMERIC_COLS.has(c) ? String(r[c]) : sqlEscape(r[c]))).join(", ") + ")");
    return header + "\n" + values.join(",\n") + ";";
  }

  function selectedColumns() {
    return COLUMNS.filter((c) => $("ddg-col-" + c) && $("ddg-col-" + c).checked);
  }

  function run() {
    const errEl = $("ddg-error");
    const statusEl = $("ddg-status");
    errEl.textContent = "";
    let count = parseInt(tb.z2h($("ddg-count").value).trim(), 10);
    if (!Number.isFinite(count)) { errEl.textContent = "件数は数値で入力してください"; $("ddg-output").value = ""; statusEl.textContent = ""; return; }
    if (count < 1) count = 1;
    if (count > 1000) count = 1000;
    if (String(count) !== tb.z2h($("ddg-count").value).trim()) {
      statusEl.textContent = "件数は1〜1,000の範囲に調整されました（" + count + "件で生成）";
    } else {
      statusEl.textContent = count + "件生成しました";
    }
    const cols = selectedColumns();
    if (cols.length === 0) { errEl.textContent = "少なくとも1つ列を選択してください"; $("ddg-output").value = ""; return; }

    const rng = makeRng($("ddg-seed").value);
    const refDate = new Date();
    const rows = [];
    for (let i = 0; i < count; i++) rows.push(genRow(i, rng, refDate));

    const format = $("ddg-format").value;
    if (format === "csv") $("ddg-output").value = toCsv(rows, cols);
    else if (format === "json") $("ddg-output").value = toJson(rows, cols);
    else {
      const table = $("ddg-table").value.trim() || "users";
      $("ddg-output").value = toSql(rows, cols, table);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const watchIds = ["ddg-count", "ddg-seed", "ddg-format", "ddg-table"].concat(COLUMNS.map((c) => "ddg-col-" + c));
    watchIds.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener(el.type === "checkbox" ? "change" : "input", tb.debounce(run, 100));
    });
    run();
  });
})();
