/**
 * Stripeの請求書情報をシートに出力する
 */
function outputInvoiceInfo() {
  try {
    // Stripeサーバーから請求書情報を取得
    const { data: invoiceInfoList } = getStripeInfo("https://api.stripe.com/v1/invoices?limit=200");

    // 請求書情報シートの最新登録日を取得（B2セルの日付が最新）
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const outputSheet = ss.getSheetByName("請求書情報");
    const latestDate = new Date(outputSheet.getRange(2, 2).getValue());

    // 請求書情報シートに未記載の請求書情報を抽出
    // 出力する情報：ID・請求日・名前・説明文・金額・ステータス
    const outputInfoArray = invoiceInfoList.reduce((acc, invoiceInfo) => {
      if (!invoiceInfo.paid) return acc;
      const invoiceInfoDetail = invoiceInfo.lines.data[0];
      const invoiceDate = new Date(invoiceInfoDetail.period.start * 1000); // 取得日時をUNIX日時から変換
      if (invoiceDate.getTime() <= latestDate.getTime()) return acc;
      const infoList = [invoiceInfo.id, invoiceDate, invoiceInfo.customer_name, invoiceInfoDetail.description, invoiceInfoDetail.amount, invoiceInfo.status];
      return [...acc, infoList];
    }, []);

    // 新規の支払い情報がない場合、終了
    if (outputInfoArray.length === 0) {
      console.log("新しい請求書情報はありません。");
      return;
    }

    // 支払い情報をシートに追加（シートの冒頭に追加）
    outputSheet.insertRows(2, outputInfoArray.length);
    outputSheet.getRange(2, 1, outputInfoArray.length, outputInfoArray[0].length).setValues(outputInfoArray);
  } catch(err) {
    console.error(`エラー内容：${err.message}\nスタック：${err.stack}`);
    const gasUrl = `https://script.google.com/u/0/home/projects/${ScriptApp.getScriptId()}/edit`;
    SlackNotification.SendToSinlabSlack(`StripeControllerのoutputInvoiceInfo関数でエラーが発生しました。\n${err.message}\n${err.stack}\n\n${gasUrl}`, "通知担当", "テスト用");
    throw err;
  }
}
