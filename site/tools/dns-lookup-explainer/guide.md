## 使い方

1. `dig example.com` や `nslookup example.com` の実行結果を貼り付けます。
2. dig形式ではHEADERのopcode/status/id、flags（qr/aa/rd/ra/ad/cd等）、QUESTION/ANSWER/AUTHORITY/ADDITIONALを分解し、レコードごとにTTLの読みやすい表記と意味を表示します。
3. nslookup形式ではServer/Name/Address等や、`-type=any`実行時の`canonical name =`等を解析します。
4. CNAMEが連なる場合はチェーンを矢印表示し、SOAはserial等の各値に分解します。

## 仕組み・根拠

DNSメッセージのヘッダーとリソースレコードの構造はRFC 1035で規定されています。本ツールはdig・nslookupの出力テキストの行パターン（`;; ->>HEADER<<-`、`;; ○○ SECTION:`、`Name:`等）を正規表現で解析するだけで、実際の名前解決やDNSサーバーへの問い合わせは行いません。`NXDOMAIN`はドメイン自体が存在しないこと、`SERVFAIL`はサーバー側の異常を示すことなど、RFC 1035の応答コードの意味を表示します。SOAのminimumはレコード不在をキャッシュする際のTTLです（RFC 2308）。

**現場の落とし穴**: ANSWER SECTIONのTTLは権威サーバーが返した時点の値で、キャッシュサーバー経由では経過時間が引かれた残り時間に見えることがあります。同じドメインへ複数回`dig`してTTLが徐々に減るのはこのためで異常ではありません。またANSWERが0件でもNOERRORなら「該当レコード種別のみ不在（NODATA）」であり、ドメイン自体が無いNXDOMAINとは意味が異なります。

## よくある質問

### Q. このツールで実際にDNSの名前解決はできますか？
A. できません。貼り付けたテキストを解析して解説するのみで、DNSサーバーへの照会は一切行いません。

### Q. `nslookup`の出力をそのまま貼っても解析できますか？
A. Server/Non-authoritative answer/Name/Address等の一般的な形式や、`-type=any`実行時のcanonical name/nameserver/mail exchanger/text/SOA形式に対応しています。認識できない行は無視されます。

### Q. flagsに`aa`が無いのは異常ですか？
A. いいえ。`aa`は権威サーバーからの直接の回答にのみ付き、キャッシュDNSサーバー経由では通常付きません。
