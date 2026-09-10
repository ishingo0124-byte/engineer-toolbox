(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const CHECK_IDS = ["cm-u-r", "cm-u-w", "cm-u-x", "cm-g-r", "cm-g-w", "cm-g-x", "cm-o-r", "cm-o-w", "cm-o-x", "cm-suid", "cm-sgid", "cm-sticky"];
  let typeChar = "-"; // 記号表記の先頭1文字（ファイル種別）。編集時のみ更新し、他は維持する。

  function toHalfWidth(s) {
    return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  function digit(r, w, x) { return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0); }

  function stateFromCheckboxes() {
    const g = (id) => $(id).checked;
    return {
      u_r: g("cm-u-r"), u_w: g("cm-u-w"), u_x: g("cm-u-x"),
      g_r: g("cm-g-r"), g_w: g("cm-g-w"), g_x: g("cm-g-x"),
      o_r: g("cm-o-r"), o_w: g("cm-o-w"), o_x: g("cm-o-x"),
      suid: g("cm-suid"), sgid: g("cm-sgid"), sticky: g("cm-sticky"),
    };
  }

  function parseOctal(raw) {
    const s = toHalfWidth(String(raw || "").trim()).replace(/^0+(?=[0-7]{3,4}$)/, "");
    let str = s;
    if (!/^[0-7]{3,4}$/.test(str)) return null;
    if (str.length === 3) str = "0" + str;
    const special = parseInt(str[0], 10);
    const own = parseInt(str[1], 10), grp = parseInt(str[2], 10), oth = parseInt(str[3], 10);
    return {
      u_r: !!(own & 4), u_w: !!(own & 2), u_x: !!(own & 1),
      g_r: !!(grp & 4), g_w: !!(grp & 2), g_x: !!(grp & 1),
      o_r: !!(oth & 4), o_w: !!(oth & 2), o_x: !!(oth & 1),
      suid: !!(special & 4), sgid: !!(special & 2), sticky: !!(special & 1),
    };
  }

  function parseSymbolic(raw) {
    let s = String(raw || "").trim();
    if (s.length === 9) s = "-" + s;
    if (s.length !== 10) return null;
    const type = s[0];
    const p = s.slice(1);
    if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(p)) return null;
    typeChar = type;
    return {
      u_r: p[0] === "r", u_w: p[1] === "w", u_x: p[2] === "x" || p[2] === "s",
      g_r: p[3] === "r", g_w: p[4] === "w", g_x: p[5] === "x" || p[5] === "s",
      o_r: p[6] === "r", o_w: p[7] === "w", o_x: p[8] === "x" || p[8] === "t",
      suid: p[2] === "s" || p[2] === "S", sgid: p[5] === "s" || p[5] === "S", sticky: p[8] === "t" || p[8] === "T",
    };
  }

  function stateToOctal(st) {
    const own = digit(st.u_r, st.u_w, st.u_x), grp = digit(st.g_r, st.g_w, st.g_x), oth = digit(st.o_r, st.o_w, st.o_x);
    const special = digit(st.suid, st.sgid, st.sticky);
    return (special > 0 ? String(special) : "") + String(own) + String(grp) + String(oth);
  }

  function stateToSymbolic(st) {
    const c2 = st.suid ? (st.u_x ? "s" : "S") : (st.u_x ? "x" : "-");
    const c5 = st.sgid ? (st.g_x ? "s" : "S") : (st.g_x ? "x" : "-");
    const c8 = st.sticky ? (st.o_x ? "t" : "T") : (st.o_x ? "x" : "-");
    return typeChar + (st.u_r ? "r" : "-") + (st.u_w ? "w" : "-") + c2
      + (st.g_r ? "r" : "-") + (st.g_w ? "w" : "-") + c5
      + (st.o_r ? "r" : "-") + (st.o_w ? "w" : "-") + c8;
  }

  function descRWX(r, w, x) {
    const parts = [];
    if (r) parts.push("読み取り");
    if (w) parts.push("書き込み");
    if (x) parts.push("実行");
    return parts.length ? parts.join("・") : "権限なし";
  }

  function applyState(st) {
    CHECK_IDS.forEach((id) => {
      const key = id.replace("cm-", "").replace("-", "_");
      $(id).checked = !!st[key];
    });
  }

  function render(st) {
    const octal = stateToOctal(st);
    $("cm-octal").value = octal;
    $("cm-symbolic").value = stateToSymbolic(st);
    $("cm-command").textContent = "chmod " + octal + " 対象ファイル";
    $("cm-desc-u").textContent = descRWX(st.u_r, st.u_w, st.u_x);
    $("cm-desc-g").textContent = descRWX(st.g_r, st.g_w, st.g_x);
    $("cm-desc-o").textContent = descRWX(st.o_r, st.o_w, st.o_x);
    const specials = [];
    if (st.suid) specials.push("SUID（実行時に所有者の権限で動作）");
    if (st.sgid) specials.push("SGID（実行時にグループの権限で動作／ディレクトリでは作成物が同じグループを継承）");
    if (st.sticky) specials.push("スティッキービット（ディレクトリ内では所有者しか削除できない）");
    $("cm-desc-special").textContent = specials.length ? specials.join("、") : "なし";
  }

  function run(source) {
    $("cm-error").textContent = "";
    let st;
    if (source === "octal") {
      st = parseOctal($("cm-octal").value);
      if (!st) { $("cm-error").textContent = "8進数は 3〜4桁の 0〜7 の数字で入力してください（例: 755, 4755）"; return; }
    } else if (source === "symbolic") {
      st = parseSymbolic($("cm-symbolic").value);
      if (!st) { $("cm-error").textContent = "記号表記が正しくありません（例: -rwxr-xr-x、SUID等は s/S、スティッキーは t/T）"; return; }
    } else {
      st = stateFromCheckboxes();
    }
    applyState(st);
    render(st);
  }

  document.addEventListener("DOMContentLoaded", () => {
    CHECK_IDS.forEach((id) => $(id).addEventListener("input", () => run("checkbox")));
    $("cm-octal").addEventListener("input", () => run("octal"));
    $("cm-symbolic").addEventListener("input", () => run("symbolic"));
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("cm-octal").value = btn.getAttribute("data-preset");
        run("octal");
      });
    });
    run("octal");
  });
})();
