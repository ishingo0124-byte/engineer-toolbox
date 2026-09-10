(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const KEYWORDS = new Set([
    "SELECT", "DISTINCT", "ALL", "FROM", "WHERE", "AND", "OR", "NOT", "GROUP", "BY", "ORDER", "HAVING",
    "LIMIT", "OFFSET", "AS", "ASC", "DESC", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
    "CREATE", "TABLE", "ALTER", "DROP", "VIEW", "INDEX", "TRIGGER", "PROCEDURE", "FUNCTION",
    "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "CHECK", "CONSTRAINT", "DEFAULT", "NULL",
    "AUTO_INCREMENT", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "CROSS", "ON", "USING",
    "UNION", "INTERSECT", "EXCEPT", "CASE", "WHEN", "THEN", "ELSE", "END", "WITH", "RECURSIVE",
    "EXISTS", "IN", "BETWEEN", "LIKE", "IS", "IF", "BEGIN", "DECLARE", "RETURNING", "TOP",
    "TRUE", "FALSE"
  ]);

  // --- トークナイザ：文字列リテラル・コメント・引用符付き識別子の中身は壊さない ---
  function tokenize(sql) {
    const tokens = [];
    const n = sql.length;
    let i = 0;
    while (i < n) {
      const c = sql[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "-" && sql[i + 1] === "-") {
        let j = sql.indexOf("\n", i);
        if (j === -1) j = n;
        tokens.push({ type: "comment", value: sql.slice(i, j) });
        i = j; continue;
      }
      if (c === "/" && sql[i + 1] === "*") {
        let j = sql.indexOf("*/", i + 2);
        j = j === -1 ? n : j + 2;
        tokens.push({ type: "comment", value: sql.slice(i, j) });
        i = j; continue;
      }
      if (c === "'") {
        let j = i + 1;
        while (j < n) {
          if (sql[j] === "'") { if (sql[j + 1] === "'") { j += 2; continue; } j++; break; }
          j++;
        }
        tokens.push({ type: "string", value: sql.slice(i, j) });
        i = j; continue;
      }
      if (c === '"' || c === "`") {
        const q = c; let j = i + 1;
        while (j < n) {
          if (sql[j] === q) { if (sql[j + 1] === q) { j += 2; continue; } j++; break; }
          j++;
        }
        tokens.push({ type: "ident", value: sql.slice(i, j) });
        i = j; continue;
      }
      if (c === "[") {
        let j = sql.indexOf("]", i);
        j = j === -1 ? n : j + 1;
        tokens.push({ type: "ident", value: sql.slice(i, j) });
        i = j; continue;
      }
      if (/[0-9]/.test(c)) {
        let j = i;
        while (j < n && /[0-9]/.test(sql[j])) j++;
        if (sql[j] === "." && /[0-9]/.test(sql[j + 1] || "")) { j++; while (j < n && /[0-9]/.test(sql[j])) j++; }
        tokens.push({ type: "number", value: sql.slice(i, j) });
        i = j; continue;
      }
      if (/[A-Za-z_@#]/.test(c)) {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_$@#]/.test(sql[j])) j++;
        tokens.push({ type: "word", value: sql.slice(i, j) });
        i = j; continue;
      }
      const two = sql.slice(i, i + 2);
      if (["<>", "<=", ">=", "!=", "||", "::"].includes(two)) {
        tokens.push({ type: "op", value: two }); i += 2; continue;
      }
      if (c === "(") { tokens.push({ type: "lparen", value: "(" }); i++; continue; }
      if (c === ")") { tokens.push({ type: "rparen", value: ")" }); i++; continue; }
      if (c === ",") { tokens.push({ type: "comma", value: "," }); i++; continue; }
      if (c === ";") { tokens.push({ type: "semi", value: ";" }); i++; continue; }
      if (c === ".") { tokens.push({ type: "dot", value: "." }); i++; continue; }
      if ("=<>+-*/%".includes(c)) { tokens.push({ type: "op", value: c }); i++; continue; }
      tokens.push({ type: "other", value: c }); i++; continue;
    }
    return tokens;
  }

  // --- カンマ直前・( 直後などの、括弧の性質を前後関係から判定する ---
  // "list"    : CREATE TABLE(列定義) / INSERT INTO(列名) の直後   → カンマごとに改行
  // "subquery": 直後が SELECT / WITH → サブクエリとして改行して展開
  // "inline"  : それ以外（関数呼び出し・単純な式のグルーピングなど）→ 折り返さない
  function classifyParen(tokens, i) {
    const next = tokens[i + 1];
    if (next && next.type === "word") {
      const nu = next.value.toUpperCase();
      if (nu === "SELECT" || nu === "WITH") return "subquery";
    }
    let j = i - 1;
    if (j >= 0 && tokens[j] && tokens[j].type === "word") {
      while (j >= 2 && tokens[j - 1] && tokens[j - 1].type === "dot" && tokens[j - 2] && tokens[j - 2].type === "word") {
        j -= 2;
      }
      const p = j - 1;
      let q = p;
      while (q >= 0 && tokens[q] && tokens[q].type === "word" && ["IF", "NOT", "EXISTS"].includes(tokens[q].value.toUpperCase())) {
        q--;
      }
      if (q >= 1 && tokens[q] && tokens[q].type === "word" && tokens[q].value.toUpperCase() === "TABLE" &&
          tokens[q - 1] && tokens[q - 1].type === "word" && tokens[q - 1].value.toUpperCase() === "CREATE") {
        return "list";
      }
      if (p >= 1 && tokens[p] && tokens[p].type === "word" && tokens[p].value.toUpperCase() === "INTO" &&
          tokens[p - 1] && tokens[p - 1].type === "word" && tokens[p - 1].value.toUpperCase() === "INSERT") {
        return "list";
      }
    }
    return "inline";
  }

  function needsSpaceBefore(prev, cur) {
    if (!prev) return false;
    if (cur.type === "comma" || cur.type === "rparen" || cur.type === "semi" || cur.type === "dot") return false;
    if (prev.type === "lparen" || prev.type === "dot") return false;
    if (cur.type === "lparen" && prev.type === "word" && !KEYWORDS.has(prev.value.toUpperCase())) return false;
    if ((cur.type === "op" && cur.value === "::") || (prev.type === "op" && prev.value === "::")) return false;
    return true;
  }

  function renderToken(tok, upper) {
    if (tok.type === "word") {
      const U = tok.value.toUpperCase();
      if (KEYWORDS.has(U)) return upper ? U : U.toLowerCase();
    }
    return tok.value;
  }

  const JOIN_WORDS = new Set(["JOIN", "LEFT", "RIGHT", "FULL", "INNER", "CROSS", "OUTER"]);
  const TRIGGER_MAP = {
    SELECT: "clause-list", FROM: "clause-list", GROUP: "clause-list", ORDER: "clause-list",
    SET: "clause-list", WITH: "clause-list", RETURNING: "clause-list",
    WHERE: "clause-bool", HAVING: "clause-bool",
    VALUES: "values", UNION: null, LIMIT: null, OFFSET: null
  };
  const POP_KINDS = ["clause-list", "clause-bool", "clause-plain", "values"];

  function formatOneLine(tokens, opts) {
    let out = "";
    let last = null;
    for (const tok of tokens) {
      if (tok.type === "semi") { out += ";"; last = tok; continue; }
      const text = renderToken(tok, opts.upper);
      out += (needsSpaceBefore(last, tok) ? " " : "") + text;
      last = tok;
    }
    return out.trim();
  }

  function formatSql(sql, opts) {
    const tokens = tokenize(sql);
    if (tokens.length === 0) return "";
    if (opts.oneLine) return formatOneLine(tokens, opts);

    const IND = " ".repeat(opts.indentSize);
    const lines = [];
    let indentLevel = 0;
    let stack = [{ kind: "statement", base: 0 }];
    let curParts = [];
    let lineLastTok = null;
    let inJoinPhrase = false;

    function topFrame() { return stack[stack.length - 1]; }

    function startNewLine(newIndent) {
      if (curParts.length) lines.push(IND.repeat(indentLevel) + curParts.join(""));
      curParts = [];
      lineLastTok = null;
      if (newIndent !== undefined) indentLevel = newIndent;
    }

    function pushToken(tok, forceSpace) {
      const text = renderToken(tok, opts.upper);
      if (curParts.length === 0) {
        curParts.push(text);
      } else {
        const sp = forceSpace !== undefined ? forceSpace : needsSpaceBefore(lineLastTok, tok);
        curParts.push((sp ? " " : "") + text);
      }
      lineLastTok = tok;
    }

    function popClauseish() {
      while (stack.length > 1 && POP_KINDS.includes(topFrame().kind)) stack.pop();
    }

    function boolBreakIndent() {
      for (let k = stack.length - 1; k >= 0; k--) {
        const f = stack[k];
        if (f.kind === "clause-bool") return f.base + 1;
        if (f.kind === "paren-inline" || f.kind === "case") continue;
        return null;
      }
      return null;
    }

    function triggerClause(tok, U) {
      let base = indentLevel;
      if (POP_KINDS.includes(topFrame().kind)) base = topFrame().base;
      popClauseish();
      const suppress = (U === "FROM" && lineLastTok && lineLastTok.type === "word" && lineLastTok.value.toUpperCase() === "DELETE");
      if (!suppress) startNewLine(base); else indentLevel = base;
      pushToken(tok);
      const kind = TRIGGER_MAP[U];
      if (kind) stack.push({ kind, base });
    }

    function triggerJoin(tok) {
      let base = indentLevel;
      if (POP_KINDS.includes(topFrame().kind)) base = topFrame().base;
      popClauseish();
      startNewLine(base);
      pushToken(tok);
      stack.push({ kind: "clause-plain", base });
    }

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];

      if (tok.type === "comment") {
        pushToken(tok);
        if (tok.value.slice(0, 2) === "--") startNewLine(indentLevel);
        continue;
      }

      if (tok.type === "semi") {
        pushToken(tok);
        startNewLine(0);
        stack = [{ kind: "statement", base: 0 }];
        inJoinPhrase = false;
        const hasMore = tokens.slice(i + 1).some((t) => t.type !== "comment");
        if (hasMore) lines.push("");
        continue;
      }

      if (tok.type === "lparen") {
        if (topFrame().kind === "values") {
          const base = topFrame().base;
          startNewLine(base + 1);
          pushToken(tok);
          stack.push({ kind: "paren-inline", base: indentLevel });
        } else {
          const cls = classifyParen(tokens, i);
          if (cls === "subquery") {
            pushToken(tok, true);
            const base = indentLevel;
            stack.push({ kind: "paren-subquery", base });
            startNewLine(base + 1);
          } else if (cls === "list") {
            pushToken(tok, true);
            const base = indentLevel;
            stack.push({ kind: "paren-list", base });
            startNewLine(base + 1);
          } else {
            pushToken(tok);
            stack.push({ kind: "paren-inline", base: indentLevel });
          }
        }
        continue;
      }

      if (tok.type === "rparen") {
        popClauseish(); // WHERE/ORDER BYなどが閉じずに残っていたら、括弧を閉じる前に清算する
        if (stack.length > 1 && ["paren-list", "paren-subquery", "paren-inline"].includes(topFrame().kind)) {
          const f = stack.pop();
          if (f.kind === "paren-list" || f.kind === "paren-subquery") {
            startNewLine(f.base);
            pushToken(tok);
          } else {
            pushToken(tok);
          }
        } else {
          pushToken(tok);
        }
        continue;
      }

      if (tok.type === "comma") {
        const doBreak = ["clause-list", "paren-list"].includes(topFrame().kind);
        if (doBreak) {
          const base = topFrame().base;
          if (opts.commaStyle === "leading") {
            startNewLine(base + 1);
            pushToken(tok);
          } else {
            pushToken(tok);
            startNewLine(base + 1);
          }
        } else {
          pushToken(tok);
        }
        continue;
      }

      if (tok.type === "word") {
        const U = tok.value.toUpperCase();

        if (JOIN_WORDS.has(U)) {
          if (!inJoinPhrase) { triggerJoin(tok); inJoinPhrase = true; } else { pushToken(tok); }
          continue;
        }
        inJoinPhrase = false;

        if (Object.prototype.hasOwnProperty.call(TRIGGER_MAP, U)) {
          triggerClause(tok, U);
          continue;
        }
        if (U === "ON") {
          if (topFrame().kind === "clause-plain") stack.pop();
          pushToken(tok);
          stack.push({ kind: "clause-bool", base: indentLevel });
          continue;
        }
        if (U === "AND" || U === "OR") {
          const bi = boolBreakIndent();
          if (bi !== null) startNewLine(bi);
          pushToken(tok);
          continue;
        }
        if (U === "CASE") {
          pushToken(tok);
          stack.push({ kind: "case", base: indentLevel });
          continue;
        }
        if (U === "WHEN" && topFrame().kind === "case") {
          startNewLine(topFrame().base + 1);
          pushToken(tok);
          continue;
        }
        if (U === "ELSE" && topFrame().kind === "case") {
          startNewLine(topFrame().base + 1);
          pushToken(tok);
          continue;
        }
        if (U === "END" && topFrame().kind === "case") {
          const f = stack.pop();
          startNewLine(f.base);
          pushToken(tok);
          continue;
        }
        pushToken(tok);
        continue;
      }

      // string / ident / number / op / dot / other
      pushToken(tok);
    }

    startNewLine(0);
    // 末尾の空行を除去
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    return lines.join("\n");
  }

  function run() {
    const errEl = $("sf-error");
    errEl.textContent = "";
    const sql = $("sf-input").value;
    const opts = {
      upper: $("sf-case").value === "upper",
      indentSize: Math.min(8, Math.max(1, parseInt($("sf-indent").value, 10) || 2)),
      commaStyle: $("sf-comma").value,
      oneLine: $("sf-oneline").checked
    };
    try {
      $("sf-output").textContent = formatSql(sql, opts);
    } catch (e) {
      errEl.textContent = "整形エラー: " + e.message;
      $("sf-output").textContent = sql;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const debouncedRun = tb.debounce(run, 120);
    $("sf-input").addEventListener("input", debouncedRun);
    ["sf-case", "sf-indent", "sf-comma", "sf-oneline"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
