(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  /* =====================================================================
   * ログ行から日時を検出する（優先順位: Apache/nginx → ISO 8601 → syslog → epoch）
   * defaultOffsetMin: オフセット情報を含まない日時に適用するタイムゾーン（分）
   * assumedYear: 年を含まないsyslog形式に適用する年
   * =================================================================== */
  function detectTimestamp(line, defaultOffsetMin, assumedYear) {
    let m = line.match(/\[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s([+-]\d{4})\]/);
    if (m && MONTHS[m[2]] !== undefined) {
      const mon = MONTHS[m[2]];
      const sign = m[7][0] === "-" ? -1 : 1;
      const offMin = sign * (parseInt(m[7].slice(1, 3), 10) * 60 + parseInt(m[7].slice(3, 5), 10));
      const ms = Date.UTC(+m[3], mon, +m[1], +m[4], +m[5], +m[6]) - offMin * 60000;
      return { ms, matchText: m[0], format: "Apache/nginx" };
    }
    m = line.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?/);
    if (m) {
      const y = +m[1], mo = +m[2] - 1, d = +m[3], h = +m[4], mi = +m[5], s = +m[6];
      const fracMs = m[7] ? Math.round(parseFloat("0." + m[7]) * 1000) : 0;
      let offMin;
      if (m[8] && m[8] !== "Z") {
        const sign = m[8][0] === "-" ? -1 : 1;
        const clean = m[8].replace(":", "");
        offMin = sign * (parseInt(clean.slice(1, 3), 10) * 60 + parseInt(clean.slice(3, 5), 10));
      } else if (m[8] === "Z") offMin = 0;
      else offMin = defaultOffsetMin;
      const ms = Date.UTC(y, mo, d, h, mi, s, fracMs) - offMin * 60000;
      if (Number.isFinite(ms)) return { ms, matchText: m[0], format: "ISO 8601", hasOffset: !!m[8] };
    }
    m = line.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s(\d{2}):(\d{2}):(\d{2})/);
    if (m && MONTHS[m[1]] !== undefined) {
      const mon = MONTHS[m[1]];
      const ms = Date.UTC(assumedYear, mon, +m[2], +m[3], +m[4], +m[5]) - defaultOffsetMin * 60000;
      return { ms, matchText: m[0], format: "syslog", assumedYear: true };
    }
    m = line.match(/"(?:timestamp|time|ts|@timestamp)"\s*:\s*"?(\d{13}|\d{10})"?/i);
    if (m) {
      const digits = m[1].length, isMs = digits >= 12;
      const ms = isMs ? +m[1] : +m[1] * 1000;
      return { ms, matchText: m[0], format: "epoch(JSON)" };
    }
    m = line.match(/^(\d{13}|\d{10})\b/);
    if (m) {
      const digits = m[1].length, isMs = digits >= 12;
      const ms = isMs ? +m[1] : +m[1] * 1000;
      return { ms, matchText: m[0], format: "epoch" };
    }
    return null;
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
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
    return -new Date(ms).getTimezoneOffset();
  }
  function tzOffsetMinForNow(mode) {
    if (mode === "jst") return 540;
    if (mode === "utc") return 0;
    return -new Date().getTimezoneOffset();
  }

  const CURRENT_YEAR = new Date().getFullYear();

  function runDetectAndUnify() {
    const noteEl = $("lt-log-note");
    const outEl = $("lt-log-output");
    const text = $("lt-log-input").value;
    const tzMode = $("lt-tz").value;
    const mode = $("lt-mode").value;
    const offsetMin = tzOffsetMinForNow(tzMode);
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    if (text.trim() === "") { outEl.value = ""; noteEl.textContent = ""; return; }

    let detectedCount = 0, syslogCount = 0;
    const parsed = lines.map((line) => {
      if (line === "") return { line, det: null };
      const det = detectTimestamp(line, offsetMin, CURRENT_YEAR);
      if (det) { detectedCount++; if (det.assumedYear) syslogCount++; }
      return { line, det };
    });

    if (mode === "prefix") {
      const out = parsed.map((p) => {
        if (!p.det) return "[検出できず]\t" + p.line;
        return isoWithOffset(p.det.ms, offsetMin) + "\t" + p.line;
      });
      outEl.value = out.join("\n");
    } else {
      const withTs = parsed.filter((p) => p.det);
      const withoutTs = parsed.filter((p) => !p.det && p.line !== "");
      withTs.sort((a, b) => a.det.ms - b.det.ms);
      const out = withTs.map((p) => p.line);
      if (withoutTs.length > 0) {
        out.push("");
        out.push("# 以下はタイムスタンプを検出できなかった行（元の順序のまま）");
        withoutTs.forEach((p) => out.push(p.line));
      }
      outEl.value = out.join("\n");
    }

    let note = "検出: " + detectedCount + "行 / 未検出: " + (lines.filter((l) => l !== "").length - detectedCount) + "行";
    if (syslogCount > 0) note += "（うちsyslog形式 " + syslogCount + "行は年を" + CURRENT_YEAR + "年と仮定）";
    noteEl.textContent = note;
  }

  function buildChunks(text, label, offsetMin, assumedYear) {
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const chunks = [];
    let current = null;
    lines.forEach((line, idx) => {
      if (line === "" && idx === lines.length - 1) return; // 末尾の空行は無視
      const det = line === "" ? null : detectTimestamp(line, offsetMin, assumedYear);
      if (det) {
        current = { ms: det.ms, lines: [line], label };
        chunks.push(current);
      } else if (current) {
        current.lines.push(line);
      } else {
        current = { ms: -Infinity, lines: [line], label };
        chunks.push(current);
      }
    });
    return chunks;
  }

  function runMerge() {
    const noteEl = $("lt-merge-note");
    const outEl = $("lt-merge-output");
    const tzMode = $("lt-merge-tz").value;
    const offsetMin = tzOffsetMinForNow(tzMode);
    const files = [
      { text: $("lt-file-a").value, label: "A" },
      { text: $("lt-file-b").value, label: "B" },
      { text: $("lt-file-c").value, label: "C" }
    ].filter((f) => f.text.trim() !== "");
    if (files.length === 0) { outEl.value = ""; noteEl.textContent = ""; return; }

    let all = [];
    files.forEach((f) => { all = all.concat(buildChunks(f.text, f.label, offsetMin, CURRENT_YEAR)); });
    all.sort((a, b) => a.ms - b.ms);

    const out = [];
    all.forEach((c) => {
      c.lines.forEach((l, i) => {
        out.push("[" + c.label + "] " + l);
      });
    });
    outEl.value = out.join("\n");
    noteEl.textContent = files.length + "ファイル、合計" + all.length + "個のタイムスタンプ単位（継続行を含む）をマージしました。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("lt-current-year").textContent = String(CURRENT_YEAR);
    const d1 = tb.debounce(runDetectAndUnify, 150);
    $("lt-log-input").addEventListener("input", d1);
    $("lt-tz").addEventListener("change", d1);
    $("lt-mode").addEventListener("change", d1);
    const d2 = tb.debounce(runMerge, 150);
    ["lt-file-a", "lt-file-b", "lt-file-c"].forEach((id) => $(id).addEventListener("input", d2));
    $("lt-merge-tz").addEventListener("change", d2);
    runDetectAndUnify();
    runMerge();
  });
})();
