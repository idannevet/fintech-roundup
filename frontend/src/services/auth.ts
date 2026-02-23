import api from './api';
import type { User } from '../types';

export const authService = {
  async register(data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return { accessToken, refreshToken, user: user as User };
  },
  async verifyOTP(email: string, otp: string, type: 'verification' | 'password_reset') {
    const res = await api.post('/auth/verify-otp', { email, otp, type });
    if (res.data.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return res.data;
  },
  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  async resetPassword(email: string, otp: string, newPassword: string) {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword });
    return res.data;
  },
  async getProfile(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};
