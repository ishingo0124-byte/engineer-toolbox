(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toHalfWidth(s) {
    return tb.z2h(String(s == null ? "" : s));
  }

  function intToIp(n) {
    n = n >>> 0;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  function maskOf(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; }

  // "192.168.1.1" や "192.168.1.0/24" を1行分パース。エラーは message を返す。
  function parseLine(raw) {
    const s = toHalfWidth(raw).trim();
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(s);
    if (!m) return { error: "IPv4アドレス、または CIDR 表記で入力してください（例: 10.0.0.0/24）" };
    const octets = [m[1], m[2], m[3], m[4]].map(Number);
    for (const o of octets) if (o < 0 || o > 255) return { error: "各オクテットは0〜255の範囲で入力してください" };
    const prefix = m[5] === undefined ? 32 : parseInt(m[5], 10);
    if (prefix < 0 || prefix > 32) return { error: "プレフィックス長は0〜32の範囲で入力してください" };
    let ip = 0;
    for (const o of octets) ip = ip * 256 + o;
    ip = ip >>> 0;
    const mask = maskOf(prefix);
    const network = (ip & mask) >>> 0;
    const hostBitsSet = network !== ip;
    return { ip: ip, prefix: prefix, network: network, hostBitsSet: hostBitsSet };
  }

  // 2進で1が続いている最上位ビット数を返す（アライメント判定用）
  function trailingZeros(n) {
    n = n >>> 0;
    if (n === 0) return 32;
    let tz = 0;
    while (((n >>> tz) & 1) === 0) tz++;
    return tz;
  }
  function maxFitPow(remaining) {
    let p = 0;
    while (p < 32 && Math.pow(2, p + 1) <= remaining) p++;
    return p;
  }
  // [start, end]（両端含む・アドレス値）を最小個数のCIDRに分割
  function rangeToCidrs(start, end) {
    const blocks = [];
    let cur = start;
    while (cur <= end) {
      const remaining = end - cur + 1;
      const pow = Math.min(trailingZeros(cur), maxFitPow(remaining));
      const size = Math.pow(2, pow);
      blocks.push({ network: cur, prefix: 32 - pow });
      cur += size;
    }
    return blocks;
  }

  function aggregate(text) {
    const lines = toHalfWidth(text).split("\n");
    const messages = [];
    const ranges = [];
    let validCount = 0;
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed === "") return;
      const r = parseLine(line);
      if (r.error) { messages.push((idx + 1) + "行目: " + r.error + "（入力: " + trimmed + "）"); return; }
      validCount++;
      if (r.hostBitsSet) {
        messages.push((idx + 1) + "行目: ホストビットが立っています。" + intToIp(r.network) + "/" + r.prefix + " に正規化しました（入力: " + trimmed + "）");
      }
      const size = Math.pow(2, 32 - r.prefix);
      ranges.push({ start: r.network, end: r.network + size - 1 });
    });

    ranges.sort((a, b) => a.start - b.start);
    const merged = [];
    ranges.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end + 1) {
        if (r.end > last.end) last.end = r.end;
      } else {
        merged.push({ start: r.start, end: r.end });
      }
    });

    const outBlocks = [];
    merged.forEach((r) => { rangeToCidrs(r.start, r.end).forEach((b) => outBlocks.push(b)); });
    const totalAddr = merged.reduce((sum, r) => sum + (r.end - r.start + 1), 0);

    return {
      validCount: validCount,
      messages: messages,
      blocks: outBlocks,
      totalAddr: totalAddr
    };
  }

  function run() {
    const data = aggregate($("ca-input").value);
    $("ca-count-in").textContent = tb.fmt(data.validCount);
    $("ca-count-out").textContent = tb.fmt(data.blocks.length);
    $("ca-count-addr").textContent = tb.fmt(data.totalAddr);
    $("ca-output").value = data.blocks.map((b) => intToIp(b.network) + "/" + b.prefix).join("\n");
    $("ca-messages").textContent = data.messages.join("\n");
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ca-input").addEventListener("input", run);
    $("ca-clear").addEventListener("click", () => { $("ca-input").value = ""; run(); $("ca-input").focus(); });
    run();
  });
})();
