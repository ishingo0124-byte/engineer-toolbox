(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* =====================================================================
   * シェル風トークナイザ（自作・外部ライブラリなし）
   * 対応: バックスラッシュ行継続、シングルクォート（無エスケープ）、
   *       ダブルクォート（\" \\ \$ \` の基本エスケープ、\<改行> は継続扱い）、
   *       クォート外の空白区切り、クォートの部分埋め込み（KEY="a b" 等）。
   * =================================================================== */
  class ShellError extends Error {}

  function tokenizeShell(text) {
    const s = text.replace(/\r\n?/g, "\n");
    const tokens = [];
    let current = "";
    let started = false;
    let inSingle = false;
    let inDouble = false;
    const n = s.length;
    for (let i = 0; i < n; i++) {
      const c = s[i];
      if (inSingle) {
        if (c === "'") { inSingle = false; }
        else { current += c; }
        continue;
      }
      if (inDouble) {
        if (c === '"') { inDouble = false; continue; }
        if (c === "\\") {
          const next = s[i + 1];
          if (next === '"' || next === "\\" || next === "$" || next === "`") { current += next; i++; }
          else if (next === "\n") { i++; }
          else { current += c; }
          continue;
        }
        current += c;
        continue;
      }
      if (c === "'") { inSingle = true; started = true; continue; }
      if (c === '"') { inDouble = true; started = true; continue; }
      if (c === "\\") {
        const next = s[i + 1];
        if (next === "\n") { i++; continue; } // 行継続
        if (next === undefined) { current += "\\"; }
        else { current += next; i++; started = true; }
        continue;
      }
      if (/\s/.test(c)) {
        if (started || current !== "") { tokens.push(current); current = ""; started = false; }
        continue;
      }
      current += c;
      started = true;
    }
    if (inSingle) throw new ShellError("シングルクォートが閉じていません");
    if (inDouble) throw new ShellError("ダブルクォートが閉じていません");
    if (started || current !== "") tokens.push(current);
    return tokens;
  }

  /* =====================================================================
   * docker run オプション解析
   * =================================================================== */
  const KNOWN_FLAGS = new Set([
    "-d", "--detach", "--rm", "-i", "--interactive", "-t", "--tty",
    "-it", "-ti", "--read-only", "--init", "--sig-proxy"
  ]);
  // よく使われるが今回は変換非対応（値を1つ取る）オプション
  const VALUE_TAKING_UNKNOWN = new Set([
    "--gpus", "--memory", "-m", "--cpus", "--cpuset-cpus", "--pids-limit",
    "--shm-size", "--add-host", "--dns", "--dns-search", "--link", "--device",
    "--health-cmd", "--health-interval", "--health-retries", "--health-timeout",
    "--ip", "--mac-address", "--stop-signal", "--stop-timeout", "--log-driver",
    "--log-opt", "--security-opt", "--tmpfs", "--ulimit", "--expose", "--platform", "--pull"
  ]);

  function splitEq(tok) {
    if (tok.startsWith("--")) {
      const idx = tok.indexOf("=");
      if (idx !== -1) return [tok.slice(0, idx), tok.slice(idx + 1)];
    }
    return [tok, null];
  }

  function parseMount(raw, ctx) {
    const attrs = {};
    for (const part of raw.split(",").map((x) => x.trim()).filter(Boolean)) {
      const eq = part.indexOf("=");
      const k = eq === -1 ? part : part.slice(0, eq);
      const v = eq === -1 ? "" : part.slice(eq + 1);
      attrs[k] = v;
    }
    const type = attrs.type;
    if (type === "bind" || type === "volume") {
      const source = attrs.source || attrs.src;
      const target = attrs.target || attrs.destination || attrs.dst;
      if (source && target) {
        const ro = attrs.readonly === "" || attrs.readonly === "true" || "ro" in attrs;
        ctx.volumes.push(source + ":" + target + (ro ? ":ro" : ""));
        const known = new Set(["type", "source", "src", "target", "destination", "dst", "readonly", "ro"]);
        const extra = Object.keys(attrs).filter((k) => !known.has(k));
        if (extra.length) {
          ctx.notes.push(
            "--mount の一部属性は変換できません（" + extra.map((k) => k + (attrs[k] !== "" ? "=" + attrs[k] : "")).join(", ") +
            "）。元の指定: --mount " + raw + "（手動で確認してください）"
          );
        }
        return;
      }
    }
    ctx.notes.push("未対応の --mount 指定です（手動で変換してください）: --mount " + raw);
  }

  function parseDockerRun(tokens) {
    let i = 0;
    if (tokens[i] === "docker") i++;
    if (tokens[i] === "run") i++;

    const ctx = {
      containerName: null,
      ports: [],
      volumes: [],
      env: {},
      envFiles: [],
      restart: null,
      networks: [],
      workingDir: null,
      user: null,
      hostname: null,
      entrypoint: null,
      labels: {},
      capAdd: [],
      privileged: false,
      unsupported: [],
      notes: []
    };

    let image = null;
    let command = [];

    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok.length === 0 || tok[0] !== "-") { image = tok; i++; break; }
      const [name, inlineValue] = splitEq(tok);
      const takeValue = () => {
        if (inlineValue !== null) return inlineValue;
        i++;
        if (i >= tokens.length) throw new ShellError(name + " には値が必要です");
        return tokens[i];
      };
      switch (name) {
        case "-d": case "--detach": break;
        case "--name": ctx.containerName = takeValue(); break;
        case "-p": case "--publish": ctx.ports.push(takeValue()); break;
        case "-v": case "--volume": ctx.volumes.push(takeValue()); break;
        case "--mount": parseMount(takeValue(), ctx); break;
        case "-e": case "--env": {
          const v = takeValue();
          const eq = v.indexOf("=");
          if (eq === -1) ctx.env[v] = null; else ctx.env[v.slice(0, eq)] = v.slice(eq + 1);
          break;
        }
        case "--env-file": ctx.envFiles.push(takeValue()); break;
        case "--restart": ctx.restart = takeValue(); break;
        case "--network": ctx.networks.push(takeValue()); break;
        case "-w": case "--workdir": ctx.workingDir = takeValue(); break;
        case "-u": case "--user": ctx.user = takeValue(); break;
        case "--hostname": ctx.hostname = takeValue(); break;
        case "--entrypoint": ctx.entrypoint = takeValue(); break;
        case "--label": {
          const v = takeValue();
          const eq = v.indexOf("=");
          if (eq === -1) ctx.labels[v] = null; else ctx.labels[v.slice(0, eq)] = v.slice(eq + 1);
          break;
        }
        case "--cap-add": ctx.capAdd.push(takeValue()); break;
        case "--privileged": ctx.privileged = true; break;
        default:
          if (KNOWN_FLAGS.has(name)) { break; }
          if (inlineValue !== null) { ctx.unsupported.push(name + "=" + inlineValue); }
          else if (VALUE_TAKING_UNKNOWN.has(name)) { ctx.unsupported.push(name + " " + takeValue()); }
          else { ctx.unsupported.push(name); }
      }
      i++;
    }
    if (image === null) throw new ShellError("イメージ名が見つかりません（docker run の後にイメージ名が必要です）");
    command = tokens.slice(i);
    return { image, command, ctx };
  }

  /* =====================================================================
   * YAML 出力（Compose Specification 準拠のシンプルなブロック形式）
   * ports/volumes などコロンを含む値は必ずダブルクォートする。
   * =================================================================== */
  function needsQuote(s) {
    if (s === "") return true;
    if (/^\s|\s$/.test(s)) return true;
    if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(s)) return true;
    if (/^[-+]?(0|[1-9][0-9]*)$/.test(s)) return true;
    if (/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/.test(s) && /[0-9]/.test(s) && /[.eE]/.test(s)) return true;
    if (/^0x[0-9a-fA-F]+$/.test(s) || /^0o[0-7]+$/.test(s)) return true;
    if (/^(true|false|True|False|TRUE|FALSE|null|Null|NULL|~|yes|no|on|off|Yes|No|On|Off|YES|NO|ON|OFF)$/.test(s)) return true;
    if (/:/.test(s)) return true; // "80:80" のような値がYAMLの数値/時刻風に誤解釈されるのを防ぐ
    if (/#/.test(s)) return true;
    if (/[\n\t]/.test(s)) return true;
    return false;
  }
  function y(s) { return needsQuote(String(s)) ? JSON.stringify(String(s)) : String(s); }

  function serviceNameFromImage(image) {
    const lastSeg = image.split("/").pop();
    const base = lastSeg.split(/[:@]/)[0];
    return base || "app";
  }

  function buildCompose(image, command, ctx) {
    const serviceName = ctx.containerName || serviceNameFromImage(image);
    const lines = [];
    lines.push("services:");
    lines.push("  " + y(serviceName) + ":");
    const push = (k, v) => lines.push("    " + k + ": " + y(v));
    lines.push("    image: " + y(image));
    if (ctx.containerName) lines.push("    container_name: " + y(ctx.containerName));
    if (ctx.hostname) push("hostname", ctx.hostname);
    if (ctx.user) push("user", ctx.user);
    if (ctx.workingDir) push("working_dir", ctx.workingDir);
    if (ctx.entrypoint) push("entrypoint", ctx.entrypoint);
    if (command.length) {
      lines.push("    command:");
      for (const c of command) lines.push("      - " + y(c));
    }
    const envKeys = Object.keys(ctx.env);
    if (envKeys.length) {
      lines.push("    environment:");
      for (const k of envKeys) {
        const v = ctx.env[k];
        lines.push("      " + y(k) + ":" + (v === null ? "" : " " + y(v)));
      }
    }
    if (ctx.envFiles.length) {
      lines.push("    env_file:");
      for (const f of ctx.envFiles) lines.push("      - " + y(f));
    }
    const labelKeys = Object.keys(ctx.labels);
    if (labelKeys.length) {
      lines.push("    labels:");
      for (const k of labelKeys) {
        const v = ctx.labels[k];
        lines.push("      " + y(k) + ":" + (v === null ? "" : " " + y(v)));
      }
    }
    if (ctx.ports.length) {
      lines.push("    ports:");
      for (const p of ctx.ports) lines.push("      - " + y(p));
    }
    if (ctx.volumes.length) {
      lines.push("    volumes:");
      for (const v of ctx.volumes) lines.push("      - " + y(v));
    }
    if (ctx.networks.length) {
      lines.push("    networks:");
      for (const n of ctx.networks) lines.push("      - " + y(n));
    }
    if (ctx.capAdd.length) {
      lines.push("    cap_add:");
      for (const c of ctx.capAdd) lines.push("      - " + y(c));
    }
    if (ctx.privileged) lines.push("    privileged: true");
    if (ctx.restart) push("restart", ctx.restart);

    if (ctx.networks.length) {
      lines.push("");
      lines.push("networks:");
      const seen = new Set();
      for (const n of ctx.networks) {
        if (seen.has(n)) continue;
        seen.add(n);
        lines.push("  " + y(n) + ":");
        lines.push("    external: true");
      }
    }

    const comments = [];
    for (const u of ctx.unsupported) comments.push("# 未対応オプション: " + u + "（手動で追記してください）");
    for (const note of ctx.notes) comments.push("# " + note);
    if (comments.length) {
      lines.push("");
      for (const c of comments) lines.push(c);
    }
    return lines.join("\n") + "\n";
  }

  function convert(text) {
    const tokens = tokenizeShell(text);
    if (tokens.length === 0) return "";
    const { image, command, ctx } = parseDockerRun(tokens);
    return buildCompose(image, command, ctx);
  }

  /* =====================================================================
   * DOM連携
   * =================================================================== */
  function run() {
    const errEl = $("drc-error");
    const outEl = $("drc-output");
    errEl.textContent = "";
    const raw = $("drc-input").value;
    if (raw.trim() === "") { outEl.value = ""; return; }
    try {
      outEl.value = convert(raw);
    } catch (e) {
      outEl.value = "";
      errEl.textContent = e.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("drc-input").addEventListener("input", tb.debounce(run, 150));
    $("drc-clear").addEventListener("click", () => { $("drc-input").value = ""; run(); $("drc-input").focus(); });
    run();
  });
})();
