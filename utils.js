/**
 * 共通ユーティリティ関数
 */

/**
 * スプレッドシートの指定シートから最新日付を取得
 * @param {string} sheetName - シート名
 * @return {Date} 最新日付
 */
function getLatestDate(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  // シートが存在しない場合のエラーチェック
  if (!sheet) {
    throw new Error(`シート「${sheetName}」が見つかりません。スプレッドシートにシートを作成してください。`);
  }

  const cellValue = sheet.getRange(CONFIG.CELLS.LATEST_DATE_ROW, CONFIG.CELLS.LATEST_DATE_COLUMN).getValue();

  // セルが空の場合はデフォルト日付（1970-01-01）を返す
  if (!cellValue) {
    console.warn(`${sheetName}シートのB2セルが空です。デフォルト日付（1970-01-01）を使用します。`);
    return new Date(0); // Unix epoch
  }

  const date = new Date(cellValue);

  // 日付が無効な場合のエラーチェック
  if (isNaN(date.getTime())) {
    throw new Error(`${sheetName}シートのB2セルの値「${cellValue}」は有効な日付ではありません。日付形式（例: 2024-01-01）で入力してください。`);
  }

  return date;
}

/**
 * スプレッドシートにデータを出力
 * @param {string} sheetName - シート名
 * @param {Array<Array>} dataArray - 出力するデータ配列
 */
function outputToSheet(sheetName, dataArray) {
  if (dataArray.length === 0) {
    console.log(`新しい${sheetName}はありません。`);
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  sheet.insertRows(CONFIG.CELLS.INSERT_ROW, dataArray.length);
  sheet.getRange(CONFIG.CELLS.INSERT_ROW, 1, dataArray.length, dataArray[0].length).setValues(dataArray);
}

/**
 * UNIX時刻をDateオブジェクトに変換
 * @param {number} unixTime - UNIX時刻（秒）
 * @return {Date} Dateオブジェクト
 */
function unixToDate(unixTime) {
  return new Date(unixTime * 1000);
}

/**
 * 顧客名を取得（顧客情報が展開されている場合に対応）
 * @param {Object|string} customer - 顧客オブジェクトまたは顧客ID
 * @return {string} 顧客名
 */
function getCustomerName(customer) {
  if (!customer) return "";
  return typeof customer === 'object' ? (customer.name || "") : "";
}

/**
 * 統一されたエラーハンドリング
 * @param {Error} err - エラーオブジェクト
 * @param {string} functionName - 関数名
 */
function handleError(err, functionName) {
  console.error(`エラー内容：${err.message}\nスタック：${err.stack}`);
  const gasUrl = `https://script.google.com/u/0/home/projects/${ScriptApp.getScriptId()}/edit`;
  SlackNotification.SendToSinlabSlack(
    `StripeControllerの${functionName}関数でエラーが発生しました。\n${err.message}\n${err.stack}\n\n${gasUrl}`,
    CONFIG.SLACK.NOTIFICATION_USER,
    CONFIG.SLACK.NOTIFICATION_CHANNEL
  );
  throw err;
}

/**
 * Stripe APIのURLを構築
 * @param {string} endpoint - エンドポイント
 * @param {Object} params - クエリパラメータ
 * @return {string} 完全なURL
 */
function buildStripeUrl(endpoint, params = {}) {
  const url = CONFIG.STRIPE_API.BASE_URL + endpoint;
  const queryParts = [];

  Object.keys(params).forEach(key => {
    const value = params[key];

    // 配列の場合は各要素を個別のパラメータとして追加
    if (Array.isArray(value)) {
      value.forEach(item => {
        queryParts.push(`${key}=${encodeURIComponent(item)}`);
      });
    } else {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  });

  return queryParts.length > 0 ? `${url}?${queryParts.join('&')}` : url;
}
