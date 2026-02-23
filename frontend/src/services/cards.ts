import api from './api';
import type { Card, Transaction } from '../types';

function mapCard(c: any): Card {
  return {
    id: c.id,
    last_four: c.lastFour,
    card_type: c.cardType,
    nickname: c.nickname,
    color: c.cardColor,
    bank_name: c.bankName,
    is_active: c.isActive,
    created_at: c.createdAt || '',
  };
}

export const cardsService = {
  async getCards(): Promise<Card[]> {
    const res = await api.get('/cards');
    return (res.data as any[]).map(mapCard);
  },
  async addCard(data: { last_four: string; card_type: string; nickname: string; color: string; bank_name: string }): Promise<Card> {
    const res = await api.post('/cards', {
      lastFour: data.last_four,
      cardType: data.card_type,
      nickname: data.nickname,
      cardColor: data.color,
      bankName: data.bank_name,
    });
    return mapCard(res.data);
  },
  async deleteCard(cardId: string): Promise<void> {
    await api.delete(`/cards/${cardId}`);
  },
  async toggleCard(cardId: string): Promise<{ is_active: boolean }> {
    const res = await api.patch(`/cards/${cardId}/toggle`);
    return { is_active: res.data.isActive };
  },
  async simulateTransaction(cardId: string): Promise<{ transaction: Transaction; roundup_amount: number }> {
    const res = await api.post(`/cards/${cardId}/simulate`, {});
    const t = res.data;
    return {
      transaction: {
        id: t.id,
        card_id: cardId,
        merchant: t.merchant,
        category: t.category,
        amount: t.amount,
        roundup_amount: t.roundupAmount,
        created_at: t.createdAt,
      },
      roundup_amount: t.roundupAmount,
    };
  },
};
