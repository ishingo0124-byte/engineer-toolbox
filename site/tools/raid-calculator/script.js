(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const UNIT_BYTES = { TB: 1e12, GB: 1e9, TiB: Math.pow(2, 40), GiB: Math.pow(2, 30) };

  function toHalfWidth(s) {
    return String(s).replace(/[０-９．]/g, (c) => (c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xfee0)));
  }

  function parseNumber(raw) {
    const s = toHalfWidth(String(raw || "").trim());
    if (s === "" || !/^\d+(\.\d+)?$/.test(s)) return null;
    const v = parseFloat(s);
    if (isNaN(v) || v <= 0) return null;
    return v;
  }

  function parseIntStrict(raw) {
    const s = toHalfWidth(String(raw || "").trim());
    if (!/^\d+$/.test(s)) return null;
    const v = parseInt(s, 10);
    if (!Number.isInteger(v) || v <= 0) return null;
    return v;
  }

  function formatBytes(bytes, family) {
    if (!isFinite(bytes)) return "-";
    if (bytes <= 0) return "0 " + (family === "binary" ? "GiB" : "GB");
    if (family === "binary") {
      if (bytes >= UNIT_BYTES.TiB) return round2(bytes / UNIT_BYTES.TiB) + " TiB";
      return round2(bytes / UNIT_BYTES.GiB) + " GiB";
    }
    if (bytes >= UNIT_BYTES.TB) return round2(bytes / UNIT_BYTES.TB) + " TB";
    return round2(bytes / UNIT_BYTES.GB) + " GB";
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  // RAIDレベルごとの計算ルールを返す。usableFactor: 生容量に対する実効容量の倍率。
  function raidSpec(level, count) {
    switch (level) {
      case "0":
        return { min: 2, evenOnly: false, usableFactor: () => 1, tolerance: () => 0, toleranceLabel: () => "0本（1本でも故障するとデータ喪失）" };
      case "1":
        return {
          min: 2, evenOnly: false,
          usableFactor: (n) => 1 / n,
          tolerance: (n) => n - 1,
          toleranceLabel: (n) => (n - 1) + "本（" + n + "本すべてが同一データのミラー）",
        };
      case "5":
        return {
          min: 3, evenOnly: false,
          usableFactor: (n) => (n - 1) / n,
          tolerance: () => 1,
          toleranceLabel: () => "1本",
        };
      case "6":
        return {
          min: 4, evenOnly: false,
          usableFactor: (n) => (n - 2) / n,
          tolerance: () => 2,
          toleranceLabel: () => "2本",
        };
      case "10":
        return {
          min: 4, evenOnly: true,
          usableFactor: () => 0.5,
          tolerance: (n) => n / 2,
          toleranceLabel: (n) => "最大" + (n / 2) + "本（各ミラーペアから1本ずつ。同じペアの2本が同時故障すると喪失）",
        };
      default:
        return null;
    }
  }

  function run() {
    const err = $("rc-error");
    err.textContent = "";
    const level = $("rc-level").value;
    const count = parseIntStrict($("rc-count").value);
    const capVal = parseNumber($("rc-capacity").value);
    const unit = $("rc-unit").value;
    const spec = raidSpec(level, count);

    const outIds = ["rc-raw", "rc-usable", "rc-overhead", "rc-efficiency", "rc-tolerance", "rc-minimum"];
    if (!spec) { err.textContent = "RAIDレベルが不正です"; outIds.forEach((id) => { $(id).textContent = "-"; }); return; }

    $("rc-minimum").textContent = spec.min + "本" + (spec.evenOnly ? "以上（偶数本）" : "以上");

    if (count === null) { err.textContent = "ディスク本数は1以上の整数で入力してください"; outIds.forEach((id) => { if (id !== "rc-minimum") $(id).textContent = "-"; }); return; }
    if (capVal === null) { err.textContent = "1本あたりの容量は0より大きい数値で入力してください"; outIds.forEach((id) => { if (id !== "rc-minimum") $(id).textContent = "-"; }); return; }
    if (count < spec.min) { err.textContent = "RAID " + level + " には最低 " + spec.min + " 本のディスクが必要です（現在 " + count + " 本）"; outIds.forEach((id) => { if (id !== "rc-minimum") $(id).textContent = "-"; }); return; }
    if (spec.evenOnly && count % 2 !== 0) { err.textContent = "RAID " + level + " は偶数本のディスクが必要です（現在 " + count + " 本）"; outIds.forEach((id) => { if (id !== "rc-minimum") $(id).textContent = "-"; }); return; }

    const family = (unit === "TiB" || unit === "GiB") ? "binary" : "decimal";
    const perDiskBytes = capVal * UNIT_BYTES[unit];
    const rawBytes = perDiskBytes * count;
    const usableFactor = spec.usableFactor(count);
    const usableBytes = rawBytes * usableFactor;
    const overheadBytes = rawBytes - usableBytes;

    $("rc-raw").textContent = formatBytes(rawBytes, family);
    $("rc-usable").textContent = formatBytes(usableBytes, family);
    $("rc-overhead").textContent = formatBytes(overheadBytes, family);
    $("rc-efficiency").textContent = round2(usableFactor * 100) + "%";
    $("rc-tolerance").textContent = spec.toleranceLabel(count);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["rc-level", "rc-count", "rc-capacity", "rc-unit"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
