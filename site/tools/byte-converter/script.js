(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SCALE = 10n ** 18n;

  const UNITS = {
    B: { n: 1n, d: 1n },
    KB: { n: 1000n, d: 1n },
    MB: { n: 1000000n, d: 1n },
    GB: { n: 1000000000n, d: 1n },
    TB: { n: 1000000000000n, d: 1n },
    KiB: { n: 1024n, d: 1n },
    MiB: { n: 1024n ** 2n, d: 1n },
    GiB: { n: 1024n ** 3n, d: 1n },
    TiB: { n: 1024n ** 4n, d: 1n },
    bit: { n: 1n, d: 8n },
  };

  function parseDecimalToScaled(raw) {
    let s = (("tb" in window && tb.z2h) ? tb.z2h(raw) : raw).trim();
    if (s === "") return null;
    let neg = false;
    if (s[0] === "+" || s[0] === "-") { neg = s[0] === "-"; s = s.slice(1); }
    if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") return null;
    let [intPart, fracPart] = s.split(".");
    intPart = intPart === "" ? "0" : intPart;
    fracPart = ((fracPart || "") + "000000000000000000").slice(0, 18);
    let scaled = BigInt(intPart) * SCALE + BigInt(fracPart);
    if (neg) scaled = -scaled;
    return scaled;
  }

  function toBytesScaled(valueScaled, unit) {
    const u = UNITS[unit];
    return (valueScaled * u.n) / u.d;
  }

  function fromBytesScaled(bytesScaled, unit) {
    const u = UNITS[unit];
    return (bytesScaled * u.d) / u.n;
  }

  function formatScaled(scaled) {
    let neg = scaled < 0n;
    if (neg) scaled = -scaled;
    const intPart = scaled / SCALE;
    const frac = scaled % SCALE;
    let fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
    const intStr = intPart.toLocaleString("ja-JP");
    return (neg ? "-" : "") + intStr + (fracStr ? "." + fracStr : "");
  }

  function run() {
    const errEl = $("bc-error");
    errEl.textContent = "";
    const raw = $("bc-value").value;
    const unit = $("bc-unit").value;
    const scaledInput = parseDecimalToScaled(raw);
    const ids = ["bc-out-b", "bc-out-bit", "bc-kb", "bc-mb", "bc-gb", "bc-tb", "bc-kib", "bc-mib", "bc-gib", "bc-tib"];
    if (scaledInput === null) {
      if (raw.trim() !== "") errEl.textContent = "数値を入力してください（例: 1.5、1024）";
      ids.forEach((id) => { $(id).textContent = "-"; });
      return;
    }
    const bytesScaled = toBytesScaled(scaledInput, unit);
    $("bc-out-b").textContent = formatScaled(bytesScaled) + " B";
    $("bc-out-bit").textContent = formatScaled(fromBytesScaled(bytesScaled, "bit")) + " bit";
    $("bc-kb").textContent = formatScaled(fromBytesScaled(bytesScaled, "KB")) + " KB";
    $("bc-mb").textContent = formatScaled(fromBytesScaled(bytesScaled, "MB")) + " MB";
    $("bc-gb").textContent = formatScaled(fromBytesScaled(bytesScaled, "GB")) + " GB";
    $("bc-tb").textContent = formatScaled(fromBytesScaled(bytesScaled, "TB")) + " TB";
    $("bc-kib").textContent = formatScaled(fromBytesScaled(bytesScaled, "KiB")) + " KiB";
    $("bc-mib").textContent = formatScaled(fromBytesScaled(bytesScaled, "MiB")) + " MiB";
    $("bc-gib").textContent = formatScaled(fromBytesScaled(bytesScaled, "GiB")) + " GiB";
    $("bc-tib").textContent = formatScaled(fromBytesScaled(bytesScaled, "TiB")) + " TiB";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("bc-value").addEventListener("input", run);
    $("bc-unit").addEventListener("input", run);
    $("bc-unit").addEventListener("change", run);
    run();
  });
})();
