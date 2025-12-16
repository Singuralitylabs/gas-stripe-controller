/**
 * Stripeの取引情報をシートに出力する
 */
function outputChargeInfo() {
  try {
    // Stripeサーバーから取引情報を取得（関連データもexpandで一緒に取得して効率化）
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHARGES, {
      limit: CONFIG.STRIPE_LIMITS.CHARGE,
      'expand[]': ['data.customer', 'data.invoice']
    });
    const { data: chargeInfoList } = getStripeInfo(url);

    // 取引情報シートの最新登録日を取得
    const latestDate = getLatestDate(CONFIG.SHEETS.CHARGE);

    // 取引情報シートに未記載の取引情報を抽出
    const outputInfoArray = chargeInfoList.reduce((acc, chargeInfo) => {
      // 既にシートに記載済みの情報をスキップ（日付が古いものは除外）
      const createdDate = unixToDate(chargeInfo.created);
      if (createdDate.getTime() < latestDate.getTime()) return acc;

      // 顧客情報を取得（expandで展開済み）
      const customerName = getCustomerName(chargeInfo.customer);

      // 取引した商品名を取得
      let productName = "";

      // payment_intentから商品名を取得（追加API呼び出しが必要）
      if (chargeInfo.payment_intent) {
        const paymentIntentId = typeof chargeInfo.payment_intent === 'object'
          ? chargeInfo.payment_intent.id
          : chargeInfo.payment_intent;
        productName = getProductNameByPaymentIntentId(paymentIntentId);
      }

      // invoiceから商品名を取得（expandで展開済み）
      if (!productName && chargeInfo.invoice) {
        if (typeof chargeInfo.invoice === 'object' && chargeInfo.invoice.lines && chargeInfo.invoice.lines.data && chargeInfo.invoice.lines.data.length > 0) {
          productName = chargeInfo.invoice.lines.data[0].description;
        }
      }

      // タイムスタンプ・ID・顧客名・商品名・説明文・金額・決済方法・ステータスを出力
      const infoList = [chargeInfo.id, createdDate, customerName, productName, chargeInfo.calculated_statement_descriptor, chargeInfo.amount, chargeInfo.payment_method_details.type, chargeInfo.status];
      return [...acc, infoList];
    }, []);

    // 取引情報をシートに追加
    outputToSheet(CONFIG.SHEETS.CHARGE, outputInfoArray);
  } catch(err) {
    handleError(err, "outputChargeInfo");
  }
}

/**
 * payment_intent IDから商品名を取得する
 */
const getProductNameByPaymentIntentId = (paymentIntentId) => {
  // Stripeサーバーからセッション情報を取得
  const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHECKOUT_SESSIONS, {
    payment_intent: paymentIntentId
  });
  const {data: sessionInfoList} = getStripeInfo(url);

  // セッションが存在しない場合はスキップ
  if (sessionInfoList.length === 0) return "";

  const sessionInfo = sessionInfoList[0];

  // セッションIDから関連するline_itemsを取得
  const lineItemsUrl = `${CONFIG.STRIPE_API.BASE_URL}${CONFIG.STRIPE_API.ENDPOINTS.CHECKOUT_SESSIONS}/${sessionInfo.id}/line_items`;
  const {data: lineItemList} = getStripeInfo(lineItemsUrl);

  return lineItemList[0].description;
}
