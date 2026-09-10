(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 主要な名前付き文字参照（HTML Living Standard の named character references の代表的なもの）
  const NAMED_ENTITIES = {
    amp: 38, lt: 60, gt: 62, quot: 34, apos: 39,
    nbsp: 160, copy: 169, reg: 174, trade: 8482,
    hellip: 8230, mdash: 8212, ndash: 8211,
    lsquo: 8216, rsquo: 8217, ldquo: 8220, rdquo: 8221,
    laquo: 171, raquo: 187, deg: 176, plusmn: 177,
    times: 215, divide: 247,
    frac12: 189, frac14: 188, frac34: 190,
    sup1: 185, sup2: 178, sup3: 179,
    micro: 181, para: 182, sect: 167, middot: 183,
    bull: 8226, dagger: 8224, Dagger: 8225, permil: 8240,
    euro: 8364, pound: 163, yen: 165, cent: 162, curren: 164,
    infin: 8734, ne: 8800, le: 8804, ge: 8805,
    larr: 8592, rarr: 8594, uarr: 8593, darr: 8595, harr: 8596,
    spades: 9824, clubs: 9827, hearts: 9829, diams: 9830,
    alpha: 945, beta: 946, gamma: 947, delta: 948, pi: 960, sigma: 963, omega: 969,
    star: 9733, check: 10003, cross: 10007, heart: 10084,
    iexcl: 161, iquest: 191, szlig: 223, agrave: 224, eacute: 233,
    AMP: 38, LT: 60, GT: 62, QUOT: 34
  };
  // デコード表示・検索用の逆引き（コードポイント→代表的な名前。エンコードには使わない）
  const REV_ENTITIES = {};
  Object.keys(NAMED_ENTITIES).forEach((name) => {
    const cp = NAMED_ENTITIES[name];
    if (!(cp in REV_ENTITIES)) REV_ENTITIES[cp] = name;
  });

  function escapeHtml(text, attrMode) {
    let s = String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    if (attrMode) {
      s = s.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    return s;
  }

  function decodeHtml(input) {
    let unknownCount = 0;
    const unknownNames = [];
    const out = input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
      if (body[0] === "#") {
        let cp;
        if (body[1] === "x" || body[1] === "X") {
          cp = parseInt(body.slice(2), 16);
        } else {
          cp = parseInt(body.slice(1), 10);
        }
        if (!isFinite(cp) || cp < 0 || cp > 0x10ffff) return whole;
        try {
          return String.fromCodePoint(cp);
        } catch (e) {
          return whole;
        }
      }
      if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body)) {
        return String.fromCodePoint(NAMED_ENTITIES[body]);
      }
      unknownCount++;
      unknownNames.push(body);
      return whole;
    });
    return { text: out, unknownCount, unknownNames };
  }

  function currentAttrMode() {
    return $("he-mode-attr").checked;
  }

  function runFromText() {
    const err = $("he-error");
    err.textContent = "";
    $("he-decode-note").textContent = "";
    $("he-escaped").value = escapeHtml($("he-text").value, currentAttrMode());
  }

  function runFromEscaped() {
    const err = $("he-error");
    err.textContent = "";
    const raw = $("he-escaped").value;
    const result = decodeHtml(raw);
    $("he-text").value = result.text;
    if (result.unknownCount > 0) {
      const uniq = Array.from(new Set(result.unknownNames)).slice(0, 8);
      $("he-decode-note").textContent = "未対応の実体参照 " + result.unknownCount + " 件をそのまま残しました（例: &" + uniq.join(";, &") + ";）。主要なもの以外は非対応です。";
    } else {
      $("he-decode-note").textContent = "";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("he-text").addEventListener("input", runFromText);
    $("he-escaped").addEventListener("input", runFromEscaped);
    $("he-mode-text").addEventListener("change", runFromText);
    $("he-mode-attr").addEventListener("change", runFromText);
    $("he-clear").addEventListener("click", () => {
      $("he-text").value = "";
      $("he-escaped").value = "";
      $("he-error").textContent = "";
      $("he-decode-note").textContent = "";
      $("he-text").focus();
    });
    runFromText();
  });
})();
