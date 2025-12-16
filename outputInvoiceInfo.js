/**
 * Stripeの請求書情報をシートに出力する
 */
function outputInvoiceInfo() {
  try {
    // Stripeサーバーから請求書情報を取得
    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.INVOICES, {
      limit: CONFIG.STRIPE_LIMITS.INVOICE
    });
    const { data: invoiceInfoList } = getStripeInfo(url);

    // 請求書情報シートの最新登録日を取得
    const latestDate = getLatestDate(CONFIG.SHEETS.INVOICE);

    // 請求書情報シートに未記載の請求書情報を抽出
    // 出力する情報：ID・請求日・名前・説明文・金額・ステータス
    const outputInfoArray = invoiceInfoList.reduce((acc, invoiceInfo) => {
      if (!invoiceInfo.paid) return acc;
      const invoiceInfoDetail = invoiceInfo.lines.data[0];
      const invoiceDate = unixToDate(invoiceInfoDetail.period.start);
      if (invoiceDate.getTime() < latestDate.getTime()) return acc;
      const infoList = [invoiceInfo.id, invoiceDate, invoiceInfo.customer_name, invoiceInfoDetail.description, invoiceInfoDetail.amount, invoiceInfo.status];
      return [...acc, infoList];
    }, []);

    // 請求書情報をシートに追加
    outputToSheet(CONFIG.SHEETS.INVOICE, outputInfoArray);
  } catch(err) {
    handleError(err, "outputInvoiceInfo");
  }
}
