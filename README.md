# mnm_games

小学生向けの軽量なタイピングゲームを作るための学習用リポジトリです。

## 開発環境

- TypeScript
- Vite
- HTML/CSS
- Canvas 2D

## 起動

```bash
npm install
npm run dev
```

ブラウザで表示されたURLを開いてください。

Node.js 20以上が必要です。古いmacOSではHomebrewのビルドに時間がかかる場合があるため、Node.js公式のmacOSバイナリを`$HOME/.local/node`に置き、次のPATHをzsh設定に追加する方法も使えます。

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

## ビルド

```bash
npm run build
```

古いMacBook Proでも動かしやすいよう、外部UIフレームワークやWebGLは使わず、静的ファイルとして配布できる構成にしています。

現在は、かんたん・ふつう・むずかしいの3段階、Web Audio APIによる効果音、難易度ごとの最高記録に対応しています。最高記録はブラウザの`localStorage`に数値だけ保存するため、保存データはごく小さく、サーバーへの送信もありません。

ストーリーモードでは、正解するたびに星のエフェクトでオリジナルのじゃまモンスターを追いはらいます。れんしゅうモードでは演出を気にせず入力練習ができます。音とビジュアルは既存作品の素材を使わず、このゲーム用に軽量なCanvas描画とWeb Audio APIで生成しています。

## 品質チェック

```bash
npm run lint
npm run build
```

GitHub Actionsでも、プッシュとプルリクエストのたびにlintとビルドを実行します。
