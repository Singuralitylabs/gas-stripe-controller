/**
 * Stripeの取引情報をシートに出力する
 */
function outputSessionInfo() {
  try {
    // Stripeサーバーからセッション情報を取得
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.CHECKOUT_SESSIONS, {});
    const {data: sessionInfoList} = getStripeInfo(url);

    // 取引情報シートの最新登録日を取得
    const latestDate = getLatestDate(CONFIG.SHEETS.SESSION);

    // セッション情報シートに未記載のセッション情報を抽出
    // 出力する情報：ID・日付・顧客名・案件名・金額
    const outputInfoArray = sessionInfoList.reduce((acc, sessionInfo) => {
      // セッションIDから関連するline_itemsを取得
      const lineItemsUrl = `${CONFIG.STRIPE_API.BASE_URL}${CONFIG.STRIPE_API.ENDPOINTS.CHECKOUT_SESSIONS}/${sessionInfo.id}/line_items`;
      const {data: lineItemList} = getStripeInfo(lineItemsUrl);
      const lineItem = lineItemList[0];

      const date = unixToDate(lineItem.price.created);
      if (date.getTime() < latestDate.getTime()) return acc;

      const infoList = [sessionInfo.id, date, sessionInfo.customer, lineItem.description, lineItem.amount_total];

      return [...acc, infoList];
    }, []);

    // セッション情報をシートに追加
    outputToSheet(CONFIG.SHEETS.SESSION, outputInfoArray);
  } catch(err) {
    handleError(err, "outputSessionInfo");
  }
}
