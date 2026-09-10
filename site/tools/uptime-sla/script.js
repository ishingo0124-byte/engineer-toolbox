(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const PERIODS = { year: 365 * 24 * 3600, month: 30 * 24 * 3600, week: 7 * 24 * 3600, day: 24 * 3600 };
  const TABLE_PERCENTS = [99, 99.5, 99.9, 99.95, 99.99, 99.995, 99.999, 99.9995, 99.9999];

  function toHalfWidth(s) {
    return String(s).replace(/[０-９．]/g, (c) => (c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xfee0)));
  }

  function parsePercent(raw) {
    const s = toHalfWidth(String(raw || "").trim());
    if (s === "" || !/^-?\d+(\.\d+)?$/.test(s)) return null;
    const v = parseFloat(s);
    if (isNaN(v)) return null;
    return v;
  }

  function formatBreakdown(totalSeconds) {
    if (!isFinite(totalSeconds)) return "-";
    if (totalSeconds <= 0) return "0秒";
    const days = Math.floor(totalSeconds / 86400);
    let rem = totalSeconds - days * 86400;
    const hours = Math.floor(rem / 3600);
    rem -= hours * 3600;
    const minutes = Math.floor(rem / 60);
    rem -= minutes * 60;
    let secs = rem;
    if (days === 0 && hours === 0 && minutes === 0 && secs < 1) {
      const ms = secs * 1000;
      return (Math.round(ms * 10) / 10) + "ミリ秒";
    }
    secs = Math.round(secs * 100) / 100;
    const secsStr = (Number.isInteger(secs) ? String(secs) : secs.toFixed(2)) + "秒";
    const parts = [];
    if (days > 0) parts.push(days + "日");
    if (hours > 0 || days > 0) parts.push(hours + "時間");
    if (minutes > 0 || hours > 0 || days > 0) parts.push(minutes + "分");
    parts.push(secsStr);
    return parts.join(" ");
  }

  function downtimeSeconds(availPercent, periodSeconds) {
    return (1 - availPercent / 100) * periodSeconds;
  }

  function runForward() {
    const err = $("usla-error");
    err.textContent = "";
    const avail = parsePercent($("usla-avail").value);
    if (avail === null || avail < 0 || avail > 100) {
      err.textContent = "稼働率は0〜100の数値で入力してください（例: 99.9）";
      ["usla-year", "usla-month", "usla-week", "usla-day"].forEach((id) => { $(id).textContent = "-"; });
      return;
    }
    $("usla-year").textContent = formatBreakdown(downtimeSeconds(avail, PERIODS.year));
    $("usla-month").textContent = formatBreakdown(downtimeSeconds(avail, PERIODS.month));
    $("usla-week").textContent = formatBreakdown(downtimeSeconds(avail, PERIODS.week));
    $("usla-day").textContent = formatBreakdown(downtimeSeconds(avail, PERIODS.day));
  }

  function runReverse() {
    const err = $("usla-rev-error");
    err.textContent = "";
    const periodSeconds = parseFloat($("usla-rev-period").value);
    const minutes = parsePercent($("usla-rev-minutes").value);
    if (minutes === null || minutes < 0) {
      err.textContent = "停止時間は0以上の数値（分）で入力してください";
      $("usla-rev-avail").textContent = "-";
      return;
    }
    const downSeconds = minutes * 60;
    if (downSeconds > periodSeconds) {
      err.textContent = "停止時間が対象期間の長さを超えています";
      $("usla-rev-avail").textContent = "-";
      return;
    }
    const avail = (1 - downSeconds / periodSeconds) * 100;
    $("usla-rev-avail").textContent = (Math.round(avail * 1e6) / 1e6) + "%";
  }

  function runComposite() {
    const err = $("usla-comp-error");
    err.textContent = "";
    const a = parsePercent($("usla-comp-a").value);
    const b = parsePercent($("usla-comp-b").value);
    if (a === null || b === null || a < 0 || a > 100 || b < 0 || b > 100) {
      err.textContent = "A・Bとも0〜100の数値で入力してください";
      $("usla-comp-series").textContent = "-";
      $("usla-comp-parallel").textContent = "-";
      return;
    }
    const series = (a * b) / 100;
    const parallel = 100 - ((100 - a) * (100 - b)) / 100;
    $("usla-comp-series").textContent = (Math.round(series * 1e6) / 1e6) + "%";
    $("usla-comp-parallel").textContent = (Math.round(parallel * 1e6) / 1e6) + "%";
  }

  function buildTable() {
    const tbody = document.querySelector("#usla-table tbody");
    tbody.innerHTML = "";
    TABLE_PERCENTS.forEach((p) => {
      const tr = document.createElement("tr");
      const cells = [
        p + "%",
        formatBreakdown(downtimeSeconds(p, PERIODS.year)),
        formatBreakdown(downtimeSeconds(p, PERIODS.month)),
        formatBreakdown(downtimeSeconds(p, PERIODS.week)),
        formatBreakdown(downtimeSeconds(p, PERIODS.day)),
      ];
      cells.forEach((c) => {
        const td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("usla-avail").addEventListener("input", runForward);
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("usla-avail").value = btn.getAttribute("data-preset");
        runForward();
      });
    });
    $("usla-rev-period").addEventListener("input", runReverse);
    $("usla-rev-period").addEventListener("change", runReverse);
    $("usla-rev-minutes").addEventListener("input", runReverse);
    $("usla-comp-a").addEventListener("input", runComposite);
    $("usla-comp-b").addEventListener("input", runComposite);
    buildTable();
    runForward();
    runReverse();
    runComposite();
  });
})();
