/**
 * Stripeの取引情報をシートに出力する
 */
const outputSessionInfo = () => {
  try {
    // Stripeサーバーからセッション情報を取得
    const {data: sessionInfoList} = getStripeInfo("https://api.stripe.com/v1/checkout/sessions");

    // 取引情報シートの最新登録日を取得（B2セルの日付が最新）
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const outputSheet = ss.getSheetByName("セッション情報");
    const latestDate = new Date(outputSheet.getRange(2, 2).getValue());

    // セッション情報シートに未記載のセッション情報を抽出
    // 出力する情報：ID・日付・顧客名・案件名・金額
    outputInfoArray = sessionInfoList.reduce((acc, sessionInfo) => {
      // セッションIDから関連するline_itemsを取得
      const {data: lineItemList} = getStripeInfo(`https://api.stripe.com/v1/checkout/sessions/${sessionInfo.id}/line_items`);
      const lineItem = lineItemList[0];

      const date = new Date(lineItem.price.created * 1000); // 取得日時をUNIX日時から変換
      if (date.getTime() <= latestDate.getTime()) return acc;

      const infoList = [sessionInfo.id, date, sessionInfo.customer, lineItem.description, lineItem.amount_total];

      return [...acc, infoList];
    }, []);
    console.log(outputInfoArray);

    // // 新規の取引情報がない場合、終了
    // if (outputInfoArray.length === 0) {
    //   console.log("新しい取引情報はありません。");
    //   return;
    // }

    // // 取引情報をシートに追加（シートの冒頭に追加）
    // outputSheet.insertRows(2, outputInfoArray.length);
    // outputSheet.getRange(2, 1, outputInfoArray.length, outputInfoArray[0].length).setValues(outputInfoArray);
  } catch(err) {
    console.error(`エラー内容：${err}`);
  }
}
