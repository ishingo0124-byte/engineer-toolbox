(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function pad2(n) { return String(n).padStart(2, "0"); }
  function fmtJST(ms) {
    const d = new Date(ms + 9 * 3600000);
    return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()) + " " +
      pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds()) + " JST";
  }
  function fmtUTC(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()) + " " +
      pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds()) + " UTC";
  }
  function isoWithOffset(ms, offsetMin) {
    const local = new Date(ms + offsetMin * 60000);
    const y = local.getUTCFullYear(), mo = pad2(local.getUTCMonth() + 1), d = pad2(local.getUTCDate());
    const h = pad2(local.getUTCHours()), mi = pad2(local.getUTCMinutes()), s = pad2(local.getUTCSeconds());
    const sign = offsetMin >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMin);
    const oh = pad2(Math.floor(abs / 60)), om = pad2(abs % 60);
    return y + "-" + mo + "-" + d + "T" + h + ":" + mi + ":" + s + sign + oh + ":" + om;
  }
  function tzOffsetMin(mode, ms) {
    if (mode === "jst") return 540;
    if (mode === "utc") return 0;
    return -new Date(ms).getTimezoneOffset(); // browser: DST等も考慮しその瞬間のオフセットを使う
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const EXTRACT_RE = /(?<!\d)\d{13}(?!\d)|(?<!\d)\d{10}(?!\d)/g;

  function parseEpochToken(tok) {
    if (!/^[-+]?\d+$/.test(tok)) return { error: "整数として解釈できません: " + tok };
    let n;
    try { n = BigInt(tok); } catch (e) { return { error: "数値が大きすぎます: " + tok }; }
    const digits = (n < 0n ? -n : n).toString().length;
    const isMs = digits >= 12;
    const msBig = isMs ? n : n * 1000n;
    const msNum = Number(msBig);
    if (!Number.isFinite(msNum) || Math.abs(msNum) > 8640000000000000) return { error: "日時として扱える範囲外です: " + tok };
    return { isMs, ms: msNum, raw: tok };
  }

  function collectEpochRows(text, extractMode) {
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const rows = [];
    lines.forEach((line) => {
      const norm = tb.z2h(line).trim();
      if (norm === "") return;
      if (extractMode) {
        const matches = norm.match(EXTRACT_RE);
        if (!matches) return; // 数字を含まない行は無視（ログ全文貼り付け想定）
        matches.forEach((m) => rows.push({ display: m, source: norm, token: m }));
      } else {
        rows.push({ display: norm, source: norm, token: norm });
      }
    });
    return rows;
  }

  function runEpochToDate() {
    const errEl = $("eb-epoch-error");
    const tbody = $("eb-tbody1");
    const tsvEl = $("eb-tsv1");
    errEl.textContent = "";
    tbody.innerHTML = "";
    const text = $("eb-epoch-input").value;
    const extractMode = $("eb-extract-mode").checked;
    const tzMode = $("eb-tz1").value;
    const rows = collectEpochRows(text, extractMode);
    if (rows.length === 0) { tsvEl.value = ""; return; }

    const tsvLines = ["#\t入力値\t単位\tJST\tUTC\tISO 8601"];
    let html = "";
    rows.forEach((row, idx) => {
      const n = idx + 1;
      const parsed = parseEpochToken(row.token);
      if (parsed.error) {
        html += '<tr class="eb-err-row"><td>' + n + '</td><td class="mono">' + escapeHtml(row.display) + '</td><td colspan="4">' + escapeHtml(parsed.error) + '</td></tr>';
        tsvLines.push(n + "\t" + row.display + "\tエラー\t\t\t" + parsed.error);
        return;
      }
      const jst = fmtJST(parsed.ms), utc = fmtUTC(parsed.ms);
      const iso = isoWithOffset(parsed.ms, tzOffsetMin(tzMode, parsed.ms));
      const unit = parsed.isMs ? "ミリ秒" : "秒";
      html += '<tr><td>' + n + '</td><td class="mono">' + escapeHtml(row.display) + '</td><td>' + unit + '</td>' +
        '<td class="mono">' + jst + '</td><td class="mono">' + utc + '</td><td class="mono">' + iso + '</td></tr>';
      tsvLines.push([n, row.display, unit, jst, utc, iso].join("\t"));
    });
    tbody.innerHTML = html;
    tsvEl.value = tsvLines.join("\n");
  }

  function parseDateTimeLine(s) {
    const m = s.trim().match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] ? +m[4] : 0, mi: m[5] ? +m[5] : 0, sec: m[6] ? +m[6] : 0 };
  }
  function toEpochMs(p, tzMode) {
    let ms;
    if (tzMode === "jst") ms = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.sec) - 9 * 3600000;
    else if (tzMode === "utc") ms = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.sec);
    else ms = new Date(p.y, p.mo - 1, p.d, p.h, p.mi, p.sec).getTime();
    if (!Number.isFinite(ms)) return null;
    // ラウンドトリップで日付の妥当性を確認する（例: 2月30日のような不正な日付を検出）
    let check;
    if (tzMode === "jst") check = new Date(ms + 9 * 3600000);
    else if (tzMode === "utc") check = new Date(ms);
    else check = new Date(ms);
    const getY = tzMode === "browser" ? check.getFullYear() : check.getUTCFullYear();
    const getMo = (tzMode === "browser" ? check.getMonth() : check.getUTCMonth()) + 1;
    const getD = tzMode === "browser" ? check.getDate() : check.getUTCDate();
    if (getY !== p.y || getMo !== p.mo || getD !== p.d) return null;
    return ms;
  }

  function runDateToEpoch() {
    const errEl = $("eb-datetime-error");
    const tbody = $("eb-tbody2");
    const tsvEl = $("eb-tsv2");
    errEl.textContent = "";
    tbody.innerHTML = "";
    const text = $("eb-datetime-input").value;
    const tzMode = $("eb-tz2").value;
    const lines = text.replace(/\r\n?/g, "\n").split("\n").map((l) => tb.z2h(l).trim()).filter((l) => l !== "");
    if (lines.length === 0) { tsvEl.value = ""; return; }

    const tsvLines = ["#\t入力値\tエポック秒\tエポックミリ秒"];
    let html = "";
    lines.forEach((line, idx) => {
      const n = idx + 1;
      const p = parseDateTimeLine(line);
      if (!p) {
        html += '<tr class="eb-err-row"><td>' + n + '</td><td class="mono">' + escapeHtml(line) + '</td><td colspan="2">形式が認識できません（例: 2026-09-10 21:00:00）</td></tr>';
        tsvLines.push(n + "\t" + line + "\tエラー\tエラー");
        return;
      }
      const ms = toEpochMs(p, tzMode);
      if (ms === null) {
        html += '<tr class="eb-err-row"><td>' + n + '</td><td class="mono">' + escapeHtml(line) + '</td><td colspan="2">存在しない日時です</td></tr>';
        tsvLines.push(n + "\t" + line + "\tエラー\tエラー");
        return;
      }
      const sec = Math.floor(ms / 1000);
      html += '<tr><td>' + n + '</td><td class="mono">' + escapeHtml(line) + '</td><td class="mono">' + tb.fmt(sec) + '</td><td class="mono">' + tb.fmt(ms) + '</td></tr>';
      tsvLines.push([n, line, sec, ms].join("\t"));
    });
    tbody.innerHTML = html;
    tsvEl.value = tsvLines.join("\n");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const d1 = tb.debounce(runEpochToDate, 150);
    ["eb-epoch-input", "eb-extract-mode", "eb-tz1"].forEach((id) => {
      $(id).addEventListener(id === "eb-epoch-input" ? "input" : "change", d1);
    });
    const d2 = tb.debounce(runDateToEpoch, 150);
    ["eb-datetime-input", "eb-tz2"].forEach((id) => {
      $(id).addEventListener(id === "eb-datetime-input" ? "input" : "change", d2);
    });
    runEpochToDate();
    runDateToEpoch();
  });
})();
