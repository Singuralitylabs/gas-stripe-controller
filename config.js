/**
 * Stripe Controller 設定ファイル
 * すべての設定値を一元管理
 */

const CONFIG = {
  // シート名
  SHEETS: {
    CHARGE: "取引情報",
    INVOICE: "請求書情報",
    PAYMENT: "支払い情報",
    SESSION: "セッション情報"
  },

  // セル位置
  CELLS: {
    LATEST_DATE_ROW: 2,
    LATEST_DATE_COLUMN: 2,  // B列
    INSERT_ROW: 2  // データ挿入位置
  },

  // Stripe APIのリミット値
  STRIPE_LIMITS: {
    CHARGE: 200,
    CUSTOMER: 100,
    INVOICE: 200,
    PAYMENT: 100
  },

  // Stripe APIのベースURL
  STRIPE_API: {
    BASE_URL: "https://api.stripe.com/v1",
    ENDPOINTS: {
      CHARGES: "/charges",
      CUSTOMERS: "/customers",
      INVOICES: "/invoices",
      PAYMENT_INTENTS: "/payment_intents",
      CHECKOUT_SESSIONS: "/checkout/sessions"
    }
  },

  // Slack通知設定
  SLACK: {
    NOTIFICATION_USER: "通知担当",
    NOTIFICATION_CHANNEL: "テスト用"
  }
};
