(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const PRESETS = {
    email: {
      pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+",
      flags: { g: true, i: false, m: false, s: false, u: false },
      text: "連絡先: taro.yamada+info@example.co.jp / 予備: sales@example.com",
      replace: ""
    },
    ipv4: {
      pattern: "\\b(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}\\b",
      flags: { g: true, i: false, m: false, s: false, u: false },
      text: "サーバー: 192.168.1.1、ゲートウェイ 10.0.0.1、無効な値 999.999.999.999",
      replace: ""
    },
    date: {
      pattern: "(\\d{4})-(\\d{2})-(\\d{2})",
      flags: { g: true, i: false, m: false, s: false, u: false },
      text: "開始日は 2026-04-01、締切は 2026-09-10 です。",
      replace: "$1年$2月$3日"
    },
    zip: {
      pattern: "\\d{3}-\\d{4}",
      flags: { g: true, i: false, m: false, s: false, u: false },
      text: "郵便番号は 100-0001 と 530-0001 です。",
      replace: ""
    }
  };

  function getFlags() {
    let f = "";
    if ($("rt-g").checked) f += "g";
    if ($("rt-i").checked) f += "i";
    if ($("rt-m").checked) f += "m";
    if ($("rt-s").checked) f += "s";
    if ($("rt-u").checked) f += "u";
    return f;
  }

  function run() {
    const errEl = $("rt-error");
    errEl.textContent = "";
    const text = $("rt-text").value;
    const pattern = $("rt-pattern").value;

    if (pattern === "") {
      $("rt-highlight").innerHTML = escapeHtml(text);
      $("rt-matches").innerHTML = '<p class="hint">パターンが空です。</p>';
      $("rt-count").textContent = "0";
      $("rt-replaced").textContent = text;
      return;
    }

    let re;
    try {
      re = new RegExp(pattern, getFlags());
    } catch (e) {
      errEl.textContent = "正規表現エラー: " + e.message;
      $("rt-highlight").innerHTML = escapeHtml(text);
      $("rt-matches").innerHTML = "";
      $("rt-count").textContent = "0";
      $("rt-replaced").textContent = text;
      return;
    }

    // マッチ収集（g フラグが無い場合は最初の1件のみ、JS の実際の挙動と一致させる）
    const matches = [];
    if (re.global) {
      let m;
      let guard = 0;
      while ((m = re.exec(text)) !== null) {
        matches.push(m);
        if (m[0] === "") re.lastIndex++; // ゼロ幅マッチで無限ループしないようにする
        guard++;
        if (guard > 20000) {
          errEl.textContent = "マッチ数が多すぎるため、先頭 20000 件で打ち切りました。";
          break;
        }
      }
    } else {
      const m = re.exec(text);
      if (m) matches.push(m);
    }

    // ハイライト
    let html = "";
    let last = 0;
    for (const m of matches) {
      html += escapeHtml(text.slice(last, m.index));
      html += "<mark>" + escapeHtml(m[0]) + "</mark>";
      last = m.index + m[0].length;
    }
    html += escapeHtml(text.slice(last));
    $("rt-highlight").innerHTML = html;
    $("rt-count").textContent = tb.fmt(matches.length);

    // マッチ一覧
    if (matches.length === 0) {
      $("rt-matches").innerHTML = '<p class="hint">マッチなし</p>';
    } else {
      $("rt-matches").innerHTML = matches.map((m, i) => {
        let extra = "";
        if (m.length > 1) {
          extra += "<div class=\"hint\">キャプチャグループ</div><ul>" +
            Array.prototype.slice.call(m, 1).map((g, gi) =>
              "<li><span class=\"mono\">$" + (gi + 1) + "</span> = " +
              (g === undefined ? "<em>(マッチなし)</em>" : "<span class=\"mono\">" + escapeHtml(g) + "</span>") + "</li>"
            ).join("") + "</ul>";
        }
        if (m.groups) {
          const keys = Object.keys(m.groups);
          if (keys.length) {
            extra += "<div class=\"hint\">名前付きグループ</div><ul>" +
              keys.map((k) =>
                "<li><span class=\"mono\">$&lt;" + escapeHtml(k) + "&gt;</span> = " +
                (m.groups[k] === undefined ? "<em>(マッチなし)</em>" : "<span class=\"mono\">" + escapeHtml(m.groups[k]) + "</span>") + "</li>"
              ).join("") + "</ul>";
          }
        }
        return '<div class="rt-match"><span class="idx">#' + (i + 1) + " index=" + m.index + '</span> <span class="mono">' +
          escapeHtml(m[0]) + "</span>" + extra + "</div>";
      }).join("");
    }

    // 置換プレビュー（新しい RegExp インスタンスで lastIndex の影響を受けないようにする）
    try {
      const replacement = $("rt-replace").value;
      const reReplace = new RegExp(pattern, getFlags());
      $("rt-replaced").textContent = text.replace(reReplace, replacement);
    } catch (e) {
      $("rt-replaced").textContent = "";
    }
  }

  function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    $("rt-pattern").value = p.pattern;
    $("rt-g").checked = !!p.flags.g;
    $("rt-i").checked = !!p.flags.i;
    $("rt-m").checked = !!p.flags.m;
    $("rt-s").checked = !!p.flags.s;
    $("rt-u").checked = !!p.flags.u;
    $("rt-text").value = p.text;
    $("rt-replace").value = p.replace;
    run();
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["rt-pattern", "rt-text", "rt-replace"].forEach((id) => $(id).addEventListener("input", run));
    ["rt-g", "rt-i", "rt-m", "rt-s", "rt-u"].forEach((id) => $(id).addEventListener("change", run));
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => applyPreset(btn.getAttribute("data-preset")));
    });
    run();
  });
})();
