中古PCって大丈夫？
ミニPCで足りる？
Windows 11 も Docker もローカル LLM も、メモリは何 GB あれば動くのか。
このツールは CPU の世代・メモリ・TPM などを入れると、Windows 11・VS Code・WSL 2・Docker Desktop・Ollama に足りるかを、公式の要件ごとに合格・要確認・不足で表示します。

## 使い方

1. CPU のメーカーと世代（番台）を選び、コア数、メモリ、ストレージの容量を入れます。型番がわからないときは「わからない」で構いません。
2. TPM、UEFI セキュアブート、BIOS の仮想化機能、OS とエディションを選びます。販売ページに書かれていない項目は「不明」を選んでください。不明のまま合格にはなりません。
3. 表で用途ごとの判定と理由を読みます。各行の「未判定」は、入力欄がなくて判定できていない項目です。
4. 「結果をテキストでコピー」で、判定をメモやチャットに貼れます。

入力は選ぶだけの項目が多く、1 項目ずつ変えて表の変化を見比べることもできます。

## 仕組み・計算式

用途ごとに、公式ページの要件を条件に分けて判定しています。1 つでも満たさない条件があれば「不足」、入力が不明で決められない条件があれば「要確認」、すべて満たせば「合格」です。確認日は 2026-10-27 です。

- **Windows 11**:Microsoft「Windows 11 Specs and System Requirements」の最小要件です。1 GHz 以上で 2 コア以上の対応 64 ビットプロセッサ、RAM 4 GB、ストレージ 64 GB 以上、UEFI でセキュアブート対応、TPM 2.0 を条件にしています。
- **対応 CPU**:Microsoft Learn「Windows 11 supported Intel processors」と「Windows 11 supported AMD processors」に基づきます。Intel は第 8 世代以降の Core、AMD は Ryzen 2000 番台の一部からが掲載されています。どちらのページにも、以降の世代は一覧にない型番でも対応とみなす旨が書かれています。
- **VS Code**:Visual Studio Code「Requirements for Visual Studio Code」です。推奨は 1.6 GHz 以上のプロセッサと 1 GB の RAM で、Windows は 64 ビット版の対応バージョンです。
- **WSL 2**:Microsoft Learn「Install WSL」「Manual installation steps for older versions of WSL」です。Windows 11、または Windows 10 の Version 1903（Build 18362.1049）以降が条件で、仮想化機能も必要です。
- **Docker Desktop**:Docker Docs「Install Docker Desktop on Windows」の WSL 2 バックエンドの要件です。SLAT 対応の 64 ビットプロセッサ、システム RAM 8 GB、BIOS/UEFI のハードウェア仮想化、Windows 10 22H2 または Windows 11 23H2 以降の Enterprise・Pro・Education を条件にしています。

ここまでは、ほぼ数字を比べるだけです。

- **ローカル LLM**:Ollama の「llama2」モデルページに、7b は 8 GB、13b は 16 GB の RAM が最低限の目安と書かれています（generally require at least）。33B の 32 GB は、GitHub の Ollama README（v0.3.0）の記載です。確認した時点の現行 README 本文には RAM の記載が見当たらなかったため、モデルページとタグ付き README の記載を使っています。Windows 版の OS は、Ollama Docs「Windows」の Windows 10 22H2 以降です。

正直なところ、一番迷ったのは Ryzen 2000 番台の扱いでした。一覧には 2600 や 2700X が載っていますが、2200G や 2400G などは載っていません。世代だけで合格にはせず、要確認にしています。

## 計算例

ツールの計算ロジックを手元で動かして確かめた値です。共通の条件は、Core 第 8 世代・4 コア、ストレージ 256 GB の NVMe、TPM 2.0 あり、セキュアブート対応、仮想化は有効、Windows 11 23H2 以降の Pro です。

**例 1:メモリ 8 GB（境界）。** Windows 11、VS Code、WSL 2、Docker Desktop、7B の LLM が合格でした。Docker の要件は 8 GB なので、ちょうどで通ります。13B と 33B は不足です。

**例 2:メモリ 4 GB（境界）。** Windows 11 は 4 GB ちょうどで合格しました。VS Code と WSL 2 も合格です。Docker Desktop と、7B・13B・33B の LLM はすべて不足でした。3.9 GB と入れると、Windows 11 も不足になります。

**例 3:Core 第 7 世代、メモリ 16 GB、ストレージ 512 GB。** メモリは十分でも、Windows 11 だけが不足になりました。理由は CPU で、Microsoft の対応 CPU 一覧に第 7 世代の Core i シリーズが載っていないためです。Docker Desktop、7B と 13B の LLM は合格で、33B は不足でした。

## よくある間違い

**第 7 世代の Core i7 なら Windows 11 に上げられると思う。** 型番が i7 だと、性能の高い CPU なら大丈夫に見えますよね。ところが公式の対応 CPU は、世代で線が引かれています。例 3 のとおり、メモリが 16 GB あっても判定は変わりません。確かめるなら、Microsoft の対応 CPU 一覧か、PC Health Check で型番を見てください。

**メモリ 8 GB で Docker と LLM を同時に動かせると思う。** Docker Desktop も 7B の LLM も、単体の目安が 8 GB です。同時に動かす基準は公式にありません。単純に足せば 16 GB 相当なので、8 GB のPCでは片方ずつ使う前提で考えるのが無難です。

**HDD かどうかで判定が変わると思う。** 今回確認した公式ページには、ストレージの種類を条件にした記載がありませんでした。ツールも、HDD を選んでも判定を変えません。ただし、起動や読み込みの速さは別の話で、このツールは判定していません。気になる場合は、容量とは別に、SSD かどうかを販売ページで確かめてください。

## よくある質問

### Q. TPM があるかどうか、買う前にわかりますか?
A. 販売ページの仕様欄に「TPM 2.0」と書かれているかを見ます。書かれていなければ、出品者に聞くのが確実です。ツールで TPM を「不明」にすると、Windows 11 の行は要確認になりました。届いた後なら、Windows の「実行」で tpm.msc と入力すると TPM の情報を見られます。

### Q. 合格なら、快適に動きますか?
A. そこまでは言えません。Windows 11 の要件は最小値で、VS Code の 1 GB も「推奨」の数字です。動かす条件を満たしているかを見るツールだと考えてください。

### Q. 13B や 33B が不足でも、動かせないのですか?
A. 公式の目安は「少なくとも」という書き方で、下回ると必ず動かないとは書かれていません。このツールは目安を下回ると不足と表示します。GPU の有無は入力欄がないので、判定に入れていません。

### Q. バッテリーや保証は判定できますか?
A. できません。公式の要件に含まれない項目なので、ツールの対象外です。ノート型の中古を買うなら、バッテリーの状態と保証の有無は販売ページで別に確かめてください。
