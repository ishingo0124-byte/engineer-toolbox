(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toHalfWidth(s) {
    return s.replace(/[０-９．]/g, (c) => (c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xfee0)));
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

  // 連続した1のあとに0が続く正しいマスクなら CIDR 長を返す。そうでなければ null。
  function cidrFromMask(maskInt) {
    const bin = maskInt.toString(2).padStart(32, "0");
    const m = bin.match(/^(1*)(0*)$/);
    if (!m) return null;
    return m[1].length;
  }

  function toBinaryDotted(n) {
    return intToParts(n).map((p) => p.toString(2).padStart(8, "0")).join(".");
  }

  function ipScope(parts) {
    const [a, b] = parts;
    if (a === 10) return "プライベート（RFC 1918: 10.0.0.0/8）";
    if (a === 172 && b >= 16 && b <= 31) return "プライベート（RFC 1918: 172.16.0.0/12）";
    if (a === 192 && b === 168) return "プライベート（RFC 1918: 192.168.0.0/16）";
    if (a === 127) return "ループバック（RFC 5735: 127.0.0.0/8）";
    if (a === 169 && b === 254) return "リンクローカル（RFC 3927: 169.254.0.0/16）";
    if (a === 100 && b >= 64 && b <= 127) return "キャリアグレードNAT（RFC 6598: 100.64.0.0/10）";
    if (a >= 224 && a <= 239) return "マルチキャスト（予約）";
    if (a >= 240) return "予約（実験用）";
    return "グローバル（インターネット上で到達可能な範囲）";
  }

  function ipClass(a) {
    if (a <= 127) return "クラスA";
    if (a <= 191) return "クラスB";
    if (a <= 223) return "クラスC";
    if (a <= 239) return "クラスD（マルチキャスト）";
    return "クラスE（予約）";
  }

  let syncing = false;

  function setError(msg) {
    $("sc-error").textContent = msg || "";
  }

  function clearResults() {
    ["sc-network", "sc-broadcast", "sc-first", "sc-last", "sc-hostcount", "sc-wildcard", "sc-class", "sc-scope",
      "sc-bin-ip", "sc-bin-mask", "sc-bin-net"].forEach((id) => { $(id).textContent = "-"; });
  }

  function run(source) {
    if (syncing) return;
    setError("");
    const ipRaw = $("sc-ip").value;
    const ipParts = parseIPv4(ipRaw);
    if (!ipParts) {
      clearResults();
      if (ipRaw.trim() !== "") setError("IPアドレスの形式が正しくありません（例: 192.168.1.10）");
      return;
    }

    let cidr = null;

    if (source === "mask") {
      const maskParts = parseIPv4($("sc-mask").value);
      if (!maskParts) { clearResults(); setError("サブネットマスクの形式が正しくありません"); return; }
      const maskInt = partsToInt(maskParts);
      cidr = cidrFromMask(maskInt);
      if (cidr === null) { clearResults(); setError("サブネットマスクとして無効です（1が連続していません）"); return; }
      syncing = true;
      $("sc-cidr").value = String(cidr);
      syncing = false;
    } else {
      const cidrRaw = toHalfWidth(String($("sc-cidr").value || "").trim()).replace(/^\//, "");
      if (!/^\d{1,2}$/.test(cidrRaw)) { clearResults(); setError("CIDR は 0〜32 の整数で入力してください"); return; }
      cidr = parseInt(cidrRaw, 10);
      if (cidr < 0 || cidr > 32) { clearResults(); setError("CIDR は 0〜32 の範囲で入力してください"); return; }
      syncing = true;
      $("sc-mask").value = intToIp(maskFromCidr(cidr));
      syncing = false;
    }

    const ipInt = partsToInt(ipParts);
    const maskInt = maskFromCidr(cidr);
    const wildcardInt = (~maskInt) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;

    let firstInt, lastInt, hostCount;
    if (cidr === 32) {
      firstInt = ipInt; lastInt = ipInt; hostCount = 1;
    } else if (cidr === 31) {
      firstInt = networkInt; lastInt = broadcastInt; hostCount = 2; // RFC 3021
    } else {
      firstInt = (networkInt + 1) >>> 0;
      lastInt = (broadcastInt - 1) >>> 0;
      hostCount = Math.pow(2, 32 - cidr) - 2;
    }

    $("sc-network").textContent = intToIp(networkInt) + (cidr === 32 ? "（ホストアドレスそのもの）" : "");
    $("sc-broadcast").textContent = (cidr === 32) ? "（該当なし）" : intToIp(broadcastInt);
    $("sc-first").textContent = intToIp(firstInt);
    $("sc-last").textContent = intToIp(lastInt);
    $("sc-hostcount").textContent = tb.fmt(hostCount) + (cidr === 31 ? "（/31・RFC 3021、両方とも使用可）" : cidr === 32 ? "（ホスト指定）" : "");
    $("sc-wildcard").textContent = intToIp(wildcardInt);
    $("sc-class").textContent = ipClass(ipParts[0]);
    $("sc-scope").textContent = ipScope(ipParts);
    $("sc-bin-ip").textContent = toBinaryDotted(ipInt);
    $("sc-bin-mask").textContent = toBinaryDotted(maskInt);
    $("sc-bin-net").textContent = toBinaryDotted(networkInt);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("sc-ip").addEventListener("input", () => run("cidr"));
    $("sc-cidr").addEventListener("input", () => run("cidr"));
    $("sc-mask").addEventListener("input", () => run("mask"));
    run("cidr");
  });
})();
