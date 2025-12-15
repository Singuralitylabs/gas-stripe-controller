/**
 * Stripeの支払い情報をシートに出力する
 */
const outputPaymentInfo = () => {
  try {
    // Stripeサーバーから支払い情報を取得
    const {data: paymentInfoList} = getStripeInfo("https://api.stripe.com/v1/payment_intents?limit=100");

    // 支払い情報シートの最新登録日を取得（B2セルの日付が最新）
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const outputSheet = ss.getSheetByName("支払い情報");
    const latestDate = new Date(outputSheet.getRange(2, 2).getValue());

    // 支払い情報シートに未記載の支払い情報を抽出
    // 出力する情報：タイムスタンプ・ID・メールアドレス・説明文・金額・ステータス
    const outputInfoArray = paymentInfoList.reduce((acc, paymentInfo) => {
      const createdDate = new Date(paymentInfo.created * 1000); // 取得日時をUNIX日時から変換
      if (createdDate.getTime() <= latestDate.getTime()) return acc;
      const targetCustomerInfo = customerInfoList.find((customerInfo) => customerInfo.id == paymentInfo.customer);
      const customerName = targetCustomerInfo ? targetCustomerInfo.name : "";
      const infoList = [paymentInfo.id, createdDate, customerName, paymentInfo.calculated_statement_descriptor, paymentInfo.amount, paymentInfo.status];
      return [...acc, infoList];
    }, []);

    // 新規の支払い情報がない場合、終了
    if (outputInfoArray.length === 0) {
      console.log("新しい支払い情報はありません。");
      return;
    }

    // 支払い情報をシートに追加（シートの冒頭に追加）
    outputSheet.insertRows(2, outputInfoArray.length);
    outputSheet.getRange(2, 1, outputInfoArray.length, outputInfoArray[0].length).setValues(outputInfoArray);
  } catch(err) {
    console.error(`エラー内容：${err}`);
  }
}
