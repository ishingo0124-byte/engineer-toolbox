(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ゲームの種類キー: jv = Java版バニラ / jm = Java版MODあり / be = 統合版(Bedrock) / pw = パルワールド
  const GAMES = {
    jv: "Minecraft Java版（バニラ）",
    jm: "Minecraft Java版（MODあり）",
    be: "Minecraft 統合版（Bedrock）",
    pw: "パルワールド"
  };
  const PW_MAX_PLAYERS = 32; // ロリポップ・XServer GAMEs の掲載が最大32人まで
  const INPUT_MAX = 10000;

  // 出典ごとの目安。値は公開ページに書かれた数字だけ。計算式や係数は一切使わない。
  // row: label=出典の人数表記 / min,max=該当判定（max:null は上限なし。「〜N人」は直前の段の次から、「N人〜」は境界を含めて両方の行に該当）
  //      lo,hi=メモリ(GB) / text=表示の上書き / ref:true は参考（範囲の計算に入れない）
  const SOURCES = [
    {
      // ロリポップ! for Gamers「マイクラのおすすめレンタルサーバー｜人数別の料金相場と選び方【Java版/統合版】」
      // （2025/10/07 公開・2026/10/08 更新、表「同時プレイ人数」）／確認日 2026-10-27
      name: "ロリポップ! for Gamers",
      title: "マイクラのおすすめレンタルサーバー｜人数別の料金相場と選び方【Java版/統合版】",
      checked: "2026-10-27",
      none: { jv: "表のJava版はMOD使用時の値のみで、MODなしの記載はありません" },
      rows: {
        be: [
          { label: "1〜5人", min: 1, max: 5, lo: 2, hi: 2 },
          { label: "6〜10人", min: 6, max: 10, lo: 4, hi: 4 },
          { label: "11〜14人", min: 11, max: 14, lo: 8, hi: 8 },
          { label: "15〜25人", min: 15, max: 25, lo: 16, hi: 16 },
          { label: "25人〜", min: 25, max: null, lo: 32, hi: 32 }
        ],
        jm: [
          { label: "1〜5人（MOD使用時）", min: 1, max: 5, lo: 4, hi: 4 },
          { label: "6〜10人（MOD使用時）", min: 6, max: 10, lo: 8, hi: 8 },
          { label: "11〜14人（MOD使用時）", min: 11, max: 14, lo: 16, hi: 16 },
          { label: "15〜25人（MOD使用時）", min: 15, max: 25, lo: 16, hi: 32, text: "16〜32GB" },
          { label: "25人〜（MOD使用時）", min: 25, max: null, lo: 32, hi: 32 }
        ]
      }
    },
    {
      // XServer GAMEs「【マイクラ】サーバーのメモリ割り当てを最適化する方法 - ゼロから始めるマイクラサーバー運用ガイド」
      // （2026年7月2日、Java版前提。表「同時プレイ人数／メモリ量」と「MODやプラグイン」の節）／確認日 2026-10-27
      name: "XServer GAMEs（解説記事）",
      title: "【マイクラ】サーバーのメモリ割り当てを最適化する方法 - ゼロから始めるマイクラサーバー運用ガイド",
      checked: "2026-10-27",
      none: { be: "Java版を前提とした記事で、統合版の記載はありません" },
      rows: {
        jv: [
          { label: "4人以下", min: 1, max: 4, lo: 2, hi: 2 },
          { label: "5〜10人", min: 5, max: 10, lo: 4, hi: 4 },
          { label: "11人以上", min: 11, max: null, lo: 8, hi: 8 }
        ],
        jm: [
          { label: "人数の区別なし（MOD・プラグイン導入時）", min: 1, max: null, lo: 4, hi: 4, text: "4GB程度が最低ライン",
            note: "大型MOD（工業系・魔術系）や拡張プログラムが多いと4GBでも足りない可能性がある、と記載" }
        ]
      }
    },
    {
      // XServer GAMEs「Minecraft | かんたんに始められるマルチプレイ専用ゲームサーバー「XServer GAMEs」」
      // （プラン表「目安プレイ人数／メモリ容量」。Java版・統合版・Paper等の表と、Forge/Fabric等のMOD系の表は別）／確認日 2026-10-27
      name: "XServer GAMEs（Minecraftプラン表）",
      title: "Minecraft | かんたんに始められるマルチプレイ専用ゲームサーバー「XServer GAMEs」",
      checked: "2026-10-27",
      rows: {
        jv: [
          { label: "〜3人", min: 1, max: 3, lo: 2, hi: 2 },
          { label: "〜5人", min: 4, max: 5, lo: 4, hi: 4 },
          { label: "〜20人", min: 6, max: 20, lo: 8, hi: 8 },
          { label: "〜50人", min: 21, max: 50, lo: 16, hi: 16 },
          { label: "〜100人", min: 51, max: 100, lo: 32, hi: 32 },
          { label: "100人〜", min: 100, max: null, lo: 64, hi: 64 }
        ],
        be: [
          { label: "〜3人", min: 1, max: 3, lo: 2, hi: 2 },
          { label: "〜5人", min: 4, max: 5, lo: 4, hi: 4 },
          { label: "〜20人", min: 6, max: 20, lo: 8, hi: 8 },
          { label: "〜50人", min: 21, max: 50, lo: 16, hi: 16 },
          { label: "〜100人", min: 51, max: 100, lo: 32, hi: 32 },
          { label: "100人〜", min: 100, max: null, lo: 64, hi: 64 }
        ],
        jm: [
          { label: "〜4人（MOD系サーバー）", min: 1, max: 4, lo: 4, hi: 4 },
          { label: "〜20人（MOD系サーバー）", min: 5, max: 20, lo: 8, hi: 8 },
          { label: "20人〜（MOD系サーバー）", min: 20, max: 40, lo: 16, hi: 16 },
          { label: "40人〜（MOD系サーバー）", min: 40, max: 80, lo: 32, hi: 32 },
          { label: "80人〜（MOD系サーバー）", min: 80, max: null, lo: 64, hi: 64 }
        ]
      }
    },
    {
      // ConoHa for GAME「【マイクラ】マルチプレイ向けレンタルサーバーの選び方｜スペック・料金・専用ツールで比較｜マイクラゼミ」
      // （表「プレイヤー人数／メモリ／CPUコア数」。「ワールドの内容やMOD・プラグインの有無でも変わる」と記載）／確認日 2026-10-27
      name: "ConoHa for GAME（マイクラゼミ）",
      title: "【マイクラ】マルチプレイ向けレンタルサーバーの選び方｜スペック・料金・専用ツールで比較｜マイクラゼミ",
      checked: "2026-10-27",
      none: { jm: "表はMODの有無を分けておらず、MOD入りの目安としては書かれていません" },
      rows: {
        jv: [
          { label: "4人以下", min: 1, max: 4, lo: 2, hi: 2 },
          { label: "5〜10人", min: 5, max: 10, lo: 4, hi: 4 },
          { label: "11人以上", min: 11, max: null, lo: 8, hi: 8 }
        ],
        be: [
          { label: "4人以下", min: 1, max: 4, lo: 2, hi: 2 },
          { label: "5〜10人", min: 5, max: 10, lo: 4, hi: 4 },
          { label: "11人以上", min: 11, max: null, lo: 8, hi: 8 }
        ]
      }
    },
    {
      // Mojang「Minecraft Bedrock 版のサーバーをダウンロード | Minecraft」（minecraft.net、システム要件 RAM: 4 GB RAM）／確認日 2026-10-27
      name: "Mojang（Bedrock専用サーバーのダウンロードページ）",
      title: "Minecraft Bedrock 版のサーバーをダウンロード | Minecraft",
      checked: "2026-10-27",
      rows: {
        be: [
          { label: "人数の記載なし（システム要件）", min: 1, max: null, lo: 4, hi: 4, text: "4GB（RAM）" }
        ]
      }
    },
    {
      // Mojang「Minecraft サーバー ダウンロード | Minecraft」（minecraft.net、起動コマンド例 java -Xmx4G -Xms4G -jar …）／確認日 2026-10-27
      // 推奨値としての記載ではなく、コマンドの例。範囲の計算には入れない（ref:true）。
      name: "Mojang（Java版サーバーのダウンロードページ）",
      title: "Minecraft サーバー ダウンロード | Minecraft",
      checked: "2026-10-27",
      rows: {
        jv: [
          { label: "人数の記載なし（起動コマンドの例）", min: 1, max: null, lo: 4, hi: 4, ref: true, text: "-Xmx4G と記載（推奨値ではなく例）" }
        ]
      }
    },
    {
      // ポケットペア「Palworld Server Guide」の「要件」ページ（バージョン 1.0.4、日本語版。メモリ: 16GB／安定した動作のために32GB以上を推奨）／確認日 2026-10-27
      name: "ポケットペア（Palworld Server Guide）",
      title: "要件 | Palworld Server Guide",
      checked: "2026-10-27",
      rows: {
        pw: [
          { label: "人数の記載なし（動作要件）", min: 1, max: null, lo: 16, hi: 32, text: "16GB、安定運用は32GB以上を推奨" }
        ]
      }
    },
    {
      // ロリポップ! for Gamers「パルワールドのおすすめレンタルサーバーは？人数別のプランの選び方と料金も解説」
      // （2026/06/15 公開・2026/07/09 更新、表「同時接続人数・用途／推奨メモリ」）／確認日 2026-10-27
      name: "ロリポップ! for Gamers（パルワールド）",
      title: "パルワールドのおすすめレンタルサーバーは？人数別のプランの選び方と料金も解説",
      checked: "2026-10-27",
      rows: {
        pw: [
          { label: "2〜3人", min: 2, max: 3, lo: 16, hi: 16 },
          { label: "5〜10人", min: 5, max: 10, lo: 32, hi: 32 },
          { label: "10〜20人", min: 10, max: 20, lo: 64, hi: 64 },
          { label: "20〜32人", min: 20, max: 32, lo: 128, hi: 128 }
        ]
      },
      note: "捕獲したパルの数や拠点の規模が増えると同じ人数でも使用量が増えるため、ひとつ上のプランを選ぶと安心、と記載"
    },
    {
      // XServer GAMEs「Palworld | かんたんに始められるマルチプレイ専用ゲームサーバー「XServer GAMEs」」
      // （プラン表「目安プレイ人数／メモリ容量」: 〜10人=16GB、10人〜=32GB、〜32人=64GB）／確認日 2026-10-27
      name: "XServer GAMEs（Palworldプラン表）",
      title: "Palworld | かんたんに始められるマルチプレイ専用ゲームサーバー「XServer GAMEs」",
      checked: "2026-10-27",
      rows: {
        pw: [
          { label: "〜10人", min: 1, max: 10, lo: 16, hi: 16 },
          { label: "10人〜／〜32人", min: 10, max: 32, lo: 32, hi: 64, text: "32〜64GB",
            note: "「10人〜」に32GB、「〜32人」に64GBと掲載。11〜31人のどこで切り替わるかは書かれていない" }
        ]
      }
    }
  ];

  // レンタルサービスのプランのメモリ容量(GB)。名前とメモリ容量だけ（料金は載せない）。
  // ロリポップ: gamers.lolipop.jp/minecraft-je（4〜128GB）, /minecraft-bedrock（2〜128GB）, /palworld（16〜128GB）の申込ボタンのプラン名／確認日 2026-10-27
  // XServer GAMEs: games.xserver.ne.jp/game-server/minecraft/（バニラ・統合版 2〜64GB、MOD系 4〜64GB）, /palworld/（16〜64GB）のプラン表／確認日 2026-10-27
  // ConoHa for GAME: game.conoha.jp/template/minecraft/（1〜64GB）, /pricing/ のパルワールド専用プラン（8〜64GB）／確認日 2026-10-27
  const PLANS = [
    { name: "ロリポップ! for Gamers", sizes: { jv: [4, 8, 16, 32, 64, 128], jm: [4, 8, 16, 32, 64, 128], be: [2, 4, 8, 16, 32, 64, 128], pw: [16, 32, 64, 128] } },
    { name: "XServer GAMEs", sizes: { jv: [2, 4, 8, 16, 32, 64], jm: [4, 8, 16, 32, 64], be: [2, 4, 8, 16, 32, 64], pw: [16, 32, 64] } },
    { name: "ConoHa for GAME", sizes: { jv: [1, 2, 4, 8, 16, 32, 64], jm: [1, 2, 4, 8, 16, 32, 64], be: [1, 2, 4, 8, 16, 32, 64], pw: [8, 16, 32, 64] } }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function half(s) {
    const v = String(s == null ? "" : s);
    return (window.tb && window.tb.z2h ? window.tb.z2h(v) : v).trim();
  }
  function gbText(row) {
    if (row.text) return row.text;
    return row.lo === row.hi ? row.lo + "GB" : row.lo + "〜" + row.hi + "GB";
  }
  function rowMatches(row, n) {
    return n >= row.min && (row.max === null || n <= row.max);
  }

  // 純粋な計算部分: 入力 -> { error } か { entries, lo, hi, plans, ... }
  function calc(game, nRaw, bigMod) {
    if (!GAMES[game]) return { error: "ゲームの種類を選んでください。" };
    const s = half(nRaw);
    if (s === "") return { error: "同時に遊ぶ人数を入力してください。" };
    if (!/^\d+$/.test(s)) return { error: "人数は整数（1以上）で入力してください。" };
    const n = parseInt(s, 10);
    if (n < 1) return { error: "人数は1人以上で入力してください。0人では目安を出せません。" };
    if (n > INPUT_MAX) return { error: "人数は" + INPUT_MAX.toLocaleString("en-US") + "人以下で入力してください。" };
    if (game === "pw" && n > PW_MAX_PLAYERS) {
      return { error: "パルワールドの出典（ロリポップ・XServer GAMEs）が扱う人数は最大" + PW_MAX_PLAYERS + "人までです。" + n + "人の公開された目安がありません。" };
    }
    const entries = [];
    SOURCES.forEach((src) => {
      const rows = src.rows[game];
      if (!rows) {
        if (src.none && src.none[game]) entries.push({ src: src, kind: "none", message: src.none[game] });
        return;
      }
      const hit = rows.filter((r) => rowMatches(r, n));
      if (hit.length === 0) {
        entries.push({ src: src, kind: "none", message: n + "人に当たる行がありません（公開された目安がありません）" });
        return;
      }
      hit.forEach((r) => entries.push({ src: src, kind: "row", row: r }));
    });
    const used = entries.filter((e) => e.kind === "row" && !e.row.ref);
    if (used.length === 0) return { error: "この条件には公開された目安がありません。", entries: entries };
    const lo = Math.min.apply(null, used.map((e) => e.row.lo));
    const hi = Math.max.apply(null, used.map((e) => e.row.hi));
    const plans = PLANS.map((p) => {
      const sizes = p.sizes[game] || [];
      const ok = sizes.filter((x) => x >= hi);
      return { name: p.name, sizes: sizes, ok: ok, max: sizes.length ? sizes[sizes.length - 1] : null };
    });
    const all = [];
    plans.forEach((p) => p.ok.forEach((x) => all.push(x)));
    const smallest = all.length ? Math.min.apply(null, all) : null;
    return { n: n, game: game, entries: entries, lo: lo, hi: hi, plans: plans, smallest: smallest, bigMod: !!bigMod && game === "jm" };
  }

  function render(res) {
    const err = $("gsm-error"), sum = $("gsm-summary"), tbl = $("gsm-table"), plans = $("gsm-plans");
    err.textContent = ""; sum.innerHTML = ""; tbl.innerHTML = ""; plans.innerHTML = "";
    if (res.error) {
      err.textContent = res.error;
      if (!res.entries) return;
    }
    // 出典ごとの表（エラー時でも該当なしの説明は出す）
    let h = '<table><thead><tr><th>出典</th><th>掲載の人数</th><th>推奨メモリ</th><th>確認日</th></tr></thead><tbody>';
    res.entries.forEach((e) => {
      const head = esc(e.src.name) + '<br><span class="hint">' + esc(e.src.title) + "</span>";
      if (e.kind === "none") {
        h += "<tr><td>" + head + '</td><td colspan="2">' + esc(e.message) + "</td><td>" + esc(e.src.checked) + "</td></tr>";
      } else {
        const extra = e.row.note ? '<br><span class="hint">' + esc(e.row.note) + "</span>" : "";
        const refMark = e.row.ref ? '<br><span class="hint">参考（下の範囲には含めません）</span>' : "";
        h += "<tr><td>" + head + "</td><td>" + esc(e.row.label) + "</td><td>" + esc(gbText(e.row)) + extra + refMark + "</td><td>" + esc(e.src.checked) + "</td></tr>";
      }
    });
    h += "</tbody></table>";
    tbl.innerHTML = h;
    if (res.error) return;

    const range = res.lo === res.hi ? res.lo + "GB" : res.lo + "GB〜" + res.hi + "GB";
    let s = "<div><strong>" + esc(GAMES[res.game]) + "・" + res.n + "人</strong> の公開された目安：<strong>" + esc(range) + "</strong></div>";
    s += '<p class="hint" style="margin:6px 0 0">下の表のうち、該当する出典の最小値〜最大値です。係数や計算式は使っていません。</p>';
    if (res.game === "jm") {
      s += '<p class="hint" style="margin:6px 0 0">MODの数や大きさ別の数値を載せている出典は、確認した範囲ではありませんでした（公開された目安がありません）。</p>';
      if (res.bigMod) s += '<p style="margin:6px 0 0">大型MODを入れる場合、XServer GAMEsの解説記事は「4GBでも足りない可能性がある」と書いています。数値の目安は載っていません。</p>';
    }
    sum.innerHTML = s;

    let p = "<p style=\"margin:16px 0 6px;font-weight:700\">目安の上限（" + res.hi + "GB）を満たすプランのメモリ容量</p>";
    if (res.smallest === null) {
      p += "<p>下記のサービスの掲載プランに、" + res.hi + "GB以上のものはありませんでした。</p>";
    } else {
      p += "<p>掲載プランの中で最小のメモリ容量は <strong>" + res.smallest + "GB</strong> です。</p>";
    }
    p += "<ul>";
    res.plans.forEach((x) => {
      if (x.sizes.length === 0) {
        p += "<li>" + esc(x.name) + "：この種類のプランは確認できませんでした</li>";
      } else if (x.ok.length === 0) {
        p += "<li>" + esc(x.name) + "：掲載プランの最大は" + x.max + "GBで、上限の" + res.hi + "GBには届きません</li>";
      } else {
        p += "<li>" + esc(x.name) + "：" + x.ok.map((v) => v + "GB").join("・") + "（最小 " + x.ok[0] + "GB）</li>";
      }
    });
    p += "</ul>";
    p += '<p class="hint">プランの構成や新規受付の状況は変わります。申し込み前に各社の公式ページで確認してください。メモリ容量は2026-10-27に各社の公開ページで確認した値です。</p>';
    plans.innerHTML = p;
  }

  function run() {
    const game = $("gsm-game").value;
    $("gsm-bigmod-wrap").hidden = game !== "jm";
    render(calc(game, $("gsm-players").value, $("gsm-bigmod").checked));
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["gsm-game", "gsm-players", "gsm-bigmod"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    run();
  });
})();
