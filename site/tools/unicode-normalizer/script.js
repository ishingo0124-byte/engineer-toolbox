(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const FORMS = ["NFC", "NFD", "NFKC", "NFKD"];
  const DEFAULT_TEXT = "が\nガ\nか" + "゙" + "\nＡ１ｶﾞ①㈱\n👨‍👩‍👧‍👦";

  function codePointCount(s) { return s === "" ? 0 : Array.from(s).length; }
  function graphemeCount(s) {
    if ("Intl" in window && Intl.Segmenter) {
      const seg = new Intl.Segmenter("ja", { granularity: "grapheme" });
      let n = 0;
      for (const _ of seg.segment(s)) n++;
      return n;
    }
    return codePointCount(s);
  }
  function utf8Bytes(s) { return new TextEncoder().encode(s).length; }

  function run() {
    const raw = $("un-text").value;
    const err = $("un-error");
    err.textContent = "";
    let results;
    try {
      results = {};
      for (const f of FORMS) results[f] = raw.normalize(f);
    } catch (e) {
      err.textContent = "正規化に失敗しました: " + e.message;
      return;
    }
    const origCP = codePointCount(raw), origBytes = utf8Bytes(raw), origGr = graphemeCount(raw);
    let html = "<tr><th>形式</th><th>コードポイント数</th><th>UTF-8バイト数</th><th>見た目の文字数</th><th>元と同じか</th></tr>";
    html += "<tr><td>元のテキスト</td><td>" + tb.fmt(origCP) + "</td><td>" + tb.fmt(origBytes) + "</td><td>" + tb.fmt(origGr) + "</td><td>—</td></tr>";
    for (const f of FORMS) {
      const norm = results[f];
      const cp = codePointCount(norm), bytes = utf8Bytes(norm), gr = graphemeCount(norm);
      const changed = norm !== raw;
      html += "<tr><td>" + f + "</td><td>" + tb.fmt(cp) + "</td><td>" + tb.fmt(bytes) + "</td><td>" + tb.fmt(gr) + "</td><td>" + (changed ? "変化あり" : "変化なし") + "</td></tr>";
    }
    $("un-table").innerHTML = html;
    $("un-out-nfc").textContent = results.NFC;
    $("un-out-nfd").textContent = results.NFD;
    $("un-out-nfkc").textContent = results.NFKC;
    $("un-out-nfkd").textContent = results.NFKD;

    const macNote = $("un-mac-note");
    if (/[゙゚]/.test(raw)) {
      macNote.hidden = false;
      $("un-mac-fixed").textContent = results.NFC;
    } else {
      macNote.hidden = true;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!$("un-text").value) $("un-text").value = DEFAULT_TEXT;
    $("un-text").addEventListener("input", run);
    run();
  });
})();
