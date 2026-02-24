import api from './api';
import type { RecurringDeposit } from '../types';

export const recurringService = {
  async getRecurring(): Promise<RecurringDeposit[]> {
    const res = await api.get('/recurring');
    return res.data as RecurringDeposit[];
  },
  async createRecurring(data: { amount: number; frequency: 'daily' | 'weekly' | 'monthly' }): Promise<RecurringDeposit> {
    const res = await api.post('/recurring', data);
    return res.data as RecurringDeposit;
  },
  async toggle(id: string): Promise<{ isActive: boolean }> {
    const res = await api.patch(`/recurring/${id}/toggle`, {});
    return res.data;
  },
  async deleteRecurring(id: string): Promise<void> {
    await api.delete(`/recurring/${id}`);
  },
};
