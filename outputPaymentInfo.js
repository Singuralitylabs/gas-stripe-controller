/**
 * Stripeの支払い情報をシートに出力する
 */
function outputPaymentInfo() {
  try {
    // Stripeサーバーから支払い情報を取得（顧客情報もexpandで取得して効率化）
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYMENT_INTENTS, {
      limit: CONFIG.STRIPE_LIMITS.PAYMENT,
      'expand[]': 'data.customer'
    });
    const {data: paymentInfoList} = getStripeInfo(url);

    // 支払い情報シートの最新登録日を取得
    const latestDate = getLatestDate(CONFIG.SHEETS.PAYMENT);

    // 支払い情報シートに未記載の支払い情報を抽出
    // 出力する情報：タイムスタンプ・ID・メールアドレス・説明文・金額・ステータス
    const outputInfoArray = paymentInfoList.reduce((acc, paymentInfo) => {
      const createdDate = unixToDate(paymentInfo.created);
      if (createdDate.getTime() < latestDate.getTime()) return acc;
      const customerName = getCustomerName(paymentInfo.customer);
      const infoList = [paymentInfo.id, createdDate, customerName, paymentInfo.calculated_statement_descriptor, paymentInfo.amount, paymentInfo.status];
      return [...acc, infoList];
    }, []);

    // 支払い情報をシートに追加
    outputToSheet(CONFIG.SHEETS.PAYMENT, outputInfoArray);
  } catch(err) {
    handleError(err, "outputPaymentInfo");
  }
}
