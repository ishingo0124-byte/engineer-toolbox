CSR を作りたいのに、openssl のオプションがどうしても覚えられない。
SAN を付けるときの書き方は、毎回検索し直している。
PFX に変換したら、古いサーバーで読めなくなったこともあります。
やりたいことを選んで値を入れるだけで、実行前に目で確かめられるコマンドが 1 行で出ます。

## 使い方

1. 「やりたいこと」から目的を選びます。秘密鍵と CSR の作成、自己署名証明書、証明書や CSR の確認、PEM・DER・PFX の変換、鍵と証明書の対応確認、s_client での接続テストがあります。
2. 目的に合う入力欄だけが表示されます。ファイル名、CN、SAN（1行に1つ）、有効日数などを入れると、下にコマンドが出ます。
3. 「コマンドをコピー」を押して、ターミナルに貼り付けます。

ここからは、うまく使うための補足です。

4. 「生成された内容の意味」に、各オプションの役割が書かれます。意図しないものが混ざっていないか、貼る前に見てください。
5. 「オプションごとに改行する」にチェックを入れると、bash や zsh 向けに \ で改行した形になります。

このページはコマンドを組み立てるだけです。実行も、ファイルの送信もしません。

## 仕組み・計算式

生成するオプションは、OpenSSL の公式マニュアル（openssl-req、openssl-x509、openssl-pkcs12、openssl-s_client、openssl-pkey）に載っているものだけを使っています。目的ごとの骨格は次のとおりです。

```
CSR 作成     openssl req -new -newkey ... -keyout 鍵 -out CSR -subj ... -addext ...
自己署名     openssl req -x509 -newkey ... -keyout 鍵 -out 証明書 -days 日数 ...
中身の確認   openssl x509 -in 証明書 -text -noout
有効期限     openssl x509 -in 証明書 -noout -enddate
PFX 作成     openssl pkcs12 -export -out PFX -inkey 鍵 -in 証明書
接続テスト   openssl s_client -connect ホスト:ポート -servername ホスト
```

-subj の値では、「/」が項目の区切りです。値の中に「/」や「\」や「+」がある場合は、前に「\」を付けてエスケープします（openssl-req のマニュアルにある仕様です）。このツールは自動でエスケープし、さらにシェル用の引用符も付けます。

SAN は -addext "subjectAltName=DNS:a,DNS:b" の形で渡します。-addext は OpenSSL 1.1.1 以降のオプションです。IP アドレスは IP:、メールアドレスは email: に自動で振り分けます。

秘密鍵をパスフレーズなしで保存するオプションは、-nodes か -noenc です。OpenSSL 3.0 で -noenc が加わり、-nodes は古い別名になりました。-nodes のままでも 1.1.1 と 3.x の両方で動きます。

鍵と証明書の対応確認は、公開鍵のハッシュを比べる方法です。openssl pkey で秘密鍵から公開鍵を出し、openssl x509 で証明書から公開鍵を出して、openssl dgst -sha256 でそれぞれのハッシュを取ります。RSA でも EC でも使えます。

OpenSSL 3.0 では、PKCS#12 の既定の暗号化方式と MAC が新しい方式に変わりました。そのため、古い Windows や古い Java では、3.x で作った PFX を読み込めないことがあります。pkcs12 の -legacy を付けるか、-certpbe・-keypbe・-macalg で旧来の方式を指定すると、読める形にできます。-legacy はレガシープロバイダが使える環境でのみ動きます。

## 計算例

数字ではなく「入力 → 生成されるコマンド」の例です。コマンドの組み立てロジックを node で実行して、出力を確かめました。openssl 本体での実行確認はしていません。

**例1: example.com の秘密鍵と CSR（既定の入力）**

入力は、RSA 2048 ビット、パスフレーズなし（-nodes）、CN が example.com、SAN が example.com と www.example.com です。生成されるのは次の1行です。

```
openssl req -new -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=example.com" -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

**例2: 中間証明書つきの PFX を、古い環境向けに作る**

入力は、秘密鍵 server.key、証明書 server.crt、中間証明書 chain.crt、フレンドリ名 my cert、互換指定が -legacy です。

```
openssl pkcs12 -export -out server.pfx -inkey server.key -in server.crt -certfile chain.crt -name "my cert" -legacy
```

**例3: 特殊文字を含む件名（境界値）**

C に jp、O に A/B+C's Co、CN に example.com を入れると、-subj の部分は次のようになります。

```
-subj '/C=JP/O=A\/B\+C'\''s Co/CN=example.com'
```

C は大文字の JP に直り、「/」と「+」には「\」が付きます。「'」はシェル側のエスケープです。意外だったのは、値に「'」や「/」を入れるだけで、openssl とシェルの2段階でエスケープが要ることでした。

接続先が IP アドレスの場合も、同じ方法で確かめました。ホストに 192.0.2.10、ポートに 8443 を入れると、次のコマンドになり、-servername は付きません。

```
openssl s_client -connect 192.0.2.10:8443 </dev/null
```

SNI にはホスト名しか使えないので、接続先が IP アドレスのときは -servername を付けない作りにしました。

## よくある間違い

### 1. SAN を付けずに CSR を作ってしまう

CN だけの CSR で作った証明書は、いまのブラウザでエラーになることがあります。Chrome などの主要ブラウザは、CN ではなく SAN を見てホスト名を照合するためです。SAN の欄に、ブラウザからアクセスするホスト名をすべて入れてください。

### 2. 自己署名証明書の -days を付け忘れる

req -x509 で -days を付けないと、有効期間は既定の30日になります。数日後に期限切れで困った、という話は珍しくありません。このツールは有効日数を必ず入力させ、指定した値をそのままコマンドに入れます。

### 3. 秘密鍵と証明書の組み合わせを取り違える

証明書を更新したのに、サーバーが起動しない。原因が、別の鍵で作った CSR から発行された証明書だった、ということがあります。「秘密鍵と証明書が対応しているか確認する」を選ぶと、2つのハッシュを並べるコマンドが出ます。同じ値なら対応しています。

## よくある質問

### Q. このページでコマンドを実行されたり、ファイルが送られたりしませんか？
A. いいえ、ありません。ページ上でコマンドの文字列を組み立てるだけで、入力した値はブラウザの外には出ません。

### Q. PowerShell でも、そのまま貼り付けて使えますか？
A. bash や zsh などの POSIX シェルを想定しているので、PowerShell や cmd では引用符の扱いが違います。Git Bash では、-subj の先頭の「/」がファイルパスとして変換されることがあります。そのときはコマンドの先頭に MSYS_NO_PATHCONV=1 を付けて実行してください。

### Q. 秘密鍵のパスフレーズを、コマンドに直接書けますか？
A. このツールは書きません。パスフレーズや PFX のパスワードをコマンドに書くと、シェルの履歴やプロセス一覧に残るおそれがあるためです。実行すると、対話で入力を求められます。
