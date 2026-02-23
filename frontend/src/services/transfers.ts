import api from './api';
import type { Transfer, VirtualCard, InvestmentPortfolio } from '../types';

export const transfersService = {
  async getTransfers(): Promise<Transfer[]> {
    const res = await api.get('/transfers');
    return res.data.transfers;
  },
  async createTransfer(data: { amount: number; type: 'virtual_card' | 'investment'; notes?: string }): Promise<Transfer> {
    const res = await api.post('/transfers', data);
    return res.data.transfer;
  },
  async getVirtualCard(): Promise<VirtualCard> {
    const res = await api.get('/transfers/virtual-card');
    return res.data.virtual_card;
  },
  async getInvestment(): Promise<InvestmentPortfolio> {
    const res = await api.get('/transfers/investment');
    return res.data.portfolio;
  },
};
