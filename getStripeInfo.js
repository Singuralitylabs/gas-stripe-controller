/**
 * Stripeサーバーから指定のURLの情報を取得する
 */
function getStripeInfo (url) {
  // APIキーを取得
  const apiKey = PropertiesService.getScriptProperties().getProperty("SECRET_KEY");

  // APIキーが設定されていない場合はエラー
  if (!apiKey) {
    throw new Error("SECRET_KEYがスクリプトプロパティに設定されていません。");
  }

  // Stripe APIのオプション設定
  const options = {
    "method" : "get",
    "headers" : {"Authorization" : `Bearer ${apiKey}`},
    "muteHttpExceptions" : true  // HTTPエラーを例外としない
  };

  try {
    // Stripeサーバーから情報を取得
    const res = UrlFetchApp.fetch(url, options);
    const responseCode = res.getResponseCode();

    // HTTPステータスコードをチェック
    if (responseCode !== 200) {
      const errorBody = res.getContentText();
      throw new Error(`Stripe API error (${responseCode}): ${errorBody}`);
    }

    // JSON形式で戻す
    return JSON.parse(res.getContentText());
  } catch (err) {
    // エラー情報を詳細に記録
    console.error(`Stripe API呼び出しエラー: ${url}`, err);
    throw err;
  }
}
