(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const TYPE_DESC = {
    "-": "通常ファイル", "d": "ディレクトリ", "l": "シンボリックリンク",
    "b": "ブロックデバイス", "c": "キャラクタデバイス", "p": "名前付きパイプ（FIFO）",
    "s": "ソケット", "D": "ドア（Solaris固有）"
  };

  const FULL_RE = /^([-dlbcpsD])([r-][w-][xsS-])([r-][w-][xsS-])([r-][w-][xtT-])([.+@]?)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.*)$/;
  const BARE_RE = /^([-dlbcpsD]?)([r-][w-][xsS-])([r-][w-][xsS-])([r-][w-][xtT-])([.+@]?)$/;

  const DATE_PATTERNS = [
    /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2})\s+(.*)$/,
    /^(\w{3}\s+\d{1,2}\s+\d{4})\s+(.*)$/,
    /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:\s?[+-]\d{2}:?\d{2})?)\s+(.*)$/,
    /^(\d{4}-\d{2}-\d{2})\s+(.*)$/
  ];

  function decodeTriad(tri, kind) {
    const r = tri[0] === "r";
    const w = tri[1] === "w";
    const c = tri[2];
    let x, special = null;
    if (kind === "other") {
      x = c === "x" || c === "t";
      if (c === "t" || c === "T") special = "sticky";
    } else {
      x = c === "x" || c === "s";
      if (c === "s" || c === "S") special = kind === "owner" ? "setuid" : "setgid";
    }
    const value = (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
    return { r, w, x, special, value, raw: tri };
  }

  function humanSize(bytes) {
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
    if (!isFinite(bytes)) return String(bytes);
    if (bytes < 1024) return bytes + " B";
    let v = bytes, i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    return v.toFixed(digits) + " " + units[i];
  }

  function octalOf(o, g, oth) {
    const setuid = o.special === "setuid" ? 4 : 0;
    const setgid = g.special === "setgid" ? 2 : 0;
    const sticky = oth.special === "sticky" ? 1 : 0;
    const leading = setuid + setgid + sticky;
    const base = "" + o.value + g.value + oth.value;
    return leading > 0 ? ("" + leading + base) : base;
  }

  function specialLabel(o, g, oth) {
    const labels = [];
    if (o.special === "setuid") labels.push("setuid（実行時に所有者の権限で動作）" + (o.x ? "" : "（実行権なし＝事実上無効）"));
    if (g.special === "setgid") labels.push("setgid（実行時に所有グループの権限で動作／ディレクトリでは新規作成物に同じグループを継承）" + (g.x ? "" : "（実行権なし＝事実上無効）"));
    if (oth.special === "sticky") labels.push("sticky bit（共有ディレクトリ内で他人のファイルを削除できないよう制限。例: /tmp）" + (oth.x ? "" : "（その他への実行権なしは一般的ではありません）"));
    return labels.length ? labels : ["なし"];
  }

  function triadText(t, label) {
    const parts = [];
    parts.push("読み取り" + (t.r ? "○" : "×"));
    parts.push("書き込み" + (t.w ? "○" : "×"));
    parts.push("実行" + (t.x ? "○" : "×"));
    return label + "：" + t.raw + "（" + parts.join(" / ") + "）";
  }

  function parseLine(line) {
    const trimmed = line.trim();
    if (trimmed === "") return { skip: true };
    let m = trimmed.match(FULL_RE);
    if (m) {
      const [, typeChar, oT, gT, otT, aclFlag, links, owner, group, size, rest] = m;
      let date = "", name = rest;
      for (const p of DATE_PATTERNS) {
        const dm = rest.match(p);
        if (dm) { date = dm[1]; name = dm[2]; break; }
      }
      let target = "";
      if (typeChar === "l") {
        const am = name.match(/^(.*)\s->\s(.*)$/);
        if (am) { name = am[1]; target = am[2]; }
      }
      return {
        full: true, typeChar, aclFlag,
        o: decodeTriad(oT, "owner"), g: decodeTriad(gT, "group"), oth: decodeTriad(otT, "other"),
        links: parseInt(links, 10), owner, group, size: parseInt(size, 10), date, name, target
      };
    }
    m = trimmed.match(BARE_RE);
    if (m) {
      const [, typeCharRaw, oT, gT, otT, aclFlag] = m;
      const typeChar = typeCharRaw || "-";
      return {
        full: false, typeChar, aclFlag,
        o: decodeTriad(oT, "owner"), g: decodeTriad(gT, "group"), oth: decodeTriad(otT, "other")
      };
    }
    return { skip: true, raw: line };
  }

  function renderCard(r, rawLine) {
    const typeDesc = TYPE_DESC[r.typeChar] || ("不明（" + r.typeChar + "）");
    const oct = octalOf(r.o, r.g, r.oth);
    let html = '<div class="lpd-card">';
    html += '<p class="lpd-raw mono">' + escapeHtml(rawLine.trim()) + "</p>";
    html += '<div class="lpd-triads">';
    html += '<div><span class="t">種別：</span>' + escapeHtml(r.typeChar) + "（" + typeDesc + "）</div>";
    html += '<div class="mono">' + escapeHtml(triadText(r.o, "所有者(u)")) + "</div>";
    html += '<div class="mono">' + escapeHtml(triadText(r.g, "グループ(g)")) + "</div>";
    html += '<div class="mono">' + escapeHtml(triadText(r.oth, "その他(o)")) + "</div>";
    html += "</div>";
    html += '<p>特殊ビット：' + escapeHtml(specialLabel(r.o, r.g, r.oth).join("、")) + "</p>";
    html += '<p class="lpd-oct mono">8進数: ' + oct + "</p>";
    if (r.aclFlag) {
      const aclNote = r.aclFlag === "." ? "SELinuxセキュリティコンテキストあり（.）" : r.aclFlag === "+" ? "追加のACL（アクセス制御リスト）あり（+）" : "拡張属性あり（@、主にmacOS）";
      html += '<p class="hint">' + aclNote + "</p>";
    }
    if (r.full) {
      html += '<dl class="result-grid">';
      html += "<dt>ハードリンク数</dt><dd><span>" + tb.fmt(r.links) + "</span></dd>";
      html += "<dt>所有者</dt><dd><span>" + escapeHtml(r.owner) + "</span></dd>";
      html += "<dt>グループ</dt><dd><span>" + escapeHtml(r.group) + "</span></dd>";
      html += "<dt>サイズ</dt><dd><span>" + tb.fmt(r.size) + " バイト（" + humanSize(r.size) + "）</span></dd>";
      html += "<dt>日時</dt><dd><span>" + (r.date ? escapeHtml(r.date) : "（判読できませんでした）") + "</span></dd>";
      html += "<dt>ファイル名</dt><dd><span>" + escapeHtml(r.name) + (r.target ? " → " + escapeHtml(r.target) : "") + "</span></dd>";
      html += "</dl>";
    } else {
      html += '<p class="hint">パーミッション文字列のみの入力のため、リンク数・所有者・サイズ・日時・ファイル名は表示していません。</p>';
    }
    html += "</div>";
    return html;
  }

  function run() {
    const errEl = $("lpd-error");
    errEl.textContent = "";
    const raw = $("lpd-input").value;
    const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    let html = "";
    let parsed = 0, skipped = 0;
    for (const line of lines) {
      const r = parseLine(line);
      if (r.skip) {
        if (line.trim() !== "") { skipped++; html += '<p class="lpd-skip">スキップ: <span class="mono">' + escapeHtml(line.trim()) + "</span></p>"; }
        continue;
      }
      parsed++;
      html += renderCard(r, line);
    }
    $("lpd-out").innerHTML = html || '<p class="hint">解析できる行がありません。</p>';
    $("lpd-stats").textContent = "解析 " + tb.fmt(parsed) + " 件 / スキップ " + tb.fmt(skipped) + " 件";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("lpd-input").addEventListener("input", tb.debounce(run, 120));
    run();
  });
})();
