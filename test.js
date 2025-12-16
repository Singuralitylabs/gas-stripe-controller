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
