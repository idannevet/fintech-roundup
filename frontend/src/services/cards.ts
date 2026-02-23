import api from './api';
import type { Card, Transaction } from '../types';

export const cardsService = {
  async getCards(): Promise<Card[]> {
    const res = await api.get('/cards');
    return res.data.cards;
  },
  async addCard(data: { last_four: string; card_type: string; nickname: string; color: string; bank_name: string }): Promise<Card> {
    const res = await api.post('/cards', data);
    return res.data.card;
  },
  async deleteCard(cardId: string): Promise<void> {
    await api.delete(`/cards/${cardId}`);
  },
  async toggleCard(cardId: string): Promise<Card> {
    const res = await api.patch(`/cards/${cardId}/toggle`);
    return res.data.card;
  },
  async simulateTransaction(cardId: string, options?: { merchant?: string; amount?: number; category?: string }): Promise<{ transaction: Transaction; roundup_amount: number }> {
    const res = await api.post(`/cards/${cardId}/simulate`, options || {});
    return res.data;
  },
};
