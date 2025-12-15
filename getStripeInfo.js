/**
 * Stripeサーバーから指定のURLの情報を取得する
 */
const getStripeInfo = (url) => {
  // APIキーを取得
  const apiKey = PropertiesService.getScriptProperties().getProperty("SECRET_KEY");

  // Stripe APIのオプション設定
  const options = {
    "method" : "get",
    "headers" : {"Authorization" : `Bearer ${apiKey}`}
  };

  // Stripeサーバーから情報を取得
  const res = UrlFetchApp.fetch(url, options);

  // JSON形式で戻す
  return JSON.parse(res.getContentText());
}
