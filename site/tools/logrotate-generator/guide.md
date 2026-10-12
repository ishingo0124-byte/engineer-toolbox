/etc/logrotate.d/ に置く設定、どこかのサイトからコピペして rotate の数字だけ書き換えていませんか。
compress と delaycompress の違いも、copytruncate と create が同時に使えない理由も、あやふやなまま。
このツールは、選んだ項目から /etc/logrotate.d/ にそのまま置ける設定を組み立て、矛盾する組み合わせには警告を出します。

## 使い方

1. 対象パス（1行に1つ。glob 可）と、設定ファイル名、ローテーション周期、保持世代数を決めます。
2. compress、missingok、notifempty、create、dateext など必要な項目にチェックを入れます。
3. postrotate で実行したいコマンド（例: `systemctl reload nginx`）があれば、1行に1コマンドで入力します。
4. 周期を size にしたときは、サイズ（100k、100M、1G の形）を入れます。

ここまでが入力です。

5. 生成された設定をコピーし、`/etc/logrotate.d/` 配下に保存します。このツールは設定の中身を作るだけで、何も送信しません。

## 仕組み・計算式

設定の書式は、logrotate の man ページ（logrotate(8)）にある構文どおりです。対象パスのあとに `{ }` を置き、その中にオプションを並べます。複数のパスを書くと、`{` は最後のパスの次の行に置かれます。

主な指定の意味を、man ページの説明に沿って整理します。

- `daily` / `weekly` / `monthly`: 時間間隔でローテーションします。
- `size 100M`: ログがその大きさを超えたらローテーションします。単位は k、M、G です。
- `rotate 14`: 14世代まで残し、それより古いものは削除します。`rotate 0` なら、古いログはローテーションされず削除されます。
- `compress`: 古いログを gzip で圧縮します。`delaycompress` は、直前の世代の圧縮を次のローテーションまで遅らせます。
- `create 0640 www-data adm`: ローテーション後に、指定のモード・所有者・グループで空のログファイルを作ります。

`copytruncate` は、元のファイルを移動せず、中身をコピーしたあとに元のファイルを空にする方式です。man ページには、コピーと切り詰めの間に書き込まれたログが失われる可能性がある、と書かれています。アプリがログを開き直せるなら、`create` と `postrotate` の組み合わせのほうが、取りこぼしの心配は小さくなります。

`sharedscripts` は、複数のログにマッチしても `postrotate` を1回だけ実行する指定です。付けないと、ログファイルごとにスクリプトが実行されます。

`dateext` を付けると、世代番号の代わりに日付がファイル名に入ります。`dateformat` を空にしたときの既定は `-%Y%m%d` です。

## 計算例

この節は、設定を組み立てる例です。ツールの生成ロジック（script.js の `generate` 関数）に値を渡し、実際に出た内容を書いています。logrotate 本体を動かして試したものではありません。

**例1: nginx の既定値のまま生成する**

入力は、パス `/var/log/nginx/*.log`、名前 `nginx`、周期 daily、保持 14、compress・missingok・notifempty・create（0640 www-data adm）・sharedscripts にチェック、postrotate に `systemctl reload nginx` です。出力は次の順になりました。

- 1行目: `/var/log/nginx/*.log {`
- 本文: `daily`、`rotate 14`、`compress`、`missingok`、`notifempty`、`create 0640 www-data adm`、`sharedscripts`
- 最後: `postrotate` / `systemctl reload nginx` / `endscript`、そして `}`

配置先は `/etc/logrotate.d/nginx` と表示され、警告は出ません。

**例2: size 周期にする**

周期を size、サイズを `100M`、保持を 7 にし、delaycompress と copytruncate と dateext をオンにして create をオフにすると、本文は `size 100M`、`rotate 7`、`compress`、`delaycompress`、`missingok`、`notifempty`、`copytruncate`、`dateext` の順に並びました。postrotate を空にしたので、スクリプトの部分は出ません。

**例3: 境界の例 — rotate を 0 にして2つのパスを書く**

パスを `/var/log/a.log` と `/var/log/b.log` の2行にして `rotate 0` にすると、1行目と2行目にパスが並び、3行目が単独の `{` になりました。

同じ状態で sharedscripts を外すと、出力から `sharedscripts` の行が消えます。このときはマッチしたログごとに postrotate が走る書き方になるので、reload のような1回で足りる処理は、チェックを入れたままにしてください。

**例4: 矛盾する組み合わせ**

copytruncate と create を両方オンにすると、警告が出ました。ツールは指定どおり、両方の行を出力します。サイズに `100MB` と入れると、書式エラーとして扱われ、設定は出力されません。

正直なところ、`100MB` が通らないのは意外でした。単位は k、M、G の1文字だけです。

## よくある間違い

### 1. copytruncate と create を一緒に書く

コピペで集めた設定が混ざると、起きがちです。copytruncate は元のファイルをその場で空にする方式で、新しい空ファイルを作る create とは考え方が合いません。ツールは両方出力しますが、警告が出ます。ログを開き直せるアプリなら create 側、できないアプリなら copytruncate 側、と選んでください。

### 2. delaycompress だけ付けて compress を外す

delaycompress は圧縮を1世代遅らせる指定なので、compress がなければ効きません。ツールは compress を外すと、delaycompress の行を出力しません。

### 3. 複数ファイルにマッチするのに sharedscripts を付けない

`/var/log/nginx/*.log` のようなパスで、reload を postrotate に書くと、ファイルの数だけ reload が走る書き方になります。1回でよい処理には、必ず sharedscripts を付けます。

### 4. create の所有者やグループを片方だけ書く

ツールは、所有者とグループの片方だけだと警告し、出力は `create 0640` だけになります（例で確認しました）。両方を書くか、両方を空にしてください。

## よくある質問

### Q. rotate を 0 にするとどうなりますか？
A. 古いログはローテーションされず、削除される設定になります。直近のログだけ見られればよい場合には使えますが、障害の調査に使うログでは避けたほうが無難です。

### Q. missingok は何のために付けますか？
A. 対象パスに一致するファイルがなくても、エラーにしないための指定です。デーモンがまだ起動していない環境や、ログが一度も出ていない環境で役に立ちます。

### Q. 生成した設定をそのまま使って大丈夫ですか？
A. 構文としては有効な設定を作りますが、モードや所有者は、そのシステムの実情に合わせて見直してください。配置後の `logrotate -d` での確認は、この解説では試していません。

### Q. size を指定すると、100M を超えた瞬間に回りますか？
A. 超えた瞬間に回るとは限りません。logrotate は多くの環境で cron などから1日1回起動されるので、判定はその起動時です。起動間隔を変えている環境は、そちらの設定を確認してください。
