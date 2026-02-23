import api from './api';
import type { RoundingConfig } from '../types';

function mapConfig(d: any): RoundingConfig {
  return {
    is_enabled: d.isEnabled,
    rounding_unit: d.roundingUnit,
  };
}

export const settingsService = {
  async getRoundingConfig(): Promise<RoundingConfig> {
    const res = await api.get('/settings/rounding');
    return mapConfig(res.data);
  },
  async updateRoundingConfig(data: Partial<RoundingConfig>): Promise<RoundingConfig> {
    const res = await api.put('/settings/rounding', {
      isEnabled: data.is_enabled,
      roundingUnit: data.rounding_unit,
    });
    return mapConfig(res.data);
  },
  async updateProfile(data: { first_name?: string; last_name?: string; phone?: string }) {
    const res = await api.put('/settings/profile', {
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
    });
    return res.data;
  },
};
