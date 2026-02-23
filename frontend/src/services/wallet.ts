import api from './api';
import type { WalletSummary, WalletHistory, WalletStats } from '../types';

export const walletService = {
  async getSummary(): Promise<WalletSummary> {
    const res = await api.get('/wallet');
    return res.data;
  },
  async getHistory(days?: number): Promise<WalletHistory[]> {
    const res = await api.get('/wallet/history', { params: { days } });
    return res.data.history;
  },
  async getStats(): Promise<WalletStats> {
    const res = await api.get('/wallet/stats');
    return res.data.stats;
  },
};
