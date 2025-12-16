/**
 * Stripe API Type Definitions
 *
 * TypeScript type definitions for Stripe API objects used in this project.
 * Based on Stripe API version 2024-xx-xx
 */

/**
 * Google Apps Script Global Objects
 */
declare const console: {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
};

/**
 * Stripe Payout Object
 * Represents a payout to a bank account or debit card
 */
interface StripePayout {
  /** Unique identifier for the payout */
  id: string;

  /** String representing the object's type. Value is "payout" */
  object: 'payout';

  /** Amount (in smallest currency unit) to be transferred to your bank account or debit card */
  amount: number;

  /** Date the payout is expected to arrive in the bank (UNIX timestamp) */
  arrival_date: number;

  /** Returns true if the payout was created by an automated payout schedule */
  automatic: boolean;

  /** ID of the balance transaction that describes the impact of this payout on your account balance */
  balance_transaction: string | null;

  /** Time at which the payout was created (UNIX timestamp) */
  created: number;

  /** Three-letter ISO currency code (lowercase) */
  currency: string;

  /** An arbitrary string attached to the object */
  description: string | null;

  /** ID of the bank account or card the payout was sent to */
  destination: string | null;

  /** If the payout failed or was canceled, this will be the ID of the balance transaction */
  failure_balance_transaction: string | null;

  /** Error code explaining reason for payout failure if available */
  failure_code: string | null;

  /** Message to user further explaining reason for payout failure if available */
  failure_message: string | null;

  /** Has the value true if the object exists in live mode or false if in test mode */
  livemode: boolean;

  /** Set of key-value pairs that you can attach to an object */
  metadata: Record<string, string>;

  /** The method used to send this payout (standard or instant) */
  method: 'standard' | 'instant';

  /** The source balance this payout came from */
  source_type: 'card' | 'bank_account';

  /** Extra information about a payout */
  statement_descriptor: string | null;

  /** Current status of the payout (paid, pending, in_transit, canceled, or failed) */
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';

  /** Can be bank_account or card */
  type: 'bank_account' | 'card';
}

/**
 * Stripe Balance Transaction Object
 * Represents a single transaction that updates your Stripe balance
 */
interface StripeBalanceTransaction {
  /** Unique identifier for the balance transaction */
  id: string;

  /** String representing the object's type. Value is "balance_transaction" */
  object: 'balance_transaction';

  /** Gross amount of the transaction (in smallest currency unit) */
  amount: number;

  /** The date the transaction's net funds will become available (UNIX timestamp) */
  available_on: number;

  /** Time at which the balance transaction was created (UNIX timestamp) */
  created: number;

  /** Three-letter ISO currency code (lowercase) */
  currency: string;

  /** An arbitrary string attached to the object */
  description: string | null;

  /** The exchange rate used, if applicable */
  exchange_rate: number | null;

  /** Fees (in smallest currency unit) paid for this transaction */
  fee: number;

  /** Detailed breakdown of fees (in smallest currency unit) paid for this transaction */
  fee_details: Array<{
    /** Amount of the fee */
    amount: number;
    /** Three-letter ISO currency code */
    currency: string;
    /** Description of the fee */
    description: string;
    /** Type of fee */
    type: string;
  }>;

  /** Net amount of the transaction (in smallest currency unit) */
  net: number;

  /** The Stripe object to which this transaction is related */
  source: string | null;

  /** Current status of the transaction (available or pending) */
  status: 'available' | 'pending';

  /** Transaction type */
  type:
    | 'adjustment'
    | 'advance'
    | 'advance_funding'
    | 'application_fee'
    | 'application_fee_refund'
    | 'charge'
    | 'connect_collection_transfer'
    | 'contribution'
    | 'issuing_authorization_hold'
    | 'issuing_authorization_release'
    | 'issuing_dispute'
    | 'issuing_transaction'
    | 'payment'
    | 'payment_failure_refund'
    | 'payment_refund'
    | 'payout'
    | 'payout_cancel'
    | 'payout_failure'
    | 'refund'
    | 'refund_failure'
    | 'reserve_transaction'
    | 'reserved_funds'
    | 'stripe_fee'
    | 'stripe_fx_fee'
    | 'tax_fee'
    | 'topup'
    | 'topup_reversal'
    | 'transfer'
    | 'transfer_cancel'
    | 'transfer_failure'
    | 'transfer_refund';
}

/**
 * Stripe List Response
 * Generic type for paginated list responses from Stripe API
 */
interface StripeListResponse<T> {
  /** String representing the object's type. Value is "list" */
  object: 'list';

  /** Array of data items */
  data: T[];

  /** Whether there are more items available */
  has_more: boolean;

  /** URL for accessing this list */
  url: string;
}

/**
 * Config object structure
 */
interface Config {
  SHEETS: {
    CHARGE: string;
    INVOICE: string;
    PAYMENT: string;
    SESSION: string;
    PAYOUT: string;
  };

  CELLS: {
    LATEST_DATE_ROW: number;
    LATEST_DATE_COLUMN: number;
    INSERT_ROW: number;
  };

  STRIPE_LIMITS: {
    CHARGE: number;
    CUSTOMER: number;
    INVOICE: number;
    PAYMENT: number;
    PAYOUT: number;
    BALANCE_TRANSACTION: number;
  };

  STRIPE_API: {
    BASE_URL: string;
    ENDPOINTS: {
      CHARGES: string;
      CUSTOMERS: string;
      INVOICES: string;
      PAYMENT_INTENTS: string;
      CHECKOUT_SESSIONS: string;
      PAYOUTS: string;
      BALANCE_TRANSACTIONS: string;
    };
  };

  SLACK: {
    NOTIFICATION_USER: string;
    NOTIFICATION_CHANNEL: string;
  };
}

/**
 * Global function declarations
 */

/**
 * Get the latest date from a specified sheet
 */
declare function getLatestDate(sheetName: string): Date;

/**
 * Output data array to a specified sheet
 */
declare function outputToSheet(sheetName: string, dataArray: any[][]): void;

/**
 * Convert UNIX timestamp to Date object
 */
declare function unixToDate(unixTime: number): Date;

/**
 * Get customer name from customer object or ID
 */
declare function getCustomerName(customer: any): string;

/**
 * Handle errors with logging and Slack notification
 */
declare function handleError(err: Error, functionName: string): never;

/**
 * Build Stripe API URL with query parameters
 */
declare function buildStripeUrl(endpoint: string, params?: Record<string, any>): string;

/**
 * Fetch information from Stripe API
 */
declare function getStripeInfo(url: string): any;

/**
 * Output payout information to spreadsheet
 */
declare function outputPayoutInfo(): void;

/**
 * Output payout information for a specific date range
 */
declare function outputPayoutInfoByDateRange(startDate: Date, endDate: Date): void;

/**
 * Fetch balance transactions for a payout (automatic or manual)
 */
declare function fetchBalanceTransactionsForPayout(payout: StripePayout): StripeBalanceTransaction[];

/**
 * Fetch balance transactions for automatic payout (with pagination)
 */
declare function fetchBalanceTransactionsForAutomaticPayout(payoutId: string): StripeBalanceTransaction[];

/**
 * Fetch balance transaction for manual payout
 */
declare function fetchBalanceTransactionForManualPayout(payout: StripePayout): StripeBalanceTransaction[];

/**
 * Test functions
 */
declare function testPayoutsConnectionSmall(): void;
declare function testBalanceTransactionsConnection(): void;
declare function testFetchAllBalanceTransactions(): void;
declare function testOutputPayoutInfoDryRun(): void;
declare function testPayoutsByDateRange(): void;

