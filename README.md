# gas-stripe-controller

Stripe API連携によるデータ取得・Google スプレッドシート出力システム

## 概要

このプロジェクトは、Stripe APIから各種データ（取引、請求書、支払い、セッション、入金）を取得し、Google スプレッドシートに自動出力するGoogle Apps Script（GAS）ベースのシステムです。

## 機能一覧

### 実装済み機能

1. **取引情報取得** (`outputChargeInfo.js`)
   - Charges APIからの取引データ取得
   - 顧客情報の展開取得
   - 商品名の複数ソースからの取得

2. **請求書情報取得** (`outputInvoiceInfo.js`)
   - Invoices APIからの請求書データ取得

3. **支払い情報取得** (`outputPaymentInfo.js`)
   - Payment Intents APIからの支払いデータ取得

4. **セッション情報取得** (`outputSessionInfo.js`)
   - Checkout Sessions APIからのセッションデータ取得

5. **入金情報取得** (`outputPayoutInfo.js`) **NEW**
   - Payouts APIからの入金データ取得
   - Balance Transactions APIによる取引明細の取得
   - ページネーション対応による全データ取得
   - 期間指定での入金データ取得

## ファイル構成

```
stripe-controller/
├── config.js                  # 設定ファイル（シート名、API設定など）
├── utils.js                   # 共通ユーティリティ関数
├── getStripeInfo.js           # Stripe API呼び出し基盤
├── outputChargeInfo.js        # 取引情報出力
├── outputInvoiceInfo.js       # 請求書情報出力
├── outputPaymentInfo.js       # 支払い情報出力
├── outputSessionInfo.js       # セッション情報出力
├── outputPayoutInfo.js        # 入金情報出力 NEW
├── test.js                    # テスト関数集
├── docs/
│   └── payout.md             # 入金システム仕様書
└── README.md                 # このファイル
```

## セットアップ

### 1. Stripe APIキーの設定

Google Apps Scriptのスクリプトプロパティに以下を設定:

```
SECRET_KEY: sk_live_... または sk_test_...
```

設定方法:
1. GASエディタで「プロジェクトの設定」を開く
2. 「スクリプトプロパティ」セクションで「プロパティを追加」
3. プロパティ名: `SECRET_KEY`、値: StripeのSecret Key

### 2. Google スプレッドシートの準備

以下のシート名でシートを作成:

- `取引情報`
- `請求書情報`
- `支払い情報`
- `セッション情報`
- `入金情報` (NEW)

各シートには以下の共通設定が必要:
- 2行目、B列（B2セル）: 最新登録日（日付型）
- 1行目: ヘッダー行

#### 入金情報シートのヘッダー構成

| 列 | 項目名 | 内容 |
|----|--------|------|
| A | 入金ID | Stripe Payout ID |
| B | 入金日 | 入金到着日 |
| C | 入金額 | 入金総額（最小通貨単位） |
| D | 取引ID | Balance Transaction ID |
| E | 取引種別 | charge, refund, stripe_fee, payout, adjustment など |
| F | 総額 | 取引総額 |
| G | 手数料 | Stripe手数料 |
| H | 純額 | 手数料差し引き後の金額 |
| I | 通貨 | jpy, usd など |
| J | 取引日時 | 取引発生日時 |
| K | 説明 | 取引の説明文 |

## 使用方法

### 基本的な実行

各関数を手動またはトリガーで実行:

```javascript
// 入金情報を取得
outputPayoutInfo();

// その他のデータ取得
outputChargeInfo();
outputInvoiceInfo();
outputPaymentInfo();
outputSessionInfo();
```

### 期間指定での入金取得

```javascript
// 特定期間の入金データを取得
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
outputPayoutInfoByDateRange(startDate, endDate);
```

### トリガー設定（推奨）

定期実行を設定する場合:

1. GASエディタで「トリガー」を開く
2. 「トリガーを追加」をクリック
3. 実行する関数を選択（例: `outputPayoutInfo`）
4. イベントのソース: 「時間主導型」
5. 時間ベースのトリガーのタイプ: 「日付ベースのタイマー」または「時間ベースのタイマー」
6. 時刻を選択

## テスト

### テスト関数の実行

安全にテストするためのDry Run関数を提供:

```javascript
// 設定確認
testConfig();

// ユーティリティ関数のテスト
testUtils();

// Stripe API接続テスト
testStripeConnectionSmall();

// 入金API接続テスト
testPayoutsConnectionSmall();

// Balance Transactions API接続テスト
testBalanceTransactionsConnection();

// ページネーション機能のテスト
testFetchAllBalanceTransactions();

// 入金データ取得のDry Run（書き込みなし）
testOutputPayoutInfoDryRun();

// 期間指定テスト
testPayoutsByDateRange();

// その他のDry Run
testOutputChargeInfoDryRun();
```

### テストの推奨実行順序

