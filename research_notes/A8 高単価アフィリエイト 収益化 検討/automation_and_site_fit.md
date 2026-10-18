# A8 高単価アフィリエイト：Claude Code で自動化できる範囲と、既存サイト「エンジニアの道具箱」との適合（2026年10月18日時点）

調査日: 2026-10-18（UTC）。ローカルのリポジトリは読むだけで、変更していない。A8.net にはログインしていない。Google オートコンプリートは 2026-10-18 09:00〜09:11 UTC に `suggestqueries.google.com`（hl=ja, gl=jp）から取得した。以下「AC」と略す。

---

## 1. 既存資産（ローカルリポジトリ）の現状：何があり、何が数字になっているか

### Takeaway
公開済みのツールは93本（和暦・年齢・学年系が約20本、残りはインフラ・開発系）。検索の表示回数は28日で3,720回まで伸びた。ただし自然検索は週30〜50セッションで、28日間のアフィリエイト外部クリックは2回、収益は0円。AdSense は 2026-10-05 に「有用性の低いコンテンツ」で不承認になっている。A8 の枠はインフラ系21ページに VPS／レンタルサーバー4案件があるだけで、流入の過半を占める和暦・学年系ページには A8 の枠がない（楽天の物販リンクだけ）。

### Cited Findings

**事業ルール（変えてはいけない前提）**
- 事業の形は「無料 Web ツール集（静的サイト、完全クライアントサイド）＋広告（AdSense）＋アフィリエイト（技術書・学習サービス、PR表記）」。段2（有料版）は段1の数字が出てから — [CLAUDE.md](/home/user/engineer-toolbox/CLAUDE.md)
- 品質ルールは「正確さ＞見た目＞量」。根拠（RFC・法令名など）と落とし穴を解説に必ず書く。外部送信なし（プライバシーポリシーの約束）、CDN・外部ライブラリは禁止。解説文はオリジナルで、「自分で使ってみた人」の視点で書く（実際に入力して確かめたことだけ）。AI っぽい定型（「いかがでしたか」「ぜひ活用」）も禁止 — [CLAUDE.md](/home/user/engineer-toolbox/CLAUDE.md)、[site/TOOL_SPEC.md](/home/user/engineer-toolbox/site/TOOL_SPEC.md)
- 2026-09-29 の本部方針。企画は Search Console の実需要を最優先にし、エンジニア向けに限らず一般向けの計算・変換も対象にする。各ページに計算の根拠・出典・確認日・よくある間違いを載せる — [CLAUDE.md](/home/user/engineer-toolbox/CLAUDE.md)
- オーナーの関門は、ドメイン・ホスティング・GitHub・AdSense 申請・ASP 登録・決済登録・公開（デプロイ）。それ以外は会社側で「ボタンを押すだけ」まで整える — [CLAUDE.md](/home/user/engineer-toolbox/CLAUDE.md)
- トークン方針。実装と解説は sonnet に「4ツール1バッチ」で委任し、PV・収益の数字はスクリプトで CSV に落とす（LLM に数えさせない）。週1回の自動サイクル以外にセッションを立てない — [CLAUDE.md](/home/user/engineer-toolbox/CLAUDE.md)
- 戦略文書は「SEO アフィリ記事サイト」を見送りとしている。理由は「AI 記事の氾濫で Google の評価が厳しく、ツール（機能）のほうが差別化しやすい」。汎用計算は大手（casio 計算サイト等）と競合するので避け、インフラのニッチに寄せる方針だった（2026-09-10） — [docs/00_戦略.md](/home/user/engineer-toolbox/docs/00_戦略.md)
- 収益化の設計（段1）。ASP（A8／もしも）の対象は学習サービス（Udemy・技術スクール）と VPS／クラウドで、見込み単価は1件 ¥500〜1万。広告はツールの上に置かず、ツール直下と記事末尾の2か所だけにする。アフィリンクは解説に1〜2本、関係ない商品は貼らず、`rel="sponsored"`＋「PR」表記。収益より再訪を優先する — [docs/01_収益化.md](/home/user/engineer-toolbox/docs/01_収益化.md)
- 解説（guide.md）は2,000〜3,500字で、「計算例」と「よくある間違い」が必須（2026-10-05 改定。AdSense で「有用性の低いコンテンツ」と判定されたため） — [site/TOOL_SPEC.md](/home/user/engineer-toolbox/site/TOOL_SPEC.md)

**ツール在庫**
- `site/tools/` には93フォルダある。内訳はネットワーク（subnet-calculator・mtu-mss-calculator・vlsm-calculator など）、Linux（chmod・cron・systemd・rsync など）、開発（json-formatter・docker-run-to-compose など）、セキュリティ（cert-decoder・jwt-decoder など）、日付・和暦（wareki-converter・age-calculator・nenrei-hayamihyo・school-year-table・grade-calculator・sotsu-hayamihyo・hoikuen-class・toshiiwai-yakudoshi・eto-calculator・gengo-list など）、テキスト系 — [site/tools/](/home/user/engineer-toolbox/site/tools/)、[data/tool_backlog.csv](/home/user/engineer-toolbox/data/tool_backlog.csv)
- 未着手（todo）は zenkaku-checker・dakuten-tool・ipv6-subnet-calculator・openssl-command-builder・curl-command-builder・htpasswd-generator。wareki-year-pages（和暦の年ごとページ）は「2026-08 の量産ページ対策に注意して本部が設計してから着手」として保留中 — [data/tool_backlog.csv](/home/user/engineer-toolbox/data/tool_backlog.csv)
- 年末調整・年収の壁・最低賃金・相続・インボイスはバックログには無い。前回レポートの「90日の行動計画」に載っている。10/20〜10/31 が無料バッチ1（特定親族特別控除の判定、年収の壁2026早見、最低賃金2026 都道府県別＋深夜割増、インボイス特例の試算比較）、11/1〜11/15 が無料バッチ2（法定相続分、戸籍の年代早見、相続手続きの期限一覧、所見点検） — [reports/世の中の困りごと 有料ツール 需要調査.md](/home/user/engineer-toolbox/reports/世の中の困りごと%20有料ツール%20需要調査.md)

**検索表示と流入（data/kpi.csv）**
- 2026-10-12 記録（Search Console 〜10/9）
  - 28日: 表示3,720・クリック47。
  - 上位ページ: school-year-table（8クリック／1,588表示）、nenrei-hayamihyo（5／550）、uptime-sla（3／196）、well-known-ports（1／162）、ascii-unicode-table（3／149）、mtu-mss-calculator（7／88）。
  - 直近7日（10/3〜9）: 表示1,890・クリック16・CTR0.8%・平均順位12.4。
  - インデックス: 登録77・未登録18。
  — [data/kpi.csv](/home/user/engineer-toolbox/data/kpi.csv)
- nenrei-hayamihyo のクエリは197種あり、多くが「平成◯年は西暦何年」型（10/12 記録） — [data/kpi.csv](/home/user/engineer-toolbox/data/kpi.csv)
- 2026-10-14 記録
  - SC 7日（10/5〜11）: 表示1,520・クリック10・CTR0.7%。
  - GA4 7日: ユーザー44、自然検索35セッション、AI Assistant 1。
  - 28日の外部リンククリック（click イベント）は2回で、「アフィリエイト経由の成果はほぼ0」。
  - A8 は再ログインが必要で、未確認のまま。費用はドメイン・ホスティングとも0円。
  — [data/kpi.csv](/home/user/engineer-toolbox/data/kpi.csv)
