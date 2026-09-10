(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // BIPM国際単位系（SI）が定めるSI接頭辞（yからYまで20種、2022年追加のronna/quetta等は含まない）
  const SI_PREFIXES = [
    { sym: "y", name: "ヨクト", exp: -24 },
    { sym: "z", name: "ゼプト", exp: -21 },
    { sym: "a", name: "アト", exp: -18 },
    { sym: "f", name: "フェムト", exp: -15 },
    { sym: "p", name: "ピコ", exp: -12 },
    { sym: "n", name: "ナノ", exp: -9 },
    { sym: "µ", name: "マイクロ", exp: -6 },
    { sym: "m", name: "ミリ", exp: -3 },
    { sym: "c", name: "センチ", exp: -2 },
    { sym: "d", name: "デシ", exp: -1 },
    { sym: "da", name: "デカ", exp: 1 },
    { sym: "h", name: "ヘクト", exp: 2 },
    { sym: "k", name: "キロ", exp: 3 },
    { sym: "M", name: "メガ", exp: 6 },
    { sym: "G", name: "ギガ", exp: 9 },
    { sym: "T", name: "テラ", exp: 12 },
    { sym: "P", name: "ペタ", exp: 15 },
    { sym: "E", name: "エクサ", exp: 18 },
    { sym: "Z", name: "ゼタ", exp: 21 },
    { sym: "Y", name: "ヨタ", exp: 24 },
  ];

  // IEC 80000-13（IEC 60027-2）が定める2進接頭辞（KiからYiまで8種）
  const IEC_PREFIXES = [
    { sym: "Ki", name: "キビ", exp: 1 },
    { sym: "Mi", name: "メビ", exp: 2 },
    { sym: "Gi", name: "ギビ", exp: 3 },
    { sym: "Ti", name: "テビ", exp: 4 },
    { sym: "Pi", name: "ペビ", exp: 5 },
    { sym: "Ei", name: "エクスビ", exp: 6 },
    { sym: "Zi", name: "ゼビ", exp: 7 },
    { sym: "Yi", name: "ヨビ", exp: 8 },
  ];

  function parseNumber(raw) {
    let s = ("tb" in window && window.tb && window.tb.z2h ? window.tb.z2h(raw) : raw).trim();
    if (s === "") return null;
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    const v = parseFloat(s);
    return isFinite(v) ? v : null;
  }

  function formatNum(n) {
    if (n === 0) return "0";
    if (!isFinite(n)) return String(n);
    let s = n.toPrecision(10);
    if (s.indexOf("e") === -1) {
      if (s.indexOf(".") !== -1) s = s.replace(/0+$/, "").replace(/\.$/, "");
    } else {
      s = s.replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
    }
    return s;
  }

  function toEngineering(n) {
    if (n === 0) return "0×10^0";
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    let exp = Math.floor(Math.log10(abs) / 3) * 3;
    let mantissa = abs / Math.pow(10, exp);
    if (mantissa >= 1000 - 1e-9) { mantissa /= 1000; exp += 3; }
    if (mantissa < 1 && exp > -24) { mantissa *= 1000; exp -= 3; }
    let mStr = mantissa.toPrecision(6);
    if (mStr.indexOf(".") !== -1) mStr = mStr.replace(/0+$/, "").replace(/\.$/, "");
    return sign + mStr + "×10^" + exp;
  }

  function toScientific(n) {
    if (n === 0) return "0×10^0";
    let s = n.toExponential(6);
    s = s.replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
    const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/);
    if (!m) return s;
    return m[1] + "×10^" + parseInt(m[2], 10);
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function buildTable(wrapId, prefixes, base, factorBase, unit) {
    const wrap = $(wrapId);
    wrap.textContent = "";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["接頭辞", "名称", "指数", "値"].forEach((h) => hr.appendChild(el("th", null, h)));
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    prefixes.forEach((p) => {
      const tr = document.createElement("tr");
      tr.appendChild(el("td", "mono", p.sym));
      tr.appendChild(el("td", null, p.name));
      tr.appendChild(el("td", "mono", factorBase + "^" + p.exp));
      const val = base / Math.pow(factorBase, p.exp);
      tr.appendChild(el("td", "mono", formatNum(val) + (unit ? " " + p.sym + unit : "")));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function run() {
    const err = $("up-error");
    err.textContent = "";
    const v = parseNumber($("up-value").value);
    const sel = $("up-prefix").value; // "si:3" or "iec:1"
    const unit = $("up-unit").value.trim();
    const ids = ["up-base", "up-eng", "up-exp"];
    if (v === null) {
      if ($("up-value").value.trim() !== "") err.textContent = "数値を入力してください（例: 1、1.5、-2.3）";
      ids.forEach((id) => { $(id).textContent = "-"; });
      $("up-si-wrap").textContent = "";
      $("up-iec-wrap").textContent = "";
      return;
    }
    const [type, expStr] = sel.split(":");
    const exp = parseInt(expStr, 10);
    const base = type === "iec" ? v * Math.pow(1024, exp) : v * Math.pow(10, exp);

    $("up-base").textContent = formatNum(base) + (unit ? " " + unit : "");
    $("up-eng").textContent = toEngineering(base) + (unit ? " " + unit : "");
    $("up-exp").textContent = toScientific(base) + (unit ? " " + unit : "");

    buildTable("up-si-wrap", SI_PREFIXES, base, 10, unit);
    buildTable("up-iec-wrap", IEC_PREFIXES, base, 1024, unit);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["up-value", "up-unit"].forEach((id) => $(id).addEventListener("input", run));
    $("up-prefix").addEventListener("change", run);
    $("up-prefix").addEventListener("input", run);
    run();
  });
})();
