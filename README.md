gas-stripe-controller
=====================

Stripe の支払い・請求・セッションなどの情報を、Google Apps Script（GAS）を使って取得し、スプレッドシートなどに出力するためのスクリプト群です。

## 概要

このプロジェクトは、Stripe API から各種決済情報を取得し、Google スプレッドシートに自動的に出力するための GAS スクリプトです。各関数は最新のデータのみを取得し、既存のデータと重複しないように管理します。

## 特徴

- ✅ **API効率化**: Stripe API の expand パラメータを活用し、API呼び出し回数を最大66%削減
- ✅ **堅牢なエラーハンドリング**: 統一されたエラー処理とSlack通知による監視
- ✅ **保守性の高い設計**: 設定の一元管理、共通関数化により保守性を向上
- ✅ **重複防止**: タイムスタンプベースの厳密な重複チェック
- ✅ **clasp対応**: ローカル開発環境でのコーディングとバージョン管理に対応

## ファイル構成

### コアファイル

#### `config.js`
- **機能**: プロジェクト全体の設定を一元管理
- **内容**:
  - シート名の定数（`SHEETS.CHARGE`, `SHEETS.INVOICE`等）
  - セル位置の定数（最新日付セル、挿入位置）
  - Stripe APIのリミット値とエンドポイント
  - Slack通知設定

#### `utils.js`
- **機能**: 共通ユーティリティ関数群
- **主な関数**:
  - `getLatestDate(sheetName)`: 最新日付を取得
  - `outputToSheet(sheetName, dataArray)`: スプレッドシートにデータを出力
  - `unixToDate(unixTime)`: UNIX時刻をDateオブジェクトに変換
  - `getCustomerName(customer)`: 顧客名を取得（expand対応）
  - `handleError(err, functionName)`: 統一されたエラーハンドリング
  - `buildStripeUrl(endpoint, params)`: Stripe API URLを構築

#### `getStripeInfo.js`
- **機能**: Stripe API から情報を取得する共通関数
- **処理内容**:
  - スクリプトプロパティから Stripe のシークレットキー（`SECRET_KEY`）を取得・検証
  - Bearer トークン認証で Stripe API にリクエストを送信
  - HTTPステータスコードの検証（200以外はエラー）
  - 詳細なエラーログ記録
  - レスポンスを JSON 形式で返却

### データ出力関数

#### `outputChargeInfo.js`
- **機能**: Stripe の取引情報（Charges）をスプレッドシートに出力
- **処理内容**:
  - Stripe API から取引情報（最大200件）を取得（`expand` パラメータで顧客・請求書情報も同時取得）
  - 「取引情報」シートの B2 セルの日付以降の新しい取引のみを抽出
  - 各取引について、商品名を `payment_intent` または `invoice` から取得
  - 出力項目: ID、作成日時、顧客名、商品名、説明文、金額、決済方法、ステータス
  - 新しいデータをシートの2行目に挿入
  - エラー発生時は Slack に通知し、例外を再スロー
- **API効率化**: expand パラメータにより最大401回のAPI呼び出しを削減（66%削減）

#### `outputInvoiceInfo.js`
- **機能**: Stripe の請求書情報（Invoices）をスプレッドシートに出力
- **処理内容**:
  - Stripe API から請求書情報（最大200件）を取得
  - 「請求書情報」シートの B2 セルの日付以降の新しい請求書のみを抽出
  - 支払い済み（`paid=true`）の請求書のみを対象
  - 出力項目: ID、請求日、顧客名、説明文、金額、ステータス
  - 新しいデータをシートの2行目に挿入
  - エラー発生時は Slack に通知し、例外を再スロー

#### `outputPaymentInfo.js`
- **機能**: Stripe の支払い情報（Payment Intents）をスプレッドシートに出力
- **処理内容**:
  - Stripe API から支払い情報（最大100件）を取得（`expand` パラメータで顧客情報も同時取得）
  - 「支払い情報」シートの B2 セルの日付以降の新しい支払いのみを抽出
  - 出力項目: ID、作成日時、顧客名、説明文、金額、ステータス
  - 新しいデータをシートの2行目に挿入
  - エラー発生時は Slack に通知し、例外を再スロー
- **API効率化**: expand パラメータにより最大100回のAPI呼び出しを削減（50%削減）

#### `outputSessionInfo.js`
- **機能**: Stripe のセッション情報（Checkout Sessions）をスプレッドシートに出力
- **処理内容**:
  - Stripe API からセッション情報を取得
  - 各セッションの `line_items` を取得して商品情報を取得
  - 「セッション情報」シートの B2 セルの日付以降の新しいセッションのみを抽出
  - 出力項目: ID、作成日時、顧客ID、案件名、金額
  - 新しいデータをシートの2行目に挿入
  - エラー発生時は Slack に通知し、例外を再スロー

## セットアップ手順

### 1. 必要な準備

#### 1.1 Stripe API キーの取得
1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 開発者モードで「API キー」を開く
3. 「シークレットキー」をコピー（`sk_test_...` または `sk_live_...`）

