(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const RE_VERSION = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
  const RE_PARTIAL = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

  function parseVersion(str) {
    const s = String(str).trim();
    const m = RE_VERSION.exec(s);
    if (!m) return null;
    const prerelease = m[4] ? m[4].split(".") : [];
    for (const id of prerelease) {
      if (id === "") return null;
      if (/^[0-9]+$/.test(id) && id.length > 1 && id[0] === "0") return null;
    }
    return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10), patch: parseInt(m[3], 10), prerelease };
  }

  function conv(v) {
    return (v === undefined || v === "x" || v === "X" || v === "*") ? "x" : parseInt(v, 10);
  }

  function parsePartial(str) {
    const s = String(str).trim();
    if (s === "" || s === "*") return { major: "x", minor: "x", patch: "x", prerelease: [] };
    const m = RE_PARTIAL.exec(s);
    if (!m) return null;
    let major = conv(m[1]);
    let minor = conv(m[2]);
    let patch = conv(m[3]);
    if (major === "x") { minor = "x"; patch = "x"; }
    else if (minor === "x") { patch = "x"; }
    const prerelease = m[4] ? m[4].split(".") : [];
    return { major, minor, patch, prerelease };
  }

  function fv(M, m, p, pre) { return { major: M, minor: m, patch: p, prerelease: pre || [] }; }

  function caretComparators(p) {
    const M = p.major, m = p.minor, pt = p.patch;
    if (M === "x") return [{ op: ">=", version: fv(0, 0, 0, []) }];
    if (m === "x") return [{ op: ">=", version: fv(M, 0, 0, []) }, { op: "<", version: fv(M + 1, 0, 0, []) }];
    if (pt === "x") {
      if (M === 0) return [{ op: ">=", version: fv(0, m, 0, []) }, { op: "<", version: fv(0, m + 1, 0, []) }];
      return [{ op: ">=", version: fv(M, m, 0, []) }, { op: "<", version: fv(M + 1, 0, 0, []) }];
    }
    const pre = p.prerelease || [];
    if (M === 0) {
      if (m === 0) return [{ op: ">=", version: fv(0, 0, pt, pre) }, { op: "<", version: fv(0, 0, pt + 1, []) }];
      return [{ op: ">=", version: fv(0, m, pt, pre) }, { op: "<", version: fv(0, m + 1, 0, []) }];
    }
    return [{ op: ">=", version: fv(M, m, pt, pre) }, { op: "<", version: fv(M + 1, 0, 0, []) }];
  }

  function tildeComparators(p) {
    const M = p.major, m = p.minor, pt = p.patch;
    if (M === "x") return [{ op: ">=", version: fv(0, 0, 0, []) }];
    if (m === "x") return [{ op: ">=", version: fv(M, 0, 0, []) }, { op: "<", version: fv(M + 1, 0, 0, []) }];
    if (pt === "x") return [{ op: ">=", version: fv(M, m, 0, []) }, { op: "<", version: fv(M, m + 1, 0, []) }];
    const pre = p.prerelease || [];
    return [{ op: ">=", version: fv(M, m, pt, pre) }, { op: "<", version: fv(M, m + 1, 0, []) }];
  }

  function xRangeComparators(p) {
    const M = p.major, m = p.minor, pt = p.patch;
    if (M === "x") return [{ op: ">=", version: fv(0, 0, 0, []) }];
    if (m === "x") return [{ op: ">=", version: fv(M, 0, 0, []) }, { op: "<", version: fv(M + 1, 0, 0, []) }];
    if (pt === "x") return [{ op: ">=", version: fv(M, m, 0, []) }, { op: "<", version: fv(M, m + 1, 0, []) }];
    const pre = p.prerelease || [];
    return [{ op: "=", version: fv(M, m, pt, pre) }];
  }

  function opComparators(op, p) {
    const M = p.major, m = p.minor, pt = p.patch;
    const pre = p.prerelease || [];
    if (M === "x") {
      if (op === "<" || op === "<=") return [{ op: "<", version: fv(0, 0, 0, []) }];
      return [{ op: ">=", version: fv(0, 0, 0, []) }];
    }
    if (m === "x") {
      if (op === ">=") return [{ op: ">=", version: fv(M, 0, 0, []) }];
      if (op === "<=") return [{ op: "<", version: fv(M + 1, 0, 0, []) }];
      if (op === ">") return [{ op: ">=", version: fv(M + 1, 0, 0, []) }];
      if (op === "<") return [{ op: "<", version: fv(M, 0, 0, []) }];
      return [{ op: ">=", version: fv(M, 0, 0, []) }, { op: "<", version: fv(M + 1, 0, 0, []) }];
    }
    if (pt === "x") {
      if (op === ">=") return [{ op: ">=", version: fv(M, m, 0, []) }];
      if (op === "<=") return [{ op: "<", version: fv(M, m + 1, 0, []) }];
      if (op === ">") return [{ op: ">=", version: fv(M, m + 1, 0, []) }];
      if (op === "<") return [{ op: "<", version: fv(M, m, 0, []) }];
      return [{ op: ">=", version: fv(M, m, 0, []) }, { op: "<", version: fv(M, m + 1, 0, []) }];
    }
    return [{ op: op, version: fv(M, m, pt, pre) }];
  }

  function parseComparatorToken(tok) {
    tok = tok.trim();
    if (tok === "") return null;
    if (tok[0] === "^") {
      const p = parsePartial(tok.slice(1));
      return p ? caretComparators(p) : null;
    }
    if (tok[0] === "~") {
      let rest = tok.slice(1);
      if (rest[0] === ">") rest = rest.slice(1);
      const p = parsePartial(rest);
      return p ? tildeComparators(p) : null;
    }
    const opMatch = /^(<=|>=|<|>|=)/.exec(tok);
    const op = opMatch ? opMatch[1] : null;
    const rest = opMatch ? tok.slice(op.length).trim() : tok;
    const p = parsePartial(rest);
    if (!p) return null;
    return op === null ? xRangeComparators(p) : opComparators(op, p);
  }

  function hyphenToComparators(leftStr, rightStr) {
    const L = parsePartial(leftStr);
    const R = parsePartial(rightStr);
    if (!L || !R) return null;
    const lowM = L.major === "x" ? 0 : L.major;
    const lowm = L.minor === "x" ? 0 : L.minor;
    const lowp = L.patch === "x" ? 0 : L.patch;
    const low = { op: ">=", version: fv(lowM, lowm, lowp, L.prerelease || []) };
    if (R.major === "x") return [low];
    let high;
    if (R.minor === "x") high = { op: "<", version: fv(R.major + 1, 0, 0, []) };
    else if (R.patch === "x") high = { op: "<", version: fv(R.major, R.minor + 1, 0, []) };
    else high = { op: "<=", version: fv(R.major, R.minor, R.patch, R.prerelease || []) };
    return [low, high];
  }

  function versionToString(v) {
    let s = v.major + "." + v.minor + "." + v.patch;
    if (v.prerelease && v.prerelease.length) s += "-" + v.prerelease.join(".");
    return s;
  }
  function comparatorToString(c) {
    const vs = versionToString(c.version);
    return c.op === "=" ? vs : c.op + vs;
  }

  function parseRange(rangeStr) {
    const orParts = String(rangeStr).split("||").map((s) => s.trim()).filter((s) => s !== "");
    if (orParts.length === 0) throw new Error("範囲を入力してください");
    const sets = [];
    const displayParts = [];
    for (const part of orParts) {
      const hyphenMatch = /^(\S+)\s+-\s+(\S+)$/.exec(part);
      let comps;
      if (hyphenMatch) {
        comps = hyphenToComparators(hyphenMatch[1], hyphenMatch[2]);
        if (!comps) throw new Error('範囲の解析に失敗しました: "' + part + '"');
      } else {
        const tokens = part.split(/\s+/).filter(Boolean);
        comps = [];
        for (const tok of tokens) {
          const c = parseComparatorToken(tok);
          if (!c) throw new Error('範囲の解析に失敗しました: "' + tok + '"');
          comps.push.apply(comps, c);
        }
        if (comps.length === 0) throw new Error("範囲を入力してください");
      }
      sets.push(comps);
      displayParts.push(comps.map(comparatorToString).join(" "));
    }
    return { sets: sets, display: displayParts.join(" || ") };
  }

  function compareIdentifiers(a, b) {
    const isNumA = /^[0-9]+$/.test(a), isNumB = /^[0-9]+$/.test(b);
    if (isNumA && isNumB) { const na = +a, nb = +b; return na === nb ? 0 : (na < nb ? -1 : 1); }
    if (isNumA) return -1;
    if (isNumB) return 1;
    return a === b ? 0 : (a < b ? -1 : 1);
  }
  function comparePre(a, b) {
    const ap = a.prerelease, bp = b.prerelease;
    if (ap.length && !bp.length) return -1;
    if (!ap.length && bp.length) return 1;
    if (!ap.length && !bp.length) return 0;
    const len = Math.max(ap.length, bp.length);
    for (let i = 0; i < len; i++) {
      const x = ap[i], y = bp[i];
      if (x === undefined && y === undefined) return 0;
      if (y === undefined) return 1;
      if (x === undefined) return -1;
      if (x === y) continue;
      return compareIdentifiers(x, y);
    }
    return 0;
  }
  function compareVersions(a, b) {
    if (a.major !== b.major) return a.major < b.major ? -1 : 1;
    if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
    if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
    return comparePre(a, b);
  }
  function testComparator(v, c) {
    const r = compareVersions(v, c.version);
    switch (c.op) {
      case ">=": return r >= 0;
      case "<=": return r <= 0;
      case ">": return r > 0;
      case "<": return r < 0;
      case "=": return r === 0;
    }
    return false;
  }
  function satisfies(v, parsed) {
    for (const set of parsed.sets) {
      let ok = set.every((c) => testComparator(v, c));
      if (ok && v.prerelease.length) {
        const allowed = set.some((c) => c.version.prerelease.length && c.version.major === v.major && c.version.minor === v.minor && c.version.patch === v.patch);
        if (!allowed) ok = false;
      }
      if (ok) return true;
    }
    return false;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function run() {
    const errEl = $("sr-error");
    const expEl = $("sr-expanded");
    const listEl = $("sr-list");
    errEl.textContent = "";
    listEl.innerHTML = "";
    let parsed;
    try {
      parsed = parseRange($("sr-range").value);
    } catch (e) {
      expEl.textContent = "—";
      errEl.textContent = e.message;
      return;
    }
    expEl.textContent = parsed.display;
    const lines = $("sr-versions").value.split(/\r?\n/);
    let html = "";
    let any = false;
    for (const line of lines) {
      const v = line.trim();
      if (v === "") continue;
      any = true;
      const parsedV = parseVersion(v);
      if (!parsedV) {
        html += "<dt class=\"mono\">" + escapeHtml(v) + "</dt><dd class=\"error\">バージョン形式エラー</dd>";
        continue;
      }
      const ok = satisfies(parsedV, parsed);
      html += "<dt class=\"mono\">" + escapeHtml(v) + "</dt><dd class=\"" + (ok ? "ok" : "error") + "\">" + (ok ? "✓ 一致" : "✗ 不一致") + "</dd>";
    }
    listEl.innerHTML = any ? html : '<dt>—</dt><dd>バージョンを入力してください</dd>';
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("sr-range").addEventListener("input", run);
    $("sr-versions").addEventListener("input", run);
    run();
  });
})();
