/**
 * テスト用関数
 */

/**
 * buildStripeUrl関数のテスト
 */
function testBuildStripeUrl() {
  console.log("=== buildStripeUrl テスト ===");

  // テスト1: 通常のパラメータ
  const url1 = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHARGES, {
    limit: 10
  });
  console.log("テスト1（通常）:", url1);
  console.log("期待値: https://api.stripe.com/v1/charges?limit=10");

  // テスト2: 配列パラメータ
  const url2 = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHARGES, {
    limit: 200,
    'expand[]': ['data.customer', 'data.invoice']
  });
  console.log("\nテスト2（配列）:", url2);
  console.log("期待値: https://api.stripe.com/v1/charges?limit=200&expand[]=data.customer&expand[]=data.invoice");

  // テスト3: パラメータなし
  const url3 = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHARGES, {});
  console.log("\nテスト3（空）:", url3);
  console.log("期待値: https://api.stripe.com/v1/charges");
}

/**
 * Stripe API接続テスト（少量データ）
 */
function testStripeConnectionSmall() {
  console.log("=== Stripe API 接続テスト ===");

  try {
    // 1件のみ取得してテスト
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHARGES, {
      limit: 1,
      'expand[]': ['data.customer', 'data.invoice']
    });

    console.log("リクエストURL:", url);

    const result = getStripeInfo(url);

    console.log("✅ 接続成功!");
    console.log("取得件数:", result.data ? result.data.length : 0);

    if (result.data && result.data.length > 0) {
      const charge = result.data[0];
      console.log("\nサンプルデータ:");
      console.log("- Charge ID:", charge.id);

      // customerの詳細表示（null/undefinedチェック付き）
      if (charge.customer) {
        if (typeof charge.customer === 'object') {
          console.log("- Customer (expanded):", charge.customer.id || 'ID不明');
          console.log("  - Name:", charge.customer.name || '名前なし');
          console.log("  - Email:", charge.customer.email || 'メールなし');
        } else {
          console.log("- Customer (ID):", charge.customer);
        }
      } else {
        console.log("- Customer: なし");
      }

      // invoiceの詳細表示
      if (charge.invoice) {
        if (typeof charge.invoice === 'object') {
          console.log("- Invoice (expanded):", charge.invoice.id || 'ID不明');
        } else {
          console.log("- Invoice (ID):", charge.invoice);
        }
      } else {
        console.log("- Invoice: なし");
      }

      console.log("- Amount:", charge.amount);
      console.log("- Status:", charge.status);
    }

  } catch(err) {
    console.error("❌ 接続失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}

/**
 * 設定値の確認
 */
function testConfig() {
  console.log("=== CONFIG 確認 ===");
  console.log(JSON.stringify(CONFIG, null, 2));
}

/**
 * ユーティリティ関数のテスト
 */
function testUtils() {
  console.log("=== ユーティリティ関数テスト ===");

  // UNIX時刻変換
  const date1 = unixToDate(1609459200);
  console.log("unixToDate(1609459200):", date1.toISOString());

  // 顧客名取得（オブジェクト）
  const name1 = getCustomerName({name: 'Test User'});
  console.log("getCustomerName({name:'Test User'}):", name1);

  // 顧客名取得（文字列）
  const name2 = getCustomerName('cus_123456');
  console.log("getCustomerName('cus_123456'):", name2);

  // 顧客名取得（null）
  const name3 = getCustomerName(null);
  console.log("getCustomerName(null):", name3);

  // 顧客名取得（空オブジェクト）
  const name4 = getCustomerName({});
  console.log("getCustomerName({}):", name4);
}

/**
 * outputChargeInfoの安全なテスト実行（データは取得するが書き込まない）
 */
function testOutputChargeInfoDryRun() {
  console.log("=== outputChargeInfo Dry Run テスト ===");

  try {
    // Stripeサーバーから取引情報を取得（少量）
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHARGES, {
      limit: 5,
      'expand[]': ['data.customer', 'data.invoice']
    });

    console.log("リクエストURL:", url);

    const { data: chargeInfoList } = getStripeInfo(url);

    console.log("✅ 取得成功! 件数:", chargeInfoList.length);

    // 各chargeのデータ構造を確認
    chargeInfoList.forEach((chargeInfo, index) => {
      console.log(`\n--- Charge ${index + 1} ---`);
      console.log("ID:", chargeInfo.id);
      console.log("Created:", unixToDate(chargeInfo.created).toISOString());

      // 顧客情報の確認
      const customerName = getCustomerName(chargeInfo.customer);
      console.log("Customer Name:", customerName);

      // 商品名の取得ロジックをテスト
      let productName = "";
      if (chargeInfo.payment_intent) {
        console.log("Payment Intent検出:", typeof chargeInfo.payment_intent === 'object' ? chargeInfo.payment_intent.id : chargeInfo.payment_intent);
      }

      if (chargeInfo.invoice) {
        if (typeof chargeInfo.invoice === 'object' && chargeInfo.invoice.lines && chargeInfo.invoice.lines.data && chargeInfo.invoice.lines.data.length > 0) {
          productName = chargeInfo.invoice.lines.data[0].description;
          console.log("Invoice Product Name:", productName);
        } else {
          console.log("Invoice (ID only):", chargeInfo.invoice);
        }
      }

      console.log("Amount:", chargeInfo.amount);
      console.log("Status:", chargeInfo.status);
    });

    console.log("\n✅ Dry Run完了（スプレッドシートへの書き込みなし）");

  } catch(err) {
    console.error("❌ テスト失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}

/**
 * Payouts API接続テスト（少量データ）
 */
function testPayoutsConnectionSmall() {
  console.log("=== Payouts API 接続テスト ===");

  try {
    // 最新3件の入金を取得
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: 3
    });

    console.log("リクエストURL:", url);

    const result = getStripeInfo(url);

    console.log("✅ 接続成功!");
    console.log("取得件数:", result.data ? result.data.length : 0);
    console.log("has_more:", result.has_more);

    if (result.data && result.data.length > 0) {
      result.data.forEach((payout, index) => {
        console.log(`\n--- Payout ${index + 1} ---`);
        console.log("- Payout ID:", payout.id);
        console.log("- Amount:", payout.amount, payout.currency);
        console.log("- Status:", payout.status);
        console.log("- Arrival Date:", unixToDate(payout.arrival_date).toISOString());
        console.log("- Created:", unixToDate(payout.created).toISOString());
        console.log("- Type:", payout.type);
        console.log("- Method:", payout.method);
      });
    }

  } catch(err) {
    console.error("❌ 接続失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}

/**
 * Balance Transactions API接続テスト
 */
function testBalanceTransactionsConnection() {
  console.log("=== Balance Transactions API 接続テスト ===");

  try {
    // まず最新の入金を1件取得
    const payoutsUrl = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: 1
    });

    console.log("Payouts リクエストURL:", payoutsUrl);
    const payoutsResult = getStripeInfo(payoutsUrl);

    if (!payoutsResult.data || payoutsResult.data.length === 0) {
      console.log("⚠️ テスト用の入金データが見つかりません");
      return;
    }

    const payout = payoutsResult.data[0];
    console.log("テスト対象Payout:", payout.id);

    // この入金に紐づく取引明細を取得
    const transactionsUrl = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.BALANCE_TRANSACTIONS, {
      payout: payout.id,
      limit: 5
    });

    console.log("\nBalance Transactions リクエストURL:", transactionsUrl);
    const transactionsResult = getStripeInfo(transactionsUrl);

    console.log("\n✅ 接続成功!");
    console.log("取引明細件数:", transactionsResult.data ? transactionsResult.data.length : 0);
    console.log("has_more:", transactionsResult.has_more);

    if (transactionsResult.data && transactionsResult.data.length > 0) {
      transactionsResult.data.forEach((transaction, index) => {
        console.log(`\n--- Transaction ${index + 1} ---`);
        console.log("- Transaction ID:", transaction.id);
        console.log("- Type:", transaction.type);
        console.log("- Amount:", transaction.amount);
        console.log("- Fee:", transaction.fee);
        console.log("- Net:", transaction.net);
        console.log("- Currency:", transaction.currency);
        console.log("- Created:", unixToDate(transaction.created).toISOString());
        console.log("- Description:", transaction.description || "(なし)");
      });
    }

  } catch(err) {
    console.error("❌ 接続失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}

/**
 * fetchBalanceTransactionsForPayout関数のテスト（自動/手動入金対応確認）
 */
function testFetchAllBalanceTransactions() {
  console.log("=== fetchBalanceTransactionsForPayout テスト ===");

  try {
    // 最新の入金を1件取得
    const payoutsUrl = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: 1
    });

    const payoutsResult = getStripeInfo(payoutsUrl);

    if (!payoutsResult.data || payoutsResult.data.length === 0) {
      console.log("⚠️ テスト用の入金データが見つかりません");
      return;
    }

    const payout = payoutsResult.data[0];
    console.log("テスト対象Payout:", payout.id);
    console.log("入金額:", payout.amount, payout.currency);
    console.log("入金タイプ:", payout.automatic ? "自動入金" : "手動入金");

    // fetchBalanceTransactionsForPayout関数を実行
    console.log("\nfetchBalanceTransactionsForPayout実行中...");
    const transactions = fetchBalanceTransactionsForPayout(payout);

    console.log("\n✅ 取得成功!");
    console.log("合計取引明細件数:", transactions.length);

    // 取引種別の集計
    const typeCount = {};
    let totalAmount = 0;
    let totalFee = 0;
    let totalNet = 0;

    transactions.forEach(transaction => {
      // 種別カウント
      typeCount[transaction.type] = (typeCount[transaction.type] || 0) + 1;

      // 合計計算
      totalAmount += transaction.amount;
      totalFee += transaction.fee;
      totalNet += transaction.net;
    });

    console.log("\n取引種別の内訳:");
    Object.keys(typeCount).forEach(type => {
      console.log(`  ${type}: ${typeCount[type]}件`);
    });

    console.log("\n金額集計:");
    console.log("  総額合計:", totalAmount);
    console.log("  手数料合計:", totalFee);
    console.log("  純額合計:", totalNet);

    // 最初の3件を詳細表示
    console.log("\n最初の3件のサンプル:");
    transactions.slice(0, 3).forEach((transaction, index) => {
      console.log(`\n  [${index + 1}] ${transaction.id}`);
      console.log(`      Type: ${transaction.type}`);
      console.log(`      Amount: ${transaction.amount}, Fee: ${transaction.fee}, Net: ${transaction.net}`);
      console.log(`      Description: ${transaction.description || "(なし)"}`);
    });

  } catch(err) {
    console.error("❌ テスト失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}

/**
 * outputPayoutInfoのDry Runテスト（データ取得のみ、書き込みなし）
 */
function testOutputPayoutInfoDryRun() {
  console.log("=== outputPayoutInfo Dry Run テスト ===");

  try {
    // 最新3件の入金を取得
    const payoutsUrl = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: 3
    });

    console.log("Payouts API呼び出し:", payoutsUrl);
    const { data: payoutList } = getStripeInfo(payoutsUrl);
    console.log(`入金件数: ${payoutList.length}件`);

    // 出力データ配列をシミュレート
    const outputInfoArray = [];

    for (const payout of payoutList) {
      const arrivalDate = unixToDate(payout.arrival_date);
      console.log(`\n処理中: Payout ${payout.id}`);
      console.log(`  入金日: ${arrivalDate.toISOString()}`);
      console.log(`  入金額: ${payout.amount} ${payout.currency}`);
      console.log(`  入金タイプ: ${payout.automatic ? '自動' : '手動'}入金`);

      // 取引明細を取得
      const transactions = fetchBalanceTransactionsForPayout(payout);
      console.log(`  取引明細件数: ${transactions.length}件`);

      // 出力データを構築
      for (const transaction of transactions) {
        const transactionDate = unixToDate(transaction.created);

        const infoList = [
          payout.id,
          arrivalDate,
          payout.amount,
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.fee,
          transaction.net,
          transaction.currency,
          transactionDate,
          transaction.description || ""
        ];

        outputInfoArray.push(infoList);
      }
    }

    console.log(`\n合計出力行数: ${outputInfoArray.length}行`);

    // 最初の5行をサンプル表示
    console.log("\n出力サンプル（最初の5行）:");
    outputInfoArray.slice(0, 5).forEach((row, index) => {
      console.log(`\n[${index + 1}]`);
      console.log(`  入金ID: ${row[0]}`);
      console.log(`  入金日: ${row[1]}`);
      console.log(`  入金額: ${row[2]}`);
      console.log(`  取引ID: ${row[3]}`);
      console.log(`  取引種別: ${row[4]}`);
      console.log(`  総額: ${row[5]}, 手数料: ${row[6]}, 純額: ${row[7]}`);
      console.log(`  通貨: ${row[8]}`);
      console.log(`  取引日時: ${row[9]}`);
      console.log(`  説明: ${row[10]}`);
    });

    console.log("\n✅ Dry Run完了（スプレッドシートへの書き込みなし）");

  } catch(err) {
    console.error("❌ テスト失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}

/**
 * 期間指定でのPayouts取得テスト
 */
function testPayoutsByDateRange() {
  console.log("=== Payouts 期間指定テスト ===");

  try {
    // 過去30日間の入金を取得
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log("期間:", startDate.toISOString(), "〜", endDate.toISOString());

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: 10,
      'arrival_date[gte]': startTimestamp,
      'arrival_date[lte]': endTimestamp
    });

    console.log("\nリクエストURL:", url);

    const result = getStripeInfo(url);

    console.log("\n✅ 取得成功!");
    console.log("入金件数:", result.data ? result.data.length : 0);

    if (result.data && result.data.length > 0) {
      console.log("\n入金一覧:");
      result.data.forEach((payout, index) => {
        console.log(`  [${index + 1}] ${payout.id}`);
        console.log(`      金額: ${payout.amount} ${payout.currency}`);
        console.log(`      入金日: ${unixToDate(payout.arrival_date).toISOString()}`);
        console.log(`      ステータス: ${payout.status}`);
      });
    }

  } catch(err) {
    console.error("❌ テスト失敗:", err.message);
    console.error("スタック:", err.stack);
  }
}