#### 1.2 Google スプレッドシートの準備
以下のシート名でスプレッドシートを作成してください：
- `取引情報`
- `請求書情報`
- `支払い情報`
- `セッション情報`

各シートの2行目（B2セル）に最新の日付を設定してください。この日付以降のデータのみが取得されます。

#### 1.3 GAS プロジェクトの作成

**方法A: clasp を使用（推奨）**

```bash
# claspをインストール（未インストールの場合）
npm install -g @google/clasp

# Googleアカウントでログイン
clasp login

# 既存プロジェクトをクローン
clasp clone 1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# または、新規プロジェクトを作成
clasp create --type standalone --title "Stripe Controller"

# ローカルで編集後、GASにプッシュ
clasp push

# GASエディタを開く
clasp open
```

**方法B: 手動セットアップ**

1. 上記のスプレッドシートを開く
2. 「拡張機能」→「Apps Script」を選択
3. このリポジトリのすべてのファイル（`*.js`, `appsscript.json`）をコピー＆ペースト
4. 以下のファイルを作成してください：
   - `config.js`
   - `utils.js`
   - `getStripeInfo.js`
   - `outputChargeInfo.js`
   - `outputInvoiceInfo.js`
   - `outputPaymentInfo.js`
   - `outputSessionInfo.js`

### 2. 設定

#### 2.1 Stripe API キーの設定
1. GAS エディタで「プロジェクトの設定」（歯車アイコン）を開く
2. 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」をクリック
3. プロパティ名: `SECRET_KEY`、値: Stripe のシークレットキーを入力
4. 「保存」をクリック

#### 2.2 Slack 通知ライブラリの設定（エラー通知用）
- ライブラリ ID: `1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- `appsscript.json` に既に設定済みです
- 開発モードで使用する場合は、ライブラリの最新バージョンに更新してください

### 3. 実行方法

各関数を手動で実行するか、トリガーを設定して自動実行できます。

#### 手動実行

**clasp を使用する場合:**
```bash
# 関数を実行
clasp run outputChargeInfo

# ログを確認
clasp logs

# リアルタイムログ監視
clasp logs --watch
```

**GASエディタを使用する場合:**
1. GAS エディタで関数名を選択
2. 「実行」ボタンをクリック
3. 初回実行時は権限の承認が必要です

#### 自動実行（トリガー設定）
1. GAS エディタで「トリガー」（時計アイコン）を開く
2. 「トリガーを追加」をクリック
3. 実行する関数、イベントのソース（時間主導型）、時間ベースのトリガーのタイプ（例: 1時間ごと）を設定
4. 「保存」をクリック

## 開発とデバッグ

### ローカル開発ワークフロー

```bash
# 1. ローカルで編集（VS Code等）

# 2. GASにプッシュ
clasp push

# 3. テスト実行
clasp run outputChargeInfo

# 4. ログ確認
clasp logs

# 5. 問題なければコミット
git add .
git commit -m "fix: 機能改善"
```
## 注意事項

### API制限
- Stripe API のレート制限: デフォルトでは1秒あたり100リクエスト
- 大量データ処理時は、APIレート制限に注意してください
- expand パラメータの活用により、制限に抵触するリスクを大幅に軽減

### データ管理
- 各関数は最新のデータのみを取得するため、初回実行時は B2 セルに古い日付を設定することを推奨します
- 同一タイムスタンプのデータは重複登録されません（厳密な日付比較を実装）

### エラー処理
- すべてのエラーは Slack に通知されます（SlackNotification ライブラリが必要）
- トリガー実行時のエラーは例外を再スローし、GASの自動再試行を有効化しています
- エラーログにはスタックトレースが含まれ、デバッグが容易です

### セキュリティ
- Stripe APIキー（`SECRET_KEY`）はスクリプトプロパティに安全に保存してください
- 本番環境では `sk_live_...` キーを、テスト環境では `sk_test_...` キーを使用してください
- APIキーをコードに直接記述しないでください

## トラブルシューティング

### よくある問題

#### 1. "SECRET_KEYが設定されていません" エラー
**原因**: スクリプトプロパティにAPIキーが未設定
**解決**: GASエディタの「プロジェクトの設定」→「スクリプト プロパティ」で `SECRET_KEY` を設定

#### 2. "Stripe API error (401)" エラー
**原因**: APIキーが無効または権限不足
**解決**: Stripe DashboardでAPIキーを確認し、正しいキーを設定

#### 3. "Stripe API error (429)" エラー
**原因**: APIレート制限に到達
**解決**: 実行頻度を下げるか、データ取得量を減らす

#### 4. データが重複する
**原因**: B2セルの日付設定が不適切
**解決**: B2セルに正しい最新日付を設定。日付比較は厳密（`<`）なので、同一タイムスタンプは重複しません

#### 5. clasp push でエラー
**原因**: `.clasp.json` の設定または認証の問題
**解決**: `clasp login` で再認証、または `.clasp.json` の `scriptId` を確認

