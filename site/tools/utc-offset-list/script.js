(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const JST = 540;

  // 代表都市（IANA タイムゾーン名）。夏時間の判定はブラウザの Intl に任せる
  const CITIES = [
    ["ホノルル", "Pacific/Honolulu"], ["アンカレッジ", "America/Anchorage"],
    ["ロサンゼルス", "America/Los_Angeles"], ["フェニックス", "America/Phoenix"],
    ["デンバー", "America/Denver"], ["シカゴ", "America/Chicago"],
    ["ニューヨーク", "America/New_York"], ["ハリファックス", "America/Halifax"],
    ["セントジョンズ", "America/St_Johns"], ["サンパウロ", "America/Sao_Paulo"],
    ["レイキャビク", "Atlantic/Reykjavik"], ["ロンドン", "Europe/London"],
    ["パリ", "Europe/Paris"], ["アテネ", "Europe/Athens"], ["モスクワ", "Europe/Moscow"],
    ["ドバイ", "Asia/Dubai"], ["テヘラン", "Asia/Tehran"], ["ムンバイ", "Asia/Kolkata"],
    ["カトマンズ", "Asia/Kathmandu"], ["バンコク", "Asia/Bangkok"], ["上海", "Asia/Shanghai"],
    ["東京", "Asia/Tokyo"], ["アデレード", "Australia/Adelaide"], ["シドニー", "Australia/Sydney"],
    ["オークランド", "Pacific/Auckland"]
  ];

  function half(s) { return window.tb.z2h(String(s == null ? "" : s)).trim(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmtOffset(min) {
    const sg = min < 0 ? "-" : "+", a = Math.abs(min);
    return "UTC" + sg + pad(Math.floor(a / 60)) + ":" + pad(a % 60);
  }
  function fmtDiff(offMin) {
    const d = offMin - JST;
    if (d === 0) return "日本と同じ";
    const a = Math.abs(d), h = Math.floor(a / 60), m = a % 60;
    return "日本より" + (h ? h + "時間" : "") + (m ? m + "分" : "") + (d > 0 ? "早い" : "遅い");
  }
  function dayLabel(shift) {
    if (shift === 0) return "同日";
    if (shift === 1) return "翌日";
    if (shift === -1) return "前日";
    return (shift > 0 ? "+" : "") + shift + "日";
  }
  // "2:00" "02:00" "0200" "2" → 分。不正は null
  function parseTime(raw) {
    const s = half(raw);
    let m = /^(\d{1,2}):(\d{2})$/.exec(s) || /^(\d{2})(\d{2})$/.exec(s);
    let h, mi;
    if (m) { h = parseInt(m[1], 10); mi = parseInt(m[2], 10); }
    else if (/^\d{1,2}$/.test(s)) { h = parseInt(s, 10); mi = 0; }
    else return null;
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function fmtClock(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }
  // 入力時刻(分) + 変換差(分) → { clock, shift }
  function shiftTime(base, delta) {
    const total = base + delta;
    return { clock: ((total % 1440) + 1440) % 1440, shift: Math.floor(total / 1440) };
  }

  function show(rId, eId, text, err) {
    $(eId).textContent = err || "";
    $(rId).textContent = err ? "" : text;
  }

  function run1() {
    const t = parseTime($("uo-t1").value);
    if (t === null) { show("uo-r1", "uo-e1", "", "時刻は 2:00 や 14:30 のように入力してください（0:00〜23:59）"); return; }
    const off = parseInt($("uo-off1").value, 10);
    if (isNaN(off)) { show("uo-r1", "uo-e1", "", "オフセットを選んでください"); return; }
    const r = shiftTime(t, JST - off);
    show("uo-r1", "uo-e1", fmtOffset(off) + " の " + fmtClock(t) + " = 日本時間 " + fmtClock(r.clock) + "（" + dayLabel(r.shift) + "）  ［" + fmtDiff(off) + "］");
  }
  function run2() {
    const t = parseTime($("uo-t2").value);
    if (t === null) { show("uo-r2", "uo-e2", "", "時刻は 11:00 や 23:30 のように入力してください（0:00〜23:59）"); return; }
    const off = parseInt($("uo-off2").value, 10);
    if (isNaN(off)) { show("uo-r2", "uo-e2", "", "オフセットを選んでください"); return; }
    const r = shiftTime(t, off - JST);
    show("uo-r2", "uo-e2", "日本時間 " + fmtClock(t) + " = " + fmtOffset(off) + " の " + fmtClock(r.clock) + "（" + dayLabel(r.shift) + "）  ［" + fmtDiff(off) + "］");
  }

  // 指定した瞬間(ms)における IANA タイムゾーンの UTC オフセット（分）
  function tzOffsetMin(tz, ms) {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    });
    const p = {};
    f.formatToParts(new Date(ms)).forEach((x) => { p[x.type] = parseInt(x.value, 10); });
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
    return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
  }

  function runCities() {
    const body = $("uo-cities"), err = $("uo-e3");
    const s = half($("uo-date").value);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    body.innerHTML = ""; err.textContent = "";
    if (!m) { err.textContent = "日付を選んでください"; return; }
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    const noon = Date.UTC(y, mo - 1, d, 12, 0, 0);
    if (isNaN(noon) || new Date(noon).getUTCDate() !== d) { err.textContent = "存在しない日付です"; return; }
    const jan = Date.UTC(y, 0, 15, 12), jul = Date.UTC(y, 6, 15, 12);
    let rows = "";
    CITIES.forEach((c) => {
      try {
        const cur = tzOffsetMin(c[1], noon);
        const std = Math.min(tzOffsetMin(c[1], jan), tzOffsetMin(c[1], jul));
        const hasDst = tzOffsetMin(c[1], jan) !== tzOffsetMin(c[1], jul);
        const dst = hasDst ? (cur > std ? "夏時間中" : "標準時（夏時間の制度あり）") : "夏時間なし";
        rows += "<tr><td>" + c[0] + "</td><td class=\"mono\">" + fmtOffset(cur) + "</td><td>" + dst + "</td><td>" + fmtDiff(cur) + "</td></tr>";
      } catch (e) { /* この環境が tz 名を持たない場合は行を飛ばす */ }
    });
    if (rows === "") err.textContent = "この環境ではタイムゾーン情報を取得できませんでした。下の一覧表をご覧ください。";
    body.innerHTML = rows;
  }

  function todayStr() {
    const n = new Date();
    return n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate());
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["uo-off1", "uo-t1"].forEach((id) => { $(id).addEventListener("input", run1); $(id).addEventListener("change", run1); });
    ["uo-off2", "uo-t2"].forEach((id) => { $(id).addEventListener("input", run2); $(id).addEventListener("change", run2); });
    const dt = $("uo-date");
    if (!dt.value) dt.value = todayStr();
    dt.addEventListener("input", runCities); dt.addEventListener("change", runCities);
    run1(); run2(); runCities();
  });
})();
