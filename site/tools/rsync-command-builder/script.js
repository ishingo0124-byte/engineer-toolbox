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

  function trailingSlashNote(path) {
    if (!path) return "";
    if (/\/$/.test(path)) return "末尾が「/」なので、このディレクトリの中身だけが宛先直下にコピーされます（同名ディレクトリは作られません）。";
    return "末尾に「/」が無いので、このディレクトリ自体が宛先の中にコピーされます（宛先に同名ディレクトリが作られます）。";
  }

  function run() {
    const errors = [];
    const explain = [];
    const tokens = ["rsync"];

    const src = $("rcb-src").value.trim() || ".";
    const dst = $("rcb-dst").value.trim() || ".";
    $("rcb-src-hint").textContent = trailingSlashNote(src);

    let letters = "";
    if ($("rcb-a").checked) letters += "a";
    if ($("rcb-v").checked) letters += "v";
    if ($("rcb-z").checked) letters += "z";
    if ($("rcb-h").checked) letters += "h";
    if ($("rcb-n").checked) letters += "n";
    if ($("rcb-P").checked) letters += "P";
    if (letters) {
      tokens.push("-" + letters);
      const map = { a: "-a（属性・シンボリックリンク・再帰を保持）", v: "-v（詳細表示）", z: "-z（転送時に圧縮）", h: "-h（数値を読みやすく表示）", n: "-n（試験実行・--dry-run）", P: "-P（--partial --progress：再開と進捗表示）" };
      letters.split("").forEach((c) => explain.push(["-" + c, map[c]]));
    }

    if ($("rcb-delete").checked) {
      tokens.push("--delete");
      explain.push(["--delete", "宛先側にだけ存在するファイル・ディレクトリを削除して送信元と一致させる"]);
      $("rcb-delete-warn").textContent = "注意: --delete は宛先のファイルを削除します。-n（--dry-run）を併用して結果を確認してから本番実行することを推奨します。";
    } else {
      $("rcb-delete-warn").textContent = "";
    }

    linesOf("rcb-include").forEach((p) => {
      tokens.push("--include=" + shQuote(p));
      explain.push(["--include=" + shQuote(p), "このパターンに一致するものは除外対象にしない"]);
    });
    linesOf("rcb-exclude").forEach((p) => {
      tokens.push("--exclude=" + shQuote(p));
      explain.push(["--exclude=" + shQuote(p), "このパターンに一致するものは転送しない"]);
    });

    const portR = parseNonNegInt($("rcb-ssh-port").value);
    if (!portR.ok) errors.push("SSH ポートは数字で入力してください");
    else if (portR.val !== null) {
      const sshCmd = "ssh -p " + portR.val;
      tokens.push("-e", shQuote(sshCmd));
      explain.push(["-e " + shQuote(sshCmd), "SSH の接続先ポートを " + portR.val + " 番に指定"]);
    }

    const bwR = parseNonNegInt($("rcb-bwlimit").value);
    if (!bwR.ok) errors.push("--bwlimit は数字（KB/s）で入力してください");
    else if (bwR.val !== null) {
      tokens.push("--bwlimit=" + bwR.val);
      explain.push(["--bwlimit=" + bwR.val, "転送速度を " + bwR.val + " KB/s に制限"]);
    }

    tokens.push(shQuote(src), shQuote(dst));

    $("rcb-error").textContent = errors.join("、");
    $("rcb-command").textContent = tokens.join(" ");

    const ul = $("rcb-explain");
    ul.innerHTML = "";
    explain.forEach(([opt, desc]) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "mono";
      span.textContent = opt;
      li.appendChild(span);
      li.appendChild(document.createTextNode(" … " + desc));
      ul.appendChild(li);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["rcb-src", "rcb-dst", "rcb-a", "rcb-v", "rcb-z", "rcb-h", "rcb-P", "rcb-n", "rcb-delete",
      "rcb-include", "rcb-exclude", "rcb-ssh-port", "rcb-bwlimit"
    ].forEach((id) => $(id).addEventListener("input", run));
    run();
  });
})();
