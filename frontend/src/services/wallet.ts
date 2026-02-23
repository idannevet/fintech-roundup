import api from './api';
import type { WalletSummary, WalletHistory, WalletStats } from '../types';

export const walletService = {
  async getSummary(): Promise<WalletSummary> {
    const res = await api.get('/wallet');
    const d = res.data;
    return {
      total_balance: d.totalBalance,
      monthly_balance: d.monthlyBalance,
      last_monthly_reset: d.lastMonthlyReset || '',
      card_breakdown: (d.cardBreakdown || []).map((c: any) => ({
        card_id: c.cardId,
        last_four: c.lastFour,
        nickname: c.nickname,
        color: c.cardColor,
        total_saved: c.totalRoundup,
        transaction_count: c.txCount,
      })),
    };
  },
  async getHistory(days?: number): Promise<WalletHistory[]> {
    const res = await api.get('/wallet/history', { params: { days } });
    return (res.data.daily || []).map((d: any) => ({
      date: d.date,
      daily_total: d.amount,
      transaction_count: d.count,
    }));
  },
  async getStats(): Promise<WalletStats> {
    const res = await api.get('/wallet/stats');
    const d = res.data;
    return {
      total_transactions: d.totalTransactions,
      total_saved: d.totalSaved,
      total_spent: d.totalSpent,
      avg_roundup: d.avgRoundup,
      avg_transaction: 0,
    };
  },
};
