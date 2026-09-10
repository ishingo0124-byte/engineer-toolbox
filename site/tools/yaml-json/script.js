(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* =====================================================================
   * YAML（サブセット）パーサ本体。自作。外部ライブラリは使用しない。
   * 対応: ブロック/フロー形式のマップ・シーケンス、文字列（引用符あり/なし）、
   *       数値・真偽・null、コメント、複数行（| と >）、アンカー(&)・エイリアス(*)。
   * 非対応（明示的にエラーにする）: 複数ドキュメント(---)、明示インデント数値指定、
   *       複数行にまたがる引用符付き文字列、マージキー(<<)、タブインデント。
   * =================================================================== */
  class YamlError extends Error {
    constructor(msg, line) { super(msg); this.line = line; }
  }

  function parseYAML(text) {
    const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
    const N = rawLines.length;
    const anchors = {};
    const state = { i: 0 };

    function checkTabIndent(raw, lineNo) {
      const lead = raw.match(/^[ \t]*/)[0];
      if (lead.indexOf("\t") !== -1) throw new YamlError("インデントにタブ文字は使用できません（半角スペースを使ってください）", lineNo);
      return lead.length;
    }
    function stripComment(s) {
      let inS = false, inD = false;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inS) { if (c === "'") inS = false; continue; }
        if (inD) { if (c === "\\") { i++; continue; } if (c === '"') inD = false; continue; }
        if (c === "'") { inS = true; continue; }
        if (c === '"') { inD = true; continue; }
        if (c === "#" && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
      }
      return s;
    }
    function getLine(i) {
      if (i >= N) return null;
      const raw = rawLines[i];
      const indent = checkTabIndent(raw, i + 1);
      const noComment = stripComment(raw);
      const trimmedEnd = noComment.replace(/[ \t]+$/, "");
      const content = trimmedEnd.slice(indent);
      return { i, indent, content, blank: content.length === 0, raw };
    }
    function nextNonBlank(from) {
      let i = from;
      while (i < N) {
        const li = getLine(i);
        if (!li.blank) return li;
        i++;
      }
      return null;
    }
    function computeDepthDelta(s) {
      let inS = false, inD = false, depth = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inS) { if (c === "'") inS = false; continue; }
        if (inD) { if (c === "\\") { i++; continue; } if (c === '"') inD = false; continue; }
        if (c === "'") { inS = true; continue; }
        if (c === '"') { inD = true; continue; }
        if (c === "{" || c === "[") depth++;
        else if (c === "}" || c === "]") depth--;
      }
      return depth;
    }
    function findKeyColon(s) {
      let inS = false, inD = false, depth = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inS) { if (c === "'") inS = false; continue; }
        if (inD) { if (c === "\\") { i++; continue; } if (c === '"') inD = false; continue; }
        if (c === "'") { inS = true; continue; }
        if (c === '"') { inD = true; continue; }
        if (c === "{" || c === "[") depth++;
        if (c === "}" || c === "]") depth--;
        if (c === ":" && depth === 0) {
          if (i + 1 >= s.length || /\s/.test(s[i + 1])) return i;
        }
      }
      return -1;
    }
    function readDoubleQuotedAt(s, pos, lineNo) {
      let i = pos + 1, out = "";
      for (; i < s.length; i++) {
        const c = s[i];
        if (c === '"') return [out, i + 1];
        if (c === "\\") {
          i++;
          const e = s[i];
          switch (e) {
            case "n": out += "\n"; break;
            case "t": out += "\t"; break;
            case "r": out += "\r"; break;
            case '"': out += '"'; break;
            case "\\": out += "\\"; break;
            case "/": out += "/"; break;
            case "0": out += "\0"; break;
            case "u": { const hex = s.slice(i + 1, i + 5); out += String.fromCharCode(parseInt(hex, 16)); i += 4; break; }
            default: out += e === undefined ? "" : e;
          }
          continue;
        }
        out += c;
      }
      throw new YamlError("二重引用符が閉じていません（1行の中で閉じる必要があります。複数行の文字列は | か > を使ってください）", lineNo);
    }
    function readSingleQuotedAt(s, pos, lineNo) {
      let i = pos + 1, out = "";
      for (; i < s.length; i++) {
        const c = s[i];
        if (c === "'") { if (s[i + 1] === "'") { out += "'"; i++; continue; } return [out, i + 1]; }
        out += c;
      }
      throw new YamlError("単一引用符が閉じていません（1行の中で閉じる必要があります）", lineNo);
    }
    function parseDoubleQuoted(raw, lineNo) {
      const [val, np] = readDoubleQuotedAt(raw, 0, lineNo);
      const trailing = raw.slice(np).trim();
      if (trailing !== "") throw new YamlError("二重引用符の後に不正な文字があります: " + trailing, lineNo);
      return val;
    }
    function parseSingleQuoted(raw, lineNo) {
      const [val, np] = readSingleQuotedAt(raw, 0, lineNo);
      const trailing = raw.slice(np).trim();
      if (trailing !== "") throw new YamlError("単一引用符の後に不正な文字があります: " + trailing, lineNo);
      return val;
    }
    function parseKeyText(raw, lineNo) {
      raw = raw.trim();
      if (raw[0] === '"') return parseDoubleQuoted(raw, lineNo);
      if (raw[0] === "'") return parseSingleQuoted(raw, lineNo);
      return raw;
    }
    function resolveScalar(text) {
      const t = text.trim();
      if (t === "") return null;
      if (t === "~" || t === "null" || t === "Null" || t === "NULL") return null;
      if (t === "true" || t === "True" || t === "TRUE") return true;
      if (t === "false" || t === "False" || t === "FALSE") return false;
      if (/^[-+]?(0|[1-9][0-9]*)$/.test(t)) return parseInt(t, 10);
      if (/^0x[0-9a-fA-F]+$/.test(t)) return parseInt(t, 16);
      if (/^0o[0-7]+$/.test(t)) return parseInt(t.slice(2), 8);
      if (t === ".inf" || t === "+.inf") return Infinity;
      if (t === "-.inf") return -Infinity;
      if (t === ".nan" || t === ".NaN" || t === ".NAN") return NaN;
      if (/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/.test(t) && /[0-9]/.test(t) && /[.eE]/.test(t)) return parseFloat(t);
      return t;
    }
    function deepClone(v) {
      if (Array.isArray(v)) return v.map(deepClone);
      if (v && typeof v === "object") { const o = {}; for (const k in v) o[k] = deepClone(v[k]); return o; }
      return v;
    }
    function skipSp(fc) { while (fc.s[fc.pos] === " ") fc.pos++; }
    function readFlowScalar(fc, endChars, lineNo) {
      skipSp(fc);
      if (fc.s[fc.pos] === '"') { const [v, np] = readDoubleQuotedAt(fc.s, fc.pos, lineNo); fc.pos = np; return v; }
      if (fc.s[fc.pos] === "'") { const [v, np] = readSingleQuotedAt(fc.s, fc.pos, lineNo); fc.pos = np; return v; }
      let start = fc.pos, depth = 0;
      while (fc.pos < fc.s.length) {
        const c = fc.s[fc.pos];
        if (depth === 0 && endChars.indexOf(c) !== -1) break;
        if (c === "{" || c === "[") depth++;
        if (c === "}" || c === "]") depth--;
        fc.pos++;
      }
      const raw = fc.s.slice(start, fc.pos).trim();
      return resolveScalar(raw);
    }
    function parseFlowValue(fc, lineNo) {
      skipSp(fc);
      if (fc.s[fc.pos] === "{") return parseFlowMap(fc, lineNo);
      if (fc.s[fc.pos] === "[") return parseFlowSeq(fc, lineNo);
      return readFlowScalar(fc, [",", "]", "}"], lineNo);
    }
    function parseFlowMap(fc, lineNo) {
      fc.pos++;
      const obj = {};
      skipSp(fc);
      if (fc.s[fc.pos] === "}") { fc.pos++; return obj; }
      while (true) {
        skipSp(fc);
        const key = readFlowScalar(fc, [":", ",", "}"], lineNo);
        skipSp(fc);
        if (fc.s[fc.pos] !== ":") throw new YamlError("フローマッピングで ':' が必要です", lineNo);
        fc.pos++;
        skipSp(fc);
        let val;
        if (fc.s[fc.pos] === "," || fc.s[fc.pos] === "}") val = null;
        else val = parseFlowValue(fc, lineNo);
        obj[String(key)] = val;
        skipSp(fc);
        const c = fc.s[fc.pos];
        if (c === ",") { fc.pos++; skipSp(fc); if (fc.s[fc.pos] === "}") { fc.pos++; break; } continue; }
        if (c === "}") { fc.pos++; break; }
        throw new YamlError("フローマッピングの区切り記号 ',' または '}' が必要です", lineNo);
      }
      return obj;
    }
    function parseFlowSeq(fc, lineNo) {
      fc.pos++;
      const arr = [];
      skipSp(fc);
      if (fc.s[fc.pos] === "]") { fc.pos++; return arr; }
      while (true) {
        skipSp(fc);
        arr.push(parseFlowValue(fc, lineNo));
        skipSp(fc);
        const c = fc.s[fc.pos];
        if (c === ",") { fc.pos++; skipSp(fc); if (fc.s[fc.pos] === "]") { fc.pos++; break; } continue; }
        if (c === "]") { fc.pos++; break; }
        throw new YamlError("フローシーケンスの区切り記号 ',' または ']' が必要です", lineNo);
      }
      return arr;
    }
    function collectFlowText(startLineIdx, initialText) {
      let buf = initialText;
      let depth = computeDepthDelta(initialText);
      let i = state.i;
      while (depth > 0) {
        if (i >= N) throw new YamlError("フロー形式（{}や[]）の括弧が閉じていません", startLineIdx + 1);
        const li = getLine(i);
        buf += " " + li.content;
        depth += computeDepthDelta(li.content);
        i++;
      }
      return { text: buf, endIdx: i };
    }
    function parseBlockScalar(text, baseIndent, lineIdx) {
      const m = text.match(/^([|>])([+-]?)$/);
      if (!m) throw new YamlError("この形式のブロックスカラー記法（明示的なインデント数値の指定など）には対応していません: " + text, lineIdx + 1);
      const literal = m[1] === "|";
      const chomp = m[2];
      let i = state.i;
      let blockIndent = null;
      const collected = [];
      let pendingBlanks = 0;
      while (i < N) {
        const raw = rawLines[i];
        if (raw.trim() === "") { pendingBlanks++; i++; continue; }
        const lead = raw.match(/^[ \t]*/)[0];
        if (lead.indexOf("\t") !== -1) throw new YamlError("インデントにタブ文字は使用できません", i + 1);
        const ind = lead.length;
        if (ind <= baseIndent) break;
        if (blockIndent === null) blockIndent = ind;
        for (let b = 0; b < pendingBlanks; b++) collected.push("");
        pendingBlanks = 0;
        collected.push(raw.slice(blockIndent));
        i++;
      }
      state.i = i - pendingBlanks;
      if (collected.length === 0) return "";
      let result;
      if (literal) {
        result = collected.join("\n");
      } else {
        let out = "";
        for (let li2 = 0; li2 < collected.length; li2++) {
          const line = collected[li2];
          const prev = li2 > 0 ? collected[li2 - 1] : null;
          if (li2 === 0) { out += line; continue; }
          const isMoreIndented = line.startsWith(" ") || line.startsWith("\t");
          const prevMoreIndented = prev !== null && (prev.startsWith(" ") || prev.startsWith("\t"));
          if (line === "") { out += "\n"; continue; }
          if (prev === "") { out += line; continue; }
          if (isMoreIndented || prevMoreIndented) { out += "\n" + line; continue; }
          out += " " + line;
        }
        result = out;
      }
      if (chomp !== "-") result += "\n";
      return result;
    }
    function parseValueContent(text, baseIndent, lineIdx) {
      let anchorName = null;
      while (true) {
        if (text[0] === "!") {
          const m = text.match(/^(![^\s]*)(?:\s+([\s\S]*))?$/);
          text = m[2] !== undefined ? m[2] : "";
          continue;
        }
        if (text[0] === "&") {
          const m = text.match(/^(&[^\s]+)(?:\s+([\s\S]*))?$/);
          anchorName = m[1].slice(1);
          text = m[2] !== undefined ? m[2] : "";
          continue;
        }
        break;
      }
      if (text[0] === "*") {
        const m = text.match(/^\*(\S+)\s*$/);
        if (!m) throw new YamlError("エイリアスの形式が不正です: " + text, lineIdx + 1);
        if (!(m[1] in anchors)) throw new YamlError("未定義のアンカーを参照しています: *" + m[1], lineIdx + 1);
        return deepClone(anchors[m[1]]);
      }
      let result;
      if (text === "") {
        const childLi = nextNonBlank(state.i);
        if (childLi && childLi.indent > baseIndent) {
          result = parseNodeAt(childLi.indent);
        } else if (childLi && childLi.indent === baseIndent && /^-(\s|$)/.test(childLi.content)) {
          result = parseSequenceAt(baseIndent);
        } else {
          result = null;
        }
      } else if (text === "{}") {
        result = {};
      } else if (text === "[]") {
        result = [];
      } else if (text[0] === "{" || text[0] === "[") {
        const collected = collectFlowText(lineIdx, text);
        state.i = collected.endIdx;
        result = parseFlowValue({ s: collected.text, pos: 0 }, lineIdx + 1);
      } else if (/^-(\s|$)/.test(text)) {
        result = parseSequenceInline(text, baseIndent, lineIdx);
      } else if (findKeyColon(text) !== -1) {
        result = parseMappingInline(text, baseIndent, lineIdx);
      } else if (text[0] === "|" || text[0] === ">") {
        result = parseBlockScalar(text, baseIndent, lineIdx);
      } else if (text[0] === '"') {
        result = parseDoubleQuoted(text, lineIdx + 1);
      } else if (text[0] === "'") {
        result = parseSingleQuoted(text, lineIdx + 1);
      } else {
        result = resolveScalar(text);
      }
      if (anchorName) anchors[anchorName] = result;
      return result;
    }
    function parseMappingAt(indent, seedObj) {
      const obj = seedObj || {};
      while (true) {
        const li = nextNonBlank(state.i);
        if (li === null || li.indent !== indent) break;
        if (/^-(\s|$)/.test(li.content)) break;
        const colonIdx = findKeyColon(li.content);
        if (colonIdx === -1) throw new YamlError("マッピングのキーが見つかりません（'key: value' の形式である必要があります）: " + li.content, li.i + 1);
        const keyRaw = li.content.slice(0, colonIdx).trim();
        const key = parseKeyText(keyRaw, li.i + 1);
        const rest = li.content.slice(colonIdx + 1).trim();
        state.i = li.i + 1;
        const value = parseValueContent(rest, indent, li.i);
        obj[key] = value;
      }
      return obj;
    }
    function parseMappingInline(text, baseIndent, lineIdx) {
      const colonIdx = findKeyColon(text);
      const keyRaw = text.slice(0, colonIdx).trim();
      const key = parseKeyText(keyRaw, lineIdx + 1);
      const rest = text.slice(colonIdx + 1).trim();
      const value = parseValueContent(rest, baseIndent, lineIdx);
      const obj = {}; obj[key] = value;
      return parseMappingAt(baseIndent, obj);
    }
    function parseSequenceAt(indent, seedArr) {
      const arr = seedArr || [];
      while (true) {
        const li = nextNonBlank(state.i);
        if (li === null || li.indent !== indent) break;
        if (!/^-(\s|$)/.test(li.content)) break;
        const afterDash = li.content.slice(1);
        let rest;
        if (afterDash === "") rest = "";
        else rest = afterDash.replace(/^ +/, "");
        const leadingSpaces = afterDash.length - rest.length;
        const effectiveBase = afterDash === "" ? indent : indent + 1 + leadingSpaces;
        state.i = li.i + 1;
        const value = parseValueContent(rest, effectiveBase, li.i);
        arr.push(value);
      }
      return arr;
    }
    function parseSequenceInline(text, baseIndent, lineIdx) {
      const afterDash = text.slice(1);
      const rest = afterDash.replace(/^ +/, "");
      const leadingSpaces = afterDash.length - rest.length;
      const effectiveBase = baseIndent + 1 + leadingSpaces;
      const value = parseValueContent(rest, effectiveBase, lineIdx);
      return parseSequenceAt(effectiveBase, [value]);
    }
    function parseNodeAt(indent) {
      const li = nextNonBlank(state.i);
      if (li === null || li.indent < indent) return null;
      state.i = li.i;
      if (/^-(\s|$)/.test(li.content)) return parseSequenceAt(li.indent);
      return parseMappingAt(li.indent);
    }

    const first = nextNonBlank(0);
    if (first === null) return null;
    state.i = first.i;
    let root;
    if (/^-(\s|$)/.test(first.content)) {
      root = parseSequenceAt(first.indent);
    } else if (findKeyColon(first.content) !== -1) {
      root = parseMappingAt(first.indent);
    } else {
      state.i = first.i + 1;
      root = parseValueContent(first.content, first.indent, first.i);
    }
    const leftover = nextNonBlank(state.i);
    if (leftover !== null) {
      throw new YamlError("この行を解析できません（インデントのずれ、または複数ドキュメント区切り(---)など未対応の構文の可能性があります）: " + leftover.content, leftover.i + 1);
    }
    return root;
  }

  /* =====================================================================
   * JSON → YAML（ブロック形式、インデント2）
   * =================================================================== */
  function needsQuote(s) {
    if (s === "") return true;
    if (/^\s|\s$/.test(s)) return true;
    if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(s)) return true;
    if (/^[-+]?(0|[1-9][0-9]*)$/.test(s)) return true;
    if (/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/.test(s) && /[0-9]/.test(s) && /[.eE]/.test(s)) return true;
    if (/^0x[0-9a-fA-F]+$/.test(s) || /^0o[0-7]+$/.test(s)) return true;
    if (/^(true|false|True|False|TRUE|FALSE|null|Null|NULL|~|yes|no|on|off|Yes|No|On|Off|YES|NO|ON|OFF)$/.test(s)) return true;
    if (/: |:$/.test(s)) return true;
    if (/ #/.test(s)) return true;
    if (/[\n\t]/.test(s)) return true;
    return false;
  }
  function scalarToYaml(s) { return needsQuote(s) ? JSON.stringify(s) : s; }
  function valueToYaml(v) {
    if (v === null || v === undefined) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") {
      if (Number.isNaN(v)) return ".nan";
      if (v === Infinity) return ".inf";
      if (v === -Infinity) return "-.inf";
      return String(v);
    }
    return scalarToYaml(String(v));
  }
  function indentStr(n) { return " ".repeat(n); }
  function serializeNode(v, indent) {
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]\n";
      let out = "";
      for (const item of v) {
        if (item !== null && typeof item === "object") {
          const child = serializeNode(item, indent + 2);
          const lines = child.replace(/\n$/, "").split("\n");
          out += indentStr(indent) + "- " + lines[0].slice(indent + 2) + "\n";
          for (let i = 1; i < lines.length; i++) out += lines[i] + "\n";
        } else {
          out += indentStr(indent) + "- " + valueToYaml(item) + "\n";
        }
      }
      return out;
    }
    if (v !== null && typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length === 0) return "{}\n";
      let out = "";
      for (const k of keys) {
        const val = v[k];
        const keyStr = scalarToYaml(String(k));
        const isNonEmptyCollection = val !== null && typeof val === "object" && Object.keys(val).length !== 0;
        if (isNonEmptyCollection) {
          out += indentStr(indent) + keyStr + ":\n" + serializeNode(val, indent + 2);
        } else if (val !== null && typeof val === "object") {
          out += indentStr(indent) + keyStr + ": " + (Array.isArray(val) ? "[]" : "{}") + "\n";
        } else {
          out += indentStr(indent) + keyStr + ": " + valueToYaml(val) + "\n";
        }
      }
      return out;
    }
    return indentStr(indent) + valueToYaml(v) + "\n";
  }
  function toYAML(data) { return serializeNode(data, 0).trimEnd() + "\n"; }

  function jsonParseErrorMessage(text, err) {
    const m = /position (\d+)/.exec(err.message);
    if (!m) return err.message;
    const pos = +m[1];
    const upto = text.slice(0, pos);
    const line = upto.split("\n").length;
    const col = pos - upto.lastIndexOf("\n");
    return err.message + "（" + line + "行目 " + col + "文字目付近）";
  }

  /* =====================================================================
   * DOM連携
   * =================================================================== */
  function runYamlToJson() {
    const errEl = $("yj-yaml-error");
    const outEl = $("yj-json-output");
    errEl.textContent = "";
    const raw = $("yj-yaml-input").value;
    if (raw.trim() === "") { outEl.value = ""; return; }
    try {
      const data = parseYAML(raw);
      outEl.value = JSON.stringify(data, null, 2);
    } catch (e) {
      outEl.value = "";
      if (e instanceof YamlError) errEl.textContent = (e.line ? e.line + "行目: " : "") + e.message;
      else errEl.textContent = "予期しないエラー: " + e.message;
    }
  }
  function runJsonToYaml() {
    const errEl = $("yj-json-error");
    const outEl = $("yj-yaml-output");
    errEl.textContent = "";
    const raw = $("yj-json-input").value;
    if (raw.trim() === "") { outEl.value = ""; return; }
    try {
      const data = JSON.parse(raw);
      outEl.value = toYAML(data);
    } catch (e) {
      outEl.value = "";
      errEl.textContent = "JSONとして解析できません: " + jsonParseErrorMessage(raw, e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("yj-yaml-input").addEventListener("input", tb.debounce(runYamlToJson, 150));
    $("yj-json-input").addEventListener("input", tb.debounce(runJsonToYaml, 150));
    runYamlToJson();
    runJsonToYaml();
  });
})();
