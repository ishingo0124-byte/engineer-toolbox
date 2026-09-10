(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function linesOf(id) {
    return $(id).value.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== "");
  }

  // "location = /favicon.ico" のような1行を modifier とパターンに分解する
  function parseLocationLine(raw, lineNo) {
    let s = raw.trim().replace(/\{\s*$/, "").trim();
    const m = s.match(/^location\s+(=|\^~|~\*|~)?\s*(.+)$/);
    if (!m || !m[2]) return { error: "行" + lineNo + ": location 定義として解析できません（\"location ...\" の形式で入力してください）" };
    const modifier = m[1] || "";
    const pattern = m[2].trim();
    const label = "location " + (modifier ? modifier + " " : "") + pattern;
    return { modifier: modifier, pattern: pattern, label: label };
  }

  // nginx の location マッチ規則に従って最適な location を返す
  function matchLocation(locs, path) {
    // 1. 完全一致
    for (let i = 0; i < locs.length; i++) {
      const loc = locs[i];
      if (loc.modifier === "=" && loc.pattern === path) {
        return { loc: loc, reason: "完全一致（=）に一致したため即決定" };
      }
    }

    // 2. 前方一致（modifier なし、または ^~）のうち最長のものを探す
    let best = null;
    for (let i = 0; i < locs.length; i++) {
      const loc = locs[i];
      if ((loc.modifier === "" || loc.modifier === "^~") && path.indexOf(loc.pattern) === 0) {
        if (!best || loc.pattern.length > best.pattern.length) best = loc;
      }
    }
    if (best && best.modifier === "^~") {
      return { loc: best, reason: "^~ 付きの前方一致のうち最長のもの（" + best.pattern.length + "文字）に一致し、正規表現の検査を省略" };
    }

    // 3. 正規表現（定義順に最初に一致したもの）
    for (let i = 0; i < locs.length; i++) {
      const loc = locs[i];
      if (loc.modifier === "~" || loc.modifier === "~*") {
        let re;
        try { re = new RegExp(loc.pattern, loc.modifier === "~*" ? "i" : ""); } catch (e) { continue; }
        if (re.test(path)) {
          return { loc: loc, reason: "正規表現（" + loc.modifier + "）に一致。設定内で最初にマッチした定義" };
        }
      }
    }

    // 4. どの正規表現にも一致しなければ、最長の前方一致（^~ の有無を問わない）
    if (best) {
      return { loc: best, reason: "正規表現に一致するものが無く、最長の前方一致（" + best.pattern.length + "文字）を採用" };
    }
    return null;
  }

  function run() {
    const errors = [];
    const locLines = linesOf("ngc-locations");
    const locs = [];
    locLines.forEach((line, idx) => {
      const parsed = parseLocationLine(line, idx + 1);
      if (parsed.error) errors.push(parsed.error);
      else locs.push(parsed);
    });

    const paths = linesOf("ngc-paths");

    $("ngc-error").textContent = errors.join("　");

    const tbody = $("ngc-rows");
    tbody.innerHTML = "";
    paths.forEach((path) => {
      const result = matchLocation(locs, path);
      const tr = document.createElement("tr");

      const tdPath = document.createElement("td");
      const codePath = document.createElement("span");
      codePath.className = "mono";
      codePath.textContent = path;
      tdPath.appendChild(codePath);

      const tdLoc = document.createElement("td");
      const tdReason = document.createElement("td");

      if (result) {
        const codeLoc = document.createElement("span");
        codeLoc.className = "mono";
        codeLoc.textContent = result.loc.label;
        tdLoc.appendChild(codeLoc);
        tdReason.textContent = result.reason;
      } else {
        tdLoc.textContent = "マッチする location なし";
        tdReason.textContent = "定義済みのいずれの location（完全一致・前方一致・正規表現）にも一致しませんでした";
      }

      tr.appendChild(tdPath);
      tr.appendChild(tdLoc);
      tr.appendChild(tdReason);
      tbody.appendChild(tr);
    });

    if (paths.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.textContent = "テストするリクエストパスを入力してください";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["ngc-locations", "ngc-paths"].forEach((id) => $(id).addEventListener("input", run));
    run();
  });
})();
