import api from './api';
import type { Transaction } from '../types';

export const transactionsService = {
  async getTransactions(params?: { limit?: number; offset?: number; card_id?: string }): Promise<{ transactions: Transaction[]; total: number }> {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
};
