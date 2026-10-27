(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // 公式要件の定数表（根拠を確認した日: 2026-10-27）。ルールを変えるときはここだけ直す。
  // ------------------------------------------------------------------
  const RULES = {
    // 出典: Microsoft「Windows 11 Specs and System Requirements」（microsoft.com / windows-11-specifications）確認日 2026-10-27
    //   Processor: 1 GHz 以上・2 コア以上・64-bit の対応プロセッサ / RAM: 4 GB / Storage: 64 GB 以上 /
    //   System firmware: UEFI, Secure Boot capable / TPM: version 2.0
    win11: { minCores: 2, minRamGB: 4, minStorageGB: 64 },
    // 出典: Microsoft Learn「Windows processor requirements Windows 11 supported Intel processors」
    //   「…Windows processor requirements Windows 11 supported AMD processors」確認日 2026-10-27
    //   Intel は Core 第8世代以降（第8〜14世代の i3/i5/i7/i9 とその後の世代）を掲載。第7世代の Core i は掲載なし（Core X 7000X 系などを除く）。
    //   AMD は Ryzen 2000 番台の一部（2300X・2500X・2600・2700X など）から掲載。Ryzen 1000 番台は掲載なし。
    //   ページ冒頭に「以降の世代で同じ原則を満たすものは、一覧にない型番でも対応とみなす」旨の記載あり。
    // 出典: Visual Studio Code「Requirements for Visual Studio Code」（code.visualstudio.com / docs/supporting/requirements）確認日 2026-10-27
    //   Hardware: 推奨 1.6 GHz 以上のプロセッサ・1 GB の RAM / Platforms: Windows は 64-bit の「対応する Windows クライアント」
    vscode: { recommendedRamGB: 1 },
    // 出典: Microsoft Learn「Install WSL」「Manual installation steps for older versions of WSL」確認日 2026-10-27
    //   Windows 11、または Windows 10（x64 は Version 1903 / Build 18362.1049 以降）。WSL 2 には仮想化機能（Virtual Machine Platform）が必要。
    wsl2: { win10MinBuild: "1903 (Build 18362.1049)" },
    // 出典: Docker Docs「Install Docker Desktop on Windows」（docs.docker.com / desktop/setup/install/windows-install）確認日 2026-10-27
    //   WSL 2 バックエンド: SLAT 対応の 64-bit プロセッサ / システム RAM 8 GB / BIOS/UEFI でハードウェア仮想化を有効化 /
    //   Windows 10 64-bit Enterprise・Pro・Education 22H2 (build 19045)、Windows 11 64-bit Enterprise・Pro・Education 23H2 (build 22631) 以降。
    //   Home は同ページの注記に「Linux コンテナのみ」とあるのみで、要件の行には載っていない。
    docker: { minRamGB: 8 },
    // 出典: Ollama「library/llama2」モデルページ（ollama.com）の記載「7b / 13b / 70b models generally require at least 8GB / 16GB / 64GB of RAM」
    //   および Ollama GitHub README（v0.3.0 の Model library 注記）の「8 GB で 7B、16 GB で 13B、32 GB で 33B」確認日 2026-10-27
    //   ※ 現行の README 本文には RAM の記載がなく、モデルページとタグ付き README の記載を採用している。
    // 出典: Ollama Docs「Windows」: Windows 10 22H2 以降（Home / Pro）確認日 2026-10-27
    llm: { b7: 8, b13: 16, b33: 32 }
  };

  const WIN11_CPU_ADVICE = "正確には Microsoft の対応 CPU 一覧で型番を確認してください。";

  function toHalf(s) {
    const t = String(s == null ? "" : s);
    return (typeof window !== "undefined" && window.tb && window.tb.z2h ? window.tb.z2h(t) : t.replace(/[０-９．]/g, (c) => c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xFEE0))).replace(/[,，\s]/g, "");
  }
  function parseNum(raw) {
    const s = toHalf(raw);
    if (s === "") return { blank: true, value: NaN };
    if (!/^\d+(\.\d+)?$/.test(s)) return { blank: false, value: NaN };
    return { blank: false, value: parseFloat(s) };
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function num(n) { return String(Math.round(n * 100) / 100); }

  // CPU の Windows 11 判定。戻り値 {s: pass|warn|fail, t: 理由}
  function cpuWin11(cpu) {
    let m;
    if ((m = /^intel-(\d+)$/.exec(cpu))) {
      const g = parseInt(m[1], 10);
      if (g >= 8) return { s: "pass", t: "Intel Core 第" + g + "世代は Microsoft の対応 CPU 一覧に掲載されています（Core 第8世代以降）。" + WIN11_CPU_ADVICE };
      if (g === 7) return { s: "fail", t: "Intel Core 第7世代の Core i シリーズは、Microsoft の対応 CPU 一覧に載っていません（掲載は第8世代以降。Core X 7000X 系など一部のシリーズを除く）。型番が X シリーズなら一覧で確認してください。" };
      return { s: "fail", t: "Intel Core 第" + g + "世代は、Microsoft の対応 CPU 一覧に載っていません（掲載は第8世代以降）。" };
    }
    if (cpu === "intel-le6") return { s: "fail", t: "Intel Core 第6世代以前は、Microsoft の対応 CPU 一覧に載っていません（掲載は第8世代以降）。" };
    if (cpu === "intel-ultra") return { s: "pass", t: "Core Ultra は、一覧に型番がなくても以降の世代は対応とみなすと一覧ページに書かれています。" + WIN11_CPU_ADVICE };
    if (cpu === "intel-low") return { s: "warn", t: "Celeron / Pentium / Atom は、一覧に載る系列と載らない系列があります。" + WIN11_CPU_ADVICE };
    if (cpu === "amd-1000") return { s: "fail", t: "AMD Ryzen 1000 番台は、Microsoft の対応 CPU 一覧に載っていません（掲載は Ryzen 2000 番台の一部から）。" };
    if (cpu === "amd-2000") return { s: "warn", t: "AMD Ryzen 2000 番台は、2600・2700X などは載っていますが、2200G・2400G・2500U・2700U など一覧にない型番もあります。" + WIN11_CPU_ADVICE };
    if ((m = /^amd-(\d)000$/.exec(cpu))) {
      const n = parseInt(m[1], 10);
      if (n >= 8) return { s: "pass", t: "Ryzen " + n + "000 番台は、一覧に型番がなくても以降の世代は対応とみなすと一覧ページに書かれています。" + WIN11_CPU_ADVICE };
      return { s: "pass", t: "AMD Ryzen " + n + "000 番台は Microsoft の対応 CPU 一覧に掲載されています。" + WIN11_CPU_ADVICE };
    }
    if (cpu === "amd-other") return { s: "warn", t: "Athlon など Ryzen 以外は、一覧に載る型番と載らない型番があります。" + WIN11_CPU_ADVICE };
    return { s: "warn", t: "CPU がわからないため判定できません。「設定 → システム → バージョン情報」で CPU 名を調べ、Microsoft の対応 CPU 一覧で確認してください。" };
  }

  const OS_LABEL = {
    w11new: "Windows 11 23H2 以降", w11old: "Windows 11 22H2 以前",
    w10new: "Windows 10 22H2", w10old: "Windows 10 21H2 以前", none: "OS なし・不明"
  };
  const isW11 = (o) => o === "w11new" || o === "w11old";
  const isW10 = (o) => o === "w10new" || o === "w10old";

  function worst(checks) {
    let r = "pass";
    for (const c of checks) { if (c.s === "fail") return "fail"; if (c.s === "warn") r = "warn"; }
    return r;
  }

  // 入力 -> 判定結果。DOM に触れない（node でも検算できる）
  function evaluate(inp) {
    const errors = [];
    const cores = parseNum(inp.cores), threads = parseNum(inp.threads);
    const ram = parseNum(inp.ram), ssize = parseNum(inp.ssize);
    if (cores.blank || !Number.isInteger(cores.value) || cores.value < 1 || cores.value > 512) errors.push("コア数は 1 以上の整数で入力してください。");
    if (!threads.blank && (!Number.isInteger(threads.value) || threads.value < 1 || threads.value > 1024)) errors.push("スレッド数は 1 以上の整数で入力するか、空欄にしてください。");
    if (!threads.blank && Number.isInteger(threads.value) && Number.isInteger(cores.value) && threads.value < cores.value) errors.push("スレッド数はコア数以上の値になります。入力を見直してください。");
    if (ram.blank || !(ram.value > 0) || ram.value > 16384) errors.push("メモリは 0 より大きい数字（GB）で入力してください。");
    if (ssize.blank || !(ssize.value > 0) || ssize.value > 1000000) errors.push("ストレージ容量は 0 より大きい数字（GB）で入力してください。");
    if (errors.length) return { errors: errors, rows: [] };

    const R = ram.value, S = ssize.value, C = cores.value;
    const os = inp.os, ed = inp.edition, virt = inp.virt;
    const rows = [];

    // --- Windows 11 ---
    {
      const ch = [cpuWin11(inp.cpu)];
      ch.push(C >= RULES.win11.minCores
        ? { s: "pass", t: "コア数 " + C + "（" + RULES.win11.minCores + " コア以上）" }
        : { s: "fail", t: "コア数 " + C + "。2 コア以上が必要です。" });
      ch.push(R >= RULES.win11.minRamGB
        ? { s: "pass", t: "メモリ " + num(R) + " GB（" + RULES.win11.minRamGB + " GB 以上）" }
        : { s: "fail", t: "メモリ " + num(R) + " GB。" + RULES.win11.minRamGB + " GB 以上が必要です。" });
      ch.push(S >= RULES.win11.minStorageGB
        ? { s: "pass", t: "ストレージ " + num(S) + " GB（" + RULES.win11.minStorageGB + " GB 以上）" }
        : { s: "fail", t: "ストレージ " + num(S) + " GB。" + RULES.win11.minStorageGB + " GB 以上が必要です。" });
      if (inp.sb === "yes") ch.push({ s: "pass", t: "UEFI セキュアブートに対応" });
      else if (inp.sb === "no") ch.push({ s: "fail", t: "UEFI セキュアブートに非対応。UEFI でセキュアブートが使えることが必要です。" });
      else ch.push({ s: "warn", t: "UEFI セキュアブートの対応が不明です。BIOS/UEFI の設定画面か機器の仕様表で確認してください。" });
      if (inp.tpm === "2") ch.push({ s: "pass", t: "TPM 2.0 あり" });
      else if (inp.tpm === "1.2") ch.push({ s: "fail", t: "TPM 1.2 です。必要なのは TPM 2.0 です。" });
      else if (inp.tpm === "none") ch.push({ s: "fail", t: "TPM がありません。TPM 2.0 が必要です。" });
      else ch.push({ s: "warn", t: "TPM の有無が不明です。「tpm.msc」を実行するか、機器の仕様表で TPM 2.0 を確認してください。" });
      rows.push({
        id: "win11", title: "Windows 11（公式の最小要件）", status: worst(ch), checks: ch,
        unjudged: ["クロック 1 GHz 以上", "64 ビット対応", "DirectX 12 / WDDM 2.0 のグラフィックス", "720p 以上・9 インチ超のディスプレイ"]
      });
    }

    // --- VS Code ---
    {
      const ch = [R >= RULES.vscode.recommendedRamGB
        ? { s: "pass", t: "メモリ " + num(R) + " GB（推奨 " + RULES.vscode.recommendedRamGB + " GB 以上）" }
        : { s: "fail", t: "メモリ " + num(R) + " GB。公式の推奨は " + RULES.vscode.recommendedRamGB + " GB 以上です。" }];
      if (os === "none") ch.push({ s: "warn", t: "OS が不明です。Windows は 64 ビット版の対応バージョンが条件です。" });
      else ch.push({ s: "pass", t: "OS は " + OS_LABEL[os] + "（64 ビット版であること）" });
      rows.push({
        id: "vscode", title: "VS Code", status: worst(ch), checks: ch,
        unjudged: ["推奨の 1.6 GHz 以上というクロック", "Windows のバージョンが Microsoft のサポート期間内か"]
      });
    }

    // --- WSL 2 ---
    {
      const ch = [];
      if (isW11(os) || os === "w10new") ch.push({ s: "pass", t: "OS は " + OS_LABEL[os] + "（Windows 11、または Windows 10 " + RULES.wsl2.win10MinBuild + " 以降）" });
      else if (os === "w10old") ch.push({ s: "warn", t: "Windows 10 は Version 1903（Build 18362.1049）以降が必要です。winver でビルド番号を確認してください。" });
      else ch.push({ s: "warn", t: "OS が不明です。Windows 11、または Windows 10 Version 1903（Build 18362.1049）以降が必要です。" });
      if (virt === "on") ch.push({ s: "pass", t: "仮想化機能は有効" });
      else if (virt === "off") ch.push({ s: "fail", t: "仮想化機能が無効です。WSL 2 には仮想化機能が必要なので、BIOS/UEFI の設定で有効にします。" });
      else ch.push({ s: "warn", t: "仮想化機能の状態が不明です。タスクマネージャーの「パフォーマンス → CPU」の「仮想化」で確認できます。" });
      rows.push({
        id: "wsl2", title: "WSL 2", status: worst(ch), checks: ch,
        unjudged: ["メモリの最低値（今回確認した公式ページには記載がありません）", "Virtual Machine Platform の有効化"]
      });
    }

    // --- Docker Desktop ---
    {
      const ch = [R >= RULES.docker.minRamGB
        ? { s: "pass", t: "メモリ " + num(R) + " GB（" + RULES.docker.minRamGB + " GB 以上）" }
        : { s: "fail", t: "メモリ " + num(R) + " GB。公式のシステム要件は " + RULES.docker.minRamGB + " GB です。" }];
      if (virt === "on") ch.push({ s: "pass", t: "ハードウェア仮想化は有効" });
      else if (virt === "off") ch.push({ s: "fail", t: "ハードウェア仮想化が無効です。BIOS/UEFI で有効にする必要があります。" });
      else ch.push({ s: "warn", t: "ハードウェア仮想化の状態が不明です。BIOS/UEFI かタスクマネージャーで確認してください。" });
      if (os === "w11new") ch.push({ s: "pass", t: "OS は Windows 11 23H2 以降（要件は 23H2 / build 22631 以降）" });
      else if (os === "w10new") ch.push({ s: "pass", t: "OS は Windows 10 22H2（要件は 22H2 / build 19045）" });
      else if (os === "w11old") ch.push({ s: "fail", t: "Windows 11 は 23H2（build 22631）以降が要件です。Windows Update で上げられるかを確認してください。" });
      else if (os === "w10old") ch.push({ s: "fail", t: "Windows 10 は 22H2（build 19045）が要件です。" });
      else ch.push({ s: "warn", t: "OS が不明です。Windows 10 22H2、または Windows 11 23H2 以降が要件です。" });
      if (isW10(os) || isW11(os)) {
        if (ed === "pro") ch.push({ s: "pass", t: "エディションは Pro / Enterprise / Education" });
        else if (ed === "home") ch.push({ s: "warn", t: "要件に載っているエディションは Enterprise・Pro・Education です。Home は注記に Linux コンテナのみとあります。公式ページで確認してください。" });
        else ch.push({ s: "warn", t: "エディションが不明です。要件に載っているのは Enterprise・Pro・Education です。" });
      }
      rows.push({
        id: "docker", title: "Docker Desktop（WSL 2 バックエンド）", status: worst(ch), checks: ch,
        unjudged: ["SLAT 対応の 64 ビットプロセッサ（CPU の仕様で確認）", "WSL のバージョン（2.1.5 以降）"]
      });
    }

    // --- ローカル LLM（Ollama） ---
    [["llm7", "7B", RULES.llm.b7], ["llm13", "13B", RULES.llm.b13], ["llm33", "33B", RULES.llm.b33]].forEach((x) => {
      const ch = [R >= x[2]
        ? { s: "pass", t: "メモリ " + num(R) + " GB（" + x[1] + " モデルは " + x[2] + " GB 以上が目安）" }
        : { s: "fail", t: "メモリ " + num(R) + " GB。" + x[1] + " モデルは " + x[2] + " GB 以上が目安です。" }];
      if (isW11(os) || os === "w10new") ch.push({ s: "pass", t: "OS は " + OS_LABEL[os] + "（Windows 版は Windows 10 22H2 以降）" });
      else if (os === "w10old") ch.push({ s: "fail", t: "Windows 版の Ollama は Windows 10 22H2 以降が要件です。" });
      else ch.push({ s: "warn", t: "OS が不明です。Windows 版の Ollama は Windows 10 22H2 以降が要件です。" });
      rows.push({
        id: x[0], title: "ローカル LLM " + x[1] + " 級（Ollama）", status: worst(ch), checks: ch,
        unjudged: ["GPU / VRAM（足りない分はメモリを使いますが、応答は遅くなる場合があります）", "量子化の種類・コンテキスト長による増減"]
      });
    });

    const notes = [];
    notes.push("ストレージの種類（HDD / SATA SSD / NVMe）は、今回確認した公式ページに条件として書かれていないため、判定には使っていません。" +
      (inp.stype === "hdd" ? "HDD を選んでも上の判定は変わりません。起動やファイルの読み込みの速さは、このツールの判定の外です。" : ""));
    if (R < RULES.docker.minRamGB + RULES.llm.b7) {
      notes.push("Docker Desktop と 7B モデルを同時に動かす公式の基準はありません。単純に足すと " + (RULES.docker.minRamGB + RULES.llm.b7) +
        " GB 相当で、メモリ " + num(R) + " GB には届きません。同時に使う予定なら、片方ずつ動かす前提で考えてください。");
    }
    return { errors: [], rows: rows, notes: notes, cores: C, threads: threads.blank ? null : threads.value };
  }

  const BADGE = { pass: ["合格", "psc-pass"], warn: ["要確認", "psc-warn"], fail: ["不足", "psc-fail"] };
  const MARK = { pass: "OK", warn: "要確認", fail: "不足" };

  function render(res) {
    const box = $("psc-result"), err = $("psc-error");
    err.textContent = "";
    if (res.errors.length) { box.innerHTML = ""; err.textContent = res.errors.join(" "); return; }
    const cnt = { pass: 0, warn: 0, fail: 0 };
    res.rows.forEach((r) => { cnt[r.status]++; });
    let h = '<p class="psc-sum">合格 ' + cnt.pass + ' ／ 要確認 ' + cnt.warn + ' ／ 不足 ' + cnt.fail + '（全 ' + res.rows.length + ' 用途）</p>';
    h += '<table class="psc-table"><thead><tr><th scope="col">用途</th><th scope="col">判定</th><th scope="col">理由</th></tr></thead><tbody>';
    res.rows.forEach((r) => {
      h += "<tr><th scope=\"row\">" + esc(r.title) + '</th><td><span class="psc-badge ' + BADGE[r.status][1] + '">' + BADGE[r.status][0] + "</span></td><td><ul>";
      r.checks.forEach((c) => { h += '<li><span class="psc-mark ' + BADGE[c.s][1] + '">' + MARK[c.s] + "</span>" + esc(c.t) + "</li>"; });
      h += '</ul><div class="psc-un">未判定: ' + esc(r.unjudged.join(" / ")) + "</div></td></tr>";
    });
    h += "</tbody></table>";
    res.notes.forEach((n) => { h += '<p class="hint">' + esc(n) + "</p>"; });
    box.innerHTML = h;
  }

  function toText(res) {
    if (res.errors.length) return "";
    const L = ["中古PC・ミニPCのスペック判定（確認日 2026-10-27）"];
    res.rows.forEach((r) => {
      L.push("[" + BADGE[r.status][0] + "] " + r.title);
      r.checks.forEach((c) => L.push("  - " + MARK[c.s] + ": " + c.t));
    });
    return L.join("\n");
  }

  function readInputs() {
    const v = (id) => $(id).value;
    return {
      cpu: v("psc-cpu"), cores: v("psc-cores"), threads: v("psc-threads"), ram: v("psc-ram"),
      stype: v("psc-stype"), ssize: v("psc-ssize"), tpm: v("psc-tpm"), sb: v("psc-sb"),
      virt: v("psc-virt"), os: v("psc-os"), edition: v("psc-edition")
    };
  }

  let last = null;
  function run() { last = evaluate(readInputs()); render(last); }

  if (typeof module !== "undefined" && module.exports) module.exports = { evaluate: evaluate, RULES: RULES };

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", () => {
      ["psc-cpu", "psc-cores", "psc-threads", "psc-ram", "psc-stype", "psc-ssize", "psc-tpm", "psc-sb", "psc-virt", "psc-os", "psc-edition"].forEach((id) => {
        $(id).addEventListener("input", run);
        $(id).addEventListener("change", run);
      });
      $("psc-copy").addEventListener("click", function () {
        const t = last ? toText(last) : "";
        if (t && window.tb && window.tb.copy) window.tb.copy(t, this);
      });
      run();
    });
  }
})();
