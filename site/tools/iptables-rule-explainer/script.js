(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  const PROTO = {
    tcp: "TCP", udp: "UDP", icmp: "ICMP", icmpv6: "ICMPv6", icmp6: "ICMPv6",
    all: "すべてのプロトコル", esp: "ESP（IPsec）", ah: "AH（IPsec）", sctp: "SCTP", gre: "GRE",
  };
  const CHAIN_DESC = {
    INPUT: "ホスト宛の受信パケットを処理",
    OUTPUT: "ホストから送信するパケットを処理",
    FORWARD: "転送（ルーティング）されるパケットを処理",
    PREROUTING: "ルーティング判断の前（主にDNAT用）",
    POSTROUTING: "ルーティング判断の後（主にSNAT/MASQUERADE用）",
  };
  const STATE_DESC = {
    NEW: "新規接続", ESTABLISHED: "確立済み接続の応答/継続パケット", RELATED: "既存接続に関連する新規接続（FTPのデータ接続など）",
    INVALID: "どの接続にも紐付かない不正パケット", UNTRACKED: "接続追跡の対象外",
  };
  const TARGET_DESC = {
    ACCEPT: "許可する（このルールでパケットの処理が確定し、以降のルールは見ない）",
    DROP: "破棄する（応答を返さず黙って捨てる）",
    REJECT: "拒否する（エラー応答パケットを送信元に返す）",
    LOG: "カーネルログに記録する（パケット自体は次のルールに進む。これだけでは許可も拒否もしない）",
    DNAT: "宛先アドレス/ポートを書き換える（主にPREROUTINGで使用）",
    SNAT: "送信元アドレス/ポートを固定IPに書き換える（主にPOSTROUTINGで使用）",
    MASQUERADE: "送信元アドレスを送信インターフェースのIPに動的に書き換える（動的IP向けのSNAT）",
    RETURN: "呼び出し元のチェーンに処理を戻す",
    REDIRECT: "自ホストの別ポートへリダイレクトする",
    QUEUE: "ユーザー空間プログラムにパケットを渡す",
    NFQUEUE: "指定したキュー番号でユーザー空間プログラムにパケットを渡す",
  };
  const MODULE_DESC = {
    state: "接続の状態（NEW/ESTABLISHED等）で照合する拡張（古いAPI。今はconntrackが推奨）",
    conntrack: "接続追跡の状態やプロトコルで照合する拡張",
    limit: "単位時間あたりのマッチ回数を制限する拡張（連続ログやDoS対策）",
    multiport: "複数のポート/ポート範囲をまとめて指定する拡張",
    string: "パケットのペイロードに含まれる文字列で照合する拡張",
    mac: "送信元MACアドレスで照合する拡張",
    owner: "パケットを生成したローカルプロセスのUID/GIDなどで照合する拡張（OUTPUTチェーン限定）",
    recent: "送信元アドレスの出現履歴を記録し、一定時間内の再出現で照合する拡張",
    hashlimit: "送信元/宛先ごとに個別のレート制限をかける拡張",
    tcp: "TCPヘッダのフラグやポートで照合する拡張",
    comment: "ルールに人間向けのコメントを付与する拡張（マッチ条件には影響しない）",
  };

  function protoDesc(v) { return (PROTO[v.toLowerCase()] || v) + (PROTO[v.toLowerCase()] ? "" : "（未知のプロトコル名。値のまま表示）"); }
  function stateDesc(v) {
    return v.split(",").map((s) => {
      const key = s.trim().toUpperCase();
      return key + "（" + (STATE_DESC[key] || "未対応の状態名") + "）";
    }).join(" / ");
  }
  function targetDesc(v) {
    const key = v.toUpperCase();
    if (TARGET_DESC[key]) return key + "：" + TARGET_DESC[key];
    return key + "（未対応。カスタムチェーンへのジャンプ、または未知のターゲットの可能性があります）";
  }
  function moduleDesc(v) {
    const key = v.toLowerCase();
    return v + "：" + (MODULE_DESC[key] || "未対応（このツールが持つ辞書にないモジュール名です）");
  }

  // --- iptables 系のトークナイザ（クォート文字列を維持） ---
  function tokenize(line) {
    const tokens = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      tokens.push(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]));
    }
    return tokens;
  }

  const FLAGS = [
    { keys: ["-t", "--table"], arg: 1, label: "テーブル", render: (v) => v },
    { keys: ["-p", "--protocol"], arg: 1, label: "プロトコル", render: protoDesc },
    { keys: ["-s", "--src", "--source"], arg: 1, label: "送信元アドレス", render: (v) => v },
    { keys: ["-d", "--dst", "--destination"], arg: 1, label: "宛先アドレス", render: (v) => v },
    { keys: ["-i", "--in-interface"], arg: 1, label: "入力インターフェース", render: (v) => v },
    { keys: ["-o", "--out-interface"], arg: 1, label: "出力インターフェース", render: (v) => v },
    { keys: ["--sport", "--source-port"], arg: 1, label: "送信元ポート", render: (v) => v },
    { keys: ["--dport", "--destination-port"], arg: 1, label: "宛先ポート", render: (v) => v },
    { keys: ["--sports"], arg: 1, label: "送信元ポート（複数指定, multiport）", render: (v) => v },
    { keys: ["--dports"], arg: 1, label: "宛先ポート（複数指定, multiport）", render: (v) => v },
    { keys: ["--ports"], arg: 1, label: "送信元/宛先ポート（複数指定, multiport）", render: (v) => v },
    { keys: ["-m", "--match"], arg: 1, label: "追加モジュール（-m）", render: moduleDesc },
    { keys: ["--state"], arg: 1, label: "接続状態（--state）", render: stateDesc },
    { keys: ["--ctstate"], arg: 1, label: "接続状態（--ctstate）", render: stateDesc },
    { keys: ["--limit"], arg: 1, label: "許可レート（--limit）", render: (v) => v },
    { keys: ["--limit-burst"], arg: 1, label: "バースト許容数（--limit-burst）", render: (v) => v },
    { keys: ["--tcp-flags"], arg: 2, label: "TCPフラグ判定（--tcp-flags）", render: (a, b) => "検査対象=" + a + " / 一致すべきフラグ=" + b },
    { keys: ["--syn"], arg: 0, label: "SYNパケットのみ（--syn）", render: () => "SYNが立ちACK/RST/FINが立たないパケット（=新規TCP接続要求）" },
    { keys: ["--comment"], arg: 1, label: "コメント（--comment）", render: (v) => v },
    { keys: ["--mac-source"], arg: 1, label: "送信元MACアドレス", render: (v) => v },
    { keys: ["--uid-owner"], arg: 1, label: "所有ユーザー（UID）", render: (v) => v },
    { keys: ["--gid-owner"], arg: 1, label: "所有グループ（GID）", render: (v) => v },
    { keys: ["-j", "--jump"], arg: 1, label: "ターゲット（-j, 処理内容）", render: targetDesc },
    { keys: ["--reject-with"], arg: 1, label: "REJECT時の応答種別", render: (v) => v },
    { keys: ["--to-destination"], arg: 1, label: "変換後の宛先（DNAT）", render: (v) => v },
    { keys: ["--to-source"], arg: 1, label: "変換後の送信元（SNAT）", render: (v) => v },
    { keys: ["--to-ports"], arg: 1, label: "変換後のポート", render: (v) => v },
    { keys: ["--log-prefix"], arg: 1, label: "ログの接頭辞", render: (v) => v },
    { keys: ["--log-level"], arg: 1, label: "ログレベル", render: (v) => v },
  ];
  const FLAG_MAP = {};
  FLAGS.forEach((f) => f.keys.forEach((k) => { FLAG_MAP[k] = f; }));

  const OPS = {
    "-A": "追加（-A / --append）", "--append": "追加（-A / --append）",
    "-I": "挿入（-I / --insert）", "--insert": "挿入（-I / --insert）",
    "-D": "削除（-D / --delete）", "--delete": "削除（-D / --delete）",
    "-N": "新規チェーン作成（-N / --new-chain）", "--new-chain": "新規チェーン作成（-N / --new-chain）",
    "-F": "フラッシュ／全ルール削除（-F / --flush）", "--flush": "フラッシュ／全ルール削除（-F / --flush）",
    "-P": "デフォルトポリシー設定（-P / --policy）", "--policy": "デフォルトポリシー設定（-P / --policy）",
  };

  function parseIptables(tokens) {
    const rows = [];
    const unsupported = [];
    let i = 0;
    // 先頭の "iptables"/"ip6tables"/"sudo" は読み飛ばす
    while (tokens[i] === "sudo" || tokens[i] === "iptables" || tokens[i] === "ip6tables") i++;

    let opFound = false;
    let table = "filter";
    let tableExplicit = false;

    while (i < tokens.length) {
      let tok = tokens[i];
      let negate = false;
      if (tok === "!") { negate = true; i++; tok = tokens[i]; if (tok === undefined) break; }

      if (OPS[tok]) {
        opFound = true;
        rows.push({ label: "操作", value: OPS[tok] });
        i++;
        const chain = tokens[i];
        if (chain !== undefined && !chain.startsWith("-")) {
          rows.push({ label: "チェーン", value: chain + (CHAIN_DESC[chain.toUpperCase()] ? "（" + CHAIN_DESC[chain.toUpperCase()] + "）" : "") });
          i++;
          // -I/-D は続けてルール番号を取れる
          if ((tok === "-I" || tok === "-D") && /^[0-9]+$/.test(tokens[i] || "")) {
            rows.push({ label: "ルール番号", value: tokens[i] });
            i++;
          }
          if (tok === "-P" && tokens[i] !== undefined) {
            rows.push({ label: "デフォルトポリシー", value: tokens[i] + "（" + (TARGET_DESC[tokens[i].toUpperCase()] || "未対応") + "）" });
            i++;
          }
        }
        continue;
      }

      const flag = FLAG_MAP[tok];
      if (flag) {
        const args = [];
        for (let k = 0; k < flag.arg; k++) { i++; args.push(tokens[i]); }
        i++;
        if (args.some((a) => a === undefined)) {
          unsupported.push(tok + "（引数が不足しています）");
          continue;
        }
        if (flag.keys[0] === "-t") { table = args[0]; tableExplicit = true; continue; }
        const rendered = flag.arg === 0 ? flag.render() : flag.render.apply(null, args);
        rows.push({ label: flag.label, value: (negate ? "〜ではない： " : "") + rendered });
        continue;
      }

      unsupported.push(tok);
      i++;
    }

    rows.unshift({ label: "テーブル", value: table + (tableExplicit ? "" : "（省略時の既定値）") });
    if (!opFound) unsupported.push("（操作 -A/-I/-D/-N/-F/-P のいずれも見つかりませんでした）");
    return { format: "iptables", rows, unsupported };
  }

  // --- nftables 簡易パーサ ---
  const NFT_TARGET = { accept: "ACCEPT相当：許可する", drop: "DROP相当：破棄する（応答なし）", reject: "REJECT相当：拒否する（エラー応答を返す）", masquerade: "MASQUERADE相当：送信元アドレスを動的に書き換える" };

  function parseNft(tokens) {
    const rows = [];
    const unsupported = [];
    let i = 0;
    while (tokens[i] === "sudo" || tokens[i] === "nft") i++;
    if (tokens[i] === "add" || tokens[i] === "insert" || tokens[i] === "delete") {
      rows.push({ label: "操作", value: tokens[i] === "add" ? "追加（add）" : tokens[i] === "insert" ? "挿入（insert）" : "削除（delete）" });
      i++;
    }
    if (tokens[i] !== "rule") { unsupported.push(tokens[i]); }
    else { i++; }
    const family = tokens[i]; i++;
    const table = tokens[i]; i++;
    const chain = tokens[i]; i++;
    if (family !== undefined) rows.push({ label: "アドレスファミリ", value: family + "（ip=IPv4 / ip6=IPv6 / inet=両対応 / bridge / netdev / arp）" });
    if (table !== undefined) rows.push({ label: "テーブル", value: table });
    if (chain !== undefined) rows.push({ label: "チェーン", value: chain + (CHAIN_DESC[chain.toUpperCase()] ? "（" + CHAIN_DESC[chain.toUpperCase()] + "）" : "") });

    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok === "ip" || tok === "ip6") {
        const dir = tokens[i + 1];
        if (dir === "saddr" || dir === "daddr") {
          rows.push({ label: (dir === "saddr" ? "送信元アドレス" : "宛先アドレス") + "（" + (tok === "ip" ? "IPv4" : "IPv6") + "）", value: tokens[i + 2] });
          i += 3; continue;
        }
      }
      if (tok === "tcp" || tok === "udp") {
        const dir = tokens[i + 1];
        if (dir === "dport" || dir === "sport") {
          rows.push({ label: "プロトコル", value: PROTO[tok] });
          rows.push({ label: dir === "dport" ? "宛先ポート" : "送信元ポート", value: tokens[i + 2] });
          i += 3; continue;
        }
      }
      if (tok === "iifname" || tok === "oifname") {
        rows.push({ label: tok === "iifname" ? "入力インターフェース" : "出力インターフェース", value: tokens[i + 1] });
        i += 2; continue;
      }
      if (tok === "ct" && tokens[i + 1] === "state") {
        rows.push({ label: "接続状態（ct state）", value: stateDesc(tokens[i + 2]) });
        i += 3; continue;
      }
      if (tok === "limit" && tokens[i + 1] === "rate") {
        let val = tokens[i + 2]; let j = i + 3;
        if (tokens[j] === "burst") { val += "（バースト " + tokens[j + 1] + "）"; j += 2; }
        rows.push({ label: "許可レート（limit rate）", value: val });
        i = j; continue;
      }
      if (tok === "counter") { rows.push({ label: "カウンタ", value: "通過パケット数/バイト数を計測する" }); i++; continue; }
      if (tok === "log") {
        let val = "ログ記録（パケットは継続して次のルールへ）";
        if (tokens[i + 1] === "prefix") { val += "、接頭辞=" + tokens[i + 2]; i += 3; } else { i++; }
        rows.push({ label: "ログ", value: val }); continue;
      }
      if (tok === "masquerade") { rows.push({ label: "ターゲット", value: NFT_TARGET.masquerade }); i++; continue; }
      if (tok === "snat" && tokens[i + 1] === "to") { rows.push({ label: "ターゲット", value: "SNAT相当：送信元を " + tokens[i + 2] + " に書き換える" }); i += 3; continue; }
      if (tok === "dnat" && tokens[i + 1] === "to") { rows.push({ label: "ターゲット", value: "DNAT相当：宛先を " + tokens[i + 2] + " に書き換える" }); i += 3; continue; }
      if (tok === "reject") {
        let val = NFT_TARGET.reject; let j = i + 1;
        if (tokens[j] === "with") { val += "（" + tokens.slice(j).join(" ") + "）"; j = tokens.length; }
        rows.push({ label: "ターゲット", value: val });
        i = j; continue;
      }
      if (NFT_TARGET[tok]) { rows.push({ label: "ターゲット", value: NFT_TARGET[tok] }); i++; continue; }

      unsupported.push(tok);
      i++;
    }
    return { format: "nftables（簡易対応）", rows, unsupported };
  }

  function looksLikeNft(tokens) {
    return tokens[0] === "nft" || tokens.includes("rule") && (tokens.includes("inet") || tokens.includes("ip") || tokens.includes("ip6") || tokens.includes("bridge"));
  }

  function renderResult(line, result) {
    const div = document.createElement("div");
    div.className = "result";
    const h = document.createElement("p");
    h.innerHTML = '<strong class="mono">' + escapeHtml(line) + '</strong>　<span class="hint">（' + result.format + '）</span>';
    div.appendChild(h);
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    result.rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = "<th>" + escapeHtml(r.label) + "</th><td>" + escapeHtml(r.value) + "</td>";
      tbody.appendChild(tr);
    });
    result.unsupported.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = '<th>未対応</th><td class="mono">' + escapeHtml(u) + "　— このツールの辞書にない要素です。意味の解説はできません</td>";
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    div.appendChild(table);
    return div;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function run() {
    const errEl = $("ire-error");
    errEl.textContent = "";
    const out = $("ire-output");
    out.innerHTML = "";
    const raw = ("tb" in window && tb.z2h) ? tb.z2h($("ire-input").value) : $("ire-input").value;
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
    if (lines.length === 0) { errEl.textContent = "ルールを1行以上入力してください"; return; }
    lines.forEach((line) => {
      const tokens = tokenize(line);
      if (tokens.length === 0) return;
      try {
        const result = looksLikeNft(tokens) ? parseNft(tokens) : parseIptables(tokens);
        out.appendChild(renderResult(line, result));
      } catch (e) {
        const div = document.createElement("div");
        div.className = "result";
        div.innerHTML = '<strong class="mono">' + escapeHtml(line) + '</strong><p class="error">解析できませんでした（iptables/nftablesの形式として認識できません）</p>';
        out.appendChild(div);
      }
    });
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      $("ire-input").addEventListener("input", run);
      run();
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { tokenize, parseIptables, parseNft, looksLikeNft, stateDesc, protoDesc, targetDesc, moduleDesc };
  }
})();
