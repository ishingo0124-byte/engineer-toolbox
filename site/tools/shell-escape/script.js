(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---- 単一値のエスケープ ----
  function bashSingleQuote(s) {
    // POSIX bash(1): シングルクォート内では ' 自体を表現できないため
    // 一旦クォートを閉じてエスケープ済みの ' を挟み、再度開く
    return "'" + s.split("'").join("'\\''") + "'";
  }

  function bashDoubleQuote(s) {
    // ダブルクォート内で特別な意味を持つ \ $ ` " をバックスラッシュでエスケープ
    const escaped = s.replace(/[\\$`"]/g, (c) => "\\" + c);
    return '"' + escaped + '"';
  }

  function psSingleQuote(s) {
    // about_Quoting_Rules: シングルクォート内は ' を '' に倍加する以外はすべてリテラル
    return "'" + s.split("'").join("''") + "'";
  }

  function psDoubleQuote(s) {
    // about_Quoting_Rules: エスケープ文字はバッククォート(`)。 ` $ " をエスケープする
    const escaped = s.replace(/[`$"]/g, (c) => "`" + c);
    return '"' + escaped + '"';
  }

  function cmdCaretEscape(s) {
    // cmd.exe が解釈するメタ文字 & | < > ^ ( ) ! の前に ^ を置いて無効化
    return s.replace(/([&|<>^()!])/g, "^$1");
  }

  // Windows のプログラム引数解析（MS C ランタイム / CommandLineToArgvW 方式）。
  // Python の subprocess.list2cmdline と同じアルゴリズム。
  function winArgvQuote(s) {
    if (s.length > 0 && !/[\s"]/.test(s)) return s;
    let result = '"';
    let numBackslashes = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "\\") {
        numBackslashes++;
      } else if (c === '"') {
        result += "\\".repeat(numBackslashes * 2 + 1) + '"';
        numBackslashes = 0;
      } else {
        result += "\\".repeat(numBackslashes) + c;
        numBackslashes = 0;
      }
    }
    result += "\\".repeat(numBackslashes * 2) + '"';
    return result;
  }

  function regexEscape(s) {
    return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  }

  function run() {
    const raw = $("se-input").value;
    $("se-bash-sq").textContent = bashSingleQuote(raw);
    $("se-bash-dq").textContent = bashDoubleQuote(raw);
    $("se-ps-sq").textContent = psSingleQuote(raw);
    $("se-ps-dq").textContent = psDoubleQuote(raw);
    $("se-cmd-caret").textContent = cmdCaretEscape(raw);
    $("se-cmd-argv").textContent = winArgvQuote(raw);
    $("se-json").textContent = JSON.stringify(raw);
    $("se-regex").textContent = regexEscape(raw);
    runArgList();
  }

  function runArgList() {
    const lines = $("se-arglist").value.split(/\r\n|\r|\n/).filter((l) => l !== "");
    const cmdName = $("se-cmdname").value.trim();
    const prefix = cmdName ? cmdName + " " : "";
    $("se-line-bash").textContent = prefix + lines.map(bashSingleQuote).join(" ");
    $("se-line-ps").textContent = prefix + lines.map(psSingleQuote).join(" ");
    $("se-line-cmd").textContent = prefix + lines.map(winArgvQuote).join(" ");
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["se-input", "se-arglist", "se-cmdname"].forEach((id) => $(id).addEventListener("input", run));
    run();
  });
})();
