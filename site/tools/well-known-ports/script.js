(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // データはIANA Service Name and Port Number Registryを主な典拠とする。
  // official:false は cPanel/WHM や開発用サーバーの既定ポートなど、業界慣行として広く使われているが
  // IANAの正式なサービス名登録ではない（環境やバージョンにより変わり得る）ことを示す。
  const CATEGORIES = [
    {
      cls: "infra", label: "基盤・名前解決・時刻同期・ルーティング",
      items: [
        { port: 53, proto: "TCP/UDP", name: "DNS", desc: "ドメイン名の名前解決。通常の問い合わせはUDP、ゾーン転送や応答サイズが大きい場合はTCPを使う。", sec: "再帰的な問い合わせを外部に公開するとDNSリフレクション攻撃の踏み台になり得る。" },
        { port: 67, proto: "UDP", name: "DHCP(サーバー)", desc: "DHCPサーバーがIPアドレスなどの設定をクライアントに配布する際に使うポート。" },
        { port: 68, proto: "UDP", name: "DHCP(クライアント)", desc: "DHCPクライアント側が要求・応答を受け取るポート。" },
        { port: 69, proto: "UDP", name: "TFTP", desc: "認証機構を持たない簡易ファイル転送プロトコル。PXEブートやネットワーク機器のファーム配布で使われる。", sec: "認証がないため、信頼できる内部ネットワーク以外には公開しない。" },
        { port: 123, proto: "UDP", name: "NTP", desc: "サーバーやネットワーク機器の時刻をNTPサーバーと同期する。", sec: "monlist等の機能を持つ古い実装はNTPリフレクション攻撃の踏み台にされた事例がある。" },
        { port: 135, proto: "TCP/UDP", name: "MS RPC(EPMAP)", desc: "WindowsのRPCエンドポイントマッパー。DCOMやAD関連のRPC通信の入口となる。", sec: "インターネットへの公開は厳禁。過去に本ポートを狙うワーム(Blaster等)が拡散した。" },
        { port: 137, proto: "UDP", name: "NetBIOS Name Service", desc: "Windowsファイル共有で使われるNetBIOS名の名前解決。" },
        { port: 138, proto: "UDP", name: "NetBIOS Datagram Service", desc: "NetBIOS上のコネクションレス型データグラム転送。" },
        { port: 139, proto: "TCP", name: "NetBIOS Session Service", desc: "NetBIOS上でSMB(ファイル共有)セッションを確立するための旧来の経路。現在は445番のダイレクトホスティングが主流。", sec: "445と同様に社外への公開は避ける。" },
        { port: 111, proto: "TCP/UDP", name: "rpcbind(portmapper)", desc: "ONC RPCサービスが使うポート番号をクライアントに教える仲介サービス。NFS等が利用する。", sec: "外部公開するとNFSなど内部サービスの構成情報が漏れる恐れがある。" },
        { port: 161, proto: "UDP", name: "SNMP", desc: "ネットワーク機器・サーバーの状態を取得・監視するためのプロトコル(get/walk)。", sec: "コミュニティ名が既定の\"public\"のまま外部公開され、機器情報が漏えいする事例が多い。" },
        { port: 162, proto: "UDP", name: "SNMP Trap", desc: "機器側からの異常通知(トラップ)を監視サーバーが受け取るポート。" },
        { port: 179, proto: "TCP", name: "BGP", desc: "ISPやデータセンター間でルーティング情報を交換するルーティングプロトコル。", sec: "フィルタ設定の誤りは意図しない経路広告(ルートリーク)につながる。" },
        { port: 500, proto: "UDP", name: "IKE", desc: "IPsecの鍵交換(Internet Key Exchange)に使うポート。VPN機器間のトンネル確立で使用。" },
        { port: 4500, proto: "UDP", name: "IPsec NAT-T", desc: "NAT環境を越えてIPsec通信を行うためのNATトラバーサル用ポート。" },
        { port: 520, proto: "UDP", name: "RIP", desc: "小規模ネットワーク向けの古い距離ベクトル型ルーティングプロトコル。" },
        { port: 646, proto: "TCP", name: "LDP", desc: "MPLSネットワークでラベル情報を配布するLabel Distribution Protocol。" },
        { port: 853, proto: "TCP", name: "DNS over TLS(DoT)", desc: "DNS問い合わせをTLSで暗号化して盗聴・改ざんを防ぐ仕組み。" },
        { port: 1900, proto: "UDP", name: "SSDP(UPnP)", desc: "家庭用ルーターやIoT機器同士が自動的にサービスを発見するためのプロトコル。", sec: "外部からアクセス可能な状態はSSDPリフレクション攻撃に悪用される。" },
        { port: 5353, proto: "UDP", name: "mDNS", desc: "DNSサーバーなしでローカルネットワーク内の名前解決を行うマルチキャストDNS(Bonjour/Avahi等)。" }
      ]
    },
    {
      cls: "remote", label: "リモートアクセス・端末操作",
      items: [
        { port: 22, proto: "TCP", name: "SSH", desc: "暗号化されたリモートログイン、SCP/SFTPによるファイル転送にも使われる。", sec: "公開する場合は鍵認証の必須化・総当たり攻撃対策(fail2ban等)を行う。" },
        { port: 23, proto: "TCP", name: "Telnet", desc: "暗号化のないリモートログインプロトコル。", sec: "通信が完全に平文のため、現在は使用を避けSSHに置き換えるべきとされる。" },
        { port: 3389, proto: "TCP/UDP", name: "RDP", desc: "Windowsのリモートデスクトップ接続。UDPは画面転送の高速化に使われる。", sec: "インターネットへの直接公開はブルートフォースやBlueKeep等の脆弱性の標的になりやすく、VPN経由の利用が推奨される。" },
        { port: 5900, proto: "TCP", name: "VNC", desc: "RFBプロトコルによるリモートデスクトップ共有。", sec: "実装によっては認証が弱く、外部公開はパスワード総当たりの被害を受けやすい。" },
        { port: 2222, proto: "TCP", name: "SSH代替ポート", desc: "22番の代わりに管理用SSHとして使われることがある慣行的なポート(cPanel環境等)。", official: false },
        { port: 512, proto: "TCP", name: "rexec", desc: "パスワードを平文で送るリモートコマンド実行サービス(古いUNIX系のrコマンド群の一つ)。", sec: "平文かつ認証が弱く、現在はSSHへの置き換えが前提。" },
        { port: 513, proto: "TCP", name: "rlogin", desc: "信頼ホスト関係に基づく古いリモートログインコマンド。", sec: "認証機構が脆弱なため実運用では非推奨。" },
        { port: 513, proto: "UDP", name: "who(rwho)", desc: "同一ネットワーク上でログイン中のユーザー一覧を配布する古いサービス。", sec: "ユーザー在席情報が漏えいするため内部利用に限定すべき。" },
        { port: 514, proto: "TCP", name: "rsh(remote shell)", desc: "認証なしでリモートコマンドを実行できる古いプロトコル。同じ514番でもUDPのSyslogとは別サービスである点に注意。", sec: "認証なしでコマンド実行が可能なため使用すべきでない。" }
      ]
    },
    {
      cls: "mail", label: "メール",
      items: [
        { port: 25, proto: "TCP", name: "SMTP", desc: "メールサーバー同士がメールを転送し合うためのプロトコル。", sec: "認証なしの中継を許可するとオープンリレーとしてスパム送信に悪用される。" },
        { port: 465, proto: "TCP", name: "SMTPS", desc: "接続開始時点からTLSで暗号化するSMTP(Implicit TLS)。メール送信で広く使われる。" },
        { port: 587, proto: "TCP", name: "Submission", desc: "メールクライアントがメールサーバーへ送信(投稿)するための専用ポート。STARTTLS+SMTP認証の利用が一般的。" },
        { port: 110, proto: "TCP", name: "POP3", desc: "メールをサーバーから端末へダウンロードして受信するプロトコル(平文)。", sec: "平文のため995番のPOP3S利用が望ましい。" },
        { port: 995, proto: "TCP", name: "POP3S", desc: "TLSで暗号化されたPOP3。" },
        { port: 143, proto: "TCP", name: "IMAP", desc: "サーバー上でメールを管理したまま読み書きするプロトコル(平文)。", sec: "平文のため993番のIMAPS利用が望ましい。" },
        { port: 993, proto: "TCP", name: "IMAPS", desc: "TLSで暗号化されたIMAP。" },
        { port: 119, proto: "TCP", name: "NNTP", desc: " netnews(Usenet)の記事を配信・購読するプロトコル。" },
        { port: 563, proto: "TCP", name: "NNTPS", desc: "TLSで暗号化されたNNTP。" }
      ]
    },
    {
      cls: "web", label: "Web・プロキシ・開発サーバー",
      items: [
        { port: 80, proto: "TCP", name: "HTTP", desc: "Webの標準的な平文通信。", sec: "可能な限りHTTPSへリダイレクトする構成が推奨される。" },
        { port: 443, proto: "TCP", name: "HTTPS", desc: "TLSで暗号化されたWeb通信。現代のWebサイトの標準。" },
        { port: 443, proto: "UDP", name: "HTTP/3(QUIC)", desc: "TCPではなくUDP上に構築された新しいHTTPのトランスポート層(QUIC)。同じ443番をTCP/UDP両方で使う。" },
        { port: 8080, proto: "TCP", name: "HTTP代替", desc: "80番の代わりによく使われるポート。Tomcatなどアプリケーションサーバーの既定値としても一般的。", official: false },
        { port: 8443, proto: "TCP", name: "HTTPS代替", desc: "443番の代わりによく使われるTLS用の代替ポート。", official: false },
        { port: 3128, proto: "TCP", name: "Squid(HTTPプロキシ)", desc: "Squidなどキャッシュ型HTTPプロキシの既定ポートとして広く使われる。", official: false },
        { port: 1080, proto: "TCP", name: "SOCKSプロキシ", desc: "アプリケーション非依存の汎用プロキシプロトコル。SSHのポートフォワーディングでも使われる。" },
        { port: 3000, proto: "TCP", name: "開発用サーバー", desc: "Node.js・Ruby on Rails・Grafanaなど多くの開発用/アプリの既定ポートとして慣習的に使われる。", official: false },
        { port: 5000, proto: "TCP", name: "開発用サーバー", desc: "Flaskやdocker registryなどの既定ポートとして慣習的に使われる。", official: false },
        { port: 8000, proto: "TCP", name: "開発用サーバー", desc: "Django等のフレームワークの開発用サーバーで既定として使われることが多い。", official: false },
        { port: 8009, proto: "TCP", name: "Tomcat AJP", desc: "ApacheとTomcatを連携させるApache JServ Protocol。", sec: "設定不備を突くGhostcat(CVE-2020-1938)のように、外部公開すると任意ファイル読み取り等につながった事例がある。" },
        { port: 9000, proto: "TCP", name: "PHP-FPM 等", desc: "PHP-FPM(FastCGI、通常は外部非公開)のほかSonarQubeやPortainerのWeb UIなど、用途は環境により異なる。", official: false },
        { port: 8888, proto: "TCP", name: "Jupyter Notebook", desc: "Jupyter Notebook/JupyterLabの既定の待受ポート。", official: false },
        { port: 10000, proto: "TCP", name: "Webmin", desc: "Linuxサーバーをブラウザから管理するWebminの既定ポート。", official: false },
        { port: 9418, proto: "TCP", name: "git protocol", desc: "Gitの専用プロトコル(git://)によるリポジトリの読み取り専用アクセス。", sec: "認証・暗号化がないため、公開ネットワークでの利用は減っておりHTTPS/SSH経由への移行が進んでいる。" },
        { port: 2082, proto: "TCP", name: "cPanel(HTTP)", desc: "レンタルサーバーの管理画面cPanelのHTTPアクセス用ポート(事業者標準)。", official: false },
        { port: 2083, proto: "TCP", name: "cPanel(HTTPS)", desc: "cPanel管理画面のHTTPSアクセス用ポート。", official: false },
        { port: 2086, proto: "TCP", name: "WHM(HTTP)", desc: "サーバー管理者向けWHM(Web Host Manager)のHTTPアクセス用ポート。", official: false },
        { port: 2087, proto: "TCP", name: "WHM(HTTPS)", desc: "WHMのHTTPSアクセス用ポート。", official: false },
        { port: 2095, proto: "TCP", name: "Webmail(HTTP)", desc: "cPanel環境のWebメールインターフェースのHTTPアクセス用ポート。", official: false },
        { port: 2096, proto: "TCP", name: "Webmail(HTTPS)", desc: "cPanel環境のWebメールインターフェースのHTTPSアクセス用ポート。", official: false }
      ]
    },
    {
      cls: "file", label: "ファイル転送・共有",
      items: [
        { port: 20, proto: "TCP", name: "FTP-DATA", desc: "FTPのデータ転送用コネクション(アクティブモード)。", sec: "認証情報を含め平文のため、FTPS/SFTPへの置き換えが望ましい。" },
        { port: 21, proto: "TCP", name: "FTP", desc: "FTPのコマンド(制御)コネクション。ログインIDやパスワードもここでやり取りされる。", sec: "平文のためインターネットへの公開は避けるべき。" },
        { port: 989, proto: "TCP", name: "FTPS(データ, Implicit)", desc: "接続開始時からTLSで暗号化するFTPS(Implicit TLS)のデータ用ポート。" },
        { port: 990, proto: "TCP", name: "FTPS(制御, Implicit)", desc: "FTPS(Implicit TLS)の制御用ポート。" },
        { port: 445, proto: "TCP", name: "SMB(Microsoft-DS)", desc: "Windowsのファイル共有・プリンタ共有(SMB/CIFS)。NetBIOSを介さず直接ホストする方式。", sec: "インターネットへの公開は厳禁。WannaCry等のランサムウェアが本ポートの脆弱性を悪用して拡散した。" },
        { port: 2049, proto: "TCP/UDP", name: "NFS", desc: "UNIX/Linux系で標準的に使われるネットワークファイルシステム。" },
        { port: 548, proto: "TCP", name: "AFP", desc: "旧来のmacOS(Apple Filing Protocol)によるファイル共有。現在は多くの環境でSMBに移行している。" },
        { port: 873, proto: "TCP", name: "rsync", desc: "差分転送によりファイルを効率的に同期するツール専用のデーモンポート(SSH経由の利用も可能)。", sec: "rsyncデーモンを認証なしで公開するとデータの取得・改変につながる。" },
        { port: 3260, proto: "TCP", name: "iSCSI", desc: "IPネットワーク越しにブロックストレージを共有するiSCSIターゲットの待受ポート。" },
        { port: 3690, proto: "TCP", name: "Subversion", desc: "バージョン管理システムSubversion(svnserve)専用プロトコルのポート。" },
        { port: 9100, proto: "TCP", name: "JetDirect(RAW印刷)", desc: "ネットワークプリンタへ直接印刷データを送るAppSocket/JetDirectプロトコル。" },
        { port: 515, proto: "TCP", name: "LPD", desc: "UNIX系の伝統的な印刷キューイングプロトコル(Line Printer Daemon)。" },
        { port: 631, proto: "TCP/UDP", name: "IPP", desc: "CUPS等が使うInternet Printing Protocol。ネットワークプリンタの検出・印刷ジョブ送信に使われる。" }
      ]
    },
    {
      cls: "dirauth", label: "ディレクトリ・認証基盤",
      items: [
        { port: 88, proto: "TCP/UDP", name: "Kerberos", desc: "Active Directory等で使われるチケットベースの認証プロトコル。" },
        { port: 389, proto: "TCP", name: "LDAP", desc: "ディレクトリサービスへ検索・認証のクエリを送る平文プロトコル。", sec: "平文のためLDAPS(636)またはSTARTTLSの利用が望ましい。" },
        { port: 636, proto: "TCP", name: "LDAPS", desc: "TLSで暗号化されたLDAP。" },
        { port: 3268, proto: "TCP", name: "LDAP Global Catalog", desc: "Active Directoryのフォレスト全体を横断検索できるグローバルカタログへのLDAPアクセス。" },
        { port: 3269, proto: "TCP", name: "LDAPS Global Catalog", desc: "TLSで暗号化されたグローバルカタログアクセス。" },
        { port: 749, proto: "TCP/UDP", name: "kadmin", desc: "Kerberosの管理サーバー(プリンシパルの追加・削除等)へのアクセスに使うポート。" },
        { port: 1812, proto: "UDP", name: "RADIUS(認証)", desc: "無線LANやVPN、ネットワーク機器へのログイン認証を一元管理するRADIUSの認証用ポート。" },
        { port: 1813, proto: "UDP", name: "RADIUS(アカウンティング)", desc: "RADIUSの利用状況(接続時間・データ量等)を記録するアカウンティング用ポート。" }
      ]
    },
    {
      cls: "db", label: "データベース・キャッシュ・検索基盤",
      items: [
        { port: 3306, proto: "TCP", name: "MySQL / MariaDB", desc: "MySQL・MariaDBの既定の待受ポート。", sec: "インターネットへの直接公開は避け、アプリケーションサーバーからのみ到達可能にする。" },
        { port: 5432, proto: "TCP", name: "PostgreSQL", desc: "PostgreSQLの既定の待受ポート。" },
        { port: 1433, proto: "TCP", name: "Microsoft SQL Server", desc: "SQL Serverの既定インスタンスの待受ポート。" },
        { port: 1434, proto: "UDP", name: "SQL Server Browser", desc: "名前付きインスタンスが使っているTCPポート番号をクライアントに教えるサービス。" },
        { port: 1521, proto: "TCP", name: "Oracle Database", desc: "Oracle Databaseの既定のリスナーポート。" },
        { port: 27017, proto: "TCP", name: "MongoDB", desc: "MongoDBの既定の待受ポート。", sec: "認証を有効化せず外部公開する設定が原因のデータ漏えい事例が多数報告されている。" },
        { port: 27018, proto: "TCP", name: "MongoDB(シャード)", desc: "シャーディング構成のMongoDBでシャードサーバーが使う既定ポート。" },
        { port: 6379, proto: "TCP", name: "Redis", desc: "インメモリ型のキー・バリューストア/キャッシュ。", sec: "既定では認証が無効なため、インターネット公開は厳禁。設定不備を突かれ暗号資産マイニング等に悪用された実例が多い。" },
        { port: 11211, proto: "TCP/UDP", name: "Memcached", desc: "インメモリ型の分散キャッシュサーバー。", sec: "認証機構が弱くUDPは特にDRDoS(リフレクション)攻撃の踏み台として悪用された前例がある。" },
        { port: 9200, proto: "TCP", name: "Elasticsearch(HTTP)", desc: "Elasticsearchの検索・管理用REST APIポート。", sec: "認証なしで外部公開され、蓄積データが漏えいする事例が繰り返し報告されている。" },
        { port: 9300, proto: "TCP", name: "Elasticsearch(ノード間)", desc: "Elasticsearchクラスタのノード間通信用ポート。" },
        { port: 5601, proto: "TCP", name: "Kibana", desc: "Elasticsearchのデータを可視化するダッシュボードのWeb UIポート。" },
        { port: 8983, proto: "TCP", name: "Solr", desc: "Apache Solrの管理・検索APIの既定ポート。" },
        { port: 9042, proto: "TCP", name: "Cassandra(CQL)", desc: "Apache Cassandraへのクエリ用ポート(CQLネイティブプロトコル)。" },
        { port: 7199, proto: "TCP", name: "Cassandra(JMX)", desc: "Cassandraの監視・管理用JMXポート。" },
        { port: 8086, proto: "TCP", name: "InfluxDB", desc: "時系列データベースInfluxDBのHTTP APIポート。" },
        { port: 5984, proto: "TCP", name: "CouchDB", desc: "ドキュメント指向データベースCouchDBのHTTP APIポート。" },
        { port: 8529, proto: "TCP", name: "ArangoDB", desc: "マルチモデルデータベースArangoDBの既定ポート。" },
        { port: 2181, proto: "TCP", name: "ZooKeeper", desc: "分散システムの設定管理・協調に使われるApache ZooKeeperのクライアントポート。" },
        { port: 5439, proto: "TCP", name: "Amazon Redshift", desc: "AWSのデータウェアハウスサービスRedshiftの既定接続ポート。" }
      ]
    },
    {
      cls: "msg", label: "メッセージング・監視・ログ集約",
      items: [
        { port: 514, proto: "UDP", name: "Syslog", desc: "機器やサーバーのログをネットワーク経由で集約するプロトコル。TCPの514番(rsh)とは全く別のサービスである点に注意。", sec: "送信元IPの偽装が容易な平文プロトコルのため、信頼できる管理ネットワーク内での利用が前提。" },
        { port: 9090, proto: "TCP", name: "Prometheus", desc: "メトリクス収集・監視ツールPrometheusのWeb UI/APIポート。" },
        { port: 9092, proto: "TCP", name: "Kafka", desc: "分散メッセージングシステムApache Kafkaのブローカー既定ポート。" },
        { port: 4369, proto: "TCP", name: "EPMD", desc: "Erlang Port Mapper Daemon。RabbitMQやElixirのクラスタノード探索に使われる。" },
        { port: 5671, proto: "TCP", name: "AMQP(TLS)", desc: "TLSで暗号化されたAMQP(RabbitMQ等のメッセージキュー)接続。" },
        { port: 5672, proto: "TCP", name: "AMQP", desc: "RabbitMQ等が実装するメッセージキューイングプロトコルの既定ポート。" },
        { port: 15672, proto: "TCP", name: "RabbitMQ管理画面", desc: "RabbitMQの管理UI/HTTP APIの既定ポート。", official: false },
        { port: 1883, proto: "TCP", name: "MQTT", desc: "IoT機器などで広く使われる軽量なパブリッシュ/サブスクライブ型メッセージプロトコル。" },
        { port: 8883, proto: "TCP", name: "MQTT(TLS)", desc: "TLSで暗号化されたMQTT。" },
        { port: 5044, proto: "TCP", name: "Logstash(Beats入力)", desc: "Filebeat等のBeats系エージェントからログを受信するLogstashの既定入力ポート。", official: false },
        { port: 8161, proto: "TCP", name: "ActiveMQ管理画面", desc: "Apache ActiveMQのWeb管理コンソールの既定ポート。", official: false }
      ]
    },
    {
      cls: "container", label: "コンテナ・オーケストレーション",
      items: [
        { port: 2375, proto: "TCP", name: "Docker Engine API(平文)", desc: "Docker Engineのリモート管理APIを認証・暗号化なしで公開する既定ポート。", sec: "平文かつ認証なしで公開されると、コンテナを自由に起動されホスト乗っ取りにつながる。マイニングマルウェアがスキャンする代表的なポートの一つ。" },
        { port: 2376, proto: "TCP", name: "Docker Engine API(TLS)", desc: "クライアント証明書によるTLS相互認証を行うDocker Engine APIのポート。" },
        { port: 6443, proto: "TCP", name: "Kubernetes APIサーバー", desc: "Kubernetesクラスタの操作窓口となるAPIサーバーの既定ポート。" },
        { port: 10250, proto: "TCP", name: "Kubelet API", desc: "各ノード上でPodを管理するKubeletのAPIポート。", sec: "認証設定が不十分だとノード上での任意コード実行につながるおそれがある。" },
        { port: 2379, proto: "TCP", name: "etcd(クライアント)", desc: "Kubernetesのクラスタ状態を保持する分散KVSであるetcdへのクライアントアクセス用ポート。" },
        { port: 2380, proto: "TCP", name: "etcd(ピア間)", desc: "etcdクラスタのノード間レプリケーション通信用ポート。" },
        { port: 8500, proto: "TCP", name: "Consul", desc: "サービスディスカバリ/設定管理ツールConsulのHTTP API・Web UIポート。" },
        { port: 8200, proto: "TCP", name: "Vault", desc: "シークレット管理ツールHashiCorp VaultのAPI・Web UIポート。" }
      ]
    },
    {
      cls: "voip", label: "VoIP・ストリーミング",
      items: [
        { port: 5060, proto: "TCP/UDP", name: "SIP", desc: "IP電話などで使われる呼制御プロトコル(平文)。" },
        { port: 5061, proto: "TCP", name: "SIP(TLS)", desc: "TLSで暗号化されたSIP。" },
        { port: 554, proto: "TCP/UDP", name: "RTSP", desc: "ネットワークカメラやストリーミング配信の再生制御に使われるプロトコル。" },
        { port: 1755, proto: "TCP", name: "Windows Media", desc: "Windows Media関連のストリーミングで使われた既定ポート。" }
      ]
    },
    {
      cls: "vpn", label: "VPN・トンネリング",
      items: [
        { port: 1194, proto: "UDP", name: "OpenVPN", desc: "OpenVPNの既定ポート(TCPで構成することも可能)。" },
        { port: 1701, proto: "UDP", name: "L2TP", desc: "しばしばIPsecと組み合わせて使われるトンネリングプロトコル(L2TP/IPsec)。" },
        { port: 1723, proto: "TCP", name: "PPTP", desc: "古いVPNプロトコル。制御チャネルは1723番だが、実データはGREプロトコル(IP上のプロトコル番号47)で送られる。", sec: "採用している暗号化方式(MS-CHAPv2)に既知の脆弱性があり、新規利用は推奨されない。" },
        { port: 4789, proto: "UDP", name: "VXLAN", desc: "データセンター内の仮想ネットワークをL2延伸するカプセル化プロトコル。" },
        { port: 51820, proto: "UDP", name: "WireGuard", desc: "近年広く使われる軽量・高速なVPNプロトコルの既定ポート。" }
      ]
    },
    {
      cls: "legacy", label: "レガシー・実装上の注意が必要なサービス",
      items: [
        { port: 7, proto: "TCP/UDP", name: "Echo", desc: "受け取ったデータをそのまま返す診断用サービス(RFC 862)。", sec: "UDP版は送信元を偽装した反射・増幅型DoS攻撃に利用されたことがある。" },
        { port: 13, proto: "TCP", name: "Daytime", desc: "現在時刻を人間可読な文字列で返す古いサービス(RFC 867)。" },
        { port: 19, proto: "TCP/UDP", name: "Chargen", desc: "文字列を延々と生成して送り返す診断用サービス(RFC 864)。", sec: "UDP版はEcho同様に反射・増幅型DoS攻撃の踏み台にされやすく、現在は無効化が推奨される。" },
        { port: 37, proto: "TCP/UDP", name: "Time", desc: "1900年からの経過秒数として時刻を返す古いプロトコル(RFC 868)。" },
        { port: 43, proto: "TCP", name: "Whois", desc: "ドメインやIPアドレスの登録情報を問い合わせるプロトコル。" },
        { port: 79, proto: "TCP", name: "Finger", desc: "ユーザーの在席・プロフィール情報を返す古いサービス。", sec: "個人情報の漏えいにつながるため現在はほぼ廃止されている。" },
        { port: 194, proto: "TCP", name: "IRC(登録ポート)", desc: "IRCの正式な登録ポートだが、実運用ではほぼ使われず6667番が事実上の標準になっている。" },
        { port: 6667, proto: "TCP", name: "IRC", desc: "多くのIRCサーバーが実際に使っている事実上の標準ポート。", official: false },
        { port: 6697, proto: "TCP", name: "IRC(TLS)", desc: "TLSで暗号化されたIRC接続で広く使われるポート。", official: false },
        { port: 4444, proto: "TCP", name: "krb524", desc: "IANAの正式登録名はKerberos 5から4へのチケット変換サービスだが、実務ではMetasploitなど攻撃フレームワークの既定リスナーポートとして知られ、IDS/IPSのアラートで頻繁に見かける。", sec: "不審な通信の多くはこのポートへの正規サービスではないアクセスである。" }
      ]
    }
  ];

  function toHalfWidthDigits(s) {
    return String(s || "").replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  function itemHtml(it) {
    const officialTag = it.official === false ? '<span class="wkp-tag">業界慣行(IANA正式登録外)</span>' : "";
    return (
      '<div class="wkp-item">' +
      '<div class="wkp-head"><span class="wkp-port">' + it.port + "</span>" +
      '<span class="wkp-proto">' + it.proto + "</span>" +
      '<span class="wkp-name">' + it.name + "</span>" + officialTag + "</div>" +
      '<p class="wkp-desc">' + it.desc + "</p>" +
      (it.sec ? '<p class="wkp-sec">注意: ' + it.sec + "</p>" : "") +
      "</div>"
    );
  }

  function matches(it, q) {
    if (!q) return true;
    if (String(it.port).indexOf(q) !== -1) return true;
    const hay = (it.name + " " + it.desc + " " + (it.sec || "") + " " + it.proto).toLowerCase();
    return hay.indexOf(q.toLowerCase()) !== -1;
  }

  function run() {
    const qRaw = toHalfWidthDigits($("wkp-search").value).trim();
    const results = $("wkp-results");
    let total = 0, shown = 0;
    const frag = [];
    CATEGORIES.forEach((cat) => {
      const filtered = cat.items.filter((it) => matches(it, qRaw));
      total += cat.items.length;
      shown += filtered.length;
      const defaultOpen = !qRaw && (cat.cls === "web" || cat.cls === "remote");
      const isOpen = (qRaw && filtered.length > 0) || defaultOpen;
      frag.push('<details class="wkp-cat"' + (isOpen ? " open" : "") + '>');
      frag.push("<summary>" + cat.label + "（" + filtered.length + "/" + cat.items.length + "）</summary>");
      frag.push('<div class="wkp-body">');
      if (filtered.length === 0) {
        frag.push('<p class="wkp-empty">一致するポートはありません。</p>');
      } else {
        filtered.forEach((it) => frag.push(itemHtml(it)));
      }
      frag.push("</div></details>");
    });
    results.innerHTML = frag.join("");
    $("wkp-count").textContent = qRaw
      ? shown + " / " + total + " 件が一致しました。"
      : "全 " + total + " 件を収録（現場でよく見るTCP/UDPポート）。";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("wkp-search").addEventListener("input", run);
    run();
  });
})();
