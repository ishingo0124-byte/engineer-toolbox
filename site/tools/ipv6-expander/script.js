(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toHalfWidth(s) {
    return String(s || "").replace(/[０-９Ａ-Ｆａ-ｆ．：／]/g, (c) => {
      if (c === "．") return ".";
      if (c === "：") return ":";
      if (c === "／") return "/";
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    });
  }

  function parseIPv4(raw) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) return null;
    const parts = raw.split(".").map(Number);
    for (const p of parts) if (p < 0 || p > 255 || !Number.isInteger(p)) return null;
    return parts;
  }

  // IPv6アドレスをパースして {groups:[16bit x8], prefixLen:number|null} を返す。不正なら {error: "メッセージ"}
  function parseIPv6(rawInput) {
    let s = toHalfWidth(String(rawInput || "").trim());
    if (s === "") return { error: "" };

    let prefixLen = null;
    if (s.indexOf("/") !== -1) {
      const segs = s.split("/");
      if (segs.length !== 2) return { error: "プレフィックスの指定が正しくありません（例: ::1/128）" };
      s = segs[0].trim();
      const pRaw = segs[1].trim();
      if (!/^\d{1,3}$/.test(pRaw)) return { error: "プレフィックス長は0〜128の整数で指定してください" };
      prefixLen = parseInt(pRaw, 10);
      if (prefixLen < 0 || prefixLen > 128) return { error: "プレフィックス長は0〜128の範囲で指定してください" };
    }

    if (s === "") return { error: "IPv6アドレスを入力してください" };
    if (!/^[0-9a-fA-F:.]+$/.test(s)) return { error: "使用できない文字が含まれています" };
    if (s.indexOf(":::") !== -1) return { error: "コロンが3つ以上連続しています" };

    const dcCount = (s.match(/::/g) || []).length;
    if (dcCount > 1) return { error: ":: による省略は1箇所までしか使えません" };

    let headGroups, tailGroups;
    if (dcCount === 1) {
      const idx = s.indexOf("::");
      const head = s.slice(0, idx);
      const tail = s.slice(idx + 2);
      headGroups = head === "" ? [] : head.split(":");
      tailGroups = tail === "" ? [] : tail.split(":");
    } else {
      if (s.charAt(0) === ":" || s.charAt(s.length - 1) === ":") return { error: "コロンの位置が正しくありません" };
      headGroups = s.split(":");
      tailGroups = [];
    }

    // IPv4射影（末尾の x.x.x.x）を検出して2ブロックに変換
    const target = tailGroups.length > 0 ? tailGroups : headGroups;
    let hasIPv4 = false;
    if (target.length > 0 && target[target.length - 1].indexOf(".") !== -1) {
      const v4str = target[target.length - 1];
      const v4parts = parseIPv4(v4str);
      if (!v4parts) return { error: "末尾のIPv4部分の形式が正しくありません（例: 192.0.2.1）" };
      target.pop();
      target.push(((v4parts[0] << 8) | v4parts[1]).toString(16));
      target.push(((v4parts[2] << 8) | v4parts[3]).toString(16));
      hasIPv4 = true;
    }

    if (headGroups.some((g) => g === "") || tailGroups.some((g) => g === "")) {
      return { error: "コロンの位置が正しくありません（空のブロックがあります）" };
    }

    const total = headGroups.length + tailGroups.length;
    let fullHex;
    if (dcCount === 1) {
      const zerosToInsert = 8 - total;
      if (zerosToInsert < 1) return { error: ":: は1個以上の0ブロックを省略する場合のみ使用できます（ブロック数が多すぎます）" };
      fullHex = headGroups.concat(new Array(zerosToInsert).fill("0")).concat(tailGroups);
    } else {
      if (total !== 8) return { error: "ブロック数が8個ではありません（" + total + "個）。省略には :: を使ってください" };
      fullHex = headGroups;
    }

    const groups = [];
    for (const g of fullHex) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return { error: "不正なブロックがあります: " + g };
      groups.push(parseInt(g, 16));
    }

    return { groups: groups, prefixLen: prefixLen, hasIPv4InInput: hasIPv4 };
  }

  function ipv4Dotted(hi, lo) {
    return [(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255].join(".");
  }

  function toFullExpanded(groups) {
    return groups.map((n) => n.toString(16).padStart(4, "0")).join(":");
  }

  function toCanonical(groups) {
    // IPv4射影アドレス（::ffff:0:0/96）はRFC 5952 5節の推奨に従い混在表記にする
    if (isIPv4Mapped(groups)) {
      return "::ffff:" + ipv4Dotted(groups[6], groups[7]);
    }
    const hexParts = groups.map((n) => n.toString(16));
    // 最長のゼロ連続（長さ2以上）を探す。同着なら最も左側を採用。
    let bestStart = -1, bestLen = 0;
    let curStart = -1, curLen = 0;
    for (let i = 0; i < 9; i++) {
      const isZero = i < 8 && groups[i] === 0;
      if (isZero) {
        if (curStart === -1) curStart = i;
        curLen++;
      } else {
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
        curStart = -1; curLen = 0;
      }
    }
    if (bestLen < 2) {
      return hexParts.join(":");
    }
    const left = hexParts.slice(0, bestStart).join(":");
    const right = hexParts.slice(bestStart + bestLen).join(":");
    return left + "::" + right;
  }

  function isIPv4Mapped(groups) {
    return groups[0] === 0 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 && groups[5] === 0xffff;
  }

  function toBinary(groups) {
    return groups.map((n) => n.toString(2).padStart(16, "0")).join(" ");
  }

  function setError(msg) {
    $("v6x-error").textContent = msg || "";
  }

  function clearResults() {
    ["v6x-full", "v6x-canonical", "v6x-prefix", "v6x-ipv4mapped", "v6x-binary"].forEach((id) => { $(id).textContent = "-"; });
  }

  function run() {
    setError("");
    const raw = $("v6x-input").value;
    const res = parseIPv6(raw);
    if (res.error !== undefined) {
      clearResults();
      if (res.error) setError(res.error);
      return;
    }
    const groups = res.groups;
    $("v6x-full").textContent = toFullExpanded(groups) + (res.prefixLen !== null ? "/" + res.prefixLen : "");
    $("v6x-canonical").textContent = toCanonical(groups) + (res.prefixLen !== null ? "/" + res.prefixLen : "");
    $("v6x-prefix").textContent = res.prefixLen !== null ? "/" + res.prefixLen : "（指定なし）";
    $("v6x-ipv4mapped").textContent = isIPv4Mapped(groups) ? "::ffff:" + ipv4Dotted(groups[6], groups[7]) : "-（IPv4射影アドレスではありません）";
    $("v6x-binary").textContent = toBinary(groups);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("v6x-input").addEventListener("input", run);
    run();
  });
})();
