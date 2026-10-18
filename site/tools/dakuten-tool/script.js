(function () {
  "use strict";

  const DAKU = "゙", HANDAKU = "゚"; // 結合用濁点・結合用半濁点

  function pairMap(pairs) {
    const fwd = {}, back = {};
    pairs.forEach((p) => { const a = Array.from(p); fwd[a[0]] = a[1]; back[a[1]] = a[0]; });
    return { fwd: fwd, back: back };
  }
  // 清音→濁音（ひらがな。ゔ=U+3094、ゞ=U+309E）
  const HIRA_VOICED = pairMap(["かが", "きぎ", "くぐ", "けげ", "こご", "さざ", "しじ", "すず", "せぜ", "そぞ",
    "ただ", "ちぢ", "つづ", "てで", "とど", "はば", "ひび", "ふぶ", "へべ", "ほぼ", "うゔ", "ゝゞ"]);
  // カタカナ。ヷヸヹヺ=U+30F7〜30FA、ヴ=U+30F4、ヾ=U+30FE
  const KATA_VOICED = pairMap(["カガ", "キギ", "クグ", "ケゲ", "コゴ", "サザ", "シジ", "スズ", "セゼ", "ソゾ",
    "タダ", "チヂ", "ツヅ", "テデ", "トド", "ハバ", "ヒビ", "フブ", "ヘベ", "ホボ", "ウヴ", "ワヷ", "ヰヸ", "ヱヹ", "ヲヺ", "ヽヾ"]);
  const HIRA_SEMI = pairMap(["はぱ", "ひぴ", "ふぷ", "へぺ", "ほぽ"]);
  const KATA_SEMI = pairMap(["ハパ", "ヒピ", "フプ", "ヘペ", "ホポ"]);
  // 大書き⇄小書き
  const HIRA_SMALL = pairMap(["ぁあ", "ぃい", "ぅう", "ぇえ", "ぉお", "っつ", "ゃや", "ゅゆ", "ょよ", "ゎわ", "ゕか", "ゖけ"].map((s) => s[1] + s[0]));
  const KATA_SMALL = pairMap(["ァア", "ィイ", "ゥウ", "ェエ", "ォオ", "ッツ", "ャヤ", "ュユ", "ョヨ", "ヮワ", "ヵカ", "ヶケ"].map((s) => s[1] + s[0]));
  // アイヌ語表記用の小書き片仮名 U+31F0〜31FF(ㇰ〜ㇿ)
  const KATA_EXT = pairMap(["ㇰク", "ㇱシ", "ㇲス", "ㇳト", "ㇴヌ", "ㇵハ", "ㇶヒ", "ㇷフ", "ㇸヘ", "ㇹホ", "ㇺム", "ㇻラ", "ㇼリ", "ㇽル", "ㇾレ", "ㇿロ"].map((s) => s[1] + s[0]));

  function isHira(cp) { return cp >= 0x3041 && cp <= 0x309F; }
  function isKata(cp) { return (cp >= 0x30A0 && cp <= 0x30FF) || (cp >= 0x31F0 && cp <= 0x31FF); }
  function inScope(c, o) {
    const cp = c.codePointAt(0);
    return (o.hira && isHira(cp)) || (o.kata && isKata(cp));
  }

  // 「か+U+3099」のような結合文字つきの並びを、合成済み1文字にする（かな範囲のみ）
  function composePairs(cps, o, counter) {
    const out = [];
    for (let i = 0; i < cps.length; i++) {
      const c = cps[i], n = cps[i + 1];
      if ((n === DAKU || n === HANDAKU) && inScope(c, o)) {
        const m = (c + n).normalize("NFC");
        if (Array.from(m).length === 1 && m !== c + n) {
          out.push(m); i++;
          if (counter) counter(c + n, m);
          continue;
        }
      }
      out.push(c);
    }
    return out;
  }

  // op: dakuten-add | dakuten-remove | handakuten-add | handakuten-remove | small | large | decompose | compose
  function transform(text, op, o) {
    o = o || { hira: true, kata: true, ext: false };
    let cps = Array.from(String(text == null ? "" : text));
    const changes = {};
    const note = (a, b) => { const k = a + "→" + b; changes[k] = (changes[k] || 0) + 1; };
    let changed = 0;
    const rec = (a, b) => { note(a, b); changed++; };

    if (op === "compose") {
      cps = composePairs(cps, o, rec);
    } else if (op === "decompose") {
      const out = [];
      cps.forEach((c) => {
        if (inScope(c, o) && c.codePointAt(0) < 0x3100) {
          const d = c.normalize("NFD");
          const a = Array.from(d);
          if (a.length === 2 && (a[1] === DAKU || a[1] === HANDAKU)) { out.push(d); rec(c, d); return; }
        }
        out.push(c);
      });
      cps = out;
    } else {
      cps = composePairs(cps, o, null); // NFD 形で貼られた文字も拾う（変換件数には数えない）
      const out = [];
      let tables;
      if (op === "dakuten-add") tables = [[HIRA_VOICED.fwd, "hira"], [KATA_VOICED.fwd, "kata"]];
      else if (op === "dakuten-remove") tables = [[HIRA_VOICED.back, "hira"], [KATA_VOICED.back, "kata"]];
      else if (op === "handakuten-add") tables = [[HIRA_SEMI.fwd, "hira"], [KATA_SEMI.fwd, "kata"]];
      else if (op === "handakuten-remove") tables = [[HIRA_SEMI.back, "hira"], [KATA_SEMI.back, "kata"]];
      else if (op === "small") tables = [[HIRA_SMALL.fwd, "hira"], [KATA_SMALL.fwd, "kata"]].concat(o.ext ? [[KATA_EXT.fwd, "kata"]] : []);
      else if (op === "large") tables = [[HIRA_SMALL.back, "hira"], [KATA_SMALL.back, "kata"]].concat(o.ext ? [[KATA_EXT.back, "kata"]] : []);
      else tables = [];
      const removeMark = op === "dakuten-remove" ? DAKU : (op === "handakuten-remove" ? HANDAKU : null);
      cps.forEach((c) => {
        let res = null;
        for (const t of tables) {
          if (!o[t[1]]) continue;
          if (Object.prototype.hasOwnProperty.call(t[0], c)) { res = t[0][c]; break; }
        }
        if (res !== null) { out.push(res); rec(c, res); return; }
        // 外す操作のとき、合成できずに残った結合文字（例: わ+U+3099）も取り除く
        if (removeMark && c === removeMark && out.length) {
          const prev = out[out.length - 1];
          if (inScope(prev, o)) { out.push(null); rec(prev + c, prev); return; }
        }
        out.push(c);
      });
      cps = out.filter((x) => x !== null);
    }
    return { text: cps.join(""), changed: changed, changes: changes };
  }

  const api = { transform: transform };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (typeof document === "undefined") return;

  // ---- 画面側 ----
  const $ = (id) => document.getElementById(id);

  function run() {
    const text = $("dk-in").value;
    const o = { hira: $("dk-hira").checked, kata: $("dk-kata").checked, ext: $("dk-ext").checked };
    const err = $("dk-error");
    err.textContent = "";
    if (!o.hira && !o.kata) { err.textContent = "ひらがな・カタカナのどちらかにチェックを入れてください。"; }
    const r = transform(text, $("dk-op").value, o);
    $("dk-out").value = r.text;
    const cin = Array.from(text).length, cout = Array.from(r.text).length;
    const keys = Object.keys(r.changes);
    const box = $("dk-info");
    box.textContent = "";
    const l1 = document.createElement("div");
    l1.textContent = "変換した文字: " + r.changed + " 件。コードポイント数: 入力 " + cin + " → 出力 " + cout + "。";
    box.appendChild(l1);
    if (keys.length) {
      const l2 = document.createElement("div");
      l2.className = "mono";
      l2.textContent = keys.slice(0, 40).map((k) => k + (r.changes[k] > 1 ? "×" + r.changes[k] : "")).join("  ") + (keys.length > 40 ? " …" : "");
      box.appendChild(l2);
    } else if (text !== "") {
      const l3 = document.createElement("div");
      l3.className = "hint";
      l3.textContent = "この操作で変わる文字がありませんでした。付けられない・外せない文字はそのまま残します。";
      box.appendChild(l3);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["dk-in", "dk-op", "dk-hira", "dk-kata", "dk-ext"].forEach((id) => {
      $(id).addEventListener("input", run);
      $(id).addEventListener("change", run);
    });
    $("dk-apply").addEventListener("click", () => { $("dk-in").value = $("dk-out").value; run(); });
    run();
  });
})();
