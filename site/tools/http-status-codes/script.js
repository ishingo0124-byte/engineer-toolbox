(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // データはRFC 9110（HTTP Semantics）を基準に、WebDAV(RFC 4918/5842/2518)・
  // RFC 6585・RFC 7725・RFC 8297・RFC 8470 等の拡張コード、および
  // nginx独自の499（非標準）をあわせて収録。st: "std"=標準/現行RFCで規定, "ext"=拡張仕様(WebDAV等), "nonstd"=非標準・特定実装, "dep"=非推奨。
  const CATEGORIES = [
    {
      cls: "1xx", label: "1xx informational(情報)：処理継続中の中間応答",
      items: [
        { code: 100, en: "Continue", st: "std", src: "RFC 9110",
          meaning: "リクエストの最初の部分を受け取り、残り（リクエストボディ）を送ってよいとサーバーが伝える中間応答。",
          cause: "クライアントが大きなボディを送る前に `Expect: 100-continue` を付けて事前確認した場合に発生する。",
          fix: "通常はHTTPクライアントライブラリが自動処理する。想定外に出続ける場合はExpectヘッダーの扱いをログで確認する。",
          headers: "Expect" },
        { code: 101, en: "Switching Protocols", st: "std", src: "RFC 9110",
          meaning: "クライアントが`Upgrade`ヘッダーで要求したプロトコル（WebSocketなど）への切替をサーバーが承諾した応答。",
          cause: "WebSocketハンドシェイクや HTTP/2 への切替要求など。",
          fix: "想定外に返る場合はUpgrade/Connectionヘッダーの実装（リバースプロキシの設定含む）を確認する。",
          headers: "Upgrade, Connection" },
        { code: 102, en: "Processing", st: "dep", src: "WebDAV (RFC 2518)",
          meaning: "処理に時間がかかることをクライアントに知らせ、タイムアウトによる切断を防ぐための中間応答。",
          cause: "WebDAVサーバーで複雑な操作（大量ファイルのコピー等）を実行中。",
          fix: "現在はほとんど使われていない。クライアント側のタイムアウト設定を見直す方が実用的なことが多い。",
          headers: "-" },
        { code: 103, en: "Early Hints", st: "std", src: "RFC 8297",
          meaning: "最終レスポンスの前に`Link`ヘッダー等のヒントを先行送信し、ブラウザにCSSやフォントを先読みさせるための中間応答。",
          cause: "サーバー側の処理（DBアクセス等）に時間がかかる間に、先に分かっているリソースのpreloadヒントを送る実装。",
          fix: "対応CDN/サーバーで有効化し、preloadすべきリソースをLinkヘッダーに列挙する。",
          headers: "Link" }
      ]
    },
    {
      cls: "2xx", label: "2xx success(成功)：リクエストが正常に処理された",
      items: [
        { code: 200, en: "OK", st: "std", src: "RFC 9110", meaning: "リクエストが正常に処理され、レスポンスボディに結果が含まれる標準的な成功応答。", cause: "-", fix: "-", headers: "-" },
        { code: 201, en: "Created", st: "std", src: "RFC 9110", meaning: "リクエストによって新しいリソースが作成された。", cause: "POST/PUTでのリソース新規作成成功。", fix: "-", headers: "Location（作成されたリソースのURI）" },
        { code: 202, en: "Accepted", st: "std", src: "RFC 9110", meaning: "リクエストは受理されたが、処理は完了しておらず非同期で行われる。", cause: "キューイングされるジョブ登録など。", fix: "処理状況を確認できるURLを別途案内する設計が望ましい。", headers: "-" },
        { code: 203, en: "Non-Authoritative Information", st: "std", src: "RFC 9110", meaning: "プロキシ等の仲介者がオリジンサーバーの応答を変換・改変して返した。", cause: "変換プロキシ、キャッシュの加工。", fix: "-", headers: "-" },
        { code: 204, en: "No Content", st: "std", src: "RFC 9110", meaning: "処理は成功したが返すべきボディがない。", cause: "削除成功、ボディ不要な更新の成功時など。", fix: "クライアント側は画面遷移せず現在の表示を維持するのが一般的。", headers: "-" },
        { code: 205, en: "Reset Content", st: "std", src: "RFC 9110", meaning: "成功したことに加え、クライアントに入力フォーム等の表示をリセットさせる。", cause: "フォーム送信成功後のリセット指示。", fix: "-", headers: "-" },
        { code: 206, en: "Partial Content", st: "std", src: "RFC 9110", meaning: "Rangeリクエストに対する部分的な応答。", cause: "動画のシーク再生、ダウンロード再開など。", fix: "サーバーが`Accept-Ranges: bytes`を返しているか確認する。", headers: "Content-Range, Range" },
        { code: 207, en: "Multi-Status", st: "ext", src: "WebDAV (RFC 4918)", meaning: "複数リソースへの操作結果をまとめてXMLボディで返す。", cause: "WebDAVでの一括操作（複数ファイルのCOPY/MOVE等）。", fix: "-", headers: "-" },
        { code: 208, en: "Already Reported", st: "ext", src: "WebDAV (RFC 5842)", meaning: "バインディング（複数の親から参照されるリソース）を207応答内で重複報告しないための補助コード。", cause: "WebDAVの高度な機能利用時のみ。", fix: "-", headers: "-" },
        { code: 226, en: "IM Used", st: "ext", src: "RFC 3229", meaning: "差分転送（インスタンス操作）の結果としてのレスポンスであることを示す。", cause: "帯域節約のための差分配信の実装。", fix: "-", headers: "-" }
      ]
    },
    {
      cls: "3xx", label: "3xx redirection(リダイレクト)：追加のアクションが必要",
      items: [
        { code: 300, en: "Multiple Choices", st: "std", src: "RFC 9110", meaning: "要求に対して複数の選択肢があり、サーバー側で自動的に1つに決められない。", cause: "コンテンツネゴシエーションの候補が複数ある場合。実運用での使用例は少ない。", fix: "-", headers: "-" },
        { code: 301, en: "Moved Permanently", st: "std", src: "RFC 9110", meaning: "リソースが恒久的に新しいURIへ移転した。", cause: "URL構造の恒久的な変更、ドメイン移行。", fix: "検索エンジン評価を引き継ぐため恒久リダイレクトには301か308を使う。旧実装ではPOSTがGETに変わることがある点に注意。", headers: "Location" },
        { code: 302, en: "Found", st: "std", src: "RFC 9110", meaning: "リソースが一時的に別のURIにある。", cause: "一時的な切替（メンテナンス中の代替ページ表示等）。", fix: "歴史的経緯によりクライアントがメソッドをGETに変えてしまう実装があるため、メソッドを保持したい場合は307を使う。", headers: "Location" },
        { code: 303, en: "See Other", st: "std", src: "RFC 9110", meaning: "処理結果を別のURIへGETで取得させる。", cause: "フォームPOST処理後に結果ページへ誘導する Post/Redirect/Get パターン。", fix: "再読み込みでの二重送信防止に有効。フォーム再送信防止の定石。", headers: "Location" },
        { code: 304, en: "Not Modified", st: "std", src: "RFC 9110", meaning: "条件付きリクエストの結果、キャッシュ済みの内容が最新であることを示す。ボディは送られない。", cause: "`If-None-Match`や`If-Modified-Since`がサーバー側の値と一致した場合。", fix: "ETag/Last-Modifiedをサーバーが正しく発行しているか確認する。", headers: "ETag, Last-Modified, If-None-Match, If-Modified-Since" },
        { code: 305, en: "Use Proxy", st: "dep", src: "RFC 9110（非推奨）", meaning: "指定のプロキシ経由でアクセスすべきことを示す。", cause: "-", fix: "セキュリティ上の懸念から多くのクライアントが無視する。現在は使用が推奨されない。", headers: "-" },
        { code: 306, en: "(unused)", st: "dep", src: "RFC 9110", meaning: "過去に使われていたが現在は予約済みで未使用のコード。", cause: "-", fix: "-", headers: "-" },
        { code: 307, en: "Temporary Redirect", st: "std", src: "RFC 9110", meaning: "一時的な移転。302と異なりメソッドとボディを変更せずに再送することが規定されている。", cause: "APIのメソッド・ボディを保ったまま一時的に転送したい場合。", fix: "-", headers: "Location" },
        { code: 308, en: "Permanent Redirect", st: "std", src: "RFC 9110", meaning: "恒久的な移転。301と異なりメソッドとボディを変更せずに再送する。", cause: "APIエンドポイントの恒久的な移設など、メソッド保持が必要な恒久リダイレクト。", fix: "-", headers: "Location" }
      ]
    },
    {
      cls: "4xx", label: "4xx client error(クライアントエラー)：リクエスト側に問題がある",
      items: [
        { code: 400, en: "Bad Request", st: "std", src: "RFC 9110", meaning: "構文エラーなどでサーバーがリクエストを解釈できない。", cause: "不正なJSON、必須パラメータ欠落、文字コード不正など。", fix: "リクエストボディ・ヘッダーの形式をクライアント側で検証する。エラーレスポンスの詳細メッセージを確認する。", headers: "-" },
        { code: 401, en: "Unauthorized", st: "std", src: "RFC 9110", meaning: "認証が必要、または提示された認証情報が無効。", cause: "未ログイン、トークン期限切れ、Authorizationヘッダー欠落。", fix: "再認証を促す。サーバー側は`WWW-Authenticate`で認証方式を示す必要がある。", headers: "WWW-Authenticate, Authorization" },
        { code: 402, en: "Payment Required", st: "std", src: "RFC 9110（予約）", meaning: "将来の利用のために予約されているステータス。", cause: "一部のAPIで課金上限超過を示す独自用途に転用される例がある。", fix: "-", headers: "-" },
        { code: 403, en: "Forbidden", st: "std", src: "RFC 9110", meaning: "サーバーはリクエストを理解したが、権限がないため拒否した。", cause: "アクセス権限不足、IP制限、WAFによるブロック。", fix: "認証情報や権限設定を確認する。401と異なり再認証しても解決しない場合が多い。", headers: "-" },
        { code: 404, en: "Not Found", st: "std", src: "RFC 9110", meaning: "指定されたリソースが見つからない。", cause: "URLの誤り、リソースの削除、ルーティング設定漏れ。", fix: "URLの綴り、末尾スラッシュ、ルーティング定義を確認する。", headers: "-" },
        { code: 405, en: "Method Not Allowed", st: "std", src: "RFC 9110", meaning: "そのリソースに対して使用したHTTPメソッドが許可されていない。", cause: "GETのみ許可のエンドポイントにPOSTした等。", fix: "許可されているメソッドは`Allow`ヘッダーで確認できる。", headers: "Allow" },
        { code: 406, en: "Not Acceptable", st: "std", src: "RFC 9110", meaning: "`Accept`系ヘッダーが要求する表現をサーバーが提供できない。", cause: "サーバーが対応していないレスポンス形式・言語・文字コードを要求した。", fix: "Acceptヘッダーの内容とサーバーの対応形式を照合する。", headers: "Accept, Accept-Language, Accept-Charset" },
        { code: 407, en: "Proxy Authentication Required", st: "std", src: "RFC 9110", meaning: "プロキシサーバーへの認証が必要。", cause: "社内プロキシ等の認証情報未設定。", fix: "-", headers: "Proxy-Authenticate, Proxy-Authorization" },
        { code: 408, en: "Request Timeout", st: "std", src: "RFC 9110", meaning: "クライアントがサーバーの待機時間内にリクエストを完了できなかった。", cause: "低速回線、クライアント側の処理遅延。", fix: "リクエストの分割やタイムアウト設定の見直し。多くの場合クライアント側で再試行すれば解決する。", headers: "-" },
        { code: 409, en: "Conflict", st: "std", src: "RFC 9110", meaning: "リソースの現在の状態とリクエストが競合している。", cause: "楽観的ロックでの版番号不一致、同時編集の衝突。", fix: "最新の状態を再取得してから再送する。", headers: "-" },
        { code: 410, en: "Gone", st: "std", src: "RFC 9110", meaning: "リソースが恒久的に削除され、今後も存在しないことを示す。", cause: "意図的な恒久削除。404との違いは「二度と戻らない」ことを明示する点。", fix: "検索エンジンやクローラーへ恒久的な削除を伝えたい場合に404より適切。", headers: "-" },
        { code: 411, en: "Length Required", st: "std", src: "RFC 9110", meaning: "`Content-Length`ヘッダーが必須なのに指定されていない。", cause: "チャンク転送非対応のサーバーへボディ長不明のリクエストを送った。", fix: "Content-Lengthを付与するかチャンク転送に対応させる。", headers: "Content-Length" },
        { code: 412, en: "Precondition Failed", st: "std", src: "RFC 9110", meaning: "`If-Match`等の条件付きリクエストの前提条件が満たされなかった。", cause: "更新対象がリクエスト時点から変更されていた（楽観ロック）。", fix: "最新のETagを取得して条件を付け直す。", headers: "If-Match, If-Unmodified-Since" },
        { code: 413, en: "Content Too Large", st: "std", src: "RFC 9110（旧称 Payload Too Large）", meaning: "リクエストボディがサーバーの許容量を超えている。", cause: "大きすぎるファイルアップロード。", fix: "サーバー・リバースプロキシ（nginxの`client_max_body_size`等）の上限設定を確認する。", headers: "-" },
        { code: 414, en: "URI Too Long", st: "std", src: "RFC 9110", meaning: "リクエストURIが長すぎてサーバーが処理を拒否した。", cause: "GETパラメータへの大量データ埋め込み。", fix: "大きなデータはPOSTボディで送る設計に見直す。", headers: "-" },
        { code: 415, en: "Unsupported Media Type", st: "std", src: "RFC 9110", meaning: "リクエストの`Content-Type`をサーバーが処理できない。", cause: "APIがJSONのみ受け付けるのにフォームエンコードで送った等。", fix: "Content-Typeをサーバーが期待する形式に合わせる。", headers: "Content-Type" },
        { code: 416, en: "Range Not Satisfiable", st: "std", src: "RFC 9110", meaning: "指定された`Range`がリソースの範囲外で満たせない。", cause: "ダウンロード再開位置がファイルサイズを超えている等。", fix: "Rangeの指定値をリソースサイズと照合する。", headers: "Content-Range, Range" },
        { code: 417, en: "Expectation Failed", st: "std", src: "RFC 9110", meaning: "`Expect`ヘッダーで要求された条件をサーバーが満たせない。", cause: "中間プロキシがExpect: 100-continueに未対応など。", fix: "-", headers: "Expect" },
        { code: 418, en: "I'm a teapot", st: "nonstd", src: "RFC 2324（エイプリルフールRFC）", meaning: "「私はティーポットである」というジョークとして生まれたコードで、RFC 9110には規定されていない非公式なステータス。", cause: "一部のフレームワークやボット対策・イースターエッグ的な実装で意図的に返される。", fix: "仕様として依存すべきではない。実運用APIでは400系の別コードを使うのが適切。", headers: "-" },
        { code: 421, en: "Misdirected Request", st: "std", src: "RFC 9110", meaning: "接続先のサーバーが、要求されたオーソリティ（ホスト）に対する応答を生成できない。", cause: "HTTP/2等でのコネクション再利用時、証明書やホスト設定の不一致。", fix: "TLS証明書のSAN設定やリバースプロキシのホストルーティングを確認する。", headers: "-" },
        { code: 422, en: "Unprocessable Content", st: "std", src: "RFC 9110（旧称 Unprocessable Entity, WebDAV RFC 4918）", meaning: "構文は正しいが意味的に処理できない。バリデーションエラーの表現によく使われる。", cause: "必須項目の値が業務ルールに反する等、フォーマットは正しいが内容が不正な入力。", fix: "レスポンスボディのエラー詳細を確認し、入力値を修正する。", headers: "-" },
        { code: 423, en: "Locked", st: "ext", src: "WebDAV (RFC 4918)", meaning: "対象リソースがロックされている。", cause: "WebDAVでの排他ロック中に別クライアントが操作した。", fix: "-", headers: "-" },
        { code: 424, en: "Failed Dependency", st: "ext", src: "WebDAV (RFC 4918)", meaning: "同時実行された別の操作が失敗したため、この操作も失敗した。", cause: "WebDAVの複合操作での連鎖失敗。", fix: "-", headers: "-" },
        { code: 425, en: "Too Early", st: "std", src: "RFC 8470", meaning: "TLS 1.3の0-RTTで送られ、再送攻撃対策が取れないリクエストの処理をサーバーが拒否した。", cause: "0-RTTデータでの非冪等なリクエスト（POST等）送信。", fix: "クライアントは1-RTTハンドシェイク完了後に再送する。", headers: "-" },
        { code: 426, en: "Upgrade Required", st: "std", src: "RFC 9110", meaning: "`Upgrade`ヘッダーで示すプロトコルへの切替がサーバーに必須とされている。", cause: "TLS必須のエンドポイントへ平文で接続した場合など。", fix: "指定されたプロトコルにアップグレードして再接続する。", headers: "Upgrade" },
        { code: 428, en: "Precondition Required", st: "std", src: "RFC 6585", meaning: "`If-Match`等の前提条件ヘッダーの指定がリクエストに必須なのに欠落している。", cause: "更新の競合（lost update）を防ぐためサーバーが条件付きリクエストを強制している。", fix: "対象の最新ETagを取得し、If-Matchを付けて再送する。", headers: "If-Match" },
        { code: 429, en: "Too Many Requests", st: "std", src: "RFC 6585", meaning: "一定時間内のリクエスト数がレート制限の上限を超えた。", cause: "短時間の連続アクセス、APIクォータ超過、ブルートフォース対策の作動。", fix: "`Retry-After`で示された時間だけ待って再試行する。バックオフ処理を実装する。", headers: "Retry-After" },
        { code: 431, en: "Request Header Fields Too Large", st: "std", src: "RFC 6585", meaning: "リクエストヘッダーの総サイズが大きすぎる。", cause: "巨大なCookie、過剰なカスタムヘッダー。", fix: "不要なCookie・ヘッダーを削減する。", headers: "-" },
        { code: 451, en: "Unavailable For Legal Reasons", st: "std", src: "RFC 7725", meaning: "法的な理由（裁判所命令や検閲要求等）によりリソースを提供できない。", cause: "著作権侵害申立、各国の法規制による接続遮断。", fix: "対応する法的根拠を明示するのが慣例。ユーザー側での回避は推奨されない。", headers: "-" },
        { code: 499, en: "Client Closed Request", st: "nonstd", src: "nginx独自（非標準）", meaning: "サーバーが応答を返す前にクライアント側が接続を切断したことを示す、nginx固有の内部ログ用コード。", cause: "上流処理が遅くクライアントやロードバランサーがタイムアウトで切断した、ユーザーがページを閉じた等。", fix: "上流（アプリケーションサーバー）の応答時間を調べ、必要ならタイムアウト設定を見直す。ブラウザには返らずアクセスログにのみ現れる。", headers: "-" }
      ]
    },
    {
      cls: "5xx", label: "5xx server error(サーバーエラー)：サーバー側に問題がある",
      items: [
        { code: 500, en: "Internal Server Error", st: "std", src: "RFC 9110", meaning: "サーバー内部で予期しないエラーが発生した。", cause: "未処理の例外、設定ミス、依存サービスの異常。", fix: "サーバーのアプリケーションログ・エラーログを確認する。", headers: "-" },
        { code: 501, en: "Not Implemented", st: "std", src: "RFC 9110", meaning: "サーバーがそのメソッドや機能をサポートしていない。", cause: "未実装のHTTPメソッドでのアクセス。", fix: "-", headers: "-" },
        { code: 502, en: "Bad Gateway", st: "std", src: "RFC 9110", meaning: "プロキシ/ゲートウェイとして動作するサーバーが、上流サーバーから不正な応答を受け取った。", cause: "アプリケーションサーバーのクラッシュ・再起動中、上流のプロトコル不一致。", fix: "上流（アプリケーションサーバー）のプロセスが生きているか、リバースプロキシの接続先設定を確認する。", headers: "-" },
        { code: 503, en: "Service Unavailable", st: "std", src: "RFC 9110", meaning: "サーバーが一時的に処理できない状態（過負荷やメンテナンス）。", cause: "アクセス集中、計画メンテナンス、ヘルスチェック失敗によるロードバランサーからの除外。", fix: "`Retry-After`を確認して再試行する。恒常的に出る場合はキャパシティやオートスケール設定を見直す。", headers: "Retry-After" },
        { code: 504, en: "Gateway Timeout", st: "std", src: "RFC 9110", meaning: "プロキシ/ゲートウェイが上流サーバーからの応答を時間内に受け取れなかった。", cause: "上流処理（重いDBクエリ等）が遅く、プロキシのタイムアウト時間を超えた。", fix: "上流の処理時間を短縮するか、プロキシのタイムアウト値を見直す。502との違いは「応答が無かった/遅すぎた」点。", headers: "-" },
        { code: 505, en: "HTTP Version Not Supported", st: "std", src: "RFC 9110", meaning: "リクエストで使われたHTTPのバージョンをサーバーがサポートしていない。", cause: "古い/新しすぎるHTTPバージョンでの接続。", fix: "-", headers: "-" },
        { code: 506, en: "Variant Also Negotiates", st: "ext", src: "RFC 2295", meaning: "コンテントネゴシエーションの内部設定が循環参照になっているサーバー側の構成ミス。", cause: "透過的コンテントネゴシエーションの設定誤り（実運用での遭遇頻度は非常に低い）。", fix: "-", headers: "-" },
        { code: 507, en: "Insufficient Storage", st: "ext", src: "WebDAV (RFC 4918)", meaning: "サーバーのストレージ容量不足で操作を完了できない。", cause: "ディスク容量枯渇。", fix: "サーバーの空き容量を確認する。", headers: "-" },
        { code: 508, en: "Loop Detected", st: "ext", src: "WebDAV (RFC 5842)", meaning: "リクエスト処理中に無限ループを検出した。", cause: "WebDAVのバインディング設定の誤りによる循環参照。", fix: "-", headers: "-" },
        { code: 510, en: "Not Extended", st: "ext", src: "RFC 2774", meaning: "リクエストを満たすにはさらなる拡張（extension）が必要。", cause: "実運用での使用例は極めて少ない。", fix: "-", headers: "-" },
        { code: 511, en: "Network Authentication Required", st: "std", src: "RFC 6585", meaning: "ネットワークへの接続自体に認証（ログイン）が必要。", cause: "公衆Wi-Fi等のキャプティブポータルで未ログインの状態。", fix: "ブラウザでポータルのログイン画面を開いて認証する。", headers: "-" }
      ]
    }
  ];

  function toHalfWidthDigits(s) {
    return String(s || "").replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  function tagLabel(st) {
    switch (st) {
      case "std": return "";
      case "dep": return '<span class="hsc-tag">非推奨</span>';
      case "ext": return '<span class="hsc-tag">拡張仕様(WebDAV等)</span>';
      case "nonstd": return '<span class="hsc-tag">非標準</span>';
      default: return "";
    }
  }

  function itemHtml(it) {
    return (
      '<div class="hsc-item" data-code="' + it.code + '">' +
      '<div class="hsc-head"><span class="hsc-code">' + it.code + "</span>" +
      '<span class="hsc-en">' + it.en + "</span>" + tagLabel(it.st) + "</div>" +
      "<dl>" +
      "<dt>意味</dt><dd>" + it.meaning + "</dd>" +
      (it.cause && it.cause !== "-" ? "<dt>よくある原因</dt><dd>" + it.cause + "</dd>" : "") +
      (it.fix && it.fix !== "-" ? "<dt>対処</dt><dd>" + it.fix + "</dd>" : "") +
      (it.headers && it.headers !== "-" ? '<dt>関連ヘッダー</dt><dd class="mono">' + it.headers + "</dd>" : "") +
      "<dt>出典</dt><dd>" + it.src + "</dd>" +
      "</dl></div>"
    );
  }

  function matches(it, q) {
    if (!q) return true;
    if (String(it.code).indexOf(q) !== -1) return true;
    const hay = (it.en + " " + it.meaning + " " + it.cause + " " + it.fix + " " + it.headers).toLowerCase();
    return hay.indexOf(q.toLowerCase()) !== -1;
  }

  function run() {
    const qRaw = toHalfWidthDigits($("hsc-search").value).trim();
    const results = $("hsc-results");
    let total = 0, shown = 0;
    const frag = [];
    CATEGORIES.forEach((cat) => {
      const filtered = cat.items.filter((it) => matches(it, qRaw));
      total += cat.items.length;
      shown += filtered.length;
      const defaultOpen = !qRaw && cat.cls === "4xx"; // 初期表示は最も検索されやすい4xxを開いておく
      const isOpen = (qRaw && filtered.length > 0) || defaultOpen;
      frag.push('<details class="hsc-cat"' + (isOpen ? " open" : "") + '>');
      frag.push("<summary>" + cat.label + "（" + filtered.length + "/" + cat.items.length + "）</summary>");
      frag.push('<div class="hsc-body">');
      if (filtered.length === 0) {
        frag.push('<p class="hsc-empty">一致するコードはありません。</p>');
      } else {
        filtered.forEach((it) => frag.push(itemHtml(it)));
      }
      frag.push("</div></details>");
    });
    results.innerHTML = frag.join("");
    $("hsc-count").textContent = qRaw
      ? shown + " / " + total + " 件が一致しました。"
      : "全 " + total + " 件を収録（1xx〜5xxの標準コードと主要な拡張コード）。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("hsc-search").addEventListener("input", run);
    run();
  });
})();
