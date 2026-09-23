# LINE毎日問題ボット

タイピングゲームとは別に管理する、LINE Messaging API + Google Apps Scriptの最小構成です。

## スプレッドシート

次の2シートを作成します。

`Users`

| userId | registeredAt |
| --- | --- |
|  |  |

`Questions`

| date | subject | text | answer | explanation |
| --- | --- | --- | --- | --- |
| 2026-09-23 | 算数 | 3×4はいくつ？ A 7 / B 12 / C 14 | B | 3を4回たすと12です。 |

入力例は`templates/Questions.csv`、空の利用者シートは`templates/Users.csv`にあります。Googleスプレッドシートでは、それぞれを別シートにインポートしてください。

## Apps Script設定

1. GoogleスプレッドシートからApps Scriptを開く
2. `Code.gs`の内容を貼り付ける
3. `appsscript.json`の設定を反映する
4. スクリプトプロパティに以下を登録する
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `SPREADSHEET_ID`（スプレッドシートに紐づけた場合は省略可）
5. ウェブアプリとしてデプロイし、LINE DevelopersのWebhook URLに登録する
6. LINE公式アカウントのWebhookをオンにする
7. `sendDailyQuestions`を毎日実行する時間主導型トリガーを作る

LINEで「登録」と送ると、`Users`に利用者が追加されます。問題の`date`は`yyyy-MM-dd`形式で入力してください。

アクセストークンはGitHubへ保存しないでください。子ども本人ではなく、保護者のLINEアカウントで登録・管理する運用を推奨します。

## Verifyが302になる場合

Apps ScriptのウェブアプリURLは、ブラウザではリダイレクトが追従されますが、LINEのVerifyでは302として失敗することがあります。その場合は`cloudflare-worker.js`をCloudflare Workersにデプロイし、環境変数`APPS_SCRIPT_URL`にApps Scriptの`/exec` URLを設定してください。LINEのWebhook URLにはWorkerのURLを登録します。

Cloudflare Workersの無料枠で利用できます。WorkerはApps Scriptへのリダイレクトを追従し、LINEには応答を返します。Apps Script側は最新コードを保存して再デプロイしてください。