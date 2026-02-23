import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

export const getWallet = (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as any;
  if (!wallet) { res.status(404).json({ error: 'Wallet not found' }); return; }

  // Get per-card breakdown
  const cardBreakdown = db.prepare(`
    SELECT cards.id, cards.nickname, cards.last_four, cards.card_type, cards.card_color,
           SUM(transactions.roundup_amount) as total_roundup,
           COUNT(transactions.id) as tx_count
    FROM cards
    LEFT JOIN transactions ON transactions.card_id = cards.id
    WHERE cards.user_id = ?
    GROUP BY cards.id
  `).all(userId);

  res.json({
    totalBalance: wallet.total_balance,
    monthlyBalance: wallet.monthly_balance,
    lastMonthlyReset: wallet.last_monthly_reset,
    cardBreakdown: cardBreakdown.map((c: any) => ({
      cardId: c.id,
      nickname: c.nickname,
      lastFour: c.last_four,
      cardType: c.card_type,
      cardColor: c.card_color,
      totalRoundup: c.total_roundup || 0,
      txCount: c.tx_count,
    })),
  });
};

export const getWalletHistory = (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const days = parseInt(req.query.days as string) || 30;

  // Get daily roundup totals for chart
  const history = db.prepare(`
    SELECT date(created_at) as date, SUM(roundup_amount) as amount, COUNT(*) as count
    FROM transactions
    WHERE user_id = ? AND roundup_amount > 0
      AND created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(userId, days);

  // Get monthly summary for the last 6 months
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(roundup_amount) as amount
    FROM transactions
    WHERE user_id = ? AND roundup_amount > 0
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC LIMIT 6
  `).all(userId);

  res.json({ daily: history, monthly });
};

export const getWalletStats = (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_transactions,
      SUM(roundup_amount) as total_saved,
      AVG(roundup_amount) as avg_roundup,
      MAX(roundup_amount) as max_roundup,
      SUM(amount) as total_spent
    FROM transactions
    WHERE user_id = ? AND roundup_amount > 0
  `).get(userId) as any;

  res.json({
    totalTransactions: stats.total_transactions || 0,
    totalSaved: stats.total_saved || 0,
    avgRoundup: parseFloat((stats.avg_roundup || 0).toFixed(2)),
    maxRoundup: stats.max_roundup || 0,
    totalSpent: stats.total_spent || 0,
  });
};
