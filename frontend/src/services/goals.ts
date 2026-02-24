import api from './api';
import type { Goal } from '../types';

export const goalsService = {
  async getGoals(): Promise<Goal[]> {
    const res = await api.get('/goals');
    return res.data as Goal[];
  },
  async createGoal(data: { name: string; emoji?: string; targetAmount: number; deadline?: string }): Promise<Goal> {
    const res = await api.post('/goals', data);
    return res.data as Goal;
  },
  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    const res = await api.patch(`/goals/${id}`, data);
    return res.data as Goal;
  },
  async deleteGoal(id: string): Promise<void> {
    await api.delete(`/goals/${id}`);
  },
  async contribute(id: string, amount: number): Promise<Goal & { justCompleted: boolean }> {
    const res = await api.post(`/goals/${id}/contribute`, { amount });
    return res.data;
  },
};
