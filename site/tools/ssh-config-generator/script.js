(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // シェル用クォート（~ はそのまま扱い、tilde展開を妨げないようにする）
  function needsShQuote(s) {
    return s === "" || /[^A-Za-z0-9_./:@%+=,~-]/.test(s);
  }
  function shQuote(s) {
    if (!needsShQuote(s)) return s;
    return "'" + String(s).split("'").join("'\\''") + "'";
  }
  // ssh_config(5): 空白を含む値はダブルクォートで囲む
  function cfgQuote(s) {
    if (!/\s/.test(s)) return s;
    return '"' + String(s).replace(/"/g, '\\"') + '"';
  }

  function parsePort(raw) {
    const s = tb.z2h(raw).trim();
    if (s === "") return { ok: true, val: null };
    if (!/^\d+$/.test(s)) return { ok: false, val: null, msg: "Port は数字で入力してください" };
    const n = parseInt(s, 10);
    if (n < 1 || n > 65535) return { ok: false, val: null, msg: "Port は 1〜65535 の範囲で入力してください" };
    return { ok: true, val: n };
  }

  function parseNonNegInt(raw, label) {
    const s = tb.z2h(raw).trim();
    if (s === "") return { ok: true, val: null };
    if (!/^\d+$/.test(s)) return { ok: false, val: null, msg: label + " は 0 以上の整数で入力してください" };
    return { ok: true, val: parseInt(s, 10) };
  }

  function parseProxyJump(raw) {
    const parts = String(raw).split(",").map((p) => tb.z2h(p).trim()).filter((p) => p !== "");
    return parts.join(",");
  }

  function parseLocalForwards(raw) {
    const lines = String(raw).split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== "");
    const ok = [];
    const bad = [];
    lines.forEach((l) => {
      const s = tb.z2h(l);
      if (/^\d+:[^\s:]+:\d+$/.test(s)) ok.push(s); else bad.push(l);
    });
    return { ok, bad };
  }

  function readForm() {
    return {
      host: $("scg-host").value.trim(),
      hostname: $("scg-hostname").value.trim(),
      user: $("scg-user").value.trim(),
      portRaw: $("scg-port").value,
      identityFile: $("scg-identityfile").value.trim(),
      identitiesOnly: $("scg-identitiesonly").checked,
      proxyJumpRaw: $("scg-proxyjump").value,
      forwardAgent: $("scg-forwardagent").checked,
      saiRaw: $("scg-serveraliveinterval").value,
      lfRaw: $("scg-localforward").value
    };
  }

  // フォーム内容から Host ブロック1件分を組み立てる。エラーは errors 配列に追記する。
  function buildHost(form, errors) {
    const port = parsePort(form.portRaw);
    if (!port.ok) errors.push(port.msg);
    const sai = parseNonNegInt(form.saiRaw, "ServerAliveInterval");
    if (!sai.ok) errors.push(sai.msg);
    const proxyJump = parseProxyJump(form.proxyJumpRaw);
    const lf = parseLocalForwards(form.lfRaw);
    if (lf.bad.length) {
      errors.push("LocalForward の形式が正しくない行があります（例: 8080:localhost:80）: " + lf.bad.join(" / "));
    }

    const alias = form.host || "host";
    const lines = ["Host " + alias];
    if (form.hostname) lines.push("    HostName " + form.hostname);
    if (form.user) lines.push("    User " + form.user);
    if (port.ok && port.val != null) lines.push("    Port " + port.val);
    if (form.identityFile) lines.push("    IdentityFile " + cfgQuote(form.identityFile));
    if (form.identitiesOnly) lines.push("    IdentitiesOnly yes");
    if (proxyJump) lines.push("    ProxyJump " + proxyJump);
    if (form.forwardAgent) lines.push("    ForwardAgent yes");
    if (sai.ok && sai.val != null) lines.push("    ServerAliveInterval " + sai.val);
    lf.ok.forEach((l) => lines.push("    LocalForward " + l));

    return { alias, block: lines.join("\n"), port, sai, proxyJump, lf };
  }

  function buildSshCommand(form, parsed) {
    const tokens = ["ssh"];
    if (parsed.proxyJump) tokens.push("-J", shQuote(parsed.proxyJump));
    if (form.identityFile) tokens.push("-i", shQuote(form.identityFile));
    if (parsed.port.ok && parsed.port.val != null) tokens.push("-p", String(parsed.port.val));
    if (form.identitiesOnly) tokens.push("-o", "IdentitiesOnly=yes");
    if (form.forwardAgent) tokens.push("-A");
    if (parsed.sai.ok && parsed.sai.val != null) tokens.push("-o", "ServerAliveInterval=" + parsed.sai.val);
    parsed.lf.ok.forEach((l) => tokens.push("-L", l));
    const target = (form.user && form.hostname) ? (form.user + "@" + form.hostname)
      : (form.hostname || form.user || form.host || "host");
    tokens.push(shQuote(target));
    return tokens.join(" ");
  }

  let addedHosts = [];

  function renderAddedHosts() {
    const box = $("scg-host-list");
    box.innerHTML = "";
    if (addedHosts.length === 0) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = "まだ追加したホストはありません。";
      box.appendChild(p);
    } else {
      const ul = document.createElement("ul");
      addedHosts.forEach((h, i) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.className = "mono";
        span.textContent = h.alias;
        li.appendChild(span);
        li.appendChild(document.createTextNode(" "));
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ghost";
        btn.textContent = "削除";
        btn.addEventListener("click", () => {
          addedHosts.splice(i, 1);
          renderAddedHosts();
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    $("scg-all-config").textContent = addedHosts.map((h) => h.block).join("\n\n");
  }

  function run() {
    const form = readForm();
    const errors = [];
    const parsed = buildHost(form, errors);

    $("scg-error").textContent = errors.join("、");
    $("scg-config-block").textContent = parsed.block;
    $("scg-ssh-command").textContent = buildSshCommand(form, parsed);
  }

  document.addEventListener("DOMContentLoaded", () => {
    [
      "scg-host", "scg-hostname", "scg-user", "scg-port", "scg-identityfile", "scg-identitiesonly",
      "scg-proxyjump", "scg-forwardagent", "scg-serveraliveinterval", "scg-localforward"
    ].forEach((id) => $(id).addEventListener("input", run));

    $("scg-add-host").addEventListener("click", () => {
      const form = readForm();
      const errors = [];
      const parsed = buildHost(form, errors);
      addedHosts.push({ alias: parsed.alias, block: parsed.block });
      renderAddedHosts();
    });

    renderAddedHosts();
    run();
  });
})();
