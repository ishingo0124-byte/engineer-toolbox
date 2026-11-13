自作のアプリを、サーバーの再起動後も勝手に動かしたい。
.service の書き方は毎回うろ覚えで、ExecStart の相対パスで怒られる。
Restart と Type の組み合わせも、これで合っているのか自信がない。
このツールは項目を入力するだけで .service ファイルを組み立て、置き場所と有効化のコマンド、危なそうな組み合わせの警告まで出します。

## 使い方

1. Description とユニット名、Type、ExecStart を入力します。入力と同時に右の結果が更新されます。
2. ExecStart は実行ファイルを絶対パスで書きます。引数は同じ行に続けます。
3. 必要なら User/Group、WorkingDirectory、Environment、Restart などを足します。空欄の項目は、行ごと出力されません。
4. 「生成された .service ファイル」をコピーし、「配置先パス」に保存して、「有効化コマンド」を実行します。

3つ目の項目あたりで迷ったら、まず必須の4つだけ入れて出力を見てください。足したい項目は、あとから増やせます。

## 仕組み・計算式

出力は systemd.unit(5) と systemd.service(5) の書式に沿った、[Unit]・[Service]・[Install] の3セクションです。Environment 欄は1行を1つの `Environment=KEY=VALUE` に変え、複数の変数は複数行で書きます。KEY は英字かアンダースコアで始まり、英数字とアンダースコアだけで作ります。

ExecStart、WorkingDirectory、EnvironmentFile は絶対パスが必要で、systemd.service(5) は ExecStart の先頭に絶対パスを求めています。相対パスを入れると、ツールはエラーにして出力を止めます。EnvironmentFile の先頭の `-` は、ファイルが無くてもエラーにしない指定で、systemd.exec(5) に書かれています。

配置先は `/etc/systemd/system/ユニット名.service` で、有効化は `systemctl daemon-reload` のあとに `systemctl enable --now` を実行します。daemon-reload はユニットファイルの変更を読み込み直す操作で、`--now` は自動起動の登録と、いま起動することを1回で行います。

警告が出る組み合わせは4つです。Type=oneshot と Restart が no 以外、Type=forking、Restart=no なのに RestartSec を指定、EnvironmentFile が必須指定、のときです。

## 計算例

ツールの生成処理を Node.js で動かして確かめた値です。

**例1: 初期値のまま。** ユニット名 myapp、Type=simple、ExecStart=/usr/local/bin/myapp --config /etc/myapp.conf、User=myapp、After=network-online.target です。出力は [Unit] に Description と After、[Service] に Type・ExecStart・User・`Restart=no`、[Install] に `WantedBy=multi-user.target` が並びます。配置先は `/etc/systemd/system/myapp.service`、コマンドは `sudo systemctl daemon-reload && sudo systemctl enable --now myapp.service` でした。

**例2: Web アプリ向け。** WorkingDirectory=/opt/myapp、Group=myapp、Environment に `NODE_ENV=production` と `PORT=8080`、EnvironmentFile=/etc/myapp/env を「無くてもエラーにしない」で指定、Restart=on-failure、RestartSec=5、Wants=network-online.target としました。すると `Environment=` が2行、`EnvironmentFile=-/etc/myapp/env`、`Restart=on-failure`、`RestartSec=5` が出ます。警告は出ませんでした。

**例3: 境界値とエラー。** ExecStart を `myapp --x` にすると、絶対パスで指定するよう求めるエラーになり、出力は空になります。Type=oneshot と Restart=always を選ぶと、出力はされるものの警告が付きます。Restart=no のまま RestartSec=5 を入れた場合も、5が出力されたうえで、無視されるという警告が付きました。全角の `５` や `／` は、半角に直してから処理されます。Environment に `GREETING=hello world` を入れると、`Environment="GREETING=hello world"` と引用符つきで出ました。

## よくある間違い

**After だけ書いて、ネットワークを待っているつもりになる。** After を書けば待ってくれる、と思っていませんか。After= は起動の順番だけを決めます。network-online.target を実際に有効にするには、Wants= も必要で、systemd.special(7) にその旨があります。このツールの初期値は After だけなので、ネット接続が前提のアプリなら Wants 欄にも同じ値を入れてください。

**User= に指定したユーザーがいない。** 起動に失敗し、`systemctl status` に `status=217/USER` と出ます。ツールの初期値は myapp ですが、ユーザーを作る機能はありません。`useradd` などで先に作ってください。

**パスワードや API キーを Environment= に直書きする。** ユニットファイルは `systemctl show` などでも中身が見えます。秘密の値は別ファイルに書いて、EnvironmentFile= で読み込ませ、そのファイルの権限を絞るほうが安全です。意外と、最初の動作確認のまま本番に残る人が多そうです。

## よくある質問

### Q. Type=oneshot と Restart=always で警告が出るのはなぜですか?
A. oneshot は1回走って終わる想定です。Restart=always だと終了のたびに再起動されます。決まった時刻や間隔で動かしたいなら、.timer ユニットのほうが向いています。

### Q. WantedBy を空にするとどうなりますか?
A. このツールでは multi-user.target が自動で入ります。手書きのユニットで WantedBy が無いと、`systemctl enable` に「インストール設定が無い」という趣旨の警告が出て、リンクは作られません。

### Q. Environment の値に空白や引用符を入れても大丈夫ですか?
A. 大丈夫です。systemd.exec(5) の規則に合わせて、`Environment="GREETING=hello world"` の形で出力します。値の中の `"` と `\` は、バックスラッシュで逃がします。空白も引用符も含まない値は、これまでどおり引用符なしです。

### Q. Restart=always でも systemctl stop で止まりますか?
A. 止まります。Restart= は、プロセスが落ちたときなどに systemd が起こす再起動の設定です。stop は意図した停止なので、再起動されません。

### Q. 設定が正しいか、保存前に確かめる方法はありますか?
A. ファイルを置いたあとに `systemd-analyze verify` でユニットファイルの文法を点検できます。起動後のログは `journalctl -u ユニット名` で見ます。このページでは、生成した文字列が書式どおりに出ているところまでを確認しました。
