import api from './api';
import type { User } from '../types';

function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    first_name: u.firstName,
    last_name: u.lastName,
    is_verified: u.isVerified,
    role: u.role,
    avatar_color: u.avatarColor,
    created_at: u.createdAt || '',
  };
}

export const authService = {
  async register(data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) {
    const res = await api.post('/auth/register', {
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
    });
    return res.data;
  },
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return { accessToken, refreshToken, user: mapUser(user) };
  },
  async verifyOTP(email: string, otp: string, type: 'verification' | 'password_reset') {
    const backendType = type === 'verification' ? 'verify' : 'reset';
    const res = await api.post('/auth/verify-otp', { email, code: otp, type: backendType });
    if (res.data.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return { ...res.data, user: res.data.user ? mapUser(res.data.user) : undefined };
  },
  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  async resetPassword(email: string, _otp: string, newPassword: string) {
    const res = await api.post('/auth/reset-password', { email, newPassword });
    return res.data;
  },
  async getProfile(): Promise<User> {
    const res = await api.get('/auth/me');
    return mapUser(res.data);
  },
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};
