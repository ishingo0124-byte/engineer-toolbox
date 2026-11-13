動いている docker run を、そのまま compose.yaml にしたい。
オプションが多くて、どのキーに置けばいいのか毎回調べ直している。
docker run コマンドを貼ると、Compose の services 定義に変換します。変換できなかった部分は捨てずにコメントで残すので、何が漏れたかも分かります。

## 使い方

1. 上の欄に `docker run ...` を貼り付けます。入力と同時に変換されます。
2. 行末が `\` の複数行コマンドも、そのまま貼れます。引用符で囲んだ値（`-e MSG="hello world"`）も読めます。
3. 下の欄の `services:` を、コピーボタンで compose.yaml に貼り付けます。
4. 末尾に `#` のコメントが出ていたら、変換できなかったオプションです。手で確認して書き足してください。

引用符が閉じていないときは、変換せずにエラーを出します。

## 仕組み・計算式

貼られた文字列を、シェルの規則に近い形で自作のトークナイザが単語に分けます。バックスラッシュによる行継続、シングルクォート、ダブルクォートの基本のエスケープを扱います。単語に分けたあと、docker run のオプションを Compose Specification の `services.<名前>` 配下のキーに対応づけます。

- `-p` → `ports`、`-v` と `--mount`（bind と volume）→ `volumes`
- `-e` → `environment`、`--env-file` → `env_file`、`--label` → `labels`
- `--restart` → `restart`、`--network` → `networks`
- `-w` → `working_dir`、`-u` → `user`、`--hostname` → `hostname`、`--entrypoint` → `entrypoint`
- `--cap-add` → `cap_add`、`--privileged` → `privileged`

キーの名前は Compose Specification に、オプションの意味は docker run のリファレンスに従っています。ここまでは機械的な対応表です。

サービス名は `--name` があればそれを使い、なければイメージ名からレジストリのパスとタグを除いた部分にします。ghcr.io/foo/bar:1.2 なら bar です。イメージ名のあとに続く単語は、コンテナに渡すコマンド（`command`）として出力します。

変換しないものもあります。`-d`、`--rm`、`-it`、`--init` などは、Compose の静的な設定に対応する項目がないので、黙って読み飛ばします。`--gpus`、`-m`、`--cpus`、`--add-host`、`--health-cmd` などは、対応外として値ごと `# 未対応オプション:` のコメントに残します。

YAML の値は、コロンを含むもの、数字だけのもの、true や null のように別の型に読まれうるものを、ダブルクォートで囲んで出します。Compose のドキュメントは、`ports` の値をクォートするよう勧めています。YAML 1.1 では 22:22 のような値が60進数の数として読まれる場合があるためです。

## 計算例

数字ではなく変換結果ですが、すべて script.js を node で実行して出力を確かめました。

**例1: 標準的な nginx**

`docker run -d --name web -p 8080:80 -p 443:443 -v /data/www:/usr/share/nginx/html:ro -e TZ=Asia/Tokyo --restart unless-stopped nginx:latest`

web というサービス名で、image・container_name・environment（TZ: Asia/Tokyo）・ports（"8080:80" と "443:443"）・volumes（末尾の :ro を保持）・restart が出ます。`-d` は出力に現れません。

**例2: 値なしの -e と、対応外のオプション**

`docker run -d --name db -e MYSQL_ROOT_PASSWORD -e MSG="hello world" --network backend --gpus all -it --rm postgres:16`

`MYSQL_ROOT_PASSWORD:` は値なしのまま、`MSG: hello world` は引用符が外れた状態で出ます。`--network backend` は `networks` に入り、末尾に `backend:` と `external: true` が付きました。`--gpus all` はコメントに残り、`-it` と `--rm` は消えます。

**例3: 境界値**

- `--mount type=bind,source=/srv/a,target=/app,bind-propagation=rshared` は、`"/srv/a:/app"` に変換されます。bind-propagation は変換できないので、元の指定がコメントで残ります
- `-e DEBUG=true -e PORT=8080` は、`DEBUG: "true"`、`PORT: "8080"` と、クォートつきで出ます
- `-p 127.0.0.1:5432:5432` は、そのまま `"127.0.0.1:5432:5432"`
- 閉じていない引用符（`'nginx`）は、「シングルクォートが閉じていません」のエラー

## よくある間違い

### 1. バインドマウントと名前つきボリュームを混同する

名前つきボリュームを使ったことはありませんか？ `-v /data/www:/usr/share/nginx/html` のように `/` で始まるのはバインドマウント（ホストのパス）で、`-v data:/var/lib/x` の `data` はボリューム名です。ボリューム名のほうは、このツールがトップレベルの `volumes:` に `data:` を足して出力します。バインドマウントには足しません。確かめ方は簡単で、出力の末尾に `volumes:` があるかどうかです。ただし、パスを `./data` のように相対で書いたものは、バインドマウント扱いです。
### 2. --network は既存ネットワーク扱い

`--network backend` を指定すると、`external: true` の既存ネットワークとして出力します。docker run では先に `docker network create` した前提だからです。Compose の中で新しく作りたいなら、`external: true` の行を消します。

### 3. 引数の形を取り違える

node で入力を変えて試したところ、`-p8080:80`（スペースなし）と `-dit`（フラグの束ね書き）は対応していませんでした。正直なところ、`-dit` は手癖で書きやすいので気になります。どちらも `# 未対応オプション:` のコメントに残るので、コメントが出ていたら該当の部分を手で足してください。`-l a=b` は `--label` と同じ扱いで、`labels` に入ります。
もう1つあります。イメージ名より後ろに置いたオプションは、docker run でもコンテナへの引数です。`docker run nginx -p 80:80` は、`command` に `-p` と `80:80` が入ります。

## よくある質問

### Q. `-e KEY` のように値を書かない環境変数はどうなりますか？
A. `KEY:` とだけ出力します。ホスト側に同じ名前の環境変数があれば引き継ぐ、docker run と同じ考え方です。

### Q. `-it` や `--rm` はどこに変換されますか？
A. 変換しません。対話実行や後片付けのためのオプションで、compose.yaml の静的な設定に対応項目がないからです。`stdin_open` や `tty` が必要なら手で足してください。

### Q. `version:` が出力されないのはなぜですか？
A. 現在の Compose Specification では、トップレベルの `version:` は不要とされているためです。

### Q. 同じ環境変数を2回指定するとどうなりますか？
A. 後ろの値で上書きされます。`-e A=1 -e A=2` は `A: "2"` の1行になりました。
