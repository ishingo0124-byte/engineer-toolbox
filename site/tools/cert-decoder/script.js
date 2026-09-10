(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const JST_OFFSET_MS = 9 * 3600 * 1000;

  /* =====================================================================
   * 汎用ユーティリティ
   * =================================================================== */
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtJST(ms) {
    const d = new Date(ms + JST_OFFSET_MS);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " +
      pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " JST";
  }
  function fmtUTC(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " +
      pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " UTC";
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/\n/g, "&#10;"); }

  /* =====================================================================
   * DER/ASN.1 の最小限のパーサ（自作。外部ライブラリは使用しない）
   * BER/DERの一般的なTLV（Tag-Length-Value）構造を読み取る。
   * 不定長形式（length未確定）はDERでは使用されないため非対応。
   * =================================================================== */
  function readTLV(bytes, pos) {
    if (pos >= bytes.length) throw new Error("DERデータが途中で終わっています");
    const first = bytes[pos];
    const tagClass = first & 0xc0; // 0x00 universal / 0x80 context-specific 等
    const constructed = (first & 0x20) !== 0;
    let tagNumber = first & 0x1f;
    let p = pos + 1;
    if (tagNumber === 0x1f) {
      tagNumber = 0;
      let b;
      do {
        if (p >= bytes.length) throw new Error("DERのタグが不正です");
        b = bytes[p++];
        tagNumber = (tagNumber << 7) | (b & 0x7f);
      } while (b & 0x80);
    }
    if (p >= bytes.length) throw new Error("DERの長さフィールドがありません");
    let lenByte = bytes[p++];
    let length;
    if (lenByte & 0x80) {
      const n = lenByte & 0x7f;
      if (n === 0) throw new Error("不定長形式のDERはサポートしていません");
      if (n > 4) throw new Error("DERの長さが長すぎます");
      length = 0;
      for (let i = 0; i < n; i++) { length = length * 256 + bytes[p++]; }
    } else {
      length = lenByte;
    }
    const contentStart = p;
    const contentEnd = contentStart + length;
    if (contentEnd > bytes.length) throw new Error("DERの長さがデータ範囲を超えています（証明書が壊れているか途中で切れています）");
    return { tagClass, constructed, tagNumber, contentStart, contentEnd, end: contentEnd };
  }
  function readAll(bytes, start, end) {
    const items = []; let p = start;
    while (p < end) { const t = readTLV(bytes, p); items.push(t); p = t.end; }
    return items;
  }
  function decodeOID(bytes) {
    if (bytes.length === 0) return "";
    const first = bytes[0];
    const x = first < 40 ? 0 : (first < 80 ? 1 : 2);
    const y = first - x * 40;
    const arcs = [x, y];
    let val = 0;
    for (let i = 1; i < bytes.length; i++) {
      val = val * 128 + (bytes[i] & 0x7f);
      if (!(bytes[i] & 0x80)) { arcs.push(val); val = 0; }
    }
    return arcs.join(".");
  }
  function bytesToHex(bytes, sep) { return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(sep || ""); }
  function bytesToInt(bytes) { let n = 0; for (const b of bytes) n = n * 256 + b; return n; }
  function bitLengthOfByte(b) { let n = 0; while (b) { n++; b >>= 1; } return n || 1; }

  /* =====================================================================
   * OID名前解決テーブル（RFC 5280 / RFC 3279 / RFC 5480 / RFC 8410 準拠の主要なもの）
   * =================================================================== */
  const DN_OID = {
    "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST", "2.5.4.9": "STREET",
    "2.5.4.10": "O", "2.5.4.11": "OU", "2.5.4.5": "serialNumber", "2.5.4.4": "SN", "2.5.4.12": "title",
    "0.9.2342.19200300.100.1.25": "DC", "1.2.840.113549.1.9.1": "emailAddress"
  };
  const SIG_ALG_OID = {
    "1.2.840.113549.1.1.4": "md5WithRSAEncryption（非推奨・危険なアルゴリズム）",
    "1.2.840.113549.1.1.5": "sha1WithRSAEncryption（非推奨）",
    "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
    "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
    "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
    "1.2.840.113549.1.1.10": "RSASSA-PSS",
    "1.2.840.10045.4.1": "ecdsa-with-SHA1（非推奨）",
    "1.2.840.10045.4.3.1": "ecdsa-with-SHA224",
    "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
    "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
    "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
    "1.3.101.112": "Ed25519",
    "1.3.101.113": "Ed448"
  };
  const PUBKEY_ALG_OID = { "1.2.840.113549.1.1.1": "RSA", "1.2.840.10045.2.1": "EC", "1.3.101.112": "Ed25519", "1.3.101.113": "Ed448" };
  const CURVE_OID = {
    "1.2.840.10045.3.1.7": "P-256（prime256v1 / secp256r1）",
    "1.3.132.0.34": "P-384（secp384r1）",
    "1.3.132.0.35": "P-521（secp521r1）",
    "1.3.132.0.10": "secp256k1"
  };
  const EKU_OID = {
    "1.3.6.1.5.5.7.3.1": "serverAuth（TLSサーバー認証）",
    "1.3.6.1.5.5.7.3.2": "clientAuth（TLSクライアント認証）",
    "1.3.6.1.5.5.7.3.3": "codeSigning（コード署名）",
    "1.3.6.1.5.5.7.3.4": "emailProtection（S/MIME）",
    "1.3.6.1.5.5.7.3.8": "timeStamping（タイムスタンプ）",
    "1.3.6.1.5.5.7.3.9": "OCSPSigning"
  };

  /* =====================================================================
   * Name（Subject/Issuer）・Validity・SubjectPublicKeyInfo・Extensions の解析
   * =================================================================== */
  function decodeString(bytes, tlv) {
    const content = bytes.slice(tlv.contentStart, tlv.contentEnd);
    if (tlv.tagNumber === 12) { // UTF8String
      try { return new TextDecoder("utf-8", { fatal: false }).decode(content); } catch (e) { /* fallthrough */ }
    }
    if (tlv.tagNumber === 30) { // BMPString (UTF-16BE)
      let s = ""; for (let i = 0; i + 1 < content.length; i += 2) s += String.fromCharCode((content[i] << 8) | content[i + 1]);
      return s;
    }
    // PrintableString(19) / IA5String(22) / T61String(20) 等はASCII相当として扱う
    return Array.from(content).map((b) => String.fromCharCode(b)).join("");
  }
  function parseName(bytes, tlv) {
    const rdns = readAll(bytes, tlv.contentStart, tlv.contentEnd); // SET OF ...
    const attrs = [];
    for (const rdn of rdns) {
      const avaList = readAll(bytes, rdn.contentStart, rdn.contentEnd); // SEQUENCE OF AttributeTypeAndValue
      for (const ava of avaList) {
        const parts = readAll(bytes, ava.contentStart, ava.contentEnd);
        if (parts.length < 2) continue;
        const oid = decodeOID(bytes.slice(parts[0].contentStart, parts[0].contentEnd));
        const value = decodeString(bytes, parts[1]);
        attrs.push({ oid, name: DN_OID[oid] || oid, value });
      }
    }
    return attrs;
  }
  function formatName(attrs) {
    if (attrs.length === 0) return "(空)";
    return attrs.map((a) => a.name + "=" + a.value).join(", ");
  }
  function parseTimeTLV(bytes, tlv) {
    const s = Array.from(bytes.slice(tlv.contentStart, tlv.contentEnd)).map((b) => String.fromCharCode(b)).join("");
    if (tlv.tagNumber === 23) { // UTCTime
      const m = s.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/);
      if (!m) throw new Error("日時（UTCTime）の形式が不正です: " + s);
      const yy = +m[1];
      // RFC 5280 4.1.2.5.1: YY>=50 は 19YY、YY<50 は 20YY と解釈する
      const year = yy >= 50 ? 1900 + yy : 2000 + yy;
      return Date.UTC(year, +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    } else if (tlv.tagNumber === 24) { // GeneralizedTime
      const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.\d+)?Z$/);
      if (!m) throw new Error("日時（GeneralizedTime）の形式が不正です: " + s);
      return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    }
    throw new Error("未対応の日時形式です（UTCTime/GeneralizedTime以外）");
  }
  function parseSPKI(bytes, tlv) {
    const items = readAll(bytes, tlv.contentStart, tlv.contentEnd);
    if (items.length < 2) throw new Error("公開鍵情報（SubjectPublicKeyInfo）の構造が不正です");
    const algSeq = items[0], pubKeyBS = items[1];
    const algItems = readAll(bytes, algSeq.contentStart, algSeq.contentEnd);
    const algOid = decodeOID(bytes.slice(algItems[0].contentStart, algItems[0].contentEnd));
    const pubKeyContent = bytes.slice(pubKeyBS.contentStart, pubKeyBS.contentEnd);
    const keyData = pubKeyContent.slice(1); // 先頭1バイトはBIT STRINGの未使用ビット数
    const result = { algOid, algName: PUBKEY_ALG_OID[algOid] || algOid };
    if (algOid === "1.2.840.113549.1.1.1") { // RSA: RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER }
      const rsaRoot = readTLV(keyData, 0);
      const rsaItems = readAll(keyData, rsaRoot.contentStart, rsaRoot.contentEnd);
      let modBytes = keyData.slice(rsaItems[0].contentStart, rsaItems[0].contentEnd);
      let i = 0; while (i < modBytes.length - 1 && modBytes[i] === 0) i++; // 符号ビット用の先頭0x00を除去
      modBytes = modBytes.slice(i);
      result.keySize = (modBytes.length - 1) * 8 + bitLengthOfByte(modBytes[0]);
      result.detail = "RSA（" + result.keySize + " bit）";
    } else if (algOid === "1.2.840.10045.2.1") { // EC: parameters は namedCurve OID
      const curveOid = algItems.length > 1 ? decodeOID(bytes.slice(algItems[1].contentStart, algItems[1].contentEnd)) : "";
      const curveName = CURVE_OID[curveOid] || (curveOid || "不明な曲線");
      let bitLen = null;
      if (keyData[0] === 0x04) bitLen = ((keyData.length - 1) / 2) * 8; // 非圧縮点形式 04||X||Y
      result.curveOid = curveOid; result.curveName = curveName; result.keySize = bitLen;
      result.detail = "EC（" + curveName + (bitLen ? "、" + bitLen + " bit" : "") + "）";
    } else if (algOid === "1.3.101.112") {
      result.keySize = 256; result.detail = "Ed25519（256 bit）";
    } else if (algOid === "1.3.101.113") {
      result.keySize = 456; result.detail = "Ed448（456 bit）";
    } else {
      result.detail = result.algName + "（" + algOid + "）";
    }
    return result;
  }
  function parseExtensions(bytes, extTLV) {
    // extTLV は TBSCertificate 内の [3] EXPLICIT タグ。中身がExtensions本体のSEQUENCE。
    const inner = readTLV(bytes, extTLV.contentStart);
    const items = readAll(bytes, inner.contentStart, inner.contentEnd);
    const exts = [];
    for (const extSeq of items) {
      const parts = readAll(bytes, extSeq.contentStart, extSeq.contentEnd);
      let p = 0;
      if (parts.length === 0) continue;
      const oid = decodeOID(bytes.slice(parts[p].contentStart, parts[p].contentEnd)); p++;
      let critical = false;
      if (p < parts.length && parts[p].tagNumber === 1 && parts[p].tagClass === 0x00) {
        critical = bytes[parts[p].contentStart] !== 0; p++;
      }
      if (p >= parts.length) continue;
      const octTLV = parts[p];
      const valueBytes = bytes.slice(octTLV.contentStart, octTLV.contentEnd);
      exts.push({ oid, critical, valueBytes });
    }
    return exts;
  }
  function parseBasicConstraints(valueBytes) {
    const root = readTLV(valueBytes, 0);
    const items = readAll(valueBytes, root.contentStart, root.contentEnd);
    let isCA = false, pathLen = null;
    for (const it of items) {
      if (it.tagNumber === 1) isCA = valueBytes[it.contentStart] !== 0;
      else if (it.tagNumber === 2) pathLen = bytesToInt(valueBytes.slice(it.contentStart, it.contentEnd));
    }
    return { isCA, pathLen };
  }
  const KU_NAMES = [
    "digitalSignature（デジタル署名）", "nonRepudiation（否認防止）", "keyEncipherment（鍵の暗号化）",
    "dataEncipherment（データの暗号化）", "keyAgreement（鍵共有）", "keyCertSign（証明書への署名=CA用）",
    "cRLSign（CRLへの署名）", "encipherOnly（暗号化のみ）", "decipherOnly（復号のみ）"
  ];
  function parseKeyUsage(valueBytes) {
    const root = readTLV(valueBytes, 0);
    const bits = valueBytes.slice(root.contentStart + 1, root.contentEnd);
    const out = [];
    for (let n = 0; n < 9; n++) {
      const byteIdx = Math.floor(n / 8); if (byteIdx >= bits.length) continue;
      const bit = 7 - (n % 8);
      if ((bits[byteIdx] >> bit) & 1) out.push(KU_NAMES[n]);
    }
    return out;
  }
  function parseExtKeyUsage(valueBytes) {
    const root = readTLV(valueBytes, 0);
    const items = readAll(valueBytes, root.contentStart, root.contentEnd);
    return items.map((it) => {
      const oid = decodeOID(valueBytes.slice(it.contentStart, it.contentEnd));
      return EKU_OID[oid] || oid;
    });
  }
  function compressIPv6(groups) {
    // groups: 16進文字列8個。最長の連続0を::に圧縮する（RFC 5952の推奨形式）
    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i] === "0") {
        if (curStart === -1) curStart = i;
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else { curStart = -1; curLen = 0; }
    }
    if (bestLen < 2) return groups.join(":");
    const head = groups.slice(0, bestStart).join(":");
    const tail = groups.slice(bestStart + bestLen).join(":");
    return head + "::" + tail;
  }
  function parseSAN(valueBytes) {
    const root = readTLV(valueBytes, 0);
    const items = readAll(valueBytes, root.contentStart, root.contentEnd);
    const out = [];
    for (const it of items) {
      const content = valueBytes.slice(it.contentStart, it.contentEnd);
      if (it.tagClass !== 0x80) continue; // GeneralNameはcontext-specificタグのみ対象
      if (it.tagNumber === 2) out.push({ type: "DNS", value: Array.from(content).map((b) => String.fromCharCode(b)).join("") });
      else if (it.tagNumber === 1) out.push({ type: "email", value: Array.from(content).map((b) => String.fromCharCode(b)).join("") });
      else if (it.tagNumber === 6) out.push({ type: "URI", value: Array.from(content).map((b) => String.fromCharCode(b)).join("") });
      else if (it.tagNumber === 7) {
        if (content.length === 4) out.push({ type: "IP", value: Array.from(content).join(".") });
        else if (content.length === 16) {
          const groups = []; for (let i = 0; i < 16; i += 2) groups.push(((content[i] << 8) | content[i + 1]).toString(16));
          out.push({ type: "IP", value: compressIPv6(groups) });
        } else out.push({ type: "IP", value: bytesToHex(content) });
      } else out.push({ type: "その他(タグ" + it.tagNumber + ")", value: bytesToHex(content) });
    }
    return out;
  }

  /* =====================================================================
   * 証明書全体（Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }）の解析
   * =================================================================== */
  function parseCertificate(derBytes) {
    const root = readTLV(derBytes, 0);
    if (root.tagClass !== 0x00 || !root.constructed || root.tagNumber !== 16) {
      throw new Error("先頭がSEQUENCEではありません（X.509証明書のDER構造として不正です）");
    }
    const top = readAll(derBytes, root.contentStart, root.contentEnd);
    if (top.length < 3) throw new Error("証明書の要素数が不足しています（tbsCertificate/signatureAlgorithm/signatureValueが揃っていません）");
    const tbs = top[0], sigAlgTLV = top[1];

    const tbsItems = readAll(derBytes, tbs.contentStart, tbs.contentEnd);
    let idx = 0, version = 1;
    if (tbsItems.length === 0) throw new Error("tbsCertificateが空です");
    if (tbsItems[idx].tagClass === 0x80 && tbsItems[idx].tagNumber === 0) {
      const inner = readTLV(derBytes, tbsItems[idx].contentStart);
      version = bytesToInt(derBytes.slice(inner.contentStart, inner.contentEnd)) + 1; // 0=v1,1=v2,2=v3
      idx++;
    }
    const serialTLV = tbsItems[idx++];
    const serialHex = bytesToHex(derBytes.slice(serialTLV.contentStart, serialTLV.contentEnd), ":");
    idx++; // tbs内のsignature（AlgorithmIdentifier）はouterのsignatureAlgorithmと同じ値のため読み飛ばす
    const issuerTLV = tbsItems[idx++];
    const validityTLV = tbsItems[idx++];
    const subjectTLV = tbsItems[idx++];
    const spkiTLV = tbsItems[idx++];
    let extensionsTLV = null;
    while (idx < tbsItems.length) {
      const t = tbsItems[idx];
      if (t.tagClass === 0x80 && t.tagNumber === 3) extensionsTLV = t;
      idx++;
    }

    const issuer = parseName(derBytes, issuerTLV);
    const subject = parseName(derBytes, subjectTLV);
    const validityItems = readAll(derBytes, validityTLV.contentStart, validityTLV.contentEnd);
    if (validityItems.length < 2) throw new Error("有効期間（Validity）の構造が不正です");
    const notBefore = parseTimeTLV(derBytes, validityItems[0]);
    const notAfter = parseTimeTLV(derBytes, validityItems[1]);
    const spki = parseSPKI(derBytes, spkiTLV);
    const sigAlgItems = readAll(derBytes, sigAlgTLV.contentStart, sigAlgTLV.contentEnd);
    const sigAlgOid = decodeOID(derBytes.slice(sigAlgItems[0].contentStart, sigAlgItems[0].contentEnd));

    let basicConstraints = null, keyUsage = null, extKeyUsage = null, san = null;
    if (extensionsTLV) {
      const exts = parseExtensions(derBytes, extensionsTLV);
      for (const e of exts) {
        try {
          if (e.oid === "2.5.29.19") basicConstraints = parseBasicConstraints(e.valueBytes);
          else if (e.oid === "2.5.29.15") keyUsage = parseKeyUsage(e.valueBytes);
          else if (e.oid === "2.5.29.37") extKeyUsage = parseExtKeyUsage(e.valueBytes);
          else if (e.oid === "2.5.29.17") san = parseSAN(e.valueBytes);
        } catch (err) { /* 個別拡張の解析失敗は無視して他の項目を優先表示 */ }
      }
    }
    return {
      version, serialHex, issuer, subject, notBefore, notAfter, spki,
      sigAlgOid, sigAlgName: SIG_ALG_OID[sigAlgOid] || (sigAlgOid + "（未知のアルゴリズム）"),
      basicConstraints, keyUsage, extKeyUsage, san
    };
  }

  /* =====================================================================
   * PEM抽出・秘密鍵/CSR検出
   * =================================================================== */
  function base64ToBytes(b64) {
    const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
    let bin;
    try { bin = atob(clean); } catch (e) { throw new Error("Base64のデコードに失敗しました"); }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function extractCertBlocks(raw) {
    const re = /-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----/g;
    const blocks = []; let m;
    while ((m = re.exec(raw))) blocks.push(m[1]);
    return blocks;
  }

  function formatDuration(days) {
    const abs = Math.abs(days);
    if (abs < 1) return "1日未満";
    return abs + "日";
  }

  function daysBetween(fromMs, toMs) { return Math.floor((toMs - fromMs) / 86400000); }

  function fingerprintRow(label, hex) {
    return '<dt>' + label + '</dt><dd><span class="mono">' + hex + '</span>' +
      '<button type="button" class="copy-btn" data-copy-text="' + escapeAttr(hex) + '">コピー</button></dd>';
  }

  function renderCert(cert, index, nowMs) {
    const title = "証明書 #" + index;
    const sub = escapeHtml(formatName(cert.subject));
    const iss = escapeHtml(formatName(cert.issuer));
    const isSelfSigned = formatName(cert.subject) === formatName(cert.issuer);

    let statusHtml;
    if (nowMs < cert.notBefore) {
      statusHtml = '<span style="color:var(--err)">有効期間前（' + fmtJST(cert.notBefore) + ' から有効）</span>';
    } else if (nowMs > cert.notAfter) {
      const d = daysBetween(cert.notAfter, nowMs);
      statusHtml = '<span style="color:var(--err)">期限切れ（' + formatDuration(d) + '前に失効）</span>';
    } else {
      const d = daysBetween(nowMs, cert.notAfter);
      if (d <= 14) statusHtml = '<span style="color:var(--err)">まもなく期限切れ（残り' + formatDuration(d) + '）</span>';
      else if (d <= 30) statusHtml = '<span style="color:var(--muted)">期限間近（残り' + formatDuration(d) + '）</span>';
      else statusHtml = '<span style="color:var(--ok)">有効（残り' + formatDuration(d) + '）</span>';
    }

    let bcHtml = "(拡張なし＝CAではないものと解釈)";
    if (cert.basicConstraints) {
      bcHtml = (cert.basicConstraints.isCA ? "CA:TRUE（認証局として使用可能）" : "CA:FALSE（サーバー等のエンドエンティティ用）") +
        (cert.basicConstraints.pathLen !== null ? "、pathLenConstraint:" + cert.basicConstraints.pathLen : "");
    }
    const kuHtml = cert.keyUsage ? escapeHtml(cert.keyUsage.join(" / ")) : "(拡張なし)";
    const ekuHtml = cert.extKeyUsage ? escapeHtml(cert.extKeyUsage.join(" / ")) : "(拡張なし)";
    const sanHtml = cert.san && cert.san.length
      ? cert.san.map((s) => escapeHtml(s.type + ":" + s.value)).join(", ")
      : "(SAN拡張なし)";

    let html = '<div class="result">';
    html += '<p style="font-weight:700;margin:0 0 8px">' + title + (isSelfSigned ? '（自己署名）' : '') + '</p>';
    html += '<dl class="result-grid">';
    html += '<dt>ステータス</dt><dd>' + statusHtml + '</dd>';
    html += '<dt>Subject</dt><dd class="mono" style="word-break:break-all">' + sub + '</dd>';
    html += '<dt>Issuer</dt><dd class="mono" style="word-break:break-all">' + iss + '</dd>';
    html += '<dt>シリアル番号</dt><dd class="mono" style="word-break:break-all">' + cert.serialHex + '</dd>';
    html += '<dt>バージョン</dt><dd>v' + cert.version + '</dd>';
    html += '<dt>有効期間（NotBefore）</dt><dd>' + fmtJST(cert.notBefore) + ' / ' + fmtUTC(cert.notBefore) + '</dd>';
    html += '<dt>有効期間（NotAfter）</dt><dd>' + fmtJST(cert.notAfter) + ' / ' + fmtUTC(cert.notAfter) + '</dd>';
    html += '<dt>署名アルゴリズム</dt><dd>' + escapeHtml(cert.sigAlgName) + '</dd>';
    html += '<dt>公開鍵</dt><dd>' + escapeHtml(cert.spki.detail) + '</dd>';
    html += '<dt>SAN（Subject Alternative Name）</dt><dd style="word-break:break-all">' + sanHtml + '</dd>';
    html += '<dt>Basic Constraints</dt><dd>' + bcHtml + '</dd>';
    html += '<dt>Key Usage</dt><dd>' + kuHtml + '</dd>';
    html += '<dt>Extended Key Usage</dt><dd>' + ekuHtml + '</dd>';
    html += '<dt>SHA-256フィンガープリント</dt><dd id="cd-fp256-' + index + '">計算中…</dd>';
    html += '<dt>SHA-1フィンガープリント</dt><dd id="cd-fp1-' + index + '">計算中…</dd>';
    html += '</dl></div>';
    return html;
  }

  async function run() {
    const errEl = $("cd-error");
    const resultEl = $("cd-result");
    errEl.textContent = "";
    resultEl.innerHTML = "";

    const raw = $("cd-pem").value;
    if (raw.trim() === "") return;

    if (/-----BEGIN (?:ENCRYPTED )?PRIVATE KEY-----|-----BEGIN RSA PRIVATE KEY-----|-----BEGIN EC PRIVATE KEY-----|-----BEGIN DSA PRIVATE KEY-----/.test(raw)) {
      errEl.textContent = "秘密鍵は貼らないでください。このツールは証明書（公開情報）のみを解析します。秘密鍵をブラウザやチャット等の外部に貼り付けると漏えいのリスクがあるため、処理を行いません。";
      return;
    }
    if (/-----BEGIN (?:NEW )?CERTIFICATE REQUEST-----/.test(raw)) {
      errEl.textContent = "CSR（証明書署名要求）が検出されました。このツールはCSRには対応していません。CA（認証局）が発行した証明書（-----BEGIN CERTIFICATE-----）を貼り付けてください。";
      return;
    }

    const blocks = extractCertBlocks(raw);
    if (blocks.length === 0) {
      errEl.textContent = "PEM形式の証明書が見つかりませんでした（-----BEGIN CERTIFICATE----- と -----END CERTIFICATE----- で囲まれた形式が必要です）";
      return;
    }

    const nowMs = Date.now();
    let html = "";
    const parsed = [];
    blocks.forEach((b64, i) => {
      try {
        const der = base64ToBytes(b64);
        const cert = parseCertificate(der);
        parsed.push({ der, cert, index: i + 1 });
        html += renderCert(cert, i + 1, nowMs);
      } catch (e) {
        html += '<div class="result"><p style="font-weight:700;margin:0 0 6px">証明書 #' + (i + 1) + '</p>' +
          '<p class="error" style="margin:0">解析エラー: ' + escapeHtml(e.message) + '</p></div>';
      }
    });
    resultEl.innerHTML = html;

    // フィンガープリントはWebCrypto（非同期）のため後から差し込む
    for (const p of parsed) {
      try {
        const [d256, d1] = await Promise.all([
          crypto.subtle.digest("SHA-256", p.der.buffer.slice(p.der.byteOffset, p.der.byteOffset + p.der.byteLength)),
          crypto.subtle.digest("SHA-1", p.der.buffer.slice(p.der.byteOffset, p.der.byteOffset + p.der.byteLength))
        ]);
        const hex256 = bytesToHex(new Uint8Array(d256), ":");
        const hex1 = bytesToHex(new Uint8Array(d1), ":");
        const el256 = $("cd-fp256-" + p.index), el1 = $("cd-fp1-" + p.index);
        if (el256) el256.innerHTML = '<span class="mono">' + hex256 + '</span><button type="button" class="copy-btn" data-copy-text="' + escapeAttr(hex256) + '">コピー</button>';
        if (el1) el1.innerHTML = '<span class="mono">' + hex1 + '</span><button type="button" class="copy-btn" data-copy-text="' + escapeAttr(hex1) + '">コピー</button>';
      } catch (e) {
        const el256 = $("cd-fp256-" + p.index), el1 = $("cd-fp1-" + p.index);
        if (el256) el256.textContent = "計算失敗（crypto.subtleにはhttpsまたはlocalhostが必要です）";
        if (el1) el1.textContent = "計算失敗";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("cd-pem").addEventListener("input", tb.debounce(() => { run().catch((e) => { $("cd-error").textContent = "予期しないエラー: " + e.message; }); }, 150));
    run().catch((e) => { $("cd-error").textContent = "予期しないエラー: " + e.message; });
  });
})();
