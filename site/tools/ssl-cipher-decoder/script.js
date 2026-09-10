(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // 主要な暗号スイートの IANA名 <-> OpenSSL名 対応表（主要 40 件程度）。
  // 出典: IANA TLS Cipher Suites レジストリ / RFC 8446 Appendix B.4 / RFC 5289 / RFC 7905 / OpenSSL ciphers(1)
  const TABLE = [
    // --- TLS 1.3（RFC 8446 B.4。OpenSSL 1.1.1+ もIANA名をそのまま使用） ---
    { iana: "TLS_AES_128_GCM_SHA256", openssl: "TLS_AES_128_GCM_SHA256", tls13: true },
    { iana: "TLS_AES_256_GCM_SHA384", openssl: "TLS_AES_256_GCM_SHA384", tls13: true },
    { iana: "TLS_CHACHA20_POLY1305_SHA256", openssl: "TLS_CHACHA20_POLY1305_SHA256", tls13: true },
    { iana: "TLS_AES_128_CCM_SHA256", openssl: "TLS_AES_128_CCM_SHA256", tls13: true },
    { iana: "TLS_AES_128_CCM_8_SHA256", openssl: "TLS_AES_128_CCM_8_SHA256", tls13: true },
    // --- TLS 1.2 ECDHE + AEAD（RFC 5289） ---
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256", openssl: "ECDHE-ECDSA-AES128-GCM-SHA256" },
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", openssl: "ECDHE-ECDSA-AES256-GCM-SHA384" },
    { iana: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", openssl: "ECDHE-RSA-AES128-GCM-SHA256" },
    { iana: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", openssl: "ECDHE-RSA-AES256-GCM-SHA384" },
    // --- TLS 1.2 ECDHE + CBC（RFC 5289 / RFC 4492） ---
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256", openssl: "ECDHE-ECDSA-AES128-SHA256" },
    { iana: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256", openssl: "ECDHE-RSA-AES128-SHA256" },
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384", openssl: "ECDHE-ECDSA-AES256-SHA384" },
    { iana: "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384", openssl: "ECDHE-RSA-AES256-SHA384" },
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA", openssl: "ECDHE-ECDSA-AES128-SHA" },
    { iana: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA", openssl: "ECDHE-RSA-AES128-SHA" },
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA", openssl: "ECDHE-ECDSA-AES256-SHA" },
    { iana: "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA", openssl: "ECDHE-RSA-AES256-SHA" },
    // --- ChaCha20-Poly1305（RFC 7905） ---
    { iana: "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256", openssl: "ECDHE-RSA-CHACHA20-POLY1305" },
    { iana: "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256", openssl: "ECDHE-ECDSA-CHACHA20-POLY1305" },
    { iana: "TLS_DHE_RSA_WITH_CHACHA20_POLY1305_SHA256", openssl: "DHE-RSA-CHACHA20-POLY1305" },
    // --- DHE（RFC 5288 / RFC 5246） ---
    { iana: "TLS_DHE_RSA_WITH_AES_128_GCM_SHA256", openssl: "DHE-RSA-AES128-GCM-SHA256" },
    { iana: "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", openssl: "DHE-RSA-AES256-GCM-SHA384" },
    { iana: "TLS_DHE_RSA_WITH_AES_128_CBC_SHA", openssl: "DHE-RSA-AES128-SHA" },
    { iana: "TLS_DHE_RSA_WITH_AES_256_CBC_SHA", openssl: "DHE-RSA-AES256-SHA" },
    { iana: "TLS_DHE_RSA_WITH_AES_128_CBC_SHA256", openssl: "DHE-RSA-AES128-SHA256" },
    { iana: "TLS_DHE_RSA_WITH_AES_256_CBC_SHA256", openssl: "DHE-RSA-AES256-SHA256" },
    { iana: "TLS_DHE_DSS_WITH_AES_128_CBC_SHA", openssl: "DHE-DSS-AES128-SHA" },
    // --- 静的 RSA 鍵交換（RFC 5246 / RFC 3268。前方秘匿性なし） ---
    { iana: "TLS_RSA_WITH_AES_128_GCM_SHA256", openssl: "AES128-GCM-SHA256" },
    { iana: "TLS_RSA_WITH_AES_256_GCM_SHA384", openssl: "AES256-GCM-SHA384" },
    { iana: "TLS_RSA_WITH_AES_128_CBC_SHA", openssl: "AES128-SHA" },
    { iana: "TLS_RSA_WITH_AES_256_CBC_SHA", openssl: "AES256-SHA" },
    { iana: "TLS_RSA_WITH_AES_128_CBC_SHA256", openssl: "AES128-SHA256" },
    { iana: "TLS_RSA_WITH_AES_256_CBC_SHA256", openssl: "AES256-SHA256" },
    // --- 既知の弱点を持つレガシー暗号スイート ---
    { iana: "TLS_RSA_WITH_3DES_EDE_CBC_SHA", openssl: "DES-CBC3-SHA" },
    { iana: "TLS_RSA_WITH_RC4_128_SHA", openssl: "RC4-SHA" },
    { iana: "TLS_RSA_WITH_RC4_128_MD5", openssl: "RC4-MD5" },
    { iana: "TLS_RSA_WITH_DES_CBC_SHA", openssl: "DES-CBC-SHA" },
    { iana: "TLS_RSA_EXPORT_WITH_RC4_40_MD5", openssl: "EXP-RC4-MD5" },
    { iana: "TLS_RSA_EXPORT_WITH_DES40_CBC_SHA", openssl: "EXP-DES-CBC-SHA" },
    { iana: "TLS_RSA_WITH_NULL_SHA", openssl: "NULL-SHA" },
    { iana: "TLS_RSA_WITH_NULL_MD5", openssl: "NULL-MD5" },
    { iana: "TLS_DH_anon_WITH_AES_128_CBC_SHA", openssl: "ADH-AES128-SHA" },
    { iana: "TLS_DH_anon_WITH_AES_256_GCM_SHA384", openssl: "ADH-AES256-GCM-SHA384" },
    { iana: "TLS_ECDH_anon_WITH_AES_128_CBC_SHA", openssl: "AECDH-AES128-SHA" },
    // --- 静的 ECDH（証明書に鍵が固定。RFC 4492） ---
    { iana: "TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256", openssl: "ECDH-RSA-AES128-GCM-SHA256" },
    { iana: "TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256", openssl: "ECDH-ECDSA-AES128-GCM-SHA256" },
    // --- PSK（RFC 4279 / RFC 5487 / RFC 5489） ---
    { iana: "TLS_PSK_WITH_AES_128_CBC_SHA", openssl: "PSK-AES128-CBC-SHA" },
    { iana: "TLS_DHE_PSK_WITH_AES_128_GCM_SHA256", openssl: "DHE-PSK-AES128-GCM-SHA256" },
    { iana: "TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA", openssl: "ECDHE-PSK-AES128-CBC-SHA" },
    // --- CCM（RFC 6655 / RFC 7251） ---
    { iana: "TLS_RSA_WITH_AES_128_CCM", openssl: "AES128-CCM" },
    { iana: "TLS_RSA_WITH_AES_128_CCM_8", openssl: "AES128-CCM8" },
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_CCM", openssl: "ECDHE-ECDSA-AES128-CCM" },
    { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_CCM_8", openssl: "ECDHE-ECDSA-AES128-CCM8" }
  ];
  const TABLE_BY_IANA = new Map(TABLE.map((r) => [r.iana.toUpperCase(), r]));
  const TABLE_BY_OSSL = new Map(TABLE.map((r) => [r.openssl.toUpperCase(), r]));

  // --- IANA形式（アンダースコア区切り）の鍵交換+認証トークン ---
  const KEX_AUTH_IANA = {
    "ECDHE_ECDSA": { kex: "ECDHE（楕円曲線一時鍵）", auth: "ECDSA証明書", pfs: true },
    "ECDHE_RSA": { kex: "ECDHE（楕円曲線一時鍵）", auth: "RSA証明書", pfs: true },
    "DHE_RSA": { kex: "DHE（Diffie-Hellman一時鍵）", auth: "RSA証明書", pfs: true },
    "DHE_DSS": { kex: "DHE（Diffie-Hellman一時鍵）", auth: "DSS証明書", pfs: true },
    "DHE_PSK": { kex: "DHE-PSK", auth: "事前共有鍵(PSK)", pfs: true },
    "ECDHE_PSK": { kex: "ECDHE-PSK", auth: "事前共有鍵(PSK)", pfs: true },
    "RSA_PSK": { kex: "RSA-PSK", auth: "事前共有鍵(PSK)+RSA", pfs: false },
    "PSK": { kex: "PSK（事前共有鍵のみ）", auth: "事前共有鍵(PSK)", pfs: false },
    "RSA": { kex: "RSA（静的、鍵転送）", auth: "RSA証明書", pfs: false },
    "ECDH_RSA": { kex: "ECDH（静的、証明書に固定）", auth: "RSA証明書", pfs: false },
    "ECDH_ECDSA": { kex: "ECDH（静的、証明書に固定）", auth: "ECDSA証明書", pfs: false },
    "DH_RSA": { kex: "DH（静的、証明書に固定）", auth: "RSA証明書", pfs: false },
    "DH_DSS": { kex: "DH（静的、証明書に固定）", auth: "DSS証明書", pfs: false },
    "DH_ANON": { kex: "DH（静的）", auth: "なし（匿名）", pfs: false, anon: true },
    "ECDH_ANON": { kex: "ECDH（静的）", auth: "なし（匿名）", pfs: false, anon: true },
    "SRP_SHA": { kex: "SRP", auth: "なし（SRPのみ）", pfs: false },
    "SRP_SHA_RSA": { kex: "SRP", auth: "RSA証明書", pfs: false },
    "SRP_SHA_DSS": { kex: "SRP", auth: "DSS証明書", pfs: false },
    "KRB5": { kex: "Kerberos", auth: "Kerberos", pfs: false }
  };

  // --- IANA形式の暗号アルゴリズム部（長いトークン優先でマッチ） ---
  const CIPHER_IANA = [
    ["AES_256_CCM_8", { algo: "AES", bits: 256, mode: "CCM_8（認証タグ8byte）", aead: true }],
    ["AES_128_CCM_8", { algo: "AES", bits: 128, mode: "CCM_8（認証タグ8byte）", aead: true }],
    ["AES_256_CCM", { algo: "AES", bits: 256, mode: "CCM", aead: true }],
    ["AES_128_CCM", { algo: "AES", bits: 128, mode: "CCM", aead: true }],
    ["AES_256_GCM", { algo: "AES", bits: 256, mode: "GCM", aead: true }],
    ["AES_128_GCM", { algo: "AES", bits: 128, mode: "GCM", aead: true }],
    ["AES_256_CBC", { algo: "AES", bits: 256, mode: "CBC", aead: false }],
    ["AES_128_CBC", { algo: "AES", bits: 128, mode: "CBC", aead: false }],
    ["CAMELLIA_256_GCM", { algo: "Camellia", bits: 256, mode: "GCM", aead: true }],
    ["CAMELLIA_128_GCM", { algo: "Camellia", bits: 128, mode: "GCM", aead: true }],
    ["CAMELLIA_256_CBC", { algo: "Camellia", bits: 256, mode: "CBC", aead: false }],
    ["CAMELLIA_128_CBC", { algo: "Camellia", bits: 128, mode: "CBC", aead: false }],
    ["ARIA_256_GCM", { algo: "ARIA", bits: 256, mode: "GCM", aead: true }],
    ["ARIA_128_GCM", { algo: "ARIA", bits: 128, mode: "GCM", aead: true }],
    ["3DES_EDE_CBC", { algo: "3DES", bits: 112, mode: "CBC", aead: false, weakblock: true }],
    ["DES40_CBC", { algo: "DES", bits: 40, mode: "CBC", aead: false, exportGrade: true }],
    ["DES_CBC", { algo: "DES", bits: 56, mode: "CBC", aead: false, weakblock: true }],
    ["SEED_CBC", { algo: "SEED", bits: 128, mode: "CBC", aead: false }],
    ["IDEA_CBC", { algo: "IDEA", bits: 128, mode: "CBC", aead: false }],
    ["CHACHA20_POLY1305", { algo: "ChaCha20", bits: 256, mode: "Poly1305（AEAD）", aead: true }],
    ["RC4_128", { algo: "RC4", bits: 128, mode: "ストリーム", aead: false, stream: true }],
    ["RC4_40", { algo: "RC4", bits: 40, mode: "ストリーム", aead: false, stream: true, exportGrade: true }],
    ["NULL", { algo: "NULL", bits: 0, mode: "暗号化なし", aead: false, nullCipher: true }]
  ];

  const MAC_TOKENS = ["SHA256", "SHA384", "MD5", "SHA"];

  function macLabel(tok, aead) {
    if (aead) {
      if (tok === "SHA256") return "SHA-256（PRFハッシュ。メッセージ認証はAEADに内蔵）";
      if (tok === "SHA384") return "SHA-384（PRFハッシュ。メッセージ認証はAEADに内蔵）";
      return tok + "（PRFハッシュ。メッセージ認証はAEADに内蔵）";
    }
    if (tok === "SHA") return "HMAC-SHA-1";
    if (tok === "SHA256") return "HMAC-SHA-256";
    if (tok === "SHA384") return "HMAC-SHA-384";
    if (tok === "MD5") return "HMAC-MD5";
    return tok;
  }

  function decomposeIana(raw) {
    const name = raw.trim();
    if (!/^TLS_/i.test(name)) return null;
    const body = name.slice(4);
    const upBody = body.toUpperCase();
    const withIdx = upBody.indexOf("_WITH_");
    let left = null, right, tls13 = false;
    if (withIdx === -1) {
      tls13 = true;
      right = upBody;
    } else {
      left = upBody.slice(0, withIdx);
      right = upBody.slice(withIdx + 6);
    }

    let exportGrade = false;
    if (left) {
      if (/_EXPORT1024$/.test(left)) { exportGrade = true; left = left.replace(/_EXPORT1024$/, ""); }
      else if (/_EXPORT$/.test(left)) { exportGrade = true; left = left.replace(/_EXPORT$/, ""); }
    }

    let kex = null, auth = null, pfs = false, anon = false;
    if (tls13) {
      kex = "(EC)DHE（TLS 1.3は鍵交換に毎回一時鍵を使用。スイート名には含まれない）";
      auth = "証明書またはPSK（ハンドシェイクの拡張で別途決定）";
      pfs = true;
    } else {
      const kx = KEX_AUTH_IANA[left];
      if (!kx) return { unrecognized: true, name, reason: "鍵交換/認証部（" + left + "）を認識できませんでした" };
      kex = kx.kex; auth = kx.auth; pfs = kx.pfs; anon = !!kx.anon;
    }

    let matchedCipher = null, cipherToken = "";
    for (const [tok, info] of CIPHER_IANA) {
      if (right.indexOf(tok) === 0) { matchedCipher = info; cipherToken = tok; break; }
    }
    if (!matchedCipher) return { unrecognized: true, name, reason: "暗号アルゴリズム部（" + right + "）を認識できませんでした" };

    let rest = right.slice(cipherToken.length);
    if (rest.indexOf("_") === 0) rest = rest.slice(1);
    let macTok = null, macNote = "";
    if (rest === "") {
      macNote = matchedCipher.aead ? "（既定値。TLS 1.2/1.3のPRFはSHA-256または256を使用、メッセージ認証はAEADに統合）" : "";
    } else {
      for (const m of MAC_TOKENS) { if (rest === m) { macTok = m; break; } }
      if (!macTok) macNote = "（未知のMACトークン: " + rest + "）";
    }

    if (exportGrade) matchedCipher = Object.assign({}, matchedCipher, { exportGrade: true });

    return {
      name, tls13, kex, auth, pfs, anon, exportGrade: exportGrade || !!matchedCipher.exportGrade,
      algo: matchedCipher.algo, bits: matchedCipher.bits, mode: matchedCipher.mode, aead: matchedCipher.aead,
      weakblock: !!matchedCipher.weakblock, stream: !!matchedCipher.stream, nullCipher: !!matchedCipher.nullCipher,
      mac: macTok ? macLabel(macTok, matchedCipher.aead) : (matchedCipher.aead ? "AEAD内蔵" + macNote : "不明" + macNote)
    };
  }

  // --- OpenSSL形式（ハイフン区切り）の解読 ---
  const KEX_AUTH_OSSL_TWO = {
    "ECDHE-ECDSA": { kex: "ECDHE（楕円曲線一時鍵）", auth: "ECDSA証明書", pfs: true },
    "ECDHE-RSA": { kex: "ECDHE（楕円曲線一時鍵）", auth: "RSA証明書", pfs: true },
    "DHE-RSA": { kex: "DHE（Diffie-Hellman一時鍵）", auth: "RSA証明書", pfs: true },
    "EDH-RSA": { kex: "DHE（Diffie-Hellman一時鍵、旧称EDH）", auth: "RSA証明書", pfs: true },
    "DHE-DSS": { kex: "DHE（Diffie-Hellman一時鍵）", auth: "DSS証明書", pfs: true },
    "EDH-DSS": { kex: "DHE（Diffie-Hellman一時鍵、旧称EDH）", auth: "DSS証明書", pfs: true },
    "ECDH-RSA": { kex: "ECDH（静的、証明書に固定）", auth: "RSA証明書", pfs: false },
    "ECDH-ECDSA": { kex: "ECDH（静的、証明書に固定）", auth: "ECDSA証明書", pfs: false },
    "DH-RSA": { kex: "DH（静的、証明書に固定）", auth: "RSA証明書", pfs: false },
    "DH-DSS": { kex: "DH（静的、証明書に固定）", auth: "DSS証明書", pfs: false },
    "DHE-PSK": { kex: "DHE-PSK", auth: "事前共有鍵(PSK)", pfs: true },
    "ECDHE-PSK": { kex: "ECDHE-PSK", auth: "事前共有鍵(PSK)", pfs: true },
    "RSA-PSK": { kex: "RSA-PSK", auth: "事前共有鍵(PSK)+RSA", pfs: false },
    "SRP-RSA": { kex: "SRP", auth: "RSA証明書", pfs: false },
    "SRP-DSS": { kex: "SRP", auth: "DSS証明書", pfs: false }
  };
  const KEX_AUTH_OSSL_ONE = {
    "ADH": { kex: "DH（静的）", auth: "なし（匿名）", pfs: false, anon: true },
    "AECDH": { kex: "ECDH（静的）", auth: "なし（匿名）", pfs: false, anon: true },
    "PSK": { kex: "PSK（事前共有鍵のみ）", auth: "事前共有鍵(PSK)", pfs: false },
    "SRP": { kex: "SRP", auth: "なし（SRPのみ）", pfs: false },
    "KRB5": { kex: "Kerberos", auth: "Kerberos", pfs: false }
  };
  const CIPHER_OSSL = [
    ["AES256-GCM", { algo: "AES", bits: 256, mode: "GCM", aead: true }],
    ["AES128-GCM", { algo: "AES", bits: 128, mode: "GCM", aead: true }],
    ["AES256-CCM8", { algo: "AES", bits: 256, mode: "CCM_8（認証タグ8byte）", aead: true }],
    ["AES128-CCM8", { algo: "AES", bits: 128, mode: "CCM_8（認証タグ8byte）", aead: true }],
    ["AES256-CCM", { algo: "AES", bits: 256, mode: "CCM", aead: true }],
    ["AES128-CCM", { algo: "AES", bits: 128, mode: "CCM", aead: true }],
    ["CAMELLIA256-GCM", { algo: "Camellia", bits: 256, mode: "GCM", aead: true }],
    ["CAMELLIA128-GCM", { algo: "Camellia", bits: 128, mode: "GCM", aead: true }],
    ["ARIA256-GCM", { algo: "ARIA", bits: 256, mode: "GCM", aead: true }],
    ["ARIA128-GCM", { algo: "ARIA", bits: 128, mode: "GCM", aead: true }],
    ["CHACHA20-POLY1305", { algo: "ChaCha20", bits: 256, mode: "Poly1305（AEAD）", aead: true }],
    ["AES256-CBC", { algo: "AES", bits: 256, mode: "CBC", aead: false }],
    ["AES128-CBC", { algo: "AES", bits: 128, mode: "CBC", aead: false }],
    ["AES256", { algo: "AES", bits: 256, mode: "CBC（表記省略。OpenSSL慣例でCBC）", aead: false }],
    ["AES128", { algo: "AES", bits: 128, mode: "CBC（表記省略。OpenSSL慣例でCBC）", aead: false }],
    ["CAMELLIA256", { algo: "Camellia", bits: 256, mode: "CBC（表記省略）", aead: false }],
    ["CAMELLIA128", { algo: "Camellia", bits: 128, mode: "CBC（表記省略）", aead: false }],
    ["SEED", { algo: "SEED", bits: 128, mode: "CBC（表記省略）", aead: false }],
    ["DES-CBC3", { algo: "3DES", bits: 112, mode: "CBC", aead: false, weakblock: true }],
    ["DES-CBC", { algo: "DES", bits: 56, mode: "CBC", aead: false, weakblock: true }],
    ["RC4", { algo: "RC4", bits: 128, mode: "ストリーム", aead: false, stream: true }],
    ["NULL", { algo: "NULL", bits: 0, mode: "暗号化なし", aead: false, nullCipher: true }]
  ];

  function matchOsslPrefix(tokensUpper) {
    const two = tokensUpper.slice(0, 2).join("-");
    if (KEX_AUTH_OSSL_TWO[two]) return Object.assign({ consume: 2 }, KEX_AUTH_OSSL_TWO[two]);
    const one = tokensUpper[0];
    if (KEX_AUTH_OSSL_ONE[one]) return Object.assign({ consume: 1 }, KEX_AUTH_OSSL_ONE[one]);
    if (one === "EXP" || one === "EXP1024") {
      const rest = tokensUpper.slice(1);
      const inner = matchOsslPrefix(rest) || { kex: "RSA（静的、輸出グレード）", auth: "RSA証明書", pfs: false, consume: 0 };
      return Object.assign({}, inner, { exportGrade: true, consume: 1 + inner.consume });
    }
    return { kex: "RSA（静的、鍵転送・接頭辞省略時の既定）", auth: "RSA証明書", pfs: false, consume: 0 };
  }

  function decomposeOssl(raw) {
    const name = raw.trim();
    if (name.indexOf("-") === -1) return null; // ハイフンがない単純名（RC4-MD5等は下でカバー）で、かつ該当なしなら諦める
    const tokens = name.split("-");
    const tokensUpper = tokens.map((t) => t.toUpperCase());
    const prefix = matchOsslPrefix(tokensUpper);
    const restTokens = tokens.slice(prefix.consume);
    const restStr = restTokens.join("-").toUpperCase();

    let matchedCipher = null, cipherToken = "";
    for (const [tok] of CIPHER_OSSL) {
      if (restStr.indexOf(tok) === 0) { const info = CIPHER_OSSL.find((c) => c[0] === tok)[1]; matchedCipher = info; cipherToken = tok; break; }
    }
    if (!matchedCipher) return { unrecognized: true, name, reason: "暗号アルゴリズム部（" + restStr + "）を認識できませんでした" };

    let rest = restStr.slice(cipherToken.length);
    if (rest.indexOf("-") === 0) rest = rest.slice(1);
    let macTok = null, macNote = "";
    if (rest === "") {
      macNote = matchedCipher.aead ? "（既定値。TLS 1.2のPRFはSHA-256/384、メッセージ認証はAEADに統合）" : "";
    } else {
      for (const m of MAC_TOKENS) { if (rest === m) { macTok = m; break; } }
      if (!macTok) macNote = "（未知のMACトークン: " + rest + "）";
    }

    const algo = Object.assign({}, matchedCipher);
    if (prefix.exportGrade && algo.stream) algo.bits = 40;
    if (prefix.exportGrade && algo.algo === "DES") algo.bits = 40;

    return {
      name, tls13: false, kex: prefix.kex, auth: prefix.auth, pfs: !!prefix.pfs, anon: !!prefix.anon,
      exportGrade: !!prefix.exportGrade,
      algo: algo.algo, bits: algo.bits, mode: algo.mode, aead: algo.aead,
      weakblock: !!algo.weakblock, stream: !!algo.stream, nullCipher: !!algo.nullCipher,
      mac: macTok ? macLabel(macTok, algo.aead) : (matchedCipher.aead ? "AEAD内蔵" + macNote : "不明" + macNote)
    };
  }

  function fromTableRow(row, matchedSide) {
    return { name: matchedSide === "iana" ? row.iana : row.openssl, tableRow: row };
  }

  function analyzeLine(raw) {
    const name = raw.trim();
    if (name === "") return null;
    const up = name.toUpperCase();

    let tableRow = TABLE_BY_IANA.get(up) || TABLE_BY_OSSL.get(up);
    let rec;
    if (/^TLS_/i.test(name)) {
      rec = decomposeIana(name);
    } else {
      rec = decomposeOssl(name);
    }
    if (!rec) {
      return { name, unrecognized: true, reason: "TLS_で始まるIANA名、またはハイフン区切りのOpenSSL名として認識できませんでした" };
    }
    if (tableRow) {
      rec.altName = up === tableRow.iana.toUpperCase() ? tableRow.openssl : tableRow.iana;
      rec.fromTable = true;
      rec.tls13 = rec.tls13 || !!tableRow.tls13;
    }
    return rec;
  }

  function rate(rec) {
    let level = 4; // 4推奨 3許容 2非推奨 1危険
    const reasons = [];
    function downgrade(lv, reason) { if (lv < level) level = lv; reasons.push(reason); }

    if (rec.nullCipher) downgrade(1, "NULL暗号のため通信内容が暗号化されません（機密性がありません）");
    if (rec.anon) downgrade(1, "匿名鍵交換のため通信相手を認証できず、中間者攻撃(MITM)を検知できません");
    if (rec.exportGrade) downgrade(1, "EXPORTグレード（輸出規制対応で意図的に鍵長を短くした仕様）で、現在の計算資源では短時間で解読できます");
    if (rec.stream) downgrade(1, "RC4は統計的な鍵ストリームの偏りが実証されており、RFC 7465でTLSでの使用が禁止されています");
    if (rec.algo === "3DES") downgrade(1, "3DES（実質鍵長112bit・64bitブロック）はSweet32攻撃（CVE-2016-2183）で長時間接続から平文を推測されます");
    if (rec.algo === "DES") downgrade(1, "DES（56bit）は総当たり攻撃で現実的な時間で解読できます");
    if (rec.mac === "HMAC-MD5") downgrade(1, "MD5は衝突耐性が破られており、メッセージ認証アルゴリズムとして使用すべきではありません");

    if (level > 1 && !rec.pfs) {
      downgrade(2, "前方秘匿性(PFS)がありません。サーバーの長期秘密鍵が将来漏えいすると、過去に記録された通信も遡って復号される恐れがあります");
    }
    if (level > 1 && !rec.aead && rec.mode === "CBC" && rec.mac === "HMAC-SHA-1") {
      downgrade(2, "CBCモード+SHA-1の組み合わせはBEAST/Lucky13等、実装によっては既知の攻撃手法が報告された組み合わせです");
    }
    if (level > 2 && rec.mode && rec.mode.indexOf("CCM_8") !== -1) {
      downgrade(3, "認証タグが8byteと短く、標準のGCM/CCM（16byte）より改ざん検知の強度が低いため、主に制約のあるIoT機器向けです");
    }
    if (level > 2 && !rec.aead && rec.mode && rec.mode.indexOf("CBC") !== -1) {
      downgrade(3, "CBCモードは実装次第でパディングオラクル等の攻撃余地が残るため、可能であればAEAD（GCM/ChaCha20-Poly1305）への移行が推奨されます");
    }

    if (reasons.length === 0) {
      reasons.push(rec.tls13
        ? "TLS 1.3の標準暗号スイートです。鍵交換には常に一時鍵が使われ、前方秘匿性があります"
        : "AEAD暗号と前方秘匿性のある鍵交換（(EC)DHE）の組み合わせで、現在の推奨構成に合致します");
    }
    const meta = {
      4: { label: "推奨", cls: "b-ok" },
      3: { label: "許容", cls: "b-accept" },
      2: { label: "非推奨", cls: "b-bad" },
      1: { label: "危険", cls: "b-danger" }
    }[level];
    return { level, label: meta.label, cls: meta.cls, reasons };
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function itemHtml(rec) {
    if (rec.unrecognized) {
      return '<div class="scd-item"><div class="scd-head"><span class="scd-name">' + esc(rec.name) +
        '</span><span class="scd-badge b-accept">未認識</span></div><p class="hint">' + esc(rec.reason) +
        "。IANA名（TLS_ から始まる形式）またはOpenSSL名（ハイフン区切り）で入力してください。</p></div>";
    }
    const r = rate(rec);
    const cipherLabel = rec.nullCipher ? "暗号化なし" : (rec.algo + " " + rec.bits + "bit / " + rec.mode + (rec.aead ? "（AEAD）" : ""));
    return (
      '<div class="scd-item"><div class="scd-head"><span class="scd-name">' + esc(rec.name) + "</span>" +
      '<span class="scd-badge ' + r.cls + '">' + r.label + "</span>" +
      (rec.tls13 ? '<span class="hint">TLS 1.3</span>' : "") +
      "</div>" +
      (rec.altName ? '<p class="scd-alt">対応する別名: ' + esc(rec.altName) + "</p>" : "") +
      "<dl>" +
      "<dt>鍵交換</dt><dd>" + esc(rec.kex) + "</dd>" +
      "<dt>認証</dt><dd>" + esc(rec.auth) + (rec.pfs ? "（前方秘匿性あり）" : "（前方秘匿性なし）") + "</dd>" +
      "<dt>暗号（アルゴリズム/鍵長/モード）</dt><dd class=\"mono\">" + esc(cipherLabel) + "</dd>" +
      "<dt>MAC / PRF</dt><dd class=\"mono\">" + esc(rec.mac) + "</dd>" +
      "</dl>" +
      '<ul class="scd-reasons">' + r.reasons.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" +
      "</div>"
    );
  }

  function run() {
    const errEl = $("scd-error");
    const countEl = $("scd-count");
    const resultsEl = $("scd-results");
    errEl.textContent = "";
    const raw = $("scd-input").value;
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
    if (lines.length === 0) {
      countEl.textContent = "";
      resultsEl.innerHTML = "";
      return;
    }
    const recs = lines.map(analyzeLine).filter(Boolean);
    const okCount = recs.filter((r) => !r.unrecognized).length;
    countEl.textContent = lines.length + " 件中 " + okCount + " 件を解析しました。";
    resultsEl.innerHTML = recs.map(itemHtml).join("");
  }

  function buildConvTable() {
    const tbody = document.querySelector("#scd-conv-table tbody");
    if (!tbody) return;
    tbody.innerHTML = TABLE.map((r) =>
      "<tr><td class=\"mono\">" + esc(r.iana) + "</td><td class=\"mono\">" + esc(r.openssl) + "</td><td>" + (r.tls13 ? "1.3" : "1.2") + "</td></tr>"
    ).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildConvTable();
    $("scd-input").addEventListener("input", run);
    $("scd-clear").addEventListener("click", () => { $("scd-input").value = ""; run(); });
    run();
  });
})();
