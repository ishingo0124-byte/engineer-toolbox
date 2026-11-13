踏み台を2つ挟むサーバーに、毎回長い ssh コマンドを打っている。
ProxyJump の書き方も、鍵の指定も、検索し直すたびに忘れる。
このツールはフォームに入れた値から、~/.ssh/config に追記する Host ブロックと、設定ファイルなしで同じ接続をする ssh コマンド1行を作ります。複数のホストをまとめて出すこともできます。

## 使い方

1. Host（エイリアス名）、HostName、User、Port、IdentityFile を入れます。Port は空欄なら行ごと出ず、既定の22番になります。
2. 踏み台を経由するなら、ProxyJump に入れます。複数なら、カンマ区切りで先に通る順に書きます。
3. 必要に応じて IdentitiesOnly、ForwardAgent、ServerAliveInterval、LocalForward（1行に1つ）を足します。
4. 入力と同時に、設定ブロックと ssh コマンドが出ます。コピーボタンで転記してください。

複数のホストが要るときは、「このホストを追加」で一覧に積み、全文を一度にコピーします。追加した一覧は、ページを閉じると消えます。

## 仕組み・計算式

出力する構文は、ssh_config(5) の書式に従っています。各行は「キーワード 値」の形で、値に空白が含まれるときはダブルクォートで囲みます。IdentityFile のパスに空白があれば、設定側にはダブルクォートを、ssh コマンド側にはシェル用のシングルクォートを自動で付けます。

ProxyJump は ssh_config(5) に、カンマ区切りで複数指定でき、書いた順に経由すると定められています。OpenSSH 7.3 で加わった設定で、コマンドラインの `-J` が同じ意味です。ホストは `user@host:port` の形でも書けます。

ssh コマンド欄の対応は、ProxyJump が `-J`、IdentityFile が `-i`、Port が `-p`、ForwardAgent が `-A`、LocalForward が `-L` です。IdentitiesOnly と ServerAliveInterval は `-o` で渡します。接続先は `User@HostName` にまとめ、HostName が空ならエイリアスを使います。エイリアスは設定ファイルがあって初めて意味を持つからです。

ssh_config(5) には、各設定は最初に見つかった値が使われるとも書かれています。ファイルの上から順に読まれるので、Host の並び順で結果が変わります。

## 計算例

ツールの出力生成ロジックを手元で動かして確かめた値です。

**例1:初期値のまま。** Host が myserver、HostName が 203.0.113.10、User が deploy、Port が 2222、IdentityFile が ~/.ssh/id_ed25519、ProxyJump が bastion.example.com のとき、設定ブロックは次の6行になりました。Host、HostName、User、Port、IdentityFile、ProxyJump の順です。ssh コマンドは `ssh -J bastion.example.com -i ~/.ssh/id_ed25519 -p 2222 deploy@203.0.113.10` でした。

**例2:多段と LocalForward。** ProxyJump に `jump1.example.com, admin@jump2.example.com:2200` と、カンマの後ろに空白を入れて渡すと、空白は取り除かれて `jump1.example.com,admin@jump2.example.com:2200` と出ます。IdentitiesOnly を入れると、設定側は `IdentitiesOnly yes`、コマンド側は `-o IdentitiesOnly=yes` です。LocalForward の `5433:localhost:5432` と `8080:127.0.0.1:80` は、それぞれ `-L` が2つに展開されました。

**例3(境界値):空白入りのパスと Port の上限。** IdentityFile を `C:/Users/John Doe/.ssh/id key` にすると、設定側は `IdentityFile "C:/Users/John Doe/.ssh/id key"`、コマンド側は `-i 'C:/Users/John Doe/.ssh/id key'` でした。Port は 65535 まで通り、70000 を入れると赤字のエラーになって Port の行が消えます。

LocalForward は、`8080-localhost-80` のように区切りが違う行だけが外れ、正しい行は残ります。IPv6 の `8080:[::1]:80` もこのツールでは書式エラーの扱いです。

## よくある間違い

**IdentityFile を書いたのに、別の鍵で認証されて拒否される。** ssh-agent に鍵がたくさん入っていると、ssh はまず agent の鍵から順に試します。指定した鍵に届く前に、サーバー側の認証の試行回数の上限に達してしまうことがあります。`IdentitiesOnly yes` を付けると、指定した鍵だけが使われます。好みが分かれるところですが、鍵を使い分けるホストには最初から付けておくのが無難だと思います。

**踏み台の先でも鍵が要るので、ForwardAgent を付けてしまう。** ProxyJump を使うと、最終ホストへの認証は手元の鍵で行われます。踏み台に agent を渡す必要はありません。ssh_config(5) も、agent の転送は注意して有効にするよう警告しています。踏み台の管理者から、転送した agent を悪用される恐れがあるからです。

**共通設定の Host * を、後ろに書いてしまう。** 最初に見つかった値が使われるので、個別の Host を先、`Host *` を最後に置きます。このツールは `Host *` を作らないので、全文をコピーしたあとに自分で足すときは、末尾に置いてください。

## よくある質問

### Q. Port を空欄にするとどうなりますか？
A. 設定ブロックにも ssh コマンドにも Port の行は出ません。ssh は既定の22番に接続します。

### Q. ProxyJump に何も入れなければどうなりますか？
A. ProxyJump の行は出ず、HostName に直接接続する設定になります。

### Q. 設定ファイルの権限は、何にすればよいですか？
A. 600 にしておくのが無難です。ssh は、他のユーザーが書き込める設定ファイルを「Bad owner or permissions」として読まないことがあるためです。chmod の数値に迷ったら、同じサイトの chmod 計算ツールで確かめられます。

### Q. 追加したホストの一覧は、ページを閉じても残りますか？
A. 残りません。ブラウザ内だけの一時的な一覧で、保存もサーバーへの送信もしていません。
