export interface CardOrder {
  id: string;
  product_id: string;
  amount: number;
  currency: string;
  status: string;
  last4: string | null;
  brand: string;
  expiry: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface CardSensitive {
  id: string;
  card_number: string;
  cvv: string;
  expiry: string;
  last4: string;
  brand: string;
  status: string;
  amount: number;
  currency: string;
}

export interface CardBalance {
  available: string;
  currency: string;
}

export interface WalletInfo {
  accountId: string;
  currency: string;
  availableBalance: string;
  totalBalance: string;
  frozenBalance: string;
}

export interface ChainBalance {
  chain: string;
  icon: string;
  symbol: string;
  balance: number;
  usdValue?: number;
}

export interface SpendingConfig {
  autoApproveBelow: number;
  approvalThreshold: number;
  dailyLimit: number;
  monthlyLimit: number;
  alwaysRequireApproval: string[];
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  card_last4?: string;
  description?: string;
  created_at: string;
}
