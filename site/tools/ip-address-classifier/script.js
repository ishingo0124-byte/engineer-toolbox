(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function parseIPv4(str) {
    const s = String(str).trim();
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
    if (!m) return null;
    let val = 0;
    for (let i = 1; i <= 4; i++) {
      const part = m[i];
      if (part.length > 1 && part[0] === "0") return null;
      const n = parseInt(part, 10);
      if (n > 255) return null;
      val = val * 256 + n;
    }
    return val >>> 0;
  }

  function parseIPv6(raw) {
    let s = String(raw).trim();
    if (s === "") return null;
    const pct = s.indexOf("%");
    if (pct >= 0) s = s.slice(0, pct);
    if (s === "" || !/^[0-9a-fA-F:.]+$/.test(s)) return null;
    const lastColon = s.lastIndexOf(":");
    const tailStr = lastColon >= 0 ? s.slice(lastColon + 1) : s;
    if (tailStr.indexOf(".") >= 0) {
      const v4 = parseIPv4(tailStr);
      if (v4 === null) return null;
      const hi = ((v4 >>> 16) & 0xffff).toString(16);
      const lo = (v4 & 0xffff).toString(16);
      s = s.slice(0, lastColon + 1) + hi + ":" + lo;
    }
    const dbl = (s.match(/::/g) || []).length;
    if (dbl > 1) return null;
    let headPart, tailPart, hasDouble = false;
    if (dbl === 1) {
      hasDouble = true;
      const idx = s.indexOf("::");
      headPart = s.slice(0, idx);
      tailPart = s.slice(idx + 2);
      if (headPart.indexOf(":::") >= 0 || tailPart.indexOf("::") >= 0) return null;
    } else {
      headPart = s;
      tailPart = "";
    }
    const head = headPart === "" ? [] : headPart.split(":");
    const tail = tailPart === "" ? [] : tailPart.split(":");
    let groups;
    if (hasDouble) {
      const missing = 8 - head.length - tail.length;
      if (missing < 0) return null;
      groups = head.concat(new Array(missing).fill("0")).concat(tail);
    } else {
      groups = head;
    }
    if (groups.length !== 8) return null;
    const nums = [];
    for (const g of groups) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
      nums.push(parseInt(g, 16));
    }
    return nums;
  }

  function ipv6ToBig(groups) {
    let big = 0n;
    for (const g of groups) big = (big << 16n) | BigInt(g);
    return big;
  }

  function ipv4InRange(val, baseStr, len) {
    const base = parseIPv4(baseStr);
    if (len <= 0) return true;
    const mask = len >= 32 ? 0xFFFFFFFF : (0xFFFFFFFF << (32 - len)) >>> 0;
    return ((val & mask) >>> 0) === ((base & mask) >>> 0);
  }

  const V4_RANGES = [
    { base: "0.0.0.0", len: 8, name: "未指定/このネットワーク", rfc: "RFC 1122", global: false },
    { base: "10.0.0.0", len: 8, name: "プライベート", rfc: "RFC 1918", global: false },
    { base: "100.64.0.0", len: 10, name: "CGNAT（共有アドレス空間）", rfc: "RFC 6598", global: false },
    { base: "127.0.0.0", len: 8, name: "ループバック", rfc: "RFC 1122", global: false },
    { base: "169.254.0.0", len: 16, name: "リンクローカル", rfc: "RFC 3927", global: false },
    { base: "172.16.0.0", len: 12, name: "プライベート", rfc: "RFC 1918", global: false },
    { base: "192.0.0.0", len: 24, name: "IETFプロトコル割当", rfc: "RFC 6890", global: false },
    { base: "192.0.2.0", len: 24, name: "ドキュメント用（TEST-NET-1）", rfc: "RFC 5737", global: false },
    { base: "192.88.99.0", len: 24, name: "6to4リレーエニーキャスト", rfc: "RFC 3068", global: false },
    { base: "192.168.0.0", len: 16, name: "プライベート", rfc: "RFC 1918", global: false },
    { base: "198.18.0.0", len: 15, name: "ベンチマーク用", rfc: "RFC 2544", global: false },
    { base: "198.51.100.0", len: 24, name: "ドキュメント用（TEST-NET-2）", rfc: "RFC 5737", global: false },
    { base: "203.0.113.0", len: 24, name: "ドキュメント用（TEST-NET-3）", rfc: "RFC 5737", global: false },
    { base: "224.0.0.0", len: 4, name: "マルチキャスト", rfc: "RFC 1112", global: false },
    { base: "240.0.0.0", len: 4, name: "予約済み", rfc: "RFC 1112", global: false }
  ];

  function classifyIPv4(val) {
    if (val === 0xFFFFFFFF) return { name: "ブロードキャスト（Limited Broadcast）", rfc: "RFC 919 / RFC 8190", global: false };
    for (const r of V4_RANGES) {
      if (ipv4InRange(val, r.base, r.len)) return r;
    }
    return { name: "グローバル", rfc: "—", global: true };
  }

  const V6_RANGES = [
    { prefix: "::", len: 128, name: "未指定アドレス", rfc: "RFC 4291", global: false },
    { prefix: "::1", len: 128, name: "ループバック", rfc: "RFC 4291", global: false },
    { prefix: "::ffff:0:0", len: 96, name: "IPv4射影アドレス", rfc: "RFC 4291", global: false },
    { prefix: "64:ff9b::", len: 96, name: "IPv4/IPv6変換（NAT64）", rfc: "RFC 6052", global: true },
    { prefix: "100::", len: 64, name: "Discard-Onlyアドレス", rfc: "RFC 6666", global: false },
    { prefix: "2001:db8::", len: 32, name: "ドキュメント用", rfc: "RFC 3849", global: false },
    { prefix: "2002::", len: 16, name: "6to4", rfc: "RFC 3056", global: true },
    { prefix: "fc00::", len: 7, name: "ユニークローカル（ULA）", rfc: "RFC 4193", global: false },
    { prefix: "fe80::", len: 10, name: "リンクローカル", rfc: "RFC 4291", global: false },
    { prefix: "ff00::", len: 8, name: "マルチキャスト", rfc: "RFC 4291", global: false }
  ];

  function ipv6InRange(big, prefixStr, len) {
    const pg = parseIPv6(prefixStr);
    if (!pg) return false;
    const pbig = ipv6ToBig(pg);
    if (len <= 0) return true;
    const shift = BigInt(128 - len);
    return (big >> shift) === (pbig >> shift);
  }

  function classifyIPv6(groups) {
    const big = ipv6ToBig(groups);
    for (const r of V6_RANGES) {
      if (ipv6InRange(big, r.prefix, r.len)) return r;
    }
    const top3 = big >> 125n;
    if (top3 === 0b001n) return { name: "グローバルユニキャスト", rfc: "RFC 3587", global: true };
    return { name: "その他/未割当", rfc: "RFC 6890", global: false };
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function run() {
    const err = $("ic-error");
    const list = $("ic-list");
    err.textContent = "";
    const lines = $("ic-input").value.split(/\r?\n/);
    let html = "";
    let any = false;
    for (const raw of lines) {
      const line = raw.trim();
      if (line === "") continue;
      any = true;
      if (line.indexOf(":") >= 0) {
        const groups = parseIPv6(line);
        if (!groups) {
          html += "<dt class=\"mono\">" + escapeHtml(line) + "</dt><dd class=\"error\">IPv6形式エラー</dd>";
          continue;
        }
        const info = classifyIPv6(groups);
        html += "<dt class=\"mono\">" + escapeHtml(line) + "</dt><dd>" + escapeHtml(info.name) + "（" + escapeHtml(info.rfc) + "） / " + (info.global ? "グローバル到達可" : "到達不可・限定的") + "</dd>";
      } else {
        const val = parseIPv4(line);
        if (val === null) {
          html += "<dt class=\"mono\">" + escapeHtml(line) + "</dt><dd class=\"error\">IPv4形式エラー</dd>";
          continue;
        }
        const info = classifyIPv4(val);
        html += "<dt class=\"mono\">" + escapeHtml(line) + "</dt><dd>" + escapeHtml(info.name) + "（" + escapeHtml(info.rfc) + "） / " + (info.global ? "グローバル到達可" : "到達不可・限定的") + "</dd>";
      }
    }
    list.innerHTML = any ? html : '<dt>—</dt><dd>アドレスを入力してください</dd>';
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("ic-input").addEventListener("input", run);
    run();
  });
})();
