(function () {
  "use strict";
  const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);
  const z2h = (s) => (typeof tb !== "undefined" && tb.z2h ? tb.z2h(s) : s);

  function parsePaths(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");
  }

  function parseNonNegInt(text) {
    const s = z2h(String(text || "")).trim();
    if (s === "") return { ok: false, error: "空です" };
    if (!/^[0-9]+$/.test(s)) return { ok: false, error: "半角の整数で入力してください" };
    return { ok: true, value: parseInt(s, 10) };
  }

  function validateSize(text) {
    const s = z2h(String(text || "")).trim();
    if (s === "") return { ok: false, error: "サイズを入力してください（例: 100k / 100M / 1G）" };
    if (!/^[0-9]+[kKmMgG]?$/.test(s)) return { ok: false, error: "サイズの書式が正しくありません（数字＋任意でk/M/Gの単位、例: 100M）" };
    return { ok: true, value: s };
  }

  function validateMode(text) {
    const s = z2h(String(text || "")).trim();
    if (s === "") return { ok: true, value: "" };
    if (!/^0?[0-7]{3,4}$/.test(s)) return { ok: false, error: "モードは3〜4桁の8進数で入力してください（例: 0640, 644）" };
    return { ok: true, value: s };
  }

  function indent(lines, n) {
    const pad = " ".repeat(n);
    return lines.map((l) => pad + l);
  }

  function generate(input) {
    const errors = [];
    const warnings = [];

    const paths = parsePaths(input.paths);
    if (paths.length === 0) errors.push("対象パスを1行以上入力してください");
    paths.forEach((p) => {
      if (!p.startsWith("/")) warnings.push("パス「" + p + "」が「/」で始まっていません。絶対パスの指定を推奨します");
    });

    const name = String(input.name || "").trim();
    if (name === "") errors.push("設定ファイル名を入力してください");
    else if (!/^[A-Za-z0-9._-]+$/.test(name)) errors.push("設定ファイル名は半角英数字とアンダースコア・ハイフン・ドットのみで入力してください");

    const rotateResult = parseNonNegInt(input.rotate);
    if (!rotateResult.ok) errors.push("保持世代数（rotate）: " + rotateResult.error);

    let sizeLine = "";
    if (input.period === "size") {
      const sizeResult = validateSize(input.size);
      if (!sizeResult.ok) errors.push("サイズ: " + sizeResult.error);
      else sizeLine = "size " + sizeResult.value;
    }

    const modeResult = validateMode(input.createMode);
    if (!modeResult.ok) errors.push("createモード: " + modeResult.error);

    if (input.copytruncate && input.create) {
      warnings.push("copytruncateとcreateは同時に指定すると矛盾します。copytruncateは元のログファイルを移動せずに中身だけ空にする方式で、新しい空ファイルを作る前提のcreateとは両立しません。どちらか一方を選んでください（このツールは指定どおり両方とも出力します）");
    }
    if (input.delaycompress && !input.compress) {
      warnings.push("delaycompressはcompressと併用しないと効果がありません。compressを外した場合、delaycompressの行は出力しません");
    }
    if (input.create) {
      const hasOwner = String(input.createOwner || "").trim() !== "";
      const hasGroup = String(input.createGroup || "").trim() !== "";
      if (hasOwner !== hasGroup) warnings.push("createの所有者とグループは両方指定するか、両方空欄にしてください（片方だけでは出力に反映されません）");
      if ((hasOwner || hasGroup) && modeResult.ok && modeResult.value === "") warnings.push("所有者/グループを指定する場合はモードも指定してください（logrotateのcreateは「create モード 所有者 グループ」の順で指定します）");
    }

    if (errors.length > 0) return { errors, warnings, unitText: "", path: "" };

    const body = [];
    body.push(input.period === "size" ? sizeLine : input.period);
    body.push("rotate " + rotateResult.value);
    if (input.compress) body.push("compress");
    if (input.delaycompress && input.compress) body.push("delaycompress");
    if (input.missingok) body.push("missingok");
    if (input.notifempty) body.push("notifempty");
    if (input.copytruncate) body.push("copytruncate");
    if (input.create) {
      const hasOwner = String(input.createOwner || "").trim() !== "";
      const hasGroup = String(input.createGroup || "").trim() !== "";
      if (modeResult.value !== "" && hasOwner && hasGroup) {
        body.push("create " + modeResult.value + " " + input.createOwner.trim() + " " + input.createGroup.trim());
      } else if (modeResult.value !== "") {
        body.push("create " + modeResult.value);
      } else {
        body.push("create");
      }
    }
    if (input.dateext) {
      body.push("dateext");
      const df = String(input.dateformat || "").trim();
      if (df !== "") body.push("dateformat " + df);
    }
    const scriptLines = parsePaths(input.postrotate); // 空行除去・trimの挙動を流用
    if (scriptLines.length > 0) {
      if (input.sharedscripts) body.push("sharedscripts");
      body.push("postrotate");
      body.push(...indent(scriptLines, 4));
      body.push("endscript");
    }

    const headerLine = paths.length === 1 ? paths[0] + " {" : paths.join("\n") + "\n{";
    const text = headerLine + "\n" + indent(body, 4).join("\n") + "\n}\n";
    const path = "/etc/logrotate.d/" + name;

    return { errors, warnings, unitText: text, path };
  }

  function readInput() {
    return {
      paths: $("lrg-paths").value,
      name: $("lrg-name").value,
      period: $("lrg-period").value,
      size: $("lrg-size").value,
      rotate: $("lrg-rotate").value,
      compress: $("lrg-compress").checked,
      delaycompress: $("lrg-delaycompress").checked,
      missingok: $("lrg-missingok").checked,
      notifempty: $("lrg-notifempty").checked,
      copytruncate: $("lrg-copytruncate").checked,
      create: $("lrg-create").checked,
      createMode: $("lrg-create-mode").value,
      createOwner: $("lrg-create-owner").value,
      createGroup: $("lrg-create-group").value,
      dateext: $("lrg-dateext").checked,
      dateformat: $("lrg-dateformat").value,
      postrotate: $("lrg-postrotate").value,
      sharedscripts: $("lrg-sharedscripts").checked,
    };
  }

  function run() {
    $("lrg-size-field").style.display = $("lrg-period").value === "size" ? "" : "none";

    const result = generate(readInput());
    $("lrg-error").textContent = result.errors.join("　／　");

    const warnBox = $("lrg-warnbox");
    warnBox.innerHTML = "";
    if (result.warnings.length) {
      result.warnings.forEach((w) => {
        const p = document.createElement("p");
        p.textContent = "警告: " + w;
        warnBox.appendChild(p);
      });
      warnBox.hidden = false;
    } else {
      warnBox.hidden = true;
    }

    $("lrg-output").textContent = result.unitText || "";
    $("lrg-path").textContent = result.path || "-";
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      [
        "lrg-paths", "lrg-name", "lrg-period", "lrg-size", "lrg-rotate",
        "lrg-compress", "lrg-delaycompress", "lrg-missingok", "lrg-notifempty", "lrg-copytruncate",
        "lrg-create", "lrg-create-mode", "lrg-create-owner", "lrg-create-group",
        "lrg-dateext", "lrg-dateformat", "lrg-postrotate", "lrg-sharedscripts",
      ].forEach((id) => {
        const el = $(id);
        el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", run);
      });
      run();
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { generate, parseNonNegInt, validateSize, validateMode, parsePaths };
  }
})();
