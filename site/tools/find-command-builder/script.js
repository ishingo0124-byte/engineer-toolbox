(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function z2h(s) {
    return String(s == null ? "" : s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).trim();
  }

  // シェル上で安全に扱えるよう、必要な場合だけシングルクォートで囲む
  function needsQuote(s) {
    return s === "" || /[^A-Za-z0-9_./:@%+=,-]/.test(s);
  }
  function shQuote(s) {
    if (!needsQuote(s)) return s;
    return "'" + String(s).split("'").join("'\\''") + "'";
  }

  // 整数（負数・小数・空文字は不可）のみ許可
  function parseNonNegInt(raw) {
    const s = z2h(raw);
    if (s === "") return { ok: true, val: null };
    if (!/^\d+$/.test(s)) return { ok: false, val: null };
    return { ok: true, val: parseInt(s, 10) };
  }

  function run() {
    const errors = [];
    const explain = [];
    const tokens = ["find"];

    const root = $("fdb-root").value.trim() || ".";
    tokens.push(shQuote(root));
    explain.push(["起点パス", root]);

    const maxdepthR = parseNonNegInt($("fdb-maxdepth").value);
    if (!maxdepthR.ok) errors.push("-maxdepth は0以上の整数で入力してください");
    else if (maxdepthR.val !== null) {
      tokens.push("-maxdepth", String(maxdepthR.val));
      explain.push(["-maxdepth " + maxdepthR.val, "起点から" + maxdepthR.val + "階層までしか探索しない（先に置くのが安全）"]);
    }

    const type = $("fdb-type").value;
    if (type) {
      tokens.push("-type", type);
      const typeNames = { f: "通常ファイル", d: "ディレクトリ", l: "シンボリックリンク" };
      explain.push(["-type " + type, typeNames[type] + "のみ対象"]);
    }

    const namePattern = $("fdb-name").value.trim();
    if (namePattern) {
      const mode = $("fdb-name-mode").value; // name | iname
      const negate = $("fdb-name-negate").checked;
      const opt = mode === "iname" ? "-iname" : "-name";
      if (negate) tokens.push("!", opt, shQuote(namePattern));
      else tokens.push(opt, shQuote(namePattern));
      explain.push([(negate ? "! " : "") + opt + " " + shQuote(namePattern),
        (negate ? "パターンに一致し" + "ない" : "パターンに一致する") + "ファイル名（" + (mode === "iname" ? "大小文字を無視" : "大小文字を区別") + "）"]);
    }

    const mtimeOp = $("fdb-mtime-op").value; // "", "+", "-", "exact"
    if (mtimeOp) {
      const numR = parseNonNegInt($("fdb-mtime-num").value);
      if (!numR.ok || numR.val === null) errors.push("更新日時のNは0以上の整数で入力してください");
      else {
        const unit = $("fdb-mtime-unit").value; // day | min
        const flag = unit === "min" ? "-mmin" : "-mtime";
        const sign = mtimeOp === "+" ? "+" : mtimeOp === "-" ? "-" : "";
        tokens.push(flag, sign + numR.val);
        const unitLabel = unit === "min" ? "分" : "日";
        let desc;
        if (mtimeOp === "+") desc = numR.val + unitLabel + "より前に更新（丸めの都合で実際は" + (numR.val + 1) + unitLabel + "以上前）";
        else if (mtimeOp === "-") desc = numR.val + unitLabel + "以内に更新";
        else desc = "更新から" + numR.val + "〜" + (numR.val + 1) + unitLabel + "の範囲（丸め区間）";
        explain.push([flag + " " + sign + numR.val, desc]);
      }
    }

    const sizeOp = $("fdb-size-op").value;
    if (sizeOp) {
      const numR = parseNonNegInt($("fdb-size-num").value);
      if (!numR.ok || numR.val === null) errors.push("サイズのNは0以上の整数で入力してください");
      else {
        const unit = $("fdb-size-unit").value;
        const sign = sizeOp === "+" ? "+" : sizeOp === "-" ? "-" : "";
        const val = sign + numR.val + unit;
        tokens.push("-size", val);
        const unitLabel = { c: "バイト", k: "KiB", M: "MiB", G: "GiB" }[unit] || unit;
        let desc;
        if (sizeOp === "+") desc = numR.val + unitLabel + "より大きい";
        else if (sizeOp === "-") desc = numR.val + unitLabel + "未満";
        else desc = "ちょうど" + numR.val + unitLabel + "相当";
        explain.push(["-size " + val, desc]);
      }
    }

    const user = $("fdb-user").value.trim();
    if (user) {
      tokens.push("-user", shQuote(user));
      explain.push(["-user " + shQuote(user), "所有者が " + user + " のもの"]);
    }

    const permMode = $("fdb-perm-mode").value;
    const permValue = $("fdb-perm-value").value.trim();
    if (permMode && permValue) {
      const prefix = permMode === "all" ? "-" : permMode === "any" ? "/" : "";
      tokens.push("-perm", prefix + permValue);
      const permDesc = permMode === "all" ? "指定ビットを全て含む" : permMode === "any" ? "指定ビットのいずれかを含む" : "権限が完全一致";
      explain.push(["-perm " + prefix + permValue, permDesc]);
    } else if (permMode && !permValue) {
      errors.push("-perm を使う場合は mode を入力してください");
    }

    if ($("fdb-empty").checked) {
      tokens.push("-empty");
      explain.push(["-empty", "空のファイル・空のディレクトリのみ"]);
    }

    const action = $("fdb-action").value;
    const execCmd = $("fdb-exec-cmd").value.trim();
    let pipeSuffix = "";
    if (action === "delete") {
      tokens.push("-delete");
      explain.push(["-delete", "一致したものを削除（必ず最後に置く。事前に -delete を外して結果を確認するのが安全）"]);
    } else if (action === "exec-semi" || action === "exec-plus") {
      if (!execCmd) errors.push("-exec で実行するコマンドを入力してください");
      else {
        const cmdWords = execCmd.split(/\s+/).filter(Boolean);
        tokens.push("-exec");
        cmdWords.forEach((w) => tokens.push(w));
        if (action === "exec-semi") { tokens.push("{}", "\\;"); explain.push(["-exec " + execCmd + " {} \\;", "一致したファイル1件ごとにコマンドを実行"]); }
        else { tokens.push("{}", "+"); explain.push(["-exec " + execCmd + " {} +", "一致したファイルをまとめて引数に渡して実行（xargs的に高速）"]); }
      }
    } else if (action === "xargs0") {
      if (!execCmd) errors.push("xargs で実行するコマンドを入力してください");
      else {
        tokens.push("-print0");
        pipeSuffix = " | xargs -0 " + execCmd;
        explain.push(["-print0 | xargs -0 " + execCmd, "ファイル名をNUL区切りで渡す（スペースや改行を含む名前でも安全）"]);
      }
    }

    $("fdb-error").textContent = errors.join("、");
    $("fdb-command").textContent = tokens.join(" ") + pipeSuffix;

    const ul = $("fdb-explain");
    ul.innerHTML = "";
    if (explain.length === 0) {
      const li = document.createElement("li");
      li.textContent = "条件が指定されていません（起点パス以下すべてが対象）";
      ul.appendChild(li);
    } else {
      explain.forEach(([opt, desc]) => {
        const li = document.createElement("li");
        const strong = document.createElement("span");
        strong.className = "mono";
        strong.textContent = opt;
        li.appendChild(strong);
        li.appendChild(document.createTextNode(" … " + desc));
        ul.appendChild(li);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["fdb-root", "fdb-maxdepth", "fdb-name", "fdb-name-mode", "fdb-name-negate", "fdb-type", "fdb-empty",
      "fdb-mtime-op", "fdb-mtime-num", "fdb-mtime-unit", "fdb-size-op", "fdb-size-num", "fdb-size-unit",
      "fdb-user", "fdb-perm-mode", "fdb-perm-value", "fdb-action", "fdb-exec-cmd"
    ].forEach((id) => $(id).addEventListener("input", run));
    run();
  });
})();
