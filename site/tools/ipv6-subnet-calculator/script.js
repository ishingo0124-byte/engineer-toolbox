(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MAX_LIST = 64;
  const ALL = (1n << 128n) - 1n;

  function toHalfWidth(s) {
    return String(s == null ? "" : s).replace(/[０-９Ａ-Ｆａ-ｆ．：／]/g, (c) => {
      if (c === "．") return ".";
      if (c === "：") return ":";
      if (c === "／") return "/";
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    }).replace(/　/g, " ");
  }

  function parseIPv4(raw) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) return null;
    const p = raw.split(".").map(Number);
    for (const n of p) if (n > 255) return null;
    return p;
  }

  // 戻り値 { error } または { addr: BigInt, prefix: number, hasV4: boolean }
  function parseInput(raw) {
    const s0 = toHalfWidth(raw).trim();
    if (s0 === "") return { error: "" };
    const segs = s0.split("/");
    if (segs.length !== 2) return { error: "アドレスとプレフィックス長を 2001:db8::/48 の形で入力してください" };
    const pRaw = segs[1].trim();
    if (!/^\d{1,3}$/.test(pRaw)) return { error: "プレフィックス長は 0〜128 の整数で指定してください" };
    const prefix = parseInt(pRaw, 10);
    if (prefix > 128) return { error: "プレフィックス長は 0〜128 の範囲で指定してください" };
    const s = segs[0].trim();
    if (s === "") return { error: "IPv6アドレスを入力してください" };
    if (!/^[0-9a-fA-F:.]+$/.test(s)) return { error: "使用できない文字が含まれています（ゾーンID の %eth0 などは付けられません）" };
    if (s.indexOf(":::") !== -1) return { error: "コロンが3つ以上連続しています" };
    const dc = (s.match(/::/g) || []).length;
    if (dc > 1) return { error: ":: による省略は1箇所までです" };

    let head, tail;
    if (dc === 1) {
      const i = s.indexOf("::");
      const h = s.slice(0, i), t = s.slice(i + 2);
      head = h === "" ? [] : h.split(":");
      tail = t === "" ? [] : t.split(":");
    } else {
      if (s.charAt(0) === ":" || s.charAt(s.length - 1) === ":") return { error: "コロンの位置が正しくありません" };
      head = s.split(":");
      tail = [];
    }
    let hasV4 = false;
    const target = dc === 1 ? tail : head;
    if (target.length > 0 && target[target.length - 1].indexOf(".") !== -1) {
      const v4 = parseIPv4(target[target.length - 1]);
      if (!v4) return { error: "末尾の IPv4 部分の形式が正しくありません（例: ::ffff:192.0.2.1）" };
      target.pop();
      target.push(((v4[0] << 8) | v4[1]).toString(16));
      target.push(((v4[2] << 8) | v4[3]).toString(16));
      hasV4 = true;
    }
    if (head.some((g) => g === "") || tail.some((g) => g === "")) return { error: "コロンの位置が正しくありません（空のブロックがあります）" };
    for (const g of head.concat(tail)) {
      if (g.indexOf(".") !== -1) return { error: "IPv4 表記は末尾にしか置けません" };
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return { error: "不正なブロックがあります: " + g };
    }
    const total = head.length + tail.length;
    let groups;
    if (dc === 1) {
      const z = 8 - total;
      if (z < 1) return { error: ":: は 1 ブロック以上の 0 を省略するときだけ使えます（ブロックが多すぎます）" };
      groups = head.concat(new Array(z).fill("0"), tail);
    } else {
      if (total !== 8) return { error: "ブロック数が 8 個ではありません（" + total + "個）。省略するときは :: を使ってください" };
      groups = head;
    }
    let addr = 0n;
    for (const g of groups) addr = (addr << 16n) | BigInt(parseInt(g, 16));
    return { addr: addr, prefix: prefix, hasV4: hasV4 };
  }

  function groupsOf(addr) {
    const g = [];
    for (let i = 7; i >= 0; i--) g.push(Number((addr >> BigInt(i * 16)) & 0xffffn));
    return g;
  }
  function full(addr) {
    return groupsOf(addr).map((n) => n.toString(16).padStart(4, "0")).join(":");
  }
  // RFC 5952: 最長の 0 連続（2個以上、同長なら先頭側）を :: に、先頭ゼロ省略、小文字。IPv4射影は混在表記
  function compress(addr) {
    const g = groupsOf(addr);
    if (g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0xffff) {
      return "::ffff:" + [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255].join(".");
    }
    const h = g.map((n) => n.toString(16));
    let bs = -1, bl = 0, cs = -1, cl = 0;
    for (let i = 0; i <= 8; i++) {
      if (i < 8 && g[i] === 0) { if (cs === -1) cs = i; cl++; }
      else { if (cl > bl) { bl = cl; bs = cs; } cs = -1; cl = 0; }
    }
    if (bl < 2) return h.join(":");
    return h.slice(0, bs).join(":") + "::" + h.slice(bs + bl).join(":");
  }

  function hostMask(prefix) { return prefix === 128 ? 0n : (1n << BigInt(128 - prefix)) - 1n; }
  function networkOf(addr, prefix) { return addr & (ALL ^ hostMask(prefix)); }

  function analyze(addr, prefix) {
    const net = networkOf(addr, prefix);
    const last = net | hostMask(prefix);
    const hostBits = 128 - prefix;
    const count = 1n << BigInt(hostBits);
    const n64 = prefix <= 64 ? 1n << BigInt(64 - prefix) : 0n;
    return { net: net, last: last, hostBits: hostBits, count: count, n64: n64, changed: net !== addr };
  }

  // 分割。戻り値 { total: BigInt, items: [BigInt network] }
  function split(net, prefix, target, limit) {
    const total = 1n << BigInt(target - prefix);
    const step = 1n << BigInt(128 - target);
    const n = total < BigInt(limit) ? Number(total) : limit;
    const items = [];
    for (let i = 0; i < n; i++) items.push(net + BigInt(i) * step);
    return { total: total, items: items };
  }

  function commas(b) { return b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  const core = { parseInput, analyze, split, compress, full, commas, networkOf };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined") return;

  function setText(id, t) { $(id).textContent = t; }
  function clearAll() {
    ["v6s-net", "v6s-net-full", "v6s-first", "v6s-last", "v6s-last-full", "v6s-count", "v6s-n64", "v6s-note", "v6s-list"].forEach((id) => setText(id, "-"));
    setText("v6s-split-summary", "");
  }

  function run() {
    setText("v6s-error", "");
    setText("v6s-split-error", "");
    const res = parseInput($("v6s-addr").value);
    if (res.error !== undefined) {
      clearAll();
      if (res.error) setText("v6s-error", res.error);
      return;
    }
    const a = analyze(res.addr, res.prefix);
    const p = "/" + res.prefix;
    setText("v6s-net", compress(a.net) + p);
    setText("v6s-net-full", full(a.net) + p);
    setText("v6s-first", compress(a.net));
    setText("v6s-last", compress(a.last));
    setText("v6s-last-full", full(a.last));
    setText("v6s-count", commas(a.count) + "（2^" + a.hostBits + "）");
    setText("v6s-n64", res.prefix <= 64 ? commas(a.n64) + " 個" : "0 個（/64 より狭く、/64 1 個の一部です）");
    const notes = [];
    if (a.changed) notes.push("入力アドレスのホスト部（" + a.hostBits + " ビット）を 0 にして、ネットワークアドレスを求めました。");
    if (res.hasV4) notes.push("IPv4 埋め込み表記は 128 ビットの値に直して計算しています。");
    setText("v6s-note", notes.length ? notes.join(" ") : "（なし）");

    const tRaw = toHalfWidth($("v6s-target").value).trim();
    if (tRaw === "") {
      setText("v6s-list", "分割先のプレフィックス長を入れると、分割後のサブネット一覧が出ます。");
      setText("v6s-split-summary", "");
      return;
    }
    if (!/^\d{1,3}$/.test(tRaw) || parseInt(tRaw, 10) > 128) {
      setText("v6s-list", "-");
      setText("v6s-split-error", "分割先のプレフィックス長は " + res.prefix + "〜128 の整数で指定してください");
      return;
    }
    const target = parseInt(tRaw, 10);
    if (target < res.prefix) {
      setText("v6s-list", "-");
      setText("v6s-split-error", "分割先は元のプレフィックス長（" + p + "）以上にしてください");
      return;
    }
    const sp = split(a.net, res.prefix, target, MAX_LIST);
    setText("v6s-split-summary", p + " を /" + target + " に分割すると " + commas(sp.total) + " 個です。" +
      (sp.total > BigInt(MAX_LIST) ? "先頭 " + MAX_LIST + " 件を表示しています。" : "すべて表示しています。"));
    setText("v6s-list", sp.items.map((x) => compress(x) + "/" + target).join("\n"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["v6s-addr", "v6s-target"].forEach((id) => $(id).addEventListener("input", run));
    document.querySelectorAll("[data-v6s-prefix]").forEach((b) => {
      b.addEventListener("click", () => { $("v6s-target").value = b.getAttribute("data-v6s-prefix"); run(); });
    });
    run();
  });
})();
