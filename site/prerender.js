// ツールの script.js を最小限の偽 DOM で実行し、指定した要素の初期 HTML を標準出力に返す。
// build.py から `node prerender.js <script.js> <要素id>` で呼ぶ。検索エンジンに表の中身を文字として渡すためのもの。
"use strict";
const fs = require("fs");
const [, , scriptPath, targetId] = process.argv;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const els = {};
function el(id) {
  if (!els[id]) {
    els[id] = {
      id, value: "", innerHTML: "", textContent: "", hidden: false, checked: false,
      addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
      querySelectorAll() { return []; }, querySelector() { return null; },
      classList: { add() {}, remove() {}, toggle() {} }, style: {},
    };
  }
  return els[id];
}
const ready = [];
global.window = { print() {}, location: { hash: "" }, addEventListener() {} };
global.location = global.window.location;
global.document = {
  getElementById: el,
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener(type, fn) { if (type === "DOMContentLoaded") ready.push(fn); },
  createElement() {
    const o = { _t: "" };
    Object.defineProperty(o, "textContent", { set(v) { o._t = v; }, get() { return o._t; } });
    Object.defineProperty(o, "innerHTML", { get() { return esc(o._t); } });
    return o;
  },
};
global.tb = {
  z2h: (s) => String(s).replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)),
  debounce: (f) => f,
};
new Function(fs.readFileSync(scriptPath, "utf8"))();
ready.forEach((fn) => fn());
process.stdout.write(el(targetId).innerHTML);
