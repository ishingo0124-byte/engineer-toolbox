(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const DAY_MS = 86400000;
  const WD_JA = ["日", "月", "火", "水", "木", "金", "土"];

  const CITIES = [
    { name: "東京", tz: "Asia/Tokyo" },
    { name: "UTC", tz: "UTC" },
    { name: "ロンドン", tz: "Europe/London" },
    { name: "パリ", tz: "Europe/Paris" },
    { name: "ベルリン", tz: "Europe/Berlin" },
    { name: "ニューヨーク", tz: "America/New_York" },
    { name: "ロサンゼルス", tz: "America/Los_Angeles" },
    { name: "シカゴ", tz: "America/Chicago" },
    { name: "シンガポール", tz: "Asia/Singapore" },
    { name: "シドニー", tz: "Australia/Sydney" },
    { name: "ムンバイ", tz: "Asia/Kolkata" },
    { name: "サンパウロ", tz: "America/Sao_Paulo" }
  ];

  function pad(n) { return String(n).padStart(2, "0"); }

  const dtfCache = {};
  function getFormatter(tz) {
    if (!dtfCache[tz]) {
      dtfCache[tz] = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    }
    return dtfCache[tz];
  }

  // 指定UTC時刻における、その都市の現地時刻の暦フィールドを取得
  function fieldsInZone(utcMs, tz) {
    const parts = getFormatter(tz).formatToParts(new Date(utcMs));
    const map = {};
    for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
    let h = +map.hour;
    if (h === 24) h = 0;
    return { y: +map.year, mo: +map.month, d: +map.day, h: h, mi: +map.minute, s: +map.second };
  }

  // 指定UTC時刻における、その都市のUTCからのオフセット（分）
  function offsetMinutes(utcMs, tz) {
    const f = fieldsInZone(utcMs, tz);
    const asUtc = Date.UTC(f.y, f.mo - 1, f.d, f.h, f.mi, f.s);
    return Math.round((asUtc - utcMs) / 60000);
  }

  // 「tzでの壁時計時刻 y-mo-d h:mi:s」に対応するUTCエポックミリ秒を求める（DST考慮、反復近似）
  function zonedTimeToUtc(y, mo, d, h, mi, s, tz) {
    let guess = Date.UTC(y, mo - 1, d, h, mi, s);
    for (let i = 0; i < 3; i++) {
      const off = offsetMinutes(guess, tz);
      const candidate = Date.UTC(y, mo - 1, d, h, mi, s) - off * 60000;
      if (candidate === guess) { guess = candidate; break; }
      guess = candidate;
    }
    return guess;
  }

  function fmtOffset(min) {
    const sign = min < 0 ? "-" : "+";
    const abs = Math.abs(min);
    const h = Math.floor(abs / 60), m = abs % 60;
    return "UTC" + sign + h + ":" + pad(m);
  }

  function isDstNow(utcMs, tz) {
    const f = fieldsInZone(utcMs, tz);
    const off = offsetMinutes(utcMs, tz);
    const offJan = offsetMinutes(Date.UTC(f.y, 0, 15, 12, 0, 0), tz);
    const offJul = offsetMinutes(Date.UTC(f.y, 6, 15, 12, 0, 0), tz);
    const standard = Math.min(offJan, offJul); // 夏時間は常に標準時より進む方向にずれる
    return off > standard;
  }

  function parsePicker(v) {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: m[6] ? +m[6] : 0 };
  }

  function run() {
    const errEl = $("tz-error");
    errEl.textContent = "";
    const v = $("tz-datetime").value;
    const p = parsePicker(v);
    if (!p) { errEl.textContent = "日時の形式が正しくありません"; return; }
    const baseTz = $("tz-base").value;
    let utcMs;
    try {
      utcMs = zonedTimeToUtc(p.y, p.mo, p.d, p.h, p.mi, p.s, baseTz);
    } catch (e) {
      errEl.textContent = "変換に失敗しました: " + e.message;
      return;
    }
    if (!Number.isFinite(utcMs)) { errEl.textContent = "日時が不正です"; return; }

    const baseDay = Date.UTC(p.y, p.mo - 1, p.d);
    const tbody = $("tz-tbody");
    tbody.innerHTML = "";
    CITIES.forEach((city) => {
      const f = fieldsInZone(utcMs, city.tz);
      const off = offsetMinutes(utcMs, city.tz);
      const wd = new Date(Date.UTC(f.y, f.mo - 1, f.d)).getUTCDay();
      const dayDiff = Math.round((Date.UTC(f.y, f.mo - 1, f.d) - baseDay) / DAY_MS);
      const diffLabel = dayDiff === 0 ? "同日" : (dayDiff > 0 ? "翌" + dayDiff + "日" : "前" + (-dayDiff) + "日");
      const dst = isDstNow(utcMs, city.tz);
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + city.name + (city.tz !== "UTC" ? '<br><span class="hint">' + city.tz + "</span>" : "") + "</td>" +
        "<td class=\"mono\">" + f.y + "-" + pad(f.mo) + "-" + pad(f.d) + " " + pad(f.h) + ":" + pad(f.mi) + ":" + pad(f.s) +
        "（" + WD_JA[wd] + "）</td>" +
        "<td class=\"mono\">" + fmtOffset(off) + (dst ? "（夏時間）" : "") + "</td>" +
        "<td>" + diffLabel + "</td>";
      tbody.appendChild(tr);
    });
  }

  function todayFields(tz) {
    return fieldsInZone(Date.now(), tz);
  }

  function applyPreset(tz, h) {
    const f = todayFields(tz);
    $("tz-base").value = tz;
    $("tz-datetime").value = `${f.y}-${pad(f.mo)}-${pad(f.d)}T${pad(h)}:00:00`;
    run();
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("tz-datetime").addEventListener("input", run);
    $("tz-base").addEventListener("change", run);
    $("tz-preset1").addEventListener("click", () => applyPreset("Asia/Tokyo", 10));
    $("tz-preset2").addEventListener("click", () => applyPreset("Asia/Tokyo", 21));
    $("tz-preset3").addEventListener("click", () => applyPreset("UTC", 9));
    run();
  });
})();