- GA4 の自然検索セッション（7日）は 56（10/5）→36（10/9）→33（10/12）→35（10/14）と、横ばいから減少気味 — [data/kpi.csv](/home/user/engineer-toolbox/data/kpi.csv)
- school-year-table の解説は、リードが「履歴書の学歴欄、何年何月と書けばいいんだっけ。」で始まる。「履歴書の学歴欄に使える文章をコピー」する機能もある。age-calculator・wareki-converter・gengo-list のリードも履歴書の場面から入っている — [site/tools/school-year-table/guide.md](/home/user/engineer-toolbox/site/tools/school-year-table/guide.md)、[site/tools/wareki-converter/guide.md](/home/user/engineer-toolbox/site/tools/wareki-converter/guide.md)

**収益・AdSense**
- AdSense は 2026-10-05 に不承認で、「品質改善中」。収益は全期間0円 — [data/kpi.csv](/home/user/engineer-toolbox/data/kpi.csv)
- config.json には AdSense の client ID と GA4（G-9SFZJGEVDN）が設定済み。Amazon の tag は config 側が空で、data/amazon.json 側に `engineertoolb-22` がある — [site/config.json](/home/user/engineer-toolbox/site/config.json)、[site/data/amazon.json](/home/user/engineer-toolbox/site/data/amazon.json)
- AdSense の再申請は「品質の改善後」に12月の予定 — [reports/世の中の困りごと 有料ツール 需要調査.md](/home/user/engineer-toolbox/reports/世の中の困りごと%20有料ツール%20需要調査.md)

