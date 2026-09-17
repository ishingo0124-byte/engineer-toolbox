(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const CAP = 1024;

  function parseIp(sRaw) {
    const s = tb.z2h(sRaw).trim();
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
    if (!m) throw new Error("IPv4アドレスの形式が正しくありません");
    let n = 0;
    for (let i = 1; i <= 4; i++) {
      const oct = parseInt(m[i], 10);
      if (oct < 0 || oct > 255) throw new Error("各オクテットは0〜255の範囲で入力してください");
      n = n * 256 + oct;
    }
    return n >>> 0;
  }
  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }
  function parseCidr(s) {
    const parts = tb.z2h(s).trim().split("/");
    if (parts.length !== 2) throw new Error("CIDR表記で入力してください（例: 192.168.10.0/24）");
    const ip = parseIp(parts[0]);
    const prefix = parseInt(parts[1], 10);
    if (!Number.isFinite(prefix) || prefix < 0 || prefix > 32) throw new Error("プレフィックス長は0〜32で入力してください");
    return { ip: ip, prefix: prefix };
  }
  function maskOf(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; }

  function neededPrefix(hosts, allowSmall) {
    if (allowSmall && hosts === 1) return 32;
    if (allowSmall && hosts === 2) return 31;
    for (let p = 30; p >= 0; p--) {
      const usable = Math.pow(2, 32 - p) - 2;
      if (usable >= hosts) return p;
    }
    throw new Error("要求ホスト数が大きすぎます");
  }

  function parseRequirements(text) {
    const lines = tb.z2h(text).split("\n").map((l) => l.trim()).filter((l) => l !== "");
    const rows = [];
    const errors = [];
    lines.forEach((line, idx) => {
      const m = /^(.*\S)\s+(\d+)$/.exec(line);
      if (!m) { errors.push((idx + 1) + "行目: 「名前 数値」の形式で入力してください（例: 営業 60）"); return; }
      const hosts = parseInt(m[2], 10);
      if (hosts <= 0) { errors.push((idx + 1) + "行目: 必要ホスト数は1以上にしてください"); return; }
      rows.push({ name: m[1], hosts: hosts });
    });
    return { rows: rows, errors: errors };
  }

  function trailingZeros(n) { if ((n >>> 0) === 0) return 32; let tz = 0; while (((n >>> tz) & 1) === 0) tz++; return tz; }
  function maxFitPow(remaining) { let p = 0; while (p < 32 && Math.pow(2, p + 1) <= remaining) p++; return p; }
  function rangeToCidrs(start, end, cap) {
    const blocks = []; let cur = start, truncated = false;
    while (cur <= end) {
      if (blocks.length >= cap) { truncated = true; break; }
      const remaining = end - cur + 1;
      const pow = Math.min(trailingZeros(cur), maxFitPow(remaining));
      const size = Math.pow(2, pow);
      blocks.push({ network: intToIp(cur), prefix: 32 - pow });
      cur += size;
    }
    return { blocks: blocks, truncated: truncated };
  }

  function allocate(parentCidrStr, reqText, allowSmall) {
    const parsed = parseCidr(parentCidrStr);
    const mask = maskOf(parsed.prefix);
    const base = (parsed.ip & mask) >>> 0;
    const parentSize = Math.pow(2, 32 - parsed.prefix);
    const parentEnd = base + parentSize - 1;
    const req = parseRequirements(reqText);
    const order = req.rows.map((r, i) => ({ r: r, i: i })).sort((a, b) => (b.r.hosts - a.r.hosts) || (a.i - b.i));
    let cur = base;
    const results = [];
    let overflow = false;
    order.forEach(({ r, i }) => {
      if (overflow) { results.push({ name: r.name, hosts: r.hosts, order: i, error: "手前の行が収まらなかったため未割当です" }); return; }
      let prefix;
      try { prefix = neededPrefix(r.hosts, allowSmall); } catch (e) { results.push({ name: r.name, hosts: r.hosts, order: i, error: e.message }); return; }
      const blockSize = Math.pow(2, 32 - prefix);
      const alignedStart = Math.ceil(cur / blockSize) * blockSize;
      const blockEnd = alignedStart + blockSize - 1;
      if (blockEnd > parentEnd) {
        const shortfall = blockEnd - parentEnd;
        results.push({ name: r.name, hosts: r.hosts, order: i, error: "収まりません（" + tb.fmt(shortfall) + " アドレス不足）" });
        overflow = true;
        return;
      }
      let usableFirst, usableLast, usableCount, broadcast;
      if (prefix === 32) { usableFirst = alignedStart; usableLast = alignedStart; usableCount = 1; broadcast = alignedStart; }
      else if (prefix === 31) { usableFirst = alignedStart; usableLast = alignedStart + 1; usableCount = 2; broadcast = alignedStart + 1; }
      else { usableFirst = alignedStart + 1; usableLast = blockEnd - 1; usableCount = blockSize - 2; broadcast = blockEnd; }
      results.push({
        name: r.name, hosts: r.hosts, order: i, prefix: prefix,
        network: intToIp(alignedStart), broadcast: intToIp(broadcast), mask: intToIp(maskOf(prefix)),
        usableFirst: intToIp(usableFirst), usableLast: intToIp(usableLast), usableCount: usableCount, surplus: usableCount - r.hosts
      });
      cur = alignedStart + blockSize;
    });
    results.sort((a, b) => a.order - b.order);
    let leftover = null;
    if (!overflow && cur <= parentEnd) leftover = rangeToCidrs(cur, parentEnd, CAP);
    return { base: intToIp(base), basePrefix: parsed.prefix, parentSize: parentSize, results: results, errors: req.errors, leftover: leftover };
  }

  function run() {
    const err = $("vc-error"), summary = $("vc-summary"), table = $("vc-table"), rows = $("vc-rows");
    const lfSummary = $("vc-leftover-summary"), lfTable = $("vc-leftover-table"), lfRows = $("vc-leftover-rows");
    err.textContent = ""; err.style.whiteSpace = "pre-line";
    rows.innerHTML = ""; lfRows.innerHTML = "";
    table.hidden = true; lfTable.hidden = true;
    summary.textContent = ""; lfSummary.textContent = "";
    let data;
    try {
      data = allocate($("vc-parent").value, $("vc-reqs").value, $("vc-allow-small").checked);
    } catch (e) {
      err.textContent = e.message;
      return;
    }
    if (data.errors.length) err.textContent = data.errors.join("\n");
    if (data.results.length === 0) {
      summary.textContent = "必要ホスト数リストを1行以上入力してください（例: 営業 60）。";
      return;
    }
    summary.textContent = "親ネットワーク " + data.base + "/" + data.basePrefix + "（全" + tb.fmt(data.parentSize) + "アドレス）に " + data.results.length + " 件を割り当てました。";
    table.hidden = false;
    data.results.forEach((r) => {
      const tr = document.createElement("tr");
      const cells = [r.name, tb.fmt(r.hosts)];
      if (r.error) {
        cells.push(r.error, "-", "-", "-", "-", "-", "-");
        tr.classList.add("error");
      } else {
        cells.push("/" + r.prefix, r.network, r.broadcast, r.usableFirst + " 〜 " + r.usableLast, r.mask, tb.fmt(r.usableCount), tb.fmt(r.surplus));
      }
      cells.forEach((v, idx) => {
        const td = document.createElement("td");
        if (idx >= 2) td.className = "mono";
        td.textContent = v;
        tr.appendChild(td);
      });
      rows.appendChild(tr);
    });
    if (data.leftover && data.leftover.blocks.length) {
      lfTable.hidden = false;
      lfSummary.textContent = "未割当の残りアドレス（" + tb.fmt(data.leftover.blocks.length) + (data.leftover.truncated ? "+" : "") + " ブロック）:" + (data.leftover.truncated ? "（" + CAP + "件を超えたため以降は省略）" : "");
      data.leftover.blocks.forEach((b) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td"); td.className = "mono"; td.textContent = b.network + "/" + b.prefix;
        tr.appendChild(td);
        lfRows.appendChild(tr);
      });
    } else if (!data.results.some((r) => r.error)) {
      lfSummary.textContent = "未割当の残りアドレスはありません（親ネットワークをちょうど使い切りました）。";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("vc-parent").addEventListener("input", run);
    $("vc-reqs").addEventListener("input", run);
    $("vc-allow-small").addEventListener("change", run);
    run();
  });
})();
