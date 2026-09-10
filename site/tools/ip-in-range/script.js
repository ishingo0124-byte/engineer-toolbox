(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toHalfWidth(s) {
    return String(s || "").replace(/[０-９．]/g, (c) => (c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xfee0)));
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

  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  function maskFromCidr(cidr) {
    if (cidr === 0) return 0;
    return (0xffffffff << (32 - cidr)) >>> 0;
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
    if (a === 0) return "予約（RFC 1122: 0.0.0.0/8）";
    if (a >= 240) return "予約（実験用）";
    return "グローバル（該当なし）";
  }

  // 「開始IP - 終了IP」の区切り文字（半角/全角ハイフン・チルダ）
  const RANGE_SEP = /\s*(?:~|～|〜|-|—|ー)\s*/;

  function parseRangeLine(line) {
    const raw = line.trim();
    if (raw === "") return null;
    if (raw.indexOf("/") !== -1) {
      const [ipPart, cidrPart] = raw.split("/");
      const ipParts = parseIPv4(ipPart);
      const cidrRaw = toHalfWidth(String(cidrPart || "").trim());
      if (!ipParts || !/^\d{1,2}$/.test(cidrRaw)) return { error: raw };
      const cidr = parseInt(cidrRaw, 10);
      if (cidr < 0 || cidr > 32) return { error: raw };
      const maskInt = maskFromCidr(cidr);
      const ipInt = partsToInt(ipParts);
      const networkInt = (ipInt & maskInt) >>> 0;
      const broadcastInt = (networkInt | ((~maskInt) >>> 0)) >>> 0;
      return { start: networkInt, end: broadcastInt, label: intToIp(networkInt) + "/" + cidr };
    }
    const m = raw.split(RANGE_SEP);
    if (m.length !== 2) return { error: raw };
    const sParts = parseIPv4(m[0]);
    const eParts = parseIPv4(m[1]);
    if (!sParts || !eParts) return { error: raw };
    let sInt = partsToInt(sParts);
    let eInt = partsToInt(eParts);
    if (sInt > eInt) { const t = sInt; sInt = eInt; eInt = t; }
    return { start: sInt, end: eInt, label: intToIp(sInt) + " - " + intToIp(eInt) };
  }

  function setError(msg) {
    $("iir-error").textContent = msg || "";
  }

  function run() {
    const ipLines = $("iir-ips").value.split("\n").map((s) => s.trim()).filter((s) => s !== "");
    const rangeLines = $("iir-ranges").value.split("\n").map((s) => s.trim()).filter((s) => s !== "");

    const ranges = [];
    const badRanges = [];
    for (const line of rangeLines) {
      const r = parseRangeLine(line);
      if (!r) continue;
      if (r.error) badRanges.push(r.error);
      else ranges.push(r);
    }

    const tbody = $("iir-tbody");
    tbody.innerHTML = "";
    const badIps = [];
    let shown = 0;

    for (const ipLine of ipLines) {
      const parts = parseIPv4(ipLine);
      const tr = document.createElement("tr");
      if (!parts) {
        badIps.push(ipLine);
        continue;
      }
      const ipInt = partsToInt(parts);
      const matches = ranges.filter((r) => ipInt >= r.start && ipInt <= r.end).map((r) => r.label);
      const tdIp = document.createElement("td");
      tdIp.className = "mono";
      tdIp.textContent = intToIp(ipInt);
      const tdScope = document.createElement("td");
      tdScope.textContent = ipScope(parts);
      const tdMatch = document.createElement("td");
      tdMatch.className = "mono";
      if (matches.length === 0) {
        tdMatch.textContent = "該当なし";
      } else {
        tdMatch.textContent = matches.join(" / ");
      }
      tr.appendChild(tdIp);
      tr.appendChild(tdScope);
      tr.appendChild(tdMatch);
      tbody.appendChild(tr);
      shown++;
    }

    const errs = [];
    if (badIps.length) errs.push("IPとして読めない行: " + badIps.join(", "));
    if (badRanges.length) errs.push("範囲として読めない行: " + badRanges.join(", "));
    setError(errs.join(" / "));

    if (shown === 0 && badIps.length === 0) {
      $("iir-result-wrap").style.display = ipLines.length ? "" : "none";
    } else {
      $("iir-result-wrap").style.display = "";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("iir-ips").addEventListener("input", run);
    $("iir-ranges").addEventListener("input", run);
    run();
  });
})();
