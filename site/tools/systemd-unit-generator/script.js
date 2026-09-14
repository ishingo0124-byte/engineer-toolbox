(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function isAbsPath(p) {
    return typeof p === "string" && p.length > 0 && p.charAt(0) === "/";
  }

  function validateUnitName(name) {
    return /^[A-Za-z0-9:_.@-]+$/.test(name);
  }

  function parseNonNegInt(raw) {
    const s = tb.z2h(String(raw || "")).trim();
    if (s === "") return { ok: true, value: null };
    if (!/^[0-9]+$/.test(s)) return { ok: false, value: null };
    return { ok: true, value: parseInt(s, 10) };
  }

  function parseEnvironment(text) {
    const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
    const entries = [];
    const badLines = [];
    for (const line of lines) {
      const eq = line.indexOf("=");
      if (eq <= 0) { badLines.push(line); continue; }
      const key = line.slice(0, eq);
      const value = line.slice(eq + 1);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) { badLines.push(line); continue; }
      entries.push({ key, value });
    }
    return { entries, badLines };
  }

  // input -> { errors: string[], warnings: string[], unitText, path, cmd }
  function generate(input) {
    const errors = [];
    const warnings = [];

    const description = (input.description || "").trim();
    const unitname = tb.z2h(input.unitname || "").trim();
    const type = input.type || "simple";
    const execStart = tb.z2h(input.execStart || "").trim();
    const workdir = tb.z2h(input.workdir || "").trim();
    const user = (input.user || "").trim();
    const group = (input.group || "").trim();
    const envfile = tb.z2h(input.envfile || "").trim();
    const envfileOptional = !!input.envfileOptional;
    const restart = input.restart || "no";
    const after = tb.z2h(input.after || "").trim();
    const wants = tb.z2h(input.wants || "").trim();
    const wantedby = tb.z2h(input.wantedby || "").trim() || "multi-user.target";

    if (!unitname) errors.push("ユニット名を入力してください");
    else if (!validateUnitName(unitname)) errors.push("ユニット名に使えるのは英数字と : _ . @ - のみです: " + unitname);

    if (!execStart) errors.push("ExecStart を入力してください");
    else if (!isAbsPath(execStart)) errors.push("ExecStart は絶対パスで指定してください（例: /usr/local/bin/myapp ...）: " + execStart);

    if (workdir && !isAbsPath(workdir)) errors.push("WorkingDirectory は絶対パスで指定してください: " + workdir);
    if (envfile && !isAbsPath(envfile)) errors.push("EnvironmentFile は絶対パスで指定してください: " + envfile);

    const restartSecResult = parseNonNegInt(input.restartsec);
    if (!restartSecResult.ok) errors.push("RestartSec は0以上の整数で指定してください: " + input.restartsec);

    const envParsed = parseEnvironment(input.envText);
    if (envParsed.badLines.length) {
      errors.push("Environment は1行1つの KEY=VALUE 形式にしてください（不正な行: " + envParsed.badLines.join(" / ") + "）");
    }

    if (type === "oneshot" && restart !== "no") {
      warnings.push("Type=oneshot は1回の実行で終了する想定です。Restart=" + restart + " と組み合わせると、終了するたびに再実行を繰り返す可能性があります。定期的に1回だけ実行したいなら systemd timer（.timer ユニット）の利用を検討してください。");
    }
    if (type === "forking") {
      warnings.push("Type=forking は、起動したプロセス自身が fork してデーモン化し、親プロセスを終了させる実装が前提です。フォアグラウンドで動き続けるだけのコマンドを指定すると、systemd が起動完了を検知できずタイムアウトで失敗する場合があります。");
    }
    if (restart === "no" && restartSecResult.ok && restartSecResult.value != null) {
      warnings.push("Restart=no の場合、RestartSec は使われません（自動再起動自体が発生しないため無視されます）。");
    }
    if (envfile && !envfileOptional) {
      warnings.push("EnvironmentFile に指定したファイルが存在しない場合、サービスは起動に失敗します。存在するか不確かな場合は「ファイルが無くてもエラーにしない」を有効にしてください。");
    }

    if (errors.length) {
      return { errors, warnings, unitText: null, path: null, cmd: null };
    }

    const unitLines = ["[Unit]"];
    if (description) unitLines.push("Description=" + description);
    if (after) unitLines.push("After=" + after);
    if (wants) unitLines.push("Wants=" + wants);

    const serviceLines = ["[Service]", "Type=" + type, "ExecStart=" + execStart];
    if (workdir) serviceLines.push("WorkingDirectory=" + workdir);
    if (user) serviceLines.push("User=" + user);
    if (group) serviceLines.push("Group=" + group);
    envParsed.entries.forEach((e) => serviceLines.push("Environment=" + e.key + "=" + e.value));
    if (envfile) serviceLines.push("EnvironmentFile=" + (envfileOptional ? "-" : "") + envfile);
    serviceLines.push("Restart=" + restart);
    if (restartSecResult.value != null) serviceLines.push("RestartSec=" + restartSecResult.value);

    const installLines = ["[Install]"];
    if (wantedby) installLines.push("WantedBy=" + wantedby);

    const unitText = unitLines.join("\n") + "\n\n" + serviceLines.join("\n") + "\n\n" + installLines.join("\n") + "\n";
    const path = "/etc/systemd/system/" + unitname + ".service";
    const cmd = "sudo systemctl daemon-reload && sudo systemctl enable --now " + unitname + ".service";

    return { errors, warnings, unitText, path, cmd };
  }

  function readInput() {
    return {
      description: $("sug-desc").value,
      unitname: $("sug-unitname").value,
      type: $("sug-type").value,
      execStart: $("sug-execstart").value,
      workdir: $("sug-workdir").value,
      user: $("sug-user").value,
      group: $("sug-group").value,
      envText: $("sug-env").value,
      envfile: $("sug-envfile").value,
      envfileOptional: $("sug-envfile-optional").checked,
      restart: $("sug-restart").value,
      restartsec: $("sug-restartsec").value,
      after: $("sug-after").value,
      wants: $("sug-wants").value,
      wantedby: $("sug-wantedby").value,
    };
  }

  function run() {
    const result = generate(readInput());

    $("sug-error").textContent = result.errors.join("　／　");

    const warnBox = $("sug-warnbox");
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

    $("sug-output").textContent = result.unitText || "";
    $("sug-path").textContent = result.path || "-";
    $("sug-cmd").textContent = result.cmd || "-";
  }

  document.addEventListener("DOMContentLoaded", () => {
    [
      "sug-desc", "sug-unitname", "sug-type", "sug-execstart", "sug-workdir",
      "sug-user", "sug-group", "sug-env", "sug-envfile", "sug-envfile-optional",
      "sug-restart", "sug-restartsec", "sug-after", "sug-wants", "sug-wantedby",
    ].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", run);
    });
    run();
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { generate, parseEnvironment, isAbsPath, validateUnitName, parseNonNegInt };
  }
})();
