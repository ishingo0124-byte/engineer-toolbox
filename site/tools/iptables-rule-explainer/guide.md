先輩が書き残したiptablesの1行。-mやら--dportやらが並んでいて、どこから読めばいいのか分からない。
nftablesのルールは書き方が違うぶん、余計に読めない。
このツールは、その1行をテーブル・チェーン・条件・ターゲットに分けて、日本語の表にして見せます。

## 使い方

1. iptablesかnftablesのルールを、上の欄に1行に1つずつ貼ります。複数行をまとめて入れても、1行ごとに別の表になります。
2. 入力と同時に、操作、チェーン、プロトコル、送信元と宛先、ポート、モジュール、ターゲットの順に表が出ます。
3. 行頭の `sudo` や `iptables`、`ip6tables` は読み飛ばします。`nft` で始まる行か、`rule` と `inet`・`ip`・`ip6`・`bridge` を含む行はnftables、それ以外はiptablesとして読みます。
4. 辞書にない要素は、「未対応」の行として表に残ります。黙って消えることはありません。

表の行は、入力した順に並びます。`-t` で指定したテーブルだけは、いつも先頭に出ます。

## 仕組み・計算式

iptablesのコマンドの形は、man iptables(8)に書かれています。`-t` でテーブルを選び、`-A`（追加）や`-I`（挿入）でチェーンを指定し、`-p`・`-s`・`-d`・`--dport` などの条件を並べ、最後に `-j` で処理（ターゲット）を決めます。`-t` を省略するとfilterテーブルです。`-m` で読み込む拡張モジュールと、その引数は、man iptables-extensions(8)にまとまっています。`state` モジュールは古い書き方で、今は `conntrack` が使われます。

条件の前に `!` を置くと否定になります。表には「〜ではない」と出ます。

nftablesは、man nft(8)のとおり `nft add rule <family> <table> <chain> <式>` という並びです。iptablesの `-m state --state NEW` に当たるのが `ct state new` で、このツールのnftables対応は簡易版です。読めるのは、`ip saddr`・`ip daddr`、`tcp`・`udp` の `dport`・`sport`、`iifname`・`oifname`、`ct state`、`limit rate`、`counter`、`log`、`accept`・`drop`・`reject`・`masquerade`・`snat to`・`dnat to` です。

パケットはチェーンの上のルールから順に調べられ、`ACCEPT`・`DROP`・`REJECT` に当たった時点で結果が決まります。`LOG` はログに残すだけで、次のルールへ進みます。

## 計算例

ツールの解析ロジックを手元で動かして確かめた結果です。

**例1: 最初から入っているiptablesの行。** `iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -m state --state NEW -j ACCEPT` は、テーブルがfilter（省略時の既定値）、操作が追加、チェーンがINPUT、プロトコルがTCP、宛先ポートが22、送信元が10.0.0.0/8、モジュールがstate、接続状態がNEW（新規接続）、ターゲットがACCEPTと出ました。宛先ポートが送信元より先に並ぶのは、入力で `--dport` を先に書いたからです。

**例2: NAT。** `iptables -t nat -A POSTROUTING -s 192.168.0.0/24 -o eth0 -j MASQUERADE` は、テーブルがnat（「省略時」の注記は付かない）、チェーンがPOSTROUTING、出力インターフェースがeth0、ターゲットがMASQUERADEです。

**例3: nftables。** `nft add rule inet filter input tcp dport 22 accept` は、操作が追加、ファミリがinet、テーブルがfilter、チェーンがinput、プロトコルがTCP、宛先ポートが22、ターゲットが「ACCEPT相当」になります。

**境界の例。** `iptables -A INPUT -p tcp --dport 22 -m recent --set --name SSH -j ACCEPT` では、`recent` というモジュール名は説明が出ますが、その引数の `--set`・`--name`・`SSH` は「未対応」の3行になりました。`iptables -L` は、操作が見つからないため「未対応」が2行出ます。`-j MYCHAIN` のような自作チェーンへのジャンプは、「カスタムチェーンの可能性があります」と表示されます。

## よくある間違い

**1行だけ見て「許可されている」と判断する。** 正直なところ、これが一番事故につながると思います。`-A` は末尾に足すだけなので、手前に広い `DROP` や `REJECT` があれば、後ろのACCEPTは評価されません。`iptables -S` や `nft list ruleset` で、全体の並びを確かめてください。

**`-j LOG` を拒否のルールだと思う。** LOGはログに残すだけで、パケットは次のルールに進みます。ログを取ったあとに捨てたいなら、LOGの次にDROPを書く必要があります。

**DROPとREJECTを同じものだと思う。** DROPは黙って捨てるので、相手は応答を待ってタイムアウトします。REJECTはエラーを返すので、相手はすぐ失敗に気づきます。どちらを使っているかで、接続できないときの見え方が変わりますよね。

**nftablesの `{ 22, 80 }` をそのまま貼る。** `tcp dport { 22, 80 } accept` を貼ると、宛先ポートが `{` と出て、`22,`・`80`・`}` が「未対応」の行になりました。セット記法は解釈できません。

## よくある質問

### Q. 日本語からiptablesのコマンドを作れますか？
A. いいえ、解説専用で、逆方向の変換はしません。

### Q. 「未対応」と出たら、書き方が間違っているのですか？
A. 間違いとは限りません。このツールの辞書にないだけです。意味は `man iptables-extensions` などで調べてください。

### Q. `-m multiport --dports 80,443` には対応していますか？
A. `--dports` は認識して、`80,443` をそのまま表示します。範囲指定の `:` などの意味までは解釈しません。

### Q. ip6tablesのルールも読めますか？
A. 行頭の `ip6tables` は読み飛ばして、iptablesと同じ辞書で解析します。IPv6向けと分かる表示は出ないので、どちらのコマンドだったかは元の行で確かめてください。
