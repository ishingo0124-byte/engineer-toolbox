(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function z2h(s) {
    return String(s == null ? "" : s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).trim();
  }
  function needsQuote(s) {
    return s === "" || /[^A-Za-z0-9_./:@%+=,-]/.test(s);
  }
  function shQuote(s) {
    if (!needsQuote(s)) return s;
    return "'" + String(s).split("'").join("'\\''") + "'";
  }
  function parseNonNegInt(raw) {
    const s = z2h(raw);
    if (s === "") return { ok: true, val: null };
    if (!/^\d+$/.test(s)) return { ok: false, val: null };
    return { ok: true, val: parseInt(s, 10) };
  }
  function linesOf(id) {
    return $(id).value.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== "");
  }

  const COMP_LETTER = { targz: "z", tarbz2: "j", tarxz: "J", tar: "" };
  const COMP_NAME = { targz: "gzip", tarbz2: "bzip2", tarxz: "xz", tar: "無圧縮" };

  function run() {
    const errors = [];
    const explain = [];
    const op = $("tcb-op").value;
    const format = $("tcb-format").value;
    const archive = $("tcb-archive").value.trim() || "archive";
    const paths = linesOf("tcb-paths");
    const excludes = linesOf("tcb-exclude");
    const destdir = $("tcb-destdir").value.trim();
    const stripR = parseNonNegInt($("tcb-strip").value);
    const preserve = $("tcb-preserve").checked;
    const verbose = $("tcb-verbose").checked;

    if (!stripR.ok) errors.push("strip-components は0以上の整数で入力してください");
    if (op === "create" && paths.length === 0) errors.push("作成する対象パスを1つ以上入力してください");

    let cmd = "";
    let verify = "";
    let note = "";

    if (format === "zip") {
      if (stripR.ok && stripR.val !== null) note = "zip / unzip には tar の --strip-components に相当する機能がありません（この指定は反映されません）。";
      if (preserve) explain.push(["(権限保持)", "zip はアーカイブ内に Unix パーミッションを保存し、unzip 展開時に既定で復元されるため専用フラグは不要です"]);

      if (op === "create") {
        const tokens = ["zip", "-r", shQuote(archive)];
        explain.push(["-r", "ディレクトリを再帰的に含める"]);
        paths.forEach((p) => tokens.push(shQuote(p)));
        if (excludes.length) {
          tokens.push("-x");
          excludes.forEach((e) => tokens.push(shQuote(e)));
          explain.push(["-x " + excludes.map(shQuote).join(" "), "指定パターンに一致するファイルを圧縮対象から除外"]);
        }
        cmd = tokens.join(" ");
        verify = "unzip -l " + shQuote(archive);
      } else if (op === "extract") {
        const tokens = ["unzip", shQuote(archive)];
        if (excludes.length) {
          tokens.push("-x");
          excludes.forEach((e) => tokens.push(shQuote(e)));
          explain.push(["-x " + excludes.map(shQuote).join(" "), "指定パターンに一致するファイルを展開対象から除外"]);
        } else if (paths.length) {
          paths.forEach((p) => tokens.push(shQuote(p)));
          explain.push(["対象パス", "アーカイブ内の指定メンバーのみ展開"]);
        }
        if (destdir) { tokens.push("-d", shQuote(destdir)); explain.push(["-d " + shQuote(destdir), "展開先ディレクトリを指定"]); }
        cmd = tokens.join(" ");
        verify = "unzip -l " + shQuote(archive);
      } else {
        const tokens = ["unzip", "-l", shQuote(archive)];
        cmd = tokens.join(" ");
        verify = cmd;
      }
    } else {
      const compLetter = COMP_LETTER[format] || "";
      const opLetter = op === "create" ? "c" : op === "extract" ? "x" : "t";
      const letters = opLetter + compLetter + (verbose ? "v" : "") + (preserve && op === "extract" ? "p" : "") + "f";
      const tokens = ["tar", "-" + letters, shQuote(archive)];
      explain.push(["-" + letters, "操作=" + (op === "create" ? "作成(c)" : op === "extract" ? "展開(x)" : "一覧(t)") + "／圧縮=" + COMP_NAME[format] + (verbose ? "／詳細表示(v)" : "") + (preserve && op === "extract" ? "／権限保持(p)" : "") + "／ f は直後にファイル名を取るため最後に置く"]);

      excludes.forEach((e) => {
        tokens.push("--exclude=" + shQuote(e));
        explain.push(["--exclude=" + shQuote(e), "このパターンに一致するファイルを対象から除外"]);
      });

      if (op === "extract") {
        if (destdir) { tokens.push("-C", shQuote(destdir)); explain.push(["-C " + shQuote(destdir), "指定ディレクトリに展開（事前に作成しておく必要あり）"]); }
        if (stripR.ok && stripR.val !== null) { tokens.push("--strip-components=" + stripR.val); explain.push(["--strip-components=" + stripR.val, "アーカイブ内パスの先頭" + stripR.val + "階層を取り除いて展開"]); }
        paths.forEach((p) => tokens.push(shQuote(p)));
        if (paths.length) explain.push(["対象パス", "アーカイブ内の指定メンバーのみ展開（省略時は全て展開）"]);
      } else if (op === "create") {
        paths.forEach((p) => tokens.push(shQuote(p)));
      } else {
        paths.forEach((p) => tokens.push(shQuote(p)));
      }

      cmd = tokens.join(" ");
      verify = "tar -t" + compLetter + "vf " + shQuote(archive);
    }

    $("tcb-error").textContent = errors.join("、");
    $("tcb-command").textContent = cmd;
    $("tcb-verify").textContent = verify;
    $("tcb-note").textContent = note;

    renderExplain(explain);
  }

  function renderExplain(explain) {
    const box = $("tcb-explain-box");
    box.innerHTML = "";
    explain.forEach(([opt, desc]) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "mono";
      span.textContent = opt;
      li.appendChild(span);
      li.appendChild(document.createTextNode(" … " + desc));
      box.appendChild(li);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["tcb-op", "tcb-format", "tcb-archive", "tcb-paths", "tcb-exclude", "tcb-destdir", "tcb-strip", "tcb-preserve", "tcb-verbose"]
      .forEach((id) => $(id).addEventListener("input", run));
    run();
  });
})();
