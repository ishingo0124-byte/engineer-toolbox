(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const CAP = 1024;

  function parseIp(sRaw) {
    const s = tb.z2h(sRaw).trim();
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
    if (!m) throw new Error("IPv4アドレスの形式が正しくありません（例: 192.168.0.1）");
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
    if (parts.length !== 2) throw new Error("CIDR表記で入力してください（例: 10.0.0.0/22）");
    const ip = parseIp(parts[0]);
    const prefix = parseInt(parts[1], 10);
    if (!Number.isFinite(prefix) || prefix < 0 || prefix > 32) throw new Error("プレフィックス長は0〜32で入力してください");
    return { ip: ip, prefix: prefix };
  }
  function trailingZeros(n) {
    if ((n >>> 0) === 0) return 32;
    let tz = 0;
    while (((n >>> tz) & 1) === 0) tz++;
    return tz;
  }
  function maxFitPow(remaining) {
    let p = 0;
    while (p < 32 && Math.pow(2, p + 1) <= remaining) p++;
    return p;
  }

  // ---- 1. 加減算 ----
  function runAdd() {
    const err = $("ia-add-error"), out = $("ia-add-result");
    err.textContent = "";
    try {
      const base = parseIp($("ia-add-ip").value);
      const deltaStr = tb.z2h($("ia-add-delta").value).trim();
      if (deltaStr === "" || !/^[+-]?\d+$/.test(deltaStr)) throw new Error("加減算する整数を入力してください");
      const delta = parseInt(deltaStr, 10);
      const result = base + delta;
      if (result < 0 || result > 0xffffffff) throw new Error("結果が 0.0.0.0 未満、または 255.255.255.255 を超えています");
      out.textContent = intToIp(result);
    } catch (e) {
      err.textContent = e.message;
      out.textContent = "-";
    }
  }

  // ---- 2. 範囲→個数・最小CIDR分解 ----
  function runRange() {
    const err = $("ia-range-error"), summary = $("ia-range-summary"), table = $("ia-range-table"), rows = $("ia-range-rows");
    err.textContent = "";
    rows.innerHTML = "";
    table.hidden = true;
    try {
      const start = parseIp($("ia-range-start").value);
      const end = parseIp($("ia-range-end").value);
      if (start > end) throw new Error("開始アドレスが終了アドレスより後ろになっています");
      const count = end - start + 1;
      const blocks = [];
      let cur = start, truncated = false;
      while (cur <= end) {
        if (blocks.length >= CAP) { truncated = true; break; }
        const remaining = end - cur + 1;
        const pow = Math.min(trailingZeros(cur), maxFitPow(remaining));
        const size = Math.pow(2, pow);
        blocks.push({ network: intToIp(cur), prefix: 32 - pow, first: intToIp(cur), last: intToIp(cur + size - 1) });
        cur += size;
      }
      summary.textContent = "個数: " + tb.fmt(count) + " 件 / 最小 " + tb.fmt(blocks.length) + (truncated ? "+" : "") + " 個のCIDRに分解できます。" + (truncated ? "（" + CAP + "件を超えたため以降は省略）" : "");
      table.hidden = false;
      blocks.forEach((b) => {
        const tr = document.createElement("tr");
        const c1 = document.createElement("td"); c1.className = "mono"; c1.textContent = b.network + "/" + b.prefix;
        const c2 = document.createElement("td"); c2.className = "mono"; c2.textContent = b.first;
        const c3 = document.createElement("td"); c3.className = "mono"; c3.textContent = b.last;
        tr.appendChild(c1); tr.appendChild(c2); tr.appendChild(c3);
        rows.appendChild(tr);
      });
    } catch (e) {
      err.textContent = e.message;
      summary.textContent = "";
    }
  }

  // ---- 3. ネットワークの等分割 ----
  function runSplit() {
    const err = $("ia-split-error"), summary = $("ia-split-summary"), table = $("ia-split-table"), rows = $("ia-split-rows");
    err.textContent = "";
    rows.innerHTML = "";
    table.hidden = true;
    try {
      const { ip, prefix } = parseCidr($("ia-split-cidr").value);
      const newPrefixStr = tb.z2h($("ia-split-newprefix").value).trim();
      if (newPrefixStr === "" || !/^\d+$/.test(newPrefixStr)) throw new Error("分割後のプレフィックス長を整数で入力してください");
      const newPrefix = parseInt(newPrefixStr, 10);
      if (newPrefix < prefix) throw new Error("分割後のプレフィックス長は元の /" + prefix + " 以上にしてください");
      if (newPrefix > 32) throw new Error("プレフィックス長は32以下で入力してください");
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const base = (ip & mask) >>> 0;
      const normalizedNote = base !== ip ? "（入力アドレスをネットワークアドレス " + intToIp(base) + " に正規化しました）" : "";
      const blockSize = Math.pow(2, 32 - newPrefix);
      const total = Math.pow(2, newPrefix - prefix);
      const shown = Math.min(total, CAP);
      summary.textContent = "全 " + tb.fmt(total) + " 個" + normalizedNote + (total > CAP ? "。先頭 " + CAP + " 件のみ表示します。" : "。");
      table.hidden = false;
      for (let i = 0; i < shown; i++) {
        const netStart = base + i * blockSize;
        const tr = document.createElement("tr");
        const c0 = document.createElement("td"); c0.textContent = String(i + 1);
        const c1 = document.createElement("td"); c1.className = "mono"; c1.textContent = intToIp(netStart) + "/" + newPrefix;
        const c2 = document.createElement("td"); c2.className = "mono"; c2.textContent = intToIp(netStart);
        const c3 = document.createElement("td"); c3.className = "mono"; c3.textContent = intToIp(netStart + blockSize - 1);
        tr.appendChild(c0); tr.appendChild(c1); tr.appendChild(c2); tr.appendChild(c3);
        rows.appendChild(tr);
      }
    } catch (e) {
      err.textContent = e.message;
      summary.textContent = "";
    }
  }

  function run() { runAdd(); runRange(); runSplit(); }

  document.addEventListener("DOMContentLoaded", () => {
    ["ia-add-ip", "ia-add-delta"].forEach((id) => $(id).addEventListener("input", runAdd));
    ["ia-range-start", "ia-range-end"].forEach((id) => $(id).addEventListener("input", runRange));
    ["ia-split-cidr", "ia-split-newprefix"].forEach((id) => $(id).addEventListener("input", runSplit));
    run();
  });
})();
