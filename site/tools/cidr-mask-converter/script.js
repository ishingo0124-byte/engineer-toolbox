(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toHalfWidth(s) {
    return String(s || "").replace(/[０-９．／]/g, (c) => {
      if (c === "．") return ".";
      if (c === "／") return "/";
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    });
  }

  function parseIPv4(raw) {
    const s = toHalfWidth(String(raw || "").trim());
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return null;
    const parts = s.split(".").map(Number);
    for (const p of parts) if (p < 0 || p > 255 || !Number.isInteger(p)) return null;
    return parts;
  }

  function partsToInt(parts) {
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  }

  function intToParts(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }

  function intToIp(n) {
    return intToParts(n).join(".");
  }

  function maskFromCidr(cidr) {
    if (cidr === 0) return 0;
    return (0xffffffff << (32 - cidr)) >>> 0;
  }

  // 連続した1のあとに0が続く正しいマスクなら CIDR 長を、不連続なら null を返す。
  function cidrFromMask(maskInt) {
    const bin = maskInt.toString(2).padStart(32, "0");
    const m = bin.match(/^(1*)(0*)$/);
    if (!m) return null;
    return m[1].length;
  }

  function addrCount(cidr) {
    return Math.pow(2, 32 - cidr);
  }

  function hostCount(cidr) {
    if (cidr === 32) return 1;
    if (cidr === 31) return 2; // RFC 3021
    return addrCount(cidr) - 2;
  }

  function hostCountNote(cidr) {
    if (cidr === 32) return "（ホスト1件のみ）";
    if (cidr === 31) return "（/31・RFC 3021、両方とも使用可）";
    return "";
  }

  let syncing = false;

  function setError(msg) {
    $("cmc-error").textContent = msg || "";
  }

  function clearResults() {
    ["cmc-out-cidr", "cmc-out-mask", "cmc-out-wildcard", "cmc-out-addrcount", "cmc-out-hostcount"].forEach((id) => {
      $(id).textContent = "-";
    });
  }

  function applyResult(cidr) {
    const maskInt = maskFromCidr(cidr);
    const wildcardInt = (~maskInt) >>> 0;
    $("cmc-out-cidr").textContent = "/" + cidr;
    $("cmc-out-mask").textContent = intToIp(maskInt);
    $("cmc-out-wildcard").textContent = intToIp(wildcardInt);
    $("cmc-out-addrcount").textContent = tb.fmt(addrCount(cidr));
    $("cmc-out-hostcount").textContent = tb.fmt(hostCount(cidr)) + hostCountNote(cidr);

    syncing = true;
    $("cmc-cidr").value = String(cidr);
    $("cmc-mask").value = intToIp(maskInt);
    $("cmc-wildcard").value = intToIp(wildcardInt);
    syncing = false;
  }

  function run(source) {
    if (syncing) return;
    setError("");

    if (source === "mask") {
      const raw = $("cmc-mask").value;
      const parts = parseIPv4(raw);
      if (!parts) {
        clearResults();
        if (raw.trim() !== "") setError("サブネットマスクの形式が正しくありません（例: 255.255.255.0）");
        return;
      }
      const cidr = cidrFromMask(partsToInt(parts));
      if (cidr === null) {
        clearResults();
        setError("不連続なサブネットマスクです（1のビットが連続していません）");
        return;
      }
      applyResult(cidr);
    } else if (source === "wildcard") {
      const raw = $("cmc-wildcard").value;
      const parts = parseIPv4(raw);
      if (!parts) {
        clearResults();
        if (raw.trim() !== "") setError("ワイルドカードマスクの形式が正しくありません（例: 0.0.0.255）");
        return;
      }
      const maskInt = (~partsToInt(parts)) >>> 0;
      const cidr = cidrFromMask(maskInt);
      if (cidr === null) {
        clearResults();
        setError("不連続なワイルドカードマスクです（対応するサブネットマスクの1のビットが連続していません）");
        return;
      }
      applyResult(cidr);
    } else {
      const raw = toHalfWidth(String($("cmc-cidr").value || "").trim()).replace(/^\//, "");
      if (raw === "") { clearResults(); return; }
      if (!/^\d{1,2}$/.test(raw)) {
        clearResults();
        setError("CIDR は 0〜32 の整数で入力してください");
        return;
      }
      const cidr = parseInt(raw, 10);
      if (cidr < 0 || cidr > 32) {
        clearResults();
        setError("CIDR は 0〜32 の範囲で入力してください");
        return;
      }
      applyResult(cidr);
    }
  }

  function buildTable() {
    const tbody = $("cmc-table").querySelector("tbody");
    const frag = document.createDocumentFragment();
    for (let cidr = 0; cidr <= 32; cidr++) {
      const maskInt = maskFromCidr(cidr);
      const wildcardInt = (~maskInt) >>> 0;
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>/" + cidr + "</td>" +
        "<td>" + intToIp(maskInt) + "</td>" +
        "<td>" + intToIp(wildcardInt) + "</td>" +
        "<td>" + tb.fmt(addrCount(cidr)) + "</td>" +
        "<td>" + tb.fmt(hostCount(cidr)) + hostCountNote(cidr) + "</td>";
      frag.appendChild(tr);
    }
    tbody.appendChild(frag);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("cmc-cidr").addEventListener("input", () => run("cidr"));
    $("cmc-mask").addEventListener("input", () => run("mask"));
    $("cmc-wildcard").addEventListener("input", () => run("wildcard"));
    buildTable();
    run("cidr");
  });
})();
