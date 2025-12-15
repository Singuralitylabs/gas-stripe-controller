/**
 * Stripeの取引情報をシートに出力する
 */
function outputChargeInfo() {
  try {
    // Stripeサーバーから取引情報を取得
    const { data: chargeInfoList } = getStripeInfo("https://api.stripe.com/v1/charges?limit=200");

    // Stripeサーバーから顧客情報を取得
    const { data: customerInfoList } = getStripeInfo("https://api.stripe.com/v1/customers?limit=100");

    // 取引情報シートの最新登録日を取得（B2セルの日付が最新）
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const outputSheet = ss.getSheetByName("取引情報");
    const latestDate = new Date(outputSheet.getRange(2, 2).getValue());

    // 取引情報シートに未記載の取引情報を抽出
    const outputInfoArray = chargeInfoList.reduce((acc, chargeInfo) => {
      // 既にシートに記載済みの情報をスキップ
      const createdDate = new Date(chargeInfo.created * 1000); // 取得日時をUNIX日時から変換
      if (createdDate.getTime() <= latestDate.getTime()) return acc;

      // 顧客情報を取得
      const targetCustomerInfo = customerInfoList.find((customerInfo) => customerInfo.id == chargeInfo.customer);
      const customerName = targetCustomerInfo ? targetCustomerInfo.name : "";

      // 取引した商品名を取得
      let productName = "";
      if (chargeInfo.payment_intent) {
        productName = getProductNameByPaymentIntentId(chargeInfo.payment_intent);
      }
      if (!productName && chargeInfo.invoice) {
        const invoiceInfo = getStripeInfo(`https://api.stripe.com/v1/invoices/${chargeInfo.invoice}`);
        productName = invoiceInfo.lines.data[0].description;
      }

      // タイムスタンプ・ID・顧客名・商品名・説明文・金額・決済方法・ステータスを出力
      const infoList = [chargeInfo.id, createdDate, customerName, productName, chargeInfo.calculated_statement_descriptor, chargeInfo.amount, chargeInfo.payment_method_details.type, chargeInfo.status];
      return [...acc, infoList];
    }, []);

    // 新規の取引情報がない場合、終了
    if (outputInfoArray.length === 0) {
      console.log("新しい取引情報はありません。");
      return;
    }

    // 取引情報をシートに追加（シートの冒頭に追加）
    outputSheet.insertRows(2, outputInfoArray.length);
    outputSheet.getRange(2, 1, outputInfoArray.length, outputInfoArray[0].length).setValues(outputInfoArray);
  } catch(err) {
    console.error(`エラー内容：${err}`);
    const gasUrl = `https://script.google.com/u/0/home/projects/${ScriptApp.getScriptId()}/edit`;
    SlackNotification.SendToSinlabSlack(`StripeControllerのoutputChargeInfo関数でエラーが発生しました。\n${err.message}\n\n${gasUrl}`, "通知担当", "テスト用");
  }
}

/**
 * payment_intent IDから商品名を取得する
 */
const getProductNameByPaymentIntentId = (paymentIntentId) => {
  // Stripeサーバーからセッション情報を取得
  const {data: sessionInfoList} = getStripeInfo(`https://api.stripe.com/v1/checkout/sessions?payment_intent=${paymentIntentId}`);

  // セッションが存在しない場合はスキップ
  if (sessionInfoList.length === 0) return "";

  const sessionInfo = sessionInfoList[0];

  // セッションIDから関連するline_itemsを取得
  const {data: lineItemList} = getStripeInfo(`https://api.stripe.com/v1/checkout/sessions/${sessionInfo.id}/line_items`);

  return lineItemList[0].description;
}
