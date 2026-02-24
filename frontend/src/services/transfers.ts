import api from './api';
import type { Transfer, VirtualCard, InvestmentPortfolio } from '../types';

function mapTransfer(t: any): Transfer {
  return {
    id: t.id,
    amount: t.amount,
    type: t.transferType as 'virtual_card' | 'investment',
    destination_label: t.destinationLabel,
    status: t.status,
    notes: t.notes,
    created_at: t.createdAt,
  };
}

export const transfersService = {
  async getTransfers(): Promise<Transfer[]> {
    const res = await api.get('/transfers');
    return (res.data as any[]).map(mapTransfer);
  },
  async createTransfer(data: { amount: number; type: 'virtual_card' | 'investment'; notes?: string }): Promise<Transfer> {
    const res = await api.post('/transfers', {
      amount: data.amount,
      transferType: data.type,
      notes: data.notes,
    });
    return mapTransfer(res.data);
  },
  async getVirtualCard(): Promise<VirtualCard> {
    const res = await api.get('/transfers/virtual-card');
    const vc = res.data;
    const parts = (vc.expiry || '01/30').split('/');
    const expiry_month = parseInt(parts[0], 10) || 1;
    const expiry_year = parseInt(parts[1], 10) || 30;
    return {
      id: vc.id,
      card_number: vc.cardNumber,
      expiry_month,
      expiry_year,
      cvv: vc.cvv,
      balance: vc.balance,
      is_active: vc.isActive,
    };
  },
  async getInvestment(): Promise<InvestmentPortfolio> {
    const res = await api.get('/transfers/investment');
    const p = res.data;
    return {
      id: p.id,
      balance: p.balance,
      total_invested: p.totalInvested,
      return_percent: p.returnPercent,
      risk_level: p.riskLevel || 'moderate',
      created_at: p.updatedAt || '',
    };
  },
  async updateRiskLevel(riskLevel: 'conservative' | 'moderate' | 'aggressive'): Promise<void> {
    await api.put('/transfers/investment/risk', { riskLevel });
  },
};
