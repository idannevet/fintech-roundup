import { create } from 'zustand';
import type { Card, WalletSummary, WalletStats } from '../types';

interface AppState {
  cards: Card[];
  wallet: WalletSummary | null;
  walletStats: WalletStats | null;
  setCards: (cards: Card[]) => void;
  setWallet: (wallet: WalletSummary | null) => void;
  setWalletStats: (stats: WalletStats | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  cards: [],
  wallet: null,
  walletStats: null,
  setCards: (cards) => set({ cards }),
  setWallet: (wallet) => set({ wallet }),
  setWalletStats: (walletStats) => set({ walletStats }),
}));
