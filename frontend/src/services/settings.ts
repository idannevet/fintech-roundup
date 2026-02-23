import api from './api';
import type { RoundingConfig } from '../types';

export const settingsService = {
  async getRoundingConfig(): Promise<RoundingConfig> {
    const res = await api.get('/settings/rounding');
    return res.data.config;
  },
  async updateRoundingConfig(data: Partial<RoundingConfig>): Promise<RoundingConfig> {
    const res = await api.put('/settings/rounding', data);
    return res.data.config;
  },
  async updateProfile(data: { first_name?: string; last_name?: string; phone?: string }) {
    const res = await api.put('/settings/profile', data);
    return res.data;
  },
};
