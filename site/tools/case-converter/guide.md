DB のカラムは snake_case、JS の変数は camelCase、CSS のクラスは kebab-case。
同じ名前を3回書き直すのは、地味に疲れる。
HTTPServer のような略語がどう割れるかも、毎回気になる。
このツールは1行1語で貼った識別子を、camelCase など7形式に一括で変換し、入力がどの形式かも判定します。

## 使い方

1. 変換したい名前を、1行に1つずつ入力します。区切りが混ざっていても構いません。
2. 「下のリストに表示する出力形式」を選ぶと、各行の変換結果と、検出された入力形式が並びます。
3. 「選択形式を全行まとめてコピー」で、改行区切りのままコピーできます。
4. 下の一括変換表には、全行を7形式で同時に並べています。

表は列が多いので、目的の形式だけ見たいときは、上のリストを使うほうが楽です。

## 仕組み・計算式

入力はまず、スペース・`_`・`-`・`.` で分けます。次に、それぞれのかたまりを3つの境界で単語に切ります。小文字から大文字に変わるところ (`apiResponse`)、大文字の連続が大文字+小文字に変わる手前 (`HTTPServer` は `HTTP` と `Server`)、そして数字と英字の境目です。英数字と区切り記号だけの行が対象で、日本語などが混ざる行は切らずに、そのまま出力します。

切った単語は、形式ごとに組み立て直します。camelCase は最初の語を小文字にして、2語目以降の頭を大文字にします。PascalCase は全部の頭を大文字にします。snake_case と kebab-case と dot.case は全部小文字で、区切りがそれぞれ `_` `-` `.` です。CONSTANT_CASE は全部大文字、Title Case は頭を大文字にしてスペースで区切ります。略語も `Http` のように頭だけ大文字にします。

どの形式をどこで使うかは、言語や規約で決まります。Python は PEP 8 で、関数と変数が小文字+アンダースコア、定数が大文字+アンダースコア、クラスが CapWords (PascalCase) です。Go は Go Code Review Comments の「略語」の項で、`URL` や `ID` を大文字のまま保つよう書いています。.NET の大文字小文字の規約には、2文字の略語は大文字のまま、3文字以上は頭だけ大文字にする決まりがあります。

| 言語・領域 | 変数・関数 | 定数 | クラス・型 |
| --- | --- | --- | --- |
| JavaScript/TypeScript | camelCase | CONSTANT_CASE | PascalCase |
| Python (PEP 8) | snake_case | CONSTANT_CASE | PascalCase |
| Go | camelCase | MixedCaps | PascalCase |
| Ruby | snake_case | CONSTANT_CASE | PascalCase |
| CSS | kebab-case | - | - |

## 計算例

ツールの分割・変換処理を Node.js で動かして確かめた値です。

**例1: `user_first_name`。** 検出は snake_case で、camelCase は `userFirstName`、PascalCase は `UserFirstName`、kebab-case は `user-first-name`、CONSTANT_CASE は `USER_FIRST_NAME`、Title Case は `User First Name` でした。

**例2: `HTTPServerConfig`。** `["HTTP","Server","Config"]` に割れ、snake_case は `http_server_config`、camelCase は `httpServerConfig`、PascalCase は `HttpServerConfig` です。`getUserID` なら `["get","User","ID"]` で、snake_case は `get_user_id`、PascalCase は `GetUserId` になります。ID が `Id` に変わる点に注意してください。

**例3: 数字と境界値。** `version2Update` は `["version","2","Update"]` で、snake_case は `version_2_update` でした。`OAuth2Token` は `["O","Auth","2","Token"]` に割れ、snake_case は `o_auth_2_token` です。`base64Encode` も `base_64_encode` になります。`__init__` は前後のアンダースコアが消えて `init` になり、`ユーザー名` は変換されず、そのまま出ます。

## よくある間違い

**製品名や略語が思った場所で切れない。** 私が一番驚いたのは `OAuth2Token` でした。`O` と `Auth` に割れてしまい、`oauth_2_token` を期待していると外れます。`base64` や `IPv4Address` の `Pv` も同じです。ツールは文字の並びだけで切っているので、辞書は持っていません。こうした名前は、結果を見て手で直してください。

**略語を `Id` や `Url` にして、そのまま使う。** ツールは頭だけ大文字にするので、`userID` は `userId` に変わります。Go のようにこれを嫌う規約もあります。変換結果をそのまま使って大丈夫でしょうか。プロジェクトの規約と照らして確かめてください。

**前後のアンダースコアを残すつもりで変換する。** `_private` や `__init__` の先頭・末尾の `_` は区切りとして扱われ、消えます。Python のマジックメソッドや、内部用を示す接頭辞は、変換後に付け直す必要があります。

## よくある質問

### Q. 数字が途中にあるとどう扱われますか?
A. 英字との境目で、別の単語として切ります。`version2Update` が `version_2_update` になるのは、この規則のためです。

### Q. 「混在／判定不可」と出るのはどんな入力ですか?
A. `_` と大文字小文字の境目が両方ある場合や、どの典型パターンにも合わない場合です。判定が出なくても、分割と変換自体は行われます。

### Q. 文章をそのまま変換できますか?
A. できます。スペースも区切りとして扱うので、`already Title Case Words` のような入力も各形式に変わります。ただ、長い文は単語数が増えて結果が読みにくくなります。

### Q. 日本語を含むと、どうなりますか?
A. 英数字と区切り記号以外が混ざる行は、単語に切らず、元の文字列をそのまま出します。データが欠けることはありません。
