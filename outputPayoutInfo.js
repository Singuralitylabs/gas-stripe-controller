/**
 * Stripeの入金情報をシートに出力する
 *
 * @description
 * Stripe Payouts APIとBalance Transactions APIを使用して、
 * 入金データとそれに紐づく取引明細を取得し、Googleスプレッドシートに出力する。
 *
 * 出力データ項目：
 * - 入金ID (payout.id)
 * - 入金日 (payout.arrival_date)
 * - 入金額 (payout.amount)
 * - 取引ID (balance_transaction.id)
 * - 取引種別 (balance_transaction.type)
 * - 総額 (balance_transaction.amount)
 * - 手数料 (balance_transaction.fee)
 * - 純額 (balance_transaction.net)
 * - 通貨 (balance_transaction.currency)
 * - 取引日時 (balance_transaction.created)
 * - 説明 (balance_transaction.description)
 */

/**
 * 入金情報とその取引明細を取得してスプレッドシートに出力
 */
function outputPayoutInfo() {
  try {
    console.log("=== 入金情報の取得を開始 ===");

    // Stripeサーバーから入金一覧を取得
    const payoutsUrl = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: CONFIG.STRIPE_LIMITS.PAYOUT
    });

    console.log(`Payouts API呼び出し: ${payoutsUrl}`);
    const { data: payoutList } = getStripeInfo(payoutsUrl);
    console.log(`入金件数: ${payoutList.length}件`);

    // 入金情報シートの最新登録日を取得
    const latestDate = getLatestDate(CONFIG.SHEETS.PAYOUT);
    console.log(`最新登録日: ${latestDate.toISOString()}`);

    // 各入金に対して取引明細を取得し、出力用配列を作成
    const outputInfoArray = [];

    for (const payout of payoutList) {
      // 入金日（arrival_date）をチェック
      const arrivalDate = unixToDate(payout.arrival_date);

      // 既にシートに記載済みの入金をスキップ
      if (arrivalDate.getTime() < latestDate.getTime()) {
        console.log(`スキップ（既存）: Payout ${payout.id} - ${arrivalDate.toISOString()}`);
        continue;
      }

      console.log(`処理中: Payout ${payout.id} - ${arrivalDate.toISOString()} (${payout.automatic ? '自動' : '手動'}入金)`);

      // この入金に紐づく取引明細を取得
      // 自動入金と手動入金で取得方法が異なる
      const transactions = fetchBalanceTransactionsForPayout(payout);
      console.log(`  取引明細件数: ${transactions.length}件`);

      // 各取引明細を出力配列に追加
      for (const transaction of transactions) {
        const transactionDate = unixToDate(transaction.created);

        // 出力データ行を構築
        // A: 入金ID, B: 入金日, C: 入金額, D: 取引ID, E: 取引種別,
        // F: 総額, G: 手数料, H: 純額, I: 通貨, J: 取引日時, K: 説明
        const infoList = [
          payout.id,                    // A: 入金ID
          arrivalDate,                  // B: 入金日
          payout.amount,                // C: 入金額
          transaction.id,               // D: 取引ID
          transaction.type,             // E: 取引種別
          transaction.amount,           // F: 総額
          transaction.fee,              // G: 手数料
          transaction.net,              // H: 純額
          transaction.currency,         // I: 通貨
          transactionDate,              // J: 取引日時
          transaction.description || "" // K: 説明
        ];

        outputInfoArray.push(infoList);
      }
    }

    console.log(`合計出力行数: ${outputInfoArray.length}行`);

    // 入金情報をシートに追加
    outputToSheet(CONFIG.SHEETS.PAYOUT, outputInfoArray);

    console.log("=== 入金情報の出力が完了しました ===");

  } catch(err) {
    handleError(err, "outputPayoutInfo");
  }
}

/**
 * Payoutに紐づくBalance Transactionsを取得
 * 自動入金と手動入金で取得方法を切り替える
 *
 * Stripe APIの制約：
 * - 自動入金（automatic: true）: Balance Transactions APIの`payout`パラメータでフィルタリング可能
 * - 手動入金（automatic: false）: `payout`パラメータは使用不可、balance_transaction IDから直接取得
 *
 * @param {Object} payout - Payoutオブジェクト
 * @return {Array} Balance Transactionの配列
 */