**アフィリエイト枠の実装（build.py と site/data/*.json）**
- 解説末尾の PR 枠は、楽天 → A8 → BOOTH → Amazon の順に候補を並べ、最大2つまで出す（2026-10-05 の AdSense 不承認を受けた変更） — [site/build.py](/home/user/engineer-toolbox/site/build.py)（`pr_boxes`）
- A8 枠は `data/a8.json` の `tool_map` にあるツールだけに出る。リンク先は `https://px.a8.net/svt/ejp?a8mat=…`、計測用の1×1画像付きで `rel="sponsored nofollow noopener"`。見出しには「PR」ラベルと「A8.net のアフィリエイトリンクです」の注記が付く — [site/build.py](/home/user/engineer-toolbox/site/build.py)（`a8_box`）
- A8 の提携済み案件は4つ。XServer VPS、ConoHa VPS、ConoHa WING、さくらのVPS（10/5 承認）。オーナーの承認は 2026-10-02。使うのは「掲載サイト 003 エンジニアの道具箱」で作ったリンクだけで、001/002（既存事業のサイト）のものは流用しない。シンレンタルサーバーは提携時のサイトが 001 なので使っていない。枠が出るページは21（vps 17・web 4） — [site/data/a8.json](/home/user/engineer-toolbox/site/data/a8.json)
- A8 枠のアンカー文言は a8.json の `label`（例「XServer VPS（エックスサーバー）」）と `note`（自前の説明文）から作られている — [site/data/a8.json](/home/user/engineer-toolbox/site/data/a8.json)、[site/build.py](/home/user/engineer-toolbox/site/build.py)
- 楽天枠は和暦・年齢・学年系8ページにある。中身は還暦祝い・干支の置物・ランドセル・入学祝い・お名前シールなど、楽天市場の検索結果へのリンク — [site/data/rakuten.json](/home/user/engineer-toolbox/site/data/rakuten.json)
- Amazon 枠は書籍検索へのリンクで、network/linux/security/dev カテゴリに出る。time/text カテゴリには出さない — [site/data/amazon.json](/home/user/engineer-toolbox/site/data/amazon.json)。git の履歴では60ページ — `git log` a729357
- 解説本文の中に `{{aff:key}}` と書くと差し込める仕組みもある（`rel="sponsored noopener"`）。ただし、この関数は PR ラベルを自動では付けない。参照先の `site/data/affiliate_links.json` は現在存在しない — [site/build.py](/home/user/engineer-toolbox/site/build.py)（`aff_link`）、`ls site/data`
- プライバシーポリシーの記載。入力はブラウザ内で処理して送信しない。アフィリエイト（楽天・A8.net・Amazon 等）のリンクがあり、該当箇所に PR 表記を付けている — [site/pages/privacy.md](/home/user/engineer-toolbox/site/pages/privacy.md)

**reports/ の結論（要旨のみ）**
- 「世の中の困りごと 有料ツール 需要調査」
  - 困っている人がいちばん多いのは年収の壁・年末調整などの「計算して判定する」悩みだが、無料の答えがすでにある。
  - 有料候補の順位は、1位 相続の段取りキット、2位 小さな職場のシフト・人件費点検、3位 通知表所見の点検、4位（条件付き）インボイスの受領側チェック。
  - 「ふるさと納税の上限計算、保険・ローンの比較」は有料版にせず、「段1でアフィリエイトの入口として扱う」。
  - 和暦の流入は戸籍を経て相続へ、学年・年齢の流入は19〜22歳の子の控除へ広げる。
  — [reports/世の中の困りごと 有料ツール 需要調査.md](/home/user/engineer-toolbox/reports/世の中の困りごと%20有料ツール%20需要調査.md)
- 「Claude Code 有料ツール 需要調査」
  - 汎用のトークン節約ツールは有料商品として成立しない。
  - 「節約余地診断」を無料で出し、数字が出てから有料版を作る。
  — [reports/Claude Code 有料ツール 需要調査.md](/home/user/engineer-toolbox/reports/Claude%20Code%20有料ツール%20需要調査.md)

### Inferences
- **今の流入量では、高単価案件を貼っても収益はほぼ0円（推定）**。自然検索は月150セッション前後（週35×約4.3）、外部クリックは28日で2回。単価¥1万の案件でクリックからの成約率を1〜2%と仮定しても、期待値は月¥200〜400程度にとどまる。高単価化の前に、流入を増やすこと（年末調整・相続など季節性と需要のあるクラスタの新ページ）が先に来る。
- **流入の中心（学年・年齢早見表）と A8 枠の場所がずれている**。表示回数の約57%を占める school-year-table と nenrei-hayamihyo には、A8 枠がない。school-year-table の解説は「履歴書の学歴欄」を主用途として書かれているのに、枠はランドセル・入学祝い（楽天）になっている。
- **既存の A8 枠には、規約上の確認点がある**（第3節参照）。アンカー文言を a8.json の `label` から自前で組み立てている。A8 の FAQ はテキスト素材の文言変更を許可していない。`label` が素材の原文どおりかどうかは、管理画面でしか確かめられない。
- `{{aff:}}` で本文中にリンクを差し込むと PR ラベルが付かないので、使い始める前に、近くに PR 表記を出す処理を build.py に足すべき（第4節の消費者庁 Q&A 参照）。

### Gaps
- Search Console のクエリ単位のエクスポートは、リポジトリに無い（kpi.csv の要約だけ）。school-year-table に来ているクエリのうち、「学歴 早見表」「履歴書」系がどれだけかは確かめられなかった。
- A8 の管理画面にある提携状況・クリック数・発生件数は、kpi.csv の 10/14 時点で「再ログイン要で未確認」。
- 前回レポートの90日計画のうち、無料バッチ1（10/20〜）がすでに着手されたかどうかは、リポジトリからは読み取れない（`site/tools/` に該当フォルダは無い）。

---

## 2. 流入クラスタ → 高単価カテゴリの対応（検索需要の根拠つき）

### Takeaway
訪問者の「次の一手」として自然で、かつ高単価になりやすい組み合わせは三つある。
1. 学年・学歴早見表 → 履歴書 → 転職・就活エージェント
2. 相続（予定）→ 実家・空き家の売却査定、相続に強い税理士の紹介
3. 年末調整（予定）→ 保険の見直し相談、iDeCo、ふるさと納税

一方、「年収の壁 → 転職」「最低賃金 → 転職」はオートコンプリートにほとんど出てこず、弱い。エンジニア系では、今の VPS に加えて「インフラエンジニアの転職エージェント」が自然な候補。プログラミングスクールと VPN は、サジェストの上位に否定語や別用途が並ぶので、合わない。

### Cited Findings

**和暦・年齢・学年クラスタ（既存、流入の中心）**
- 「履歴書 学歴 早見表」のサジェストに「就活 履歴書 学歴 早見表」「アルバイト 履歴書 学歴 早見表」「バイト 履歴書 学歴 早見表」「早生まれ」「和暦」「平成」「昭和」がある — [AC: 履歴書 学歴 早見表](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E5%B1%A5%E6%AD%B4%E6%9B%B8%20%E5%AD%A6%E6%AD%B4%20%E6%97%A9%E8%A6%8B%E8%A1%A8)
- 「学歴 早見表」のサジェストには「2003年生まれ」「2004」「2005年生まれ」「2026」が並ぶ。20代前半（新卒・第二新卒の年代）の生まれ年が目立つ — 同上（AC: 学歴 早見表、2026-10-18 取得）
- 「28卒 就活」のサジェストに「28卒 就活エージェント」がある。「就活 エージェント」のサジェストには「おすすめ」「28卒」「新卒」「27 卒」が並ぶ — [AC: 28卒 就活](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=28%E5%8D%92%20%E5%B0%B1%E6%B4%BB)
- 「50代 転職」には「50代 転職サイト」「50代 転職エージェント」、「定年後 仕事」には「定年後 仕事 資格」「定年後 仕事 高収入」がある（年齢早見表の利用者層に近い） — [AC: 50代 転職](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=50%E4%BB%A3%20%E8%BB%A2%E8%81%B7)
- 子どもの学年まわり
  - 「通信教育 小学生」のサジェストは「おすすめ」「比較」「ランキング」「中学受験」「安い」。
  - 「学資保険 いつから」は「いつから入る」「いつから 知恵袋」。
  - 「中学受験 いつから」は「いつから塾」。
  - 「ランドセル いつ買う」は「年中」「年長」「2027」。
  — [AC: 通信教育 小学生](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E9%80%9A%E4%BF%A1%E6%95%99%E8%82%B2%20%E5%B0%8F%E5%AD%A6%E7%94%9F)、[AC: 学資保険 いつから](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E5%AD%A6%E8%B3%87%E4%BF%9D%E9%99%BA%20%E3%81%84%E3%81%A4%E3%81%8B%E3%82%89)
- 年中行事
  - 「成人式 何年生まれ」のサジェストに「2027」「2028年 成人式 何年生まれ」。
  - 「成人式 振袖」には「レンタル」「レンタル 相場」「レンタル どこがいい」「いつ決める」。
  - 「七五三 早見表」には「早生まれ」「数え年」「2026」、「七五三 写真」には「写真スタジオ」「相場」「安い」。
  — [AC: 成人式 振袖](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E6%88%90%E4%BA%BA%E5%BC%8F%20%E6%8C%AF%E8%A2%96)、[AC: 七五三 写真](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E4%B8%83%E4%BA%94%E4%B8%89%20%E5%86%99%E7%9C%9F)

**年末調整・年収の壁（予定）**
- 「年末調整 計算」のサジェストは「計算ツール」「計算シート 令和8年」「計算ツール 令和8年」「計算サイト」。「年収の壁 計算」は「計算ツール」「計算 アプリ」「178万円 計算方法」「パート 年収の壁 計算」 — AC（年末調整 計算／年収の壁 計算、2026-10-18 取得）
- 「年末調整 保険料控除」のサジェストは「計算」「上限」「計算ツール」「書き方」。「生命保険料控除 計算」には「計算ツール 2026」「計算 住民税」がある — [AC: 年末調整 保険料控除](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E5%B9%B4%E6%9C%AB%E8%AA%BF%E6%95%B4%20%E4%BF%9D%E9%99%BA%E6%96%99%E6%8E%A7%E9%99%A4)
- 「ideco 年末調整」のサジェストは「いくら戻る シュミレーション」「いくら戻る」「書き方」「証明書」「確定申告 どっち」 — [AC: ideco 年末調整](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=ideco%20%E5%B9%B4%E6%9C%AB%E8%AA%BF%E6%95%B4)
- 「ふるさと納税 上限 計算」のサジェストは「計算方法」「計算式 詳細」「正確」「個人事業主」「源泉徴収票」 — [AC: ふるさと納税 上限 計算](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E%20%E4%B8%8A%E9%99%90%20%E8%A8%88%E7%AE%97)
- 「保険 見直し」のサジェストは「相談」「どこがいい」「シミュレーション」と、店舗型の保険相談の社名 — [AC: 保険 見直し](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E4%BF%9D%E9%99%BA%20%E8%A6%8B%E7%9B%B4%E3%81%97)
- 「年収の壁 転職」はサジェストが本体の1件だけで、「年収の壁 副業」も2件だけ。対して「年収の壁 2026 大学生」には「住民税」「社会保険」「知恵袋」が付き、「扶養 計算」には「学生」「バイト」「交通費」が並ぶ — [AC: 年収の壁 転職](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E5%B9%B4%E5%8F%8E%E3%81%AE%E5%A3%81%20%E8%BB%A2%E8%81%B7)、[AC: 年収の壁 2026 大学生](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E5%B9%B4%E5%8F%8E%E3%81%AE%E5%A3%81%202026%20%E5%A4%A7%E5%AD%A6%E7%94%9F)
- 「特定親族特別控除」のサジェストは「とは」「大学生」「わかりやすく」「令和8年」「住民税」「申請方法」「2026」 — AC（特定親族特別控除、2026-10-18 取得）
- 競合の例。sum.money は「日本の金融計算ツール 2026年版」として、手取り・年収の壁・年末調整・投資・相続などをまとめて出している。WebFetch で取得したページには、アフィリエイトリンクも PR 表記も見当たらなかった（JS で差し込む広告は取得できていない可能性がある） — [sum.money](https://sum.money/jp/)

**最低賃金（予定）**
- 「最低賃金 2026」のサジェストは「一覧」「東京」「大阪」など都道府県名が中心。「最低賃金 計算」は「計算ツール 月給」「含まれるもの」「手当」、「最低賃金 違反」は「罰則」「通報」 — [AC: 最低賃金 計算](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E6%9C%80%E4%BD%8E%E8%B3%83%E9%87%91%20%E8%A8%88%E7%AE%97)
- 「最低賃金 転職」のサジェストは本体の1件だけ — [AC: 最低賃金 転職](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E6%9C%80%E4%BD%8E%E8%B3%83%E9%87%91%20%E8%BB%A2%E8%81%B7)
- 事業者側の語。「シフト管理 アプリ」のサジェストは「無料」「おすすめ」「介護」「複数人」。「給与計算 ソフト」は「無料」「無料 おすすめ」で、無料志向が強い — [AC: シフト管理 アプリ](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E3%82%B7%E3%83%95%E3%83%88%E7%AE%A1%E7%90%86%20%E3%82%A2%E3%83%97%E3%83%AA)

**相続（予定）**
- 「法定相続分 計算」のサジェストは「計算ツール」「エクセル」「計算例」「兄弟」 — AC（法定相続分 計算、2026-10-18 取得）
- 「相続 不動産 査定」のサジェストは「方法」「額」「売却 査定」「一括 査定」。「相続 不動産」には「売却 税金シミュレーション」「3 000万円控除」がある — [AC: 相続 不動産 査定](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E7%9B%B8%E7%B6%9A%20%E4%B8%8D%E5%8B%95%E7%94%A3%20%E6%9F%BB%E5%AE%9A)
- 「実家 売却」のサジェストは「売れない」「税金」「相続 兄弟」「査定」「相談」。「空き家 売却」は「どこに 相談」「解体費用」「3 000万円控除」「特別控除」 — [AC: 実家 売却](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E5%AE%9F%E5%AE%B6%20%E5%A3%B2%E5%8D%B4)
- 「相続 税理士 費用」のサジェストは「相場」「平均」「誰が 払う」「控除」。「相続登記 義務化」は「罰則」「期限」「過去分 いつまで」「過料」。「遺品整理 費用」は「一軒家 相場」「誰が払う」 — [AC: 相続 税理士 費用](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E7%9B%B8%E7%B6%9A%20%E7%A8%8E%E7%90%86%E5%A3%AB%20%E8%B2%BB%E7%94%A8)、[AC: 相続登記 義務化](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E7%9B%B8%E7%B6%9A%E7%99%BB%E8%A8%98%20%E7%BE%A9%E5%8B%99%E5%8C%96)、[AC: 遺品整理 費用](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E9%81%BA%E5%93%81%E6%95%B4%E7%90%86%20%E8%B2%BB%E7%94%A8)
- 競合の例
  - 「業務計算ポータル（ほしがき）」(gyomu-keisan.jp) は、法定相続分の計算を「不動産」カテゴリに置いている。同じカテゴリに不動産売却の税金計算・固定資産税の日割りなどが並び、「広告収入によって運営される独立系メディア」と表示している。取得したページには、具体的なアフィリエイト導線は確認できなかった — [gyomu-keisan.jp 法定相続分](https://gyomu-keisan.jp/real-estate/houtei-souzokubun/)
  - 法律事務所が自前で法定相続分シミュレーターを出している例もある（デイライト法律事務所） — [daylight-law.jp](https://www.daylight-law.jp/inheritance/sozoku/)

**インボイス（予定）**
- 「インボイス 計算」のサジェストは「計算ツール」「計算 無料」「計算方法 消費税」。「インボイス 会計ソフト」は「必要か」「補助金」「入力方法」「個人事業主 インボイス 会計ソフト」 — [AC: インボイス 会計ソフト](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E3%82%A4%E3%83%B3%E3%83%9C%E3%82%A4%E3%82%B9%20%E4%BC%9A%E8%A8%88%E3%82%BD%E3%83%95%E3%83%88)

**エンジニア／ネットワーク系（既存）**
- 「インフラエンジニア 転職」のサジェストは「転職エージェント」「大手」「未経験」「資格」「転職エージェント おすすめ」「転職サイト」。「エンジニア 転職」には「転職エージェント」「フルリモート」がある — [AC: インフラエンジニア 転職](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E3%82%A4%E3%83%B3%E3%83%95%E3%83%A9%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%8B%E3%82%A2%20%E8%BB%A2%E8%81%B7)
- 「ccna 勉強」のサジェストは「勉強時間」「勉強方法」「勉強サイト 無料」「ping-t」「アプリ」。「lpic 勉強」も「勉強サイト 無料」「pingt」で、無料教材志向が強い — [AC: ccna 勉強](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=ccna%20%E5%8B%89%E5%BC%B7)
- 「プログラミングスクール」のサジェストは、上位に「やめとけ」「やめとけ 知恵袋」「無駄」「子供 やめとけ」が並ぶ — [AC: プログラミングスクール](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E3%82%B9%E3%82%AF%E3%83%BC%E3%83%AB)
- 「VPN おすすめ」のサジェストは「無料」「iphone」「中国」「海外から」と、個人向けのアプリ用途。「VPS おすすめ」は「mt5」「fx」「mt4」「ea」と、FX の自動売買用途が上位に来る — [AC: VPN おすすめ](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=VPN%20%E3%81%8A%E3%81%99%E3%81%99%E3%82%81)
- 「レンタルサーバー おすすめ」のサジェストは「個人」「ゲーム」「法人」「個人事業主」 — [AC: レンタルサーバー おすすめ](https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=%E3%83%AC%E3%83%B3%E3%82%BF%E3%83%AB%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%20%E3%81%8A%E3%81%99%E3%81%99%E3%82%81)

### Inferences

対応表（判定は私の推定。根拠は上のサジェストと、各ページの用途）:

| 流入クラスタ／ページ | 訪問者の次の一手（推定） | 自然な高単価カテゴリ | 適合度 | 備考 |
|---|---|---|---|---|
| school-year-table（学歴早見表）、grade-calculator、age-calculator、wareki-converter | 履歴書を書く → 応募・転職活動 | 転職エージェント・転職サイト（年代別）、新卒就活エージェント | **高** | 解説がすでに「履歴書の学歴欄」から入っている。今の楽天枠（ランドセル）は親向けで、履歴書目的の人とずれる |
| sotsu-hayamihyo（27卒・28卒） | 就活の時期を確かめる | 新卒就活エージェント・逆求人サービス | **高** | 「28卒 就活エージェント」がサジェストに出ている |
| school-year-table（親の利用）、hoikuen-class | 入学の準備 | 子ども向け通信教育・塾・家庭教師の資料請求、学資保険 | 中 | 「通信教育 小学生 比較」の需要はあるが、比較記事の競合が強い。学資保険は保険募集の規制を要確認 |
| 成人式・七五三（未作成。年齢早見表の隣） | 年中行事の予約 | 振袖レンタル・写真スタジオ | 中 | 新規の早見表ページが要る。季節性が強い（成人式は1年前から） |
| nenrei-hayamihyo・toshiiwai-yakudoshi（年祝い） | 贈り物 | 楽天の物販（現状どおり） | 現状維持 | 高単価の自然な行き先が乏しい。50代・定年の年代には転職もありうるが、早見表を見に来た人に転職を勧めるのは唐突 |
| gengo-list（明治45年 など）→ 戸籍の年代早見（予定） | 相続の手続き | 相続の流れの中で次に出てくる「実家・空き家の売却査定」「相続税理士の紹介」「相続登記（司法書士）」「遺品整理」 | **高** | 単価が最も高い帯（推定）。ただし士業紹介は法規制の確認が必須（Gaps 参照） |
| 法定相続分・相続期限一覧（予定） | 同上 | 同上 | **高** | 「相続 不動産 一括 査定」「実家 売却 査定」が実際にサジェストに出ている |
| 年末調整・保険料控除（予定） | 控除を最大化したい／保険を見直す | 保険の無料相談（FP）、iDeCo・証券口座、ふるさと納税ポータル | 中〜高 | 「ideco 年末調整 いくら戻る シュミレーション」の需要は計算ツールと直結する。金融・保険は表示規制の確認が必須 |
| 年収の壁・扶養（予定） | 学生・パートが働く時間を調整する | アルバイト求人（単価は低め）、家計相談 | 低〜中 | 「年収の壁 転職」の需要は見えない。主な層は大学生と扶養内のパート |
| 最低賃金（予定） | 労働者は時給の確認、店主は人件費の点検 | アルバイト・転職サイト（労働者）、勤怠・給与計算 SaaS の無料トライアル（店主） | 低〜中 | 「最低賃金 転職」の需要は見えない。店主側は「無料」志向が強い |
| インボイス（予定） | 計算方式を選ぶ、会計ソフトを入れる | クラウド会計ソフト、税理士紹介 | 中 | 「インボイス 会計ソフト 必要か」の需要がある。前回レポートの4位案と客層が同じ |
| インフラ系（subnet・mtu・systemd ほか） | 検証環境を立てる／キャリアを上げる | VPS（現状）、インフラエンジニア向け転職エージェント、資格学習（Udemy 等） | VPS は現状維持、転職は**中〜高** | 「インフラエンジニア 転職エージェント おすすめ」の需要がある。資格学習は無料志向 |
| プログラミングスクール | — | — | **低** | サジェストの上位が「やめとけ」系。サイトの信頼を削るおそれ |
| VPN（mtu-mss-calculator の VPN 計算） | 社内 VPN の MTU を直す | 個人向け VPN アプリ | **低** | 訪問者はネットワーク技術者、個人向け VPN の需要は「中国」「iPhone」用途で別物 |

- 最も筋が良いのは二つ。(1) 既存の最大流入ページを、履歴書の用途に沿って転職・就活の枠へつなぎ直すこと。(2) 予定している相続ページで、不動産査定と士業紹介を受けること。どちらも「計算した結果、次にやる手続き」の延長にあるので、押し売りに見えにくい（推定）。
- 年末調整は季節性が強い（11〜12月）。2026年の公開は10月下旬〜11月初めが現実的で、インデックス待ちを考えると今年の山に間に合うかは際どい（推定）。
- 既存の PR 枠は最大2つ（楽天→A8→BOOTH→Amazon の優先順）。学年系に A8 の転職枠を足すと楽天枠と枠数を取り合うので、`pr_boxes` の優先順をページ単位で決められるようにする必要がある（推定）。

### Gaps
- **A8 上の各カテゴリの案件の有無、報酬額、成果条件は確認していない**。A8 の規約が、会員限定の情報（成果条件・報酬額など）の公開を禁じているため（第3節）、公開 Web の情報は乏しい。ログインもしていない。報酬帯の比較は、別の担当の調査かオーナーの管理画面に頼る必要がある。
- **Yahoo!知恵袋の質問件数は取得できなかった**。検索ページの件数が HTML から取り出せなかった。検索ボリューム（月間回数）も、キーワードプランナー等へのアクセスが無く取得できていない。上の判定は、オートコンプリートに何が出るか（定性的な需要の有無）にもとづく。
- 相続まわりの弁護士・司法書士・税理士の紹介を成果報酬型の広告で受けることには、士業ごとの規律（紹介料の授受の制限など）がかかる。この点の一次資料は今回確認していない。保険（保険業法の募集規制）と iDeCo・証券（金融商品取引法の広告規制）のアフィリエイト表示ルールも未確認。
- keisan.casio.jp・ke!san の収益導線（どんなアフィリエイトを置いているか）は今回取得していない。

---

## 3. Claude Code が端から端までできること／人間が要ること（A8 の API・規約）

### Takeaway
ページ制作、PR 枠の割り当て、公式サイトから作る料金表、確認日の更新、レポート CSV の集計、X の投稿文づくりは Claude Code でほぼ完結できる。人間が要るのは、A8 の管理画面の中の作業すべて（提携申請・素材の選択とリンクコードの取得・レポートのダウンロード・X アカウントのサイト登録）、セルフバックと実体験レビュー、公開の承認。A8 に公開 API は見つからず、レポートは管理画面からの CSV／Excel ダウンロードになる。規約にスクレイピングを名指しで禁じる条項は無いが、ID の第三者利用は本人の行為として扱われ、過剰アクセスとボット由来のクリックは禁止されている。

### Cited Findings

**A8 の API・データ取得**
- A8.net の「メディア会員利用規約」（2026年9月1日改訂）に、API の提供を定める条項は見当たらない — [A8.net メディア会員利用規約](https://www.a8.net/compliance/media-userpolicy.php)
- 規約 4.1.6（ID、PW の管理責任）は「ID及びパスワード管理について全責任を負い、それらを第三者に利用された場合、その第三者を当該メディアとして取り扱われること」と定めている — [A8.net メディア会員利用規約](https://www.a8.net/compliance/media-userpolicy.php)
- 規約 8.1.10 は「不正アクセス、過剰なアクセス、その他不適切な方法により、サーバーダウン、システムダウン等」を禁じ、8.1.8 は「いわゆるボット等のアドフラウドと呼ばれる、機械的・人工的な方法」による成果の発生を禁じている。管理画面のクロールやスクレイピングを名指しした条項は無い — [A8.net メディア会員利用規約](https://www.a8.net/compliance/media-userpolicy.php)
- 規約 3.10 は、「ユーザー」から「ボット、メタスパイダー、マクロプログラム、又はその他の機械的手段」を除いている — [A8.net メディア会員利用規約](https://www.a8.net/compliance/media-userpolicy.php)
- 禁止事項のページは、クローラーやボットによる意図しない不正クリックが多発した場合も対処を求めることがある、としている — [A8.netでの禁止事項](https://www.a8.net/compliance/prohibited-matter.php)
- レポートは管理画面の「レポート」タブで表示し、CSV か Excel でダウンロードできる。表示期間の初期設定は直近12か月（ヘルプの要約） — [A8.net レポートの使い方](https://support.a8.net/as/supportguide/manual/step5.php)、[確定申告に必要なデータを確認したい](https://support.a8.net/a8/as/faq/2012/10/post_122.html)
- レポートの項目（発生件数・確定金額・CVR・ステータスなど）の用語説明は公式ヘルプにある — [レポート画面の各項目について](https://support.a8.net/a8/as/faq/2025/post_2611.html)

**素材・表示のルール（自動生成で踏みやすいもの）**
- A8 の FAQ「コードの一部を変更しても良いですか？」の回答
  - 「広告素材の改変は禁止していますので、コードを変更することはご遠慮ください」。
  - 「テキスト素材のテキスト文言変更やバナー素材のバナーサイズ変更は許可しておりません」。
  - 許されるのは、フォントタグによる装飾や改行の削除など「元のコードに影響のない範囲」。
  — [A8.net FAQ](https://support.a8.net/a8/as/faq/2004/08/post_40.html)
- 禁止事項として、生成された広告コードを広告主に無断で変更することが挙がっている。該当例は「バナー画像の変更、テキスト広告の文言の変更、広告コードからリンク部分のみを使用すること等」 — [A8.netでの禁止事項](https://www.a8.net/compliance/prohibited-matter.php)
- 一方、「商品リンク」のテキストは自分で考えて入力する仕組み（ヘルプの要約） — [A8.net 商品リンク作成時の項目](https://support.a8.net/a8/as/faq/2005/08/post_26.html)
- 会員登録しないと見られない情報（広告主名やプログラム名、成果条件や成果報酬額、商品名や掲載条件、それらのキャプチャなど）をサイトやメールマガジンで公開することは禁止 — [A8.netでの禁止事項](https://www.a8.net/compliance/prohibited-matter.php)
- 規約 1.1.6 は、広告配信にあたってメディアサイト内に「PR」等の表記をすることを求めている — [A8.net メディア会員利用規約](https://www.a8.net/compliance/media-userpolicy.php)
- 自分の利益のために自分で広告をクリックすることは禁止。興味がない広告への申込、同じ広告への繰り返しの申込も禁止 — [A8.netでの禁止事項](https://www.a8.net/compliance/prohibited-matter.php)
- A8 に登録していないサイト、自分で管理・運営していないサイトへの広告掲載は禁止 — [A8.netでの禁止事項](https://www.a8.net/compliance/prohibited-matter.php)

**セルフバック**
- セルフバックは「メディア会員ご本人様にご利用いただく」ことが前提。利用予定のないサービスへの申込、虚偽・他人の情報での申込、第三者の代理申込は禁止。クリック報酬型は対象外で、Web 以外（電話・店頭・FAX）の申込も成果の対象外 — [A8.net セルフバックの注意事項](https://support.a8.net/as/caution.html)

**Search Console 側**
- Search Console API の `searchanalytics.query` は、`query`・`page`・`country`・`device`・`searchAppearance`（集計軸としてさらに `date`・`hour`）で集計できる。`rowLimit` は1〜25,000（既定1,000）。`dataState` に `all`・`final`・`hourly_all` がある。API は全行を保証せず、上位の行を返す — [Google Search Console API: searchanalytics.query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- 現在の kpi.csv は「Search Console 手動確認」「Search Console + GA4」で記録されている。GA4 が「Chrome 背面で未取得」だった日もある — [data/kpi.csv](/home/user/engineer-toolbox/data/kpi.csv)

**Claude Code がこれまでに完結させた作業（リポジトリの実績）**
- 93本のツールを「企画 → 実装 → 解説 → `build.py` で検査・生成」の流れで積み上げている。A8・楽天・Amazon の PR 枠も、JSON の `tool_map` に書いてビルドするだけで全ページに反映される形になっている — [site/build.py](/home/user/engineer-toolbox/site/build.py)、[site/data/a8.json](/home/user/engineer-toolbox/site/data/a8.json)、`git log`（e892891「A8.net のPR枠を追加（インフラ系21ページ…）」、523c0e9「A8: さくらのVPS を VPS 枠に追加」）
- A8 のリンクコード（a8mat）は、オーナーが管理画面で作ったものを a8.json に転記して使っている（「オーナー承認 2026-10-02」） — [site/data/a8.json](/home/user/engineer-toolbox/site/data/a8.json)

### Inferences

**Claude Code が端から端までできること（推定。上の実績と規約にもとづく）**
1. **計算ページの企画・実装・解説**。今の手順（sonnet に4ツール1バッチ、`build.py --check`）をそのまま使える。相続・年末調整・最低賃金の計算は法令の条文と国税庁・厚労省の一次資料を出典にして、境界値テストで固める。
2. **PR 枠の割り当て**。ページの用途に合わせて `tool_map` を編集し、枠の優先順を設計する（例: school-year-table は転職・就活、相続ページは不動産査定）。
3. **比較表・料金表**。広告主の公式サイトにある公開情報（料金・プラン・無料期間）から作り、確認日を付けて、週次で差分を見る。A8 で会員限定の情報（報酬額・成果条件）は載せない。
4. **確認日の更新と、制度改正の追跡**。最低賃金・年末調整・相続登記などの改定を、一次資料で週次に確かめる。
5. **リンクの点検**。ただし **`px.a8.net` や楽天の `hb.afl` など、成果計測用のリダイレクト URL へ自動で HTTP リクエストを送らない**。送るとボット由来のクリックとして数えられ、規約 8.1.8 や禁止事項の「クローラーやbotによる意図しない不正クリック」に触れるおそれがある。点検は、a8mat の形式チェックと、広告主の LP（直接の URL）の死活確認に留める。
6. **レポート集計**。オーナーが月1回 A8 の成果レポートを CSV でダウンロードして置けば、Claude Code が kpi.csv へ集計し、ページ別・案件別の EPC（1クリックあたりの収益）を出せる。PV・収益はスクリプトで数えるという方針（CLAUDE.md）とも合う。
7. **Search Console の分析**。API を使えば、クエリ×ページの表を週次で CSV にできる（25,000行/リクエスト）。ただし、OAuth の同意かサービスアカウントへの権限付与はオーナーの作業になる。
8. **X の投稿文の下書き**（第5節）。

**人間（オーナー）が要ること**
1. **A8 の管理画面の中の作業**: 提携申請、素材の選択とリンクコードの取得、提携状況の確認、X アカウントのサイト登録、レポートのダウンロード。規約 4.1.6 では、ID の第三者利用（エージェントによるログインを含むと読める）も本人の行為として扱われる。過剰アクセスの禁止（8.1.10）もある。依頼の制約（ログインしない）を含めて、自動ログインやスクレイピングはしないのが妥当。
2. **セルフバック**: 規約上「本人」が「利用予定のあるサービス」に申し込むものなので、エージェントには代われない。
3. **実体験レビュー**: Google のレビューの指針は「自分の体験の証拠（画像・音声・リンク）」を求めている（第4節）。サイトの文章ルールも「実際に入力して確かめたことだけ」。サービスの申込体験・相談体験は人にしか作れない。
4. **公開（デプロイ）の承認**: CLAUDE.md のオーナー関門。
5. **案件の終了・条件変更の把握**: 管理画面かメールの通知を見る必要がある。

**既存実装への確認点（推定。オーナーの管理画面で確かめる必要あり）**
- `a8_box` は a8mat リンクに自前のアンカー文言（`label`）を付けている。素材が「テキスト素材」なら、A8 の FAQ が禁じる「テキスト文言変更」に当たる可能性がある。素材の原文テキストを `label` にそのまま入れるか、文言を自分で決めてよい種類の素材（商品リンクなど）を使っているかを確認すべき。1×1 の計測画像は出しているので、「リンク部分のみの使用」には当たらない作りになっている。

### Gaps
- A8 が非公開のパートナー向け API やレポートの自動配信（メール CSV など）を提供しているかは、公開情報では確認できなかった。
- A8 の報酬振込に必要な本人確認・口座登録の現行手順（2026年）は確認していない。
- 案件の終了や報酬の変更をメールで通知する仕組みがあるかは、公開ヘルプで確認していない。
- 「成果確定レポート（月別）は過去15か月分」という記述は、検索結果の要約に出てきたもの。原文では確かめていない。

---

## 4. AI 生成アフィリエイトコンテンツの成績（2025〜2026年）と Google の立場、ツールサイトが満たすべき品質の水準

### Takeaway
Google は「AI で作ったこと」自体を罰していない。しかし、価値を足さない量産（scaled content abuse）と、販売元の説明以上のものがない薄いアフィリエイト（thin affiliation）は、明確にスパム扱い。2026年は3〜10月にスパムアップデートが4回、コアアップデートが2回あった。上位の調査では、純粋な AI 記事は1位を取りにくい（Semrush 2026: 1位の80.5%が人間、AI は10%）。工房が満たすべき水準は四つ。
1. ツールとして実際に作業が完結すること
2. 一次資料を出典に、検算済みの数字を載せること
3. PR 枠が計算結果の次の手続きにだけ出ること
4. 実体験の無いランキング・おすすめ記事を作らないこと

### Cited Findings

**Google の公式の立場**
- スパムに関するポリシー（最終更新 2026-08-28）は、Scaled content abuse を「many pages are generated for the primary purpose of manipulating search rankings」と定義している。例として「Using generative AI tools or other similar tools to generate many pages without adding value for users」「Scraping feeds, search results, or other content to generate many pages」「Stitching or combining content from different web pages without adding value」を挙げる — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- 同じポリシーは thin affiliation（商品のアフィリエイトリンク付きコンテンツで価値を足さないもの）をスパムに含めている。良いアフィリエイトページの例として、価格の詳細、独自のテスト、製品の比較などを足したものを挙げる — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- 生成 AI の利用ガイダンス（最終更新 2026-10-01）
  - AI で多くのページを価値を足さずに作ると scaled content abuse に当たりうる。
  - 「It is critical to manually factcheck and review all AI-generated content」。タイトル・メタディスクリプション・構造化データ・alt も対象。
  - どう作ったかを読者に説明することを「検討する」よう勧めている（義務ではない）。
  - 評価者ガイドラインの 4.6.5 と 4.6.6 に、量産と低労力・低独自性の扱いがあると示している。
  — [Google Search Central: Using generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- レビューの書き方の指針（最終更新 2025-12-10）
  - 「Provide evidence such as visuals, audio, or other links of your own experience」。
  - 競合との違いと、用途ごとの向き不向きを説明する。
  - 複数の販売先へのリンクを検討する。
  - ランキング形式なら単独で役立つだけの中身を持たせる。
  — [Google Search Central: Write high quality reviews](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews)
- Google 検索ステータスダッシュボードに載っている2026年の更新
  - March 2026 spam update（3/24〜25）
  - March 2026 core update（3/27〜4/8）
  - May 2026 core update（5/21〜6/2）
  - June 2026 spam update（6/24〜26）
  - August 2026 spam update（8/18〜21）
  - September 2026 spam update（9/24〜10/7頃）
  
  2025年は March core（3/13〜）、June core（6/30〜）、August spam（8/26〜9/21頃）、December core（12/11〜29頃）があった — [Google Search Status Dashboard](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history)

**AI コンテンツの成績に関する調査**
- Ahrefs（2025年7月公開、Si Quan Ong・Xibeijia Guan）
  - 10万キーワードの上位20件、計60万ページを自社の AI 検出器で分類した。
  - 「純 AI」4.6%、「純人間」13.5%、混在81.9%（何らかの AI を含むのは86.5%）。
  - AI 使用の度合いと順位の相関はほぼゼロ。
  - 相関分析であり、検出器も完全ではない。
  — [Search Engine Journal](https://www.searchenginejournal.com/ahrefs-study-finds-no-evidence-google-penalizes-ai-content/550656/)、[eMarketer](https://emarketer.com/content/google-doesn-t-penalize-ai-content-86-5--of-top-pages-use-some-ai--study-finds)、[Ahrefs 原典](https://ahrefs.com/blog/ai-generated-content-does-not-hurt-your-google-rankings/)（原典は直接開いていない。数値は二次報道による）
- Semrush（2026-04-01 公開、Margarita Loktionova）
  - 2万キーワードの上位10件（20万 URL）から絞った4.2万のブログページを GPTZero で分類した（データ収集は2025年11月）。
  - 1位は人間の文章が80.5%、AI が10%（見出しの数字では80%対9%）。
  - 人間の文章は上位10位のすべての順位で AI・混在を上回り、差は1位で最も大きく、5位以降は「relatively narrow」。
  — [Semrush: Does AI content rank in search?](https://www.semrush.com/blog/does-ai-content-rank-in-search-data-study/)
- Semrush の先行調査（2025年、2万 URL）では、上位10位に入った割合は AI 57%・人間58%でほぼ同じだった（二次報道） — [MarketingProfs](https://www.marketingprofs.com/charts/2025/52670/can-ai-written-blog-posts-rank-well-on-google-search)
- Originality.ai の継続調査
  - 情報系500キーワードの上位20件で、AI 生成の割合は 2025-09-17 時点17.31%。
  - ピークは 2025-07-08 の19.56%。2019年2月は2.27%。
  — [Originality.ai: AI Content in Google Search Results](https://originality.ai/blog/ai-content-in-google-search-results)
- 国内のコラム（ベンダーの解説記事）は、2026年5月のコアアップデートで「独自の視点を欠いたAI量産コンテンツの下落と、一次情報・実体験を持つサイトの再評価」がはっきり表れたと書いている。ただし、根拠のデータは示されておらず、Google の発表でもない — [一創 コラム](https://www.issoh.co.jp/column/details/4683/)
- 二次ブログの間では、2026年8月のスパムアップデートが薄いアフィリエイトと AI 生成コンテンツに当たったかどうかで、見方が割れている — [GSQi 事例](https://gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/)、[witscode](https://witscode.com/blogs/google-august-2026-spam-update)

**日本の表示規制**
- ステルスマーケティングは2023年10月1日から景品表示法の違反になる。消費者庁の Q&A の要点は次のとおり。
  - 明瞭かどうかは特定の文言ではなく、表示全体で判断する。
  - 「広告」「宣伝」「PR」などの表記を例として挙げている。
  - アフィリエイトサイトの冒頭に「このサイトはアフィリエイト広告を利用しています」と書くだけでは足りない場合がある。サイト内の一部が第三者の客観的意見のように見える場合は、その付近にも依頼関係を示す必要がある。
  - SNS では、本文でなくリプライに「広告」と書くだけでは明瞭とはいえない場合が多い。
  — [消費者庁 ステルスマーケティングに関するQ&A](https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/stealth_marketing/)、[消費者庁 告示の案内](https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing)

**工房自身の経験**
- AdSense は 2026-10-05 に「有用性の低いコンテンツ」で不承認になった。これを受けて、解説を2,000〜3,500字に増やし、「計算例」「よくある間違い」を必須にし、PR 枠を最大2つに絞った — [site/TOOL_SPEC.md](/home/user/engineer-toolbox/site/TOOL_SPEC.md)、`git log` 283eb4f
- 和暦の年ごとページ（wareki-year-pages）は「2026-08 の量産ページ対策に注意して本部が設計してから着手」として保留している — [data/tool_backlog.csv](/home/user/engineer-toolbox/data/tool_backlog.csv)

### Inferences
- **工房の型（作業が完結するツール＋一次資料＋検算済みの計算例）は、Google の言う「価値を足したページ」に最も近い**（推定）。危ないのは三つ。(a) 高単価を狙った「おすすめ転職エージェント比較」「不動産一括査定ランキング」のような、ツールの無い記事ページを AI で増やすこと。(b) 年ごと・都道府県ごとのテンプレートページを大量に自動生成すること。(c) 計算結果と関係の薄い PR 枠を全ページに出すこと。
- **ツールサイトが満たすべき水準**（推定。上記の Google 文書・消費者庁 Q&A・AdSense 不承認の経験から）
  1. PR 枠が無くても単独で役立つ（計算・判定・コピーが完結する）。
  2. 数字は条文・告示・国税庁などの一次資料に当たり、確認日を表示する。
  3. PR 枠は「計算結果 → 次の手続き」の文脈にだけ出し、1ページ1〜2枠にする（今のルールどおり）。
  4. 比較表を載せるなら、公式サイトの公開情報で作って確認日を付け、複数の選択肢を並べる（Google のレビュー指針）。
  5. 「使ってみた」と書くのは、オーナーが実際に申込・相談した案件だけ。
  6. 本文中のリンクにも PR 表記を近くに出す。
  7. 年ごとページなどの量産は、各ページに固有の計算結果や情報が無い限りやらない。
- Semrush 2026 の結果は「1位は人間の文章が圧倒的」というもので、AI 支援でもツールの中身と実体験が入っていれば上位は狙える。ただし、純 AI の比較記事で高単価の激戦キーワード（「転職エージェント おすすめ」など）の1位を取るのは、現実的ではない（推定）。工房が取るべきなのは、計算ツールのロングテール（「法定相続分 計算 兄弟」「ideco 年末調整 いくら戻る」など）。

### Gaps
- 日本語の検索結果に限った「AI 生成アフィリエイト記事の順位」の定量調査は見つからなかった（Ahrefs・Semrush・Originality.ai はいずれも英語中心）。
- 日本の著名な SEO 実務家（個人名つき）による2026年の一次的な分析は、今回は取得できていない。国内の記述はベンダーのコラムに留まる。
- Google の評価者ガイドライン 4.6.5・4.6.6 の現行の本文は直接確認していない（生成 AI ガイダンスからの参照のみ）。

---

## 5. X 投稿の自動化：API の料金・制限・ルールと、アフィリエイト導線としての現実的な価値

### Takeaway
X API は2026年2月に従量課金が標準になった。URL 付きの投稿は1件 $0.20（約31.5円）、URL なしは $0.015。投稿の上限はユーザーあたり15分100件と緩い。費用は月30件で $6 程度と小さい。ただし、X は2026年4月にボットの大量凍結を進め、フォロー・いいね・引用の自動化を API から外した。A8 では、X アカウントのサイト登録、X 用リンクの使用、投稿冒頭の「#PR」表記が必要。フォロワーの無い新規アカウントの自動投稿がアフィリエイトのクリックを生む根拠は見つからない。価値は低いと見る（推定）。

### Cited Findings

**料金・上限**
- X は2026年2月に開発者 API を従量課金（pay-per-use）へ移した。固定月額 $200／$5,000 からの転換 — [GIGAZINE](https://www.gigazine.net/gsc_news/en/20260209-x-api-pay-per-use/)
- 公式の料金ページ（日付の記載なし、「Prices are subject to change」）の内容
  - Post: Create が $0.015/リクエスト、Create（with URL）が $0.200、Create（summoned）が $0.010、Posts: Read が $0.005/件。
  - 従量課金プランの読み取りは月300万件が上限で、超える場合は Enterprise が必要。
  - 請求サイクルごとに支出上限を設定できる。
  - カード登録と初回購入で $20 のクレジットが付く。
  — [X Developer Platform: Pricing](https://docs.x.com/x-api/getting-started/pricing)
- 国内の解説（2026-09-29 公開、10-16 更新。9/28 に公式ドキュメントと照合したもの）
  - URL 付きの投稿は $0.200（約31.5円）で、URL なしの約13倍。
  - URL の追加料金は 2026-04-20 から（4/16 告知）。同時に通常の投稿も $0.010 から $0.015 に上がった。
  - 同じ日に、フォロー・いいね・引用ポスト（と取り消し）が全セルフサーブプランで API から外れた。
  - 2026-02-23 から、API での返信は相手が @メンションか引用をした場合に限られる。
  - 新しい無料枠は確認できない。
  — [uravation: X API 料金ガイド 2026](https://uravation.com/media/x-api-pricing-guide-2026/)
- `POST /2/tweets` の上限は、ユーザーあたり 100リクエスト/15分、アプリあたり 10,000リクエスト/24時間 — [X Developer Platform: Rate limits](https://docs.x.com/x-api/fundamentals/rate-limits)

**自動化のルール**
- X の自動化ルール（公式のヘルプ。直接取得は403で失敗し、内容は検索結果の要約による）
  - スパムにあたる自動投稿・DM の禁止。
  - トレンドトピックについての自動投稿の禁止。
  - 違反時はアカウント凍結を含む措置。
  - オランダ語版には「ランディングページや広告ページを経由してから最終コンテンツを表示するような、誤解を招くリンクを自動投稿に含めない」趣旨の項（6-3）がある。
  — [X Help: Automation rules](https://help.x.com/en/rules-and-policies/x-automation)
- 2026年4月の大量凍結について、国内メディアは「X 製品責任者が毎分208のボットを削除」と報じている — [ロボイン 2026-04-09](https://roboin.io/article/2026/04/09/x-continues-massive-ban-wave-removing-208-bots-per-minute)
- リンク付き投稿の扱い
  - X の製品責任者 Nikita Bier は、リンク付き投稿を「デブーストしていない」と述べた（2025-10-20 の記事）。リーチが低いのは、リンク先を読む間に元の投稿へいいね・返信が付かず、品質の信号が弱くなるためだと説明している。
  - 2026年1月に公開されたアルゴリズムのコードには URL を罰する明示的なルールが無い、とする分析がある。一方で、「30〜50%減」とするマーケティングブログもあり、見方は割れている。
  — [ロボイン 2025-10-20](https://roboin.io/article/2025/10/20/x-product-chief-denies-rumor-that-link-posts-are-deboosted)、[PPC Land](https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/)（PPC Land は検索要約のみで、本文は未確認）

**A8 側のルール**
- A8 は X での広告掲載を認めている。手順は「A8.net管理画面でXアカウントをサイト登録する」こと。投稿の冒頭に「必ず「#PR」などの表記」を書き、リンクは「必ずX用を選択」する。掲載条件や禁止事項はプログラムごとに異なる — [A8.net Xを使ったアフィリエイトガイド](https://www.a8.net/as/x/)、[A8.net SNSアフィリエイトガイドライン](https://www.a8.net/as/sns/)
- 禁止されていることは次のとおり。
  - 広告主名・サービス名・商標で SNS アカウントを取ること。
  - 公式アカウントになりすますこと。
  - 個人宛の SNS メッセージに広告を載せること。
  - 外部非公開の SNS に掲載すること。
  — [A8.netでの禁止事項](https://www.a8.net/compliance/prohibited-matter.php)
- 消費者庁の Q&A は、SNS で本文ではなくリプライ（ツリー）に「広告」と書くだけでは明瞭とはいえない場合が多い、としている — [消費者庁 ステマQ&A](https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/stealth_marketing/)

### Inferences
- **費用は問題にならないが、効果の根拠が無い**（推定）。URL 付き投稿を1日1件（月30件）出しても $6（約900円）程度。問題は効果のほう。工房の訪問者は、検索から一度きりの答えを探しに来る生活者（学年・年齢）が中心で、X で追いかける動機が薄い。エンジニア系ツールは X の技術者コミュニティと相性があり得るが、フォロワー0から自動投稿で育つ根拠は見つからなかった。
- **自動化の範囲は「Claude Code が下書き → オーナーが手で投稿」が妥当**（推定）。理由は四つ。(a) 2026年4月以降、ボットの凍結が強化され、フォローやいいねの自動化は API から消えた。(b) A8 は X アカウントのサイト登録と X 用リンクを求めていて、管理画面の作業がどのみち要る。(c) 冒頭の #PR 表記を全投稿で守る必要がある。(d) 自動投稿にアフィリエイトのリダイレクトリンクを入れると、X の「誤解を招くリンク」の項とぶつかる可能性を否定できない。
- 狙うなら、アフィリエイトリンクを直接投稿するより、ツールページ（自サイト）へのリンクを流すほうが安全（推定）。PR 枠はサイト側に置き、X は新しいツールや改定（「最低賃金2026 の都道府県別」「年末調整の令和8年対応」など）の告知に使う。

### Gaps
- X の自動化ルール（英語版）の原文は取得できなかった（403）。アフィリエイトリンクの自動投稿の可否や、自動化アカウントのラベル要件は確認できていない。
- X 経由のアフィリエイトクリック率・成約率の、信頼できる定量データは見つからなかった。
- X の 2026年の無料枠の有無は、公式ページに記載が無かった（二次情報は「確認できない」としている）。
