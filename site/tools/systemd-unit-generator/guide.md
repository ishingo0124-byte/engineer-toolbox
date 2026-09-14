## 使い方

1. Description・ユニット名・Type・ExecStart など各項目を入力する（入力と同時に生成されます）。
2. ExecStart は実行ファイルを絶対パスで指定します。引数がある場合は同じ行に続けて書きます。
3. 必要に応じて User/Group、Environment、Restart などを設定し、下の「生成された .service ファイル」をコピーします。
4. 配置先パスと有効化コマンドの欄も合わせて確認し、サーバー上でファイルを作成・保存します。

## 仕組み・計算式

このツールは入力値から `systemd.service(5)` と `systemd.unit(5)` の書式に沿って `[Unit]`・`[Service]`・`[Install]` の3セクションを組み立てます。空欄の項目（WorkingDirectory、User、Group、EnvironmentFile など）は行ごと出力しません。Environment 欄は1行を1つの `Environment=KEY=VALUE` 行に変換するので、複数の環境変数は複数行に分けて書きます。「=」を含まない行や、KEY部分が英数字・アンダースコア以外で始まる行はエラーとして扱い、生成を止めます。

ExecStart・WorkingDirectory・EnvironmentFile は `systemd.service(5)` の規定により絶対パスが必須で、`$PATH` を検索してのコマンド解決はできません。相対パスを入力した場合はエラーを表示します。配置先パスは `/etc/systemd/system/<ユニット名>.service` として組み立て、有効化コマンドは `systemctl daemon-reload` でユニットファイルの変更を読み込んだ上で `systemctl enable --now` により自動起動設定と即時起動をまとめて行う形にしています。

**現場の落とし穴**: `WantedBy=` を書き忘れると、`systemctl enable` 自体は成功してもシンボリックリンクが作成されず、再起動後にサービスが自動起動しません。`multi-user.target` を指定するのが一般的です。また `Type=simple`（デフォルト）は「ExecStart で起動したプロセスがそのままメインプロセスである」ことが前提で、内部で勝手にバックグラウンド化（デーモン化）するプログラムを指定すると、systemd は本来のプロセスを見失い、起動状態の把握やログの紐付けがずれることがあります。デーモン化する実装なら `Type=forking` を検討してください。

## よくある質問

### Q. Type=oneshot と Restart=always を同時に指定すると警告が出るのはなぜですか？
A. oneshot は「1回実行して終了する」ことを前提にした Type です。Restart=always と組み合わせると、コマンドが終了するたびに systemd が再起動を試み、意図せず無限に実行され続けることがあります。定期実行が目的なら `.timer` ユニットとの組み合わせを検討してください。

### Q. RestartSec は何に使われますか？
A. Restart= の条件に合致してサービスが再起動されるまでの待ち時間（秒）です。Restart=no（デフォルト）では自動再起動が発生しないため、RestartSec を指定しても無視されます。

### Q. Restart=always を設定していても `systemctl stop` で止まりますか？
A. 止まります。Restart= はプロセスが異常終了・クラッシュした場合などに systemd が自動で再起動する設定であり、`systemctl stop` のように意図的に停止指示を出した場合は再起動されません。

### Q. EnvironmentFile に指定したファイルが存在しないとどうなりますか？
A. 通常はサービスの起動に失敗します。ファイルが存在しない可能性がある場合は、パスの先頭に `-` を付けると読み込めなくてもエラーにしない挙動になります（このツールではチェックボックスで切り替えられます）。