function fetchBalanceTransactionsForPayout(payout) {
  try {
    // 自動入金の場合：Balance Transactions APIで複数の取引明細を取得
    if (payout.automatic) {
      return fetchBalanceTransactionsForAutomaticPayout(payout.id);
    }

    // 手動入金の場合：Payoutのbalance_transaction IDから直接取得
    else {
      return fetchBalanceTransactionForManualPayout(payout);
    }

  } catch (err) {
    console.error(`Balance Transactions取得エラー (Payout: ${payout.id}):`, err.message);
    throw new Error(`Balance Transactionsの取得に失敗しました: ${err.message}`);
  }
}

/**
 * 自動入金に紐づくBalance Transactionsを取得（ページネーション対応）
 *
 * @param {string} payoutId - Payout ID
 * @return {Array} Balance Transactionの配列
 */
function fetchBalanceTransactionsForAutomaticPayout(payoutId) {
  const allTransactions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    // Balance Transactions APIのパラメータを構築
    const params = {
      payout: payoutId,
      limit: CONFIG.STRIPE_LIMITS.BALANCE_TRANSACTION
    };

    // ページネーション用のパラメータを追加
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const url = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.BALANCE_TRANSACTIONS, params);
    const response = getStripeInfo(url);

    // 取得したトランザクションを配列に追加
    if (response.data && response.data.length > 0) {
      allTransactions.push(...response.data);

      // 次のページがあるかチェック
      hasMore = response.has_more;

      // 次のページ取得用のカーソルを設定
      if (hasMore) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    } else {
      hasMore = false;
    }
  }

  return allTransactions;
}

/**
 * 手動入金のBalance Transactionを取得
 * 手動入金の場合、Payout自体が1つのBalance Transactionとして記録される
 *
 * @param {Object} payout - Payoutオブジェクト
 * @return {Array} Balance Transactionの配列（1件）
 */
function fetchBalanceTransactionForManualPayout(payout) {
  // balance_transactionフィールドが存在しない場合
  if (!payout.balance_transaction) {
    console.warn(`手動入金 ${payout.id} にはbalance_transactionが設定されていません`);
    return [];
  }

  // Balance Transaction IDから直接取得
  const balanceTransactionId = payout.balance_transaction;
  const url = buildStripeUrl(`${CONFIG.STRIPE_API.ENDPOINTS.BALANCE_TRANSACTIONS}/${balanceTransactionId}`, {});
  const transaction = getStripeInfo(url);

  // 配列形式で返す（既存のコードとの互換性のため）
  return [transaction];
}

/**
 * 指定期間の入金情報を取得（カスタム期間指定版）
 *
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 */
function outputPayoutInfoByDateRange(startDate, endDate) {
  try {
    console.log("=== 期間指定での入金情報取得を開始 ===");
    console.log(`期間: ${startDate.toISOString()} 〜 ${endDate.toISOString()}`);

    // UNIX時刻に変換（秒単位）
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Stripeサーバーから期間指定で入金一覧を取得
    const payoutsUrl = buildStripeUrl(CONFIG.STRIPE_API.ENDPOINTS.PAYOUTS, {
      limit: CONFIG.STRIPE_LIMITS.PAYOUT,
      'arrival_date[gte]': startTimestamp,
      'arrival_date[lte]': endTimestamp
    });

    console.log(`Payouts API呼び出し: ${payoutsUrl}`);
    const { data: payoutList } = getStripeInfo(payoutsUrl);
    console.log(`入金件数: ${payoutList.length}件`);

    // 出力用配列を作成
    const outputInfoArray = [];

    for (const payout of payoutList) {
      const arrivalDate = unixToDate(payout.arrival_date);
      console.log(`処理中: Payout ${payout.id} - ${arrivalDate.toISOString()}`);

      // この入金に紐づく取引明細を取得
      const transactions = fetchAllBalanceTransactions(payout.id);
      console.log(`  取引明細件数: ${transactions.length}件`);

      // 各取引明細を出力配列に追加
      for (const transaction of transactions) {
        const transactionDate = unixToDate(transaction.created);

        const infoList = [
          payout.id,
          arrivalDate,
          payout.amount,
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.fee,
          transaction.net,
          transaction.currency,
          transactionDate,
          transaction.description || ""
        ];

        outputInfoArray.push(infoList);
      }
    }

    console.log(`合計出力行数: ${outputInfoArray.length}行`);

    // 入金情報をシートに追加
    outputToSheet(CONFIG.SHEETS.PAYOUT, outputInfoArray);

    console.log("=== 期間指定での入金情報出力が完了しました ===");

  } catch(err) {
    handleError(err, "outputPayoutInfoByDateRange");
  }
}
