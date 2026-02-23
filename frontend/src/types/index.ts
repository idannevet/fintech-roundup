export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  role: string;
  avatar_color: string;
  created_at: string;
}

export interface Card {
  id: string;
  last_four: string;
  card_type: string;
  nickname: string;
  color: string;
  bank_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  card_id: string;
  merchant: string;
  category: string;
  amount: number;
  roundup_amount: number;
  created_at: string;
  card_last_four?: string;
  card_nickname?: string;
  card_color?: string;
}

export interface WalletSummary {
  total_balance: number;
  monthly_balance: number;
  last_monthly_reset: string;
  card_breakdown: CardBreakdown[];
}

export interface CardBreakdown {
  card_id: string;
  last_four: string;
  nickname: string;
  color: string;
  total_saved: number;
  transaction_count: number;
}

export interface WalletHistory {
  date: string;
  daily_total: number;
  transaction_count: number;
}

export interface WalletStats {
  total_transactions: number;
  total_saved: number;
  total_spent: number;
  avg_roundup: number;
  avg_transaction: number;
}

export interface Transfer {
  id: string;
  amount: number;
  type: 'virtual_card' | 'investment';
  destination_label: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface VirtualCard {
  id: string;
  card_number: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
  balance: number;
  is_active: boolean;
}

export interface InvestmentPortfolio {
  id: string;
  balance: number;
  total_invested: number;
  return_percent: number;
  created_at: string;
}

export interface RoundingConfig {
  is_enabled: boolean;
  rounding_unit: number;
}
