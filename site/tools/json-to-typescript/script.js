(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function toPascalCase(name) {
    const parts = String(name).split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (parts.length === 0) return "Root";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  }

  // 配列プロパティのキー名（例: items）から要素の型名の元になる単数形（Item）を作る簡易ヒューリスティック
  function singularize(name) {
    const s = String(name);
    if (/ies$/i.test(s)) return s.slice(0, -3) + "y";
    if (/(ses|xes|ches|shes)$/i.test(s)) return s.slice(0, -2);
    if (/s$/i.test(s) && !/ss$/i.test(s)) return s.slice(0, -1);
    return s + "Item";
  }

  function typeOfValue(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    const t = typeof v;
    if (t === "number" || t === "string" || t === "boolean" || t === "object") return t;
    return "unknown";
  }

  function uniqueName(baseName, used) {
    let name = baseName || "Anon";
    let i = 2;
    while (used.has(name)) { name = baseName + i; i++; }
    used.add(name);
    return name;
  }

  function wrapArrayMember(t) { return /\|/.test(t) ? "(" + t + ")[]" : t + "[]"; }

  function build(v, nameHint, reg, used) {
    const t = typeOfValue(v);
    if (t === "null") return "null";
    if (t === "number") return "number";
    if (t === "string") return "string";
    if (t === "boolean") return "boolean";
    if (t === "array") {
      if (v.length === 0) return "unknown[]";
      const elemTypes = new Set();
      const objElems = [];
      v.forEach((el) => {
        if (el !== null && typeof el === "object" && !Array.isArray(el)) objElems.push(el);
        else elemTypes.add(build(el, nameHint, reg, used));
      });
      if (objElems.length > 0) elemTypes.add(mergeObjectType(objElems, singularize(nameHint), reg, used));
      const arr = Array.from(elemTypes);
      const inner = arr.length === 1 ? arr[0] : arr.join(" | ");
      return arr.length === 1 ? wrapArrayMember(inner) : "(" + inner + ")[]";
    }
    if (t === "object") return mergeObjectType([v], nameHint, reg, used);
    return "unknown";
  }

  // 複数オブジェクト（配列由来の要素群、または単体オブジェクト1件）からキー和集合のinterfaceを組み立てる
  function mergeObjectType(objs, nameHint, reg, used) {
    const keyOrder = [];
    const keySeen = new Set();
    objs.forEach((o) => Object.keys(o).forEach((k) => { if (!keySeen.has(k)) { keySeen.add(k); keyOrder.push(k); } }));
    if (keyOrder.length === 0) return "Record<string, never>";
    const name = uniqueName(toPascalCase(nameHint), used);
    const fields = keyOrder.map((k) => {
      const presentIn = objs.filter((o) => Object.prototype.hasOwnProperty.call(o, k));
      const optional = presentIn.length < objs.length;
      const types = new Set();
      presentIn.forEach((o) => types.add(build(o[k], k, reg, used)));
      const arr = Array.from(types);
      return { key: k, optional, type: arr.length === 1 ? arr[0] : arr.join(" | ") };
    });
    reg.push({ name, fields });
    return name;
  }

  function isIdentifier(k) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k); }

  function renderInterfaces(reg, opts) {
    const memberSemi = opts.semicolons ? ";" : "";
    return reg.map((r) => {
      const lines = r.fields.map((f) => {
        const key = isIdentifier(f.key) ? f.key : JSON.stringify(f.key);
        const ro = opts.readonly ? "readonly " : "";
        return "  " + ro + key + (f.optional ? "?" : "") + ": " + f.type + memberSemi;
      });
      if (opts.alias) {
        return "type " + r.name + " = {\n" + lines.join("\n") + "\n}" + (opts.semicolons ? ";" : "");
      }
      return "interface " + r.name + " {\n" + lines.join("\n") + "\n}";
    }).join("\n\n");
  }

  function positionToLineCol(text, pos) {
    let line = 1, col = 1;
    for (let i = 0; i < pos && i < text.length; i++) {
      if (text[i] === "\n") { line++; col = 1; } else { col++; }
    }
    return { line, col };
  }

  function parseErrorDetail(input, err) {
    const msg = err.message || String(err);
    let m = msg.match(/line (\d+) column (\d+)/i);
    if (m) return m[1] + "行目 " + m[2] + "列目付近: " + msg;
    m = msg.match(/position (\d+)/i);
    if (m) {
      const { line, col } = positionToLineCol(input, parseInt(m[1], 10));
      return line + "行目 " + col + "列目付近: " + msg;
    }
    return msg;
  }

  function jsonToTs(jsonText, rootName, opts) {
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      throw new Error("JSON の構文エラー: " + parseErrorDetail(jsonText, e));
    }
    const reg = [];
    const used = new Set();
    const safeRootName = rootName.trim() === "" ? "Root" : rootName.trim();
    const rootType = build(data, safeRootName, reg, used);
    let out = renderInterfaces(reg, opts);
    const rootDeclaredAsInterface = reg.length > 0 && reg[reg.length - 1].name === rootType;
    if (!rootDeclaredAsInterface) {
      const semi = opts.semicolons ? ";" : "";
      out += (out ? "\n\n" : "") + "type " + toPascalCase(safeRootName) + " = " + rootType + semi;
    }
    return out;
  }

  function run() {
    const errEl = $("j2t-error");
    const out = $("j2t-output");
    const input = $("j2t-input").value;
    if (input.trim() === "") {
      out.value = "";
      errEl.textContent = "";
      return;
    }
    const opts = {
      alias: $("j2t-kind").value === "type",
      readonly: $("j2t-readonly").checked,
      semicolons: $("j2t-semi").checked,
    };
    try {
      out.value = jsonToTs(input, $("j2t-root-name").value, opts);
      errEl.textContent = "";
    } catch (e) {
      out.value = "";
      errEl.textContent = e.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("j2t-input").addEventListener("input", tb.debounce(run, 120));
    ["j2t-root-name", "j2t-kind", "j2t-readonly", "j2t-semi"].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.type === "checkbox" ? "change" : "input", run);
    });
    run();
  });
})();
