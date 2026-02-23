import api from './api';
import type { Transaction } from '../types';

export const transactionsService = {
  async getTransactions(params?: { limit?: number; offset?: number; card_id?: string }): Promise<{ transactions: Transaction[]; total: number }> {
    const apiParams: any = {};
    if (params?.limit) apiParams.limit = params.limit;
    if (params?.offset) apiParams.offset = params.offset;
    if (params?.card_id) apiParams.cardId = params.card_id;

    const res = await api.get('/transactions', { params: apiParams });
    return {
      transactions: (res.data.transactions || []).map((t: any) => ({
        id: t.id,
        card_id: t.cardId || '',
        merchant: t.merchant,
        category: t.category,
        amount: t.amount,
        roundup_amount: t.roundupAmount,
        created_at: t.createdAt,
        card_last_four: t.lastFour,
        card_nickname: t.cardNickname,
        card_color: t.cardColor,
      })),
      total: res.data.total || 0,
    };
  },
};
