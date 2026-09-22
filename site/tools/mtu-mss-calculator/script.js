(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function readMtu() {
    const raw = ("tb" in window && tb.z2h) ? tb.z2h($("mm-mtu").value) : $("mm-mtu").value;
    const s = raw.trim();
    if (s === "") throw new Error("ベースMTUを入力してください");
    if (!/^[0-9]+$/.test(s)) throw new Error("ベースMTUは半角数字で入力してください");
    const n = parseInt(s, 10);
    if (n < 68) throw new Error("ベースMTUは68以上で入力してください（IPv4の最小MTU、RFC 791）");
    if (n > 65535) throw new Error("ベースMTUは65535以下で入力してください");
    return n;
  }

  function overheadTotal() {
    let total = 0;
    const parts = [];
    if ($("mm-ov-pppoe").checked) { total += 8; parts.push("PPPoE 8"); }
    if ($("mm-ov-vlan").checked) { total += 4; parts.push("VLAN 4"); }
    if ($("mm-ov-gre").checked) { total += 24; parts.push("GRE 24"); }
    if ($("mm-ov-vxlan").checked) { total += 50; parts.push("VXLAN 50"); }
    if ($("mm-ov-wg").checked) { total += 60; parts.push("WireGuard 60"); }
    if ($("mm-ov-esp").checked) {
      const espOv = parseInt($("mm-esp-mode").value, 10);
      total += espOv;
      parts.push("IPsec ESP " + espOv);
    }
    return { total, parts };
  }

  function run() {
    const errEl = $("mm-error");
    errEl.textContent = "";
    try {
      const mtu = readMtu();
      const { total, parts } = overheadTotal();
      const ipHeader = $("mm-ipver").value === "6" ? 40 : 20;
      const tcpHeader = 20;

      $("mm-ov-total").textContent = tb.fmt(total) + " バイト" + (parts.length ? "（" + parts.join(" + ") + "）" : "（未選択）");

      const effMtu = mtu - total;
      if (effMtu <= 0) {
        throw new Error("選択したオーバーヘッド合計（" + tb.fmt(total) + "）がベースMTU（" + tb.fmt(mtu) + "）以上です。チェックを見直してください");
      }
      $("mm-eff-mtu").textContent = tb.fmt(effMtu) + " バイト";

      const mss = effMtu - ipHeader - tcpHeader;
      if (mss <= 0) {
        $("mm-mss").textContent = "計算不可（" + tb.fmt(mss) + "、IP/TCPヘッダ分がMTUに収まりません）";
        $("mm-clamp").textContent = "-";
        return;
      }
      $("mm-mss").textContent = tb.fmt(mss) + " バイト";
      $("mm-clamp").textContent = tb.fmt(mss) + "（ip tcp adjust-mss " + mss + " / iptables --set-mss " + mss + " 相当）";
    } catch (e) {
      errEl.textContent = e.message;
      $("mm-ov-total").textContent = "0 バイト";
      $("mm-eff-mtu").textContent = "-";
      $("mm-mss").textContent = "-";
      $("mm-clamp").textContent = "-";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("mm-preset").addEventListener("change", () => {
      const v = $("mm-preset").value;
      if (v !== "") { $("mm-mtu").value = v; }
      run();
    });
    ["mm-mtu", "mm-ipver", "mm-ov-pppoe", "mm-ov-vlan", "mm-ov-gre", "mm-ov-vxlan", "mm-ov-wg", "mm-ov-esp", "mm-esp-mode"].forEach((id) => {
      const el = $(id);
      el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", run);
    });
    // 初期表示例: PPPoE + VLAN を有効にして実用的な数値を見せる
    $("mm-ov-pppoe").checked = true;
    $("mm-ov-vlan").checked = true;
    run();
  });
})();