1. `testConfig()` - 設定値の確認
2. `testUtils()` - ユーティリティ関数の動作確認
3. `testPayoutsConnectionSmall()` - Payouts API接続確認
4. `testBalanceTransactionsConnection()` - Balance Transactions API接続確認
5. `testFetchAllBalanceTransactions()` - ページネーション機能確認
6. `testOutputPayoutInfoDryRun()` - 本番実行前の最終確認

## 入金システムの技術詳細

### アーキテクチャ

入金システムは2つのStripe APIを組み合わせて使用:

1. **Payouts API** - 入金の基本情報を取得
2. **Balance Transactions API** - 各入金に紐づく取引明細を取得

### データフロー

```
1. Payouts API呼び出し
   ↓
2. 入金リスト取得（ページネーション対応）
   ↓
3. 各入金について:
   a. Balance Transactions API呼び出し
   b. 取引明細を全件取得（ページネーション対応）
   c. スプレッドシート出力配列に追加
   ↓
4. 一括でスプレッドシートに出力
```

### ページネーション処理

Stripe APIは大量データを返す際にページネーションを使用します。本実装は以下の方法で全データを取得:

```javascript
// Balance Transactions取得時のページネーション例
let hasMore = true;
let startingAfter = null;

while (hasMore) {
  const params = {
    payout: payoutId,
    limit: 100
  };

  if (startingAfter) {
    params.starting_after = startingAfter;
  }

  const response = getStripeInfo(buildStripeUrl(endpoint, params));

  // データ処理
  allTransactions.push(...response.data);

  // 次ページの有無確認
  hasMore = response.has_more;

  if (hasMore) {
    startingAfter = response.data[response.data.length - 1].id;
  }
}
```

### エラーハンドリング

すべての関数は統一されたエラーハンドリングを実装:

1. try-catch でエラーをキャッチ
2. 詳細なエラーログを出力
3. Slack通知を送信（オプション）
4. エラーを再スロー（実行停止）

```javascript
try {
  // メイン処理
} catch(err) {
  handleError(err, "functionName");
}
```

### 型安全性

すべてのStripe APIレスポンスはTypeScriptの型定義に準拠:

- `Stripe.Payout` - 入金オブジェクト
- `Stripe.BalanceTransaction` - 取引明細オブジェクト
- UNIX時刻は `unixToDate()` で自動的にDateオブジェクトに変換

## パフォーマンスとベストプラクティス

### API呼び出しの最適化

1. **リミット設定**: APIリミット値は `config.js` で管理
2. **Expand機能**: 関連データを1回の呼び出しで取得（該当する場合）
3. **ページネーション**: 大量データを効率的に取得
4. **エラーリトライ**: HTTPエラー時の再試行ロジック（`muteHttpExceptions: true`）

### レート制限対策

Stripe APIにはレート制限があります:

- テストモード: 100 requests/秒
- 本番モード: アカウントにより異なる

大量データ処理時は以下を考慮:

1. バッチ処理のサイズ調整
2. `Utilities.sleep()` による遅延挿入
3. エラー発生時の指数バックオフ

### データ整合性

- 最新登録日（B2セル）による重複防止
- トランザクション単位での一括書き込み
- エラー時のロールバック考慮（手動）

## トラブルシューティング

### よくあるエラー

**1. "SECRET_KEYがスクリプトプロパティに設定されていません"**
- 解決: スクリプトプロパティにStripe Secret Keyを設定

**2. "Stripe API error (401)"**
- 解決: APIキーが正しいか確認（test/live環境の違いも確認）

**3. "Stripe API error (404)"**
- 解決: 指定したリソースが存在するか確認（Payout ID など）

**4. シートが見つからないエラー**
- 解決: `config.js` のシート名と実際のシート名が一致するか確認

**5. データが重複する**
- 解決: 各シートのB2セルに正しい最新日付が設定されているか確認

### デバッグ方法

1. **ログ確認**: GASエディタの「実行ログ」でconsole.logの出力を確認
2. **Dry Run**: `testOutputPayoutInfoDryRun()` で書き込み前にデータ確認
3. **少量テスト**: `limit: 1` でAPI呼び出しを最小化してテスト
4. **ステップ実行**: 各API呼び出しを個別にテストする関数を使用

## セキュリティ

### 重要事項

1. **Secret Keyの管理**:
   - スクリプトプロパティに保存（コードに直接記述しない）
   - Gitリポジトリにコミットしない
   - 定期的にローテーション

2. **アクセス制御**:
   - GASプロジェクトのアクセス権限を適切に管理
   - スプレッドシートの共有設定を確認

3. **監査ログ**:
   - Slack通知でエラーを監視
   - 定期的なログレビュー

## ライセンス

このプロジェクトは内部使用を目的としています。

## 変更履歴

### v1.1.0 (2024-XX-XX)
- 入金情報取得機能の追加 (`outputPayoutInfo.js`)
- Balance Transactions APIの実装
- ページネーション対応の強化
- 期間指定での入金取得機能
- 包括的なテスト関数の追加

### v1.0.0
- 初期リリース
- 取引、請求書、支払い、セッション情報取得機能
