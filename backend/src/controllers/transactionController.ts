import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

export const getTransactions = (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const cardId = req.query.cardId as string;

  let query = `
    SELECT t.*, c.nickname as card_nickname, c.last_four, c.card_type, c.card_color
    FROM transactions t
    JOIN cards c ON c.id = t.card_id
    WHERE t.user_id = ?
  `;
  const params: any[] = [userId];

  if (cardId) { query += ' AND t.card_id = ?'; params.push(cardId); }
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const transactions = db.prepare(query).all(...params);
  const total = (db.prepare('SELECT COUNT(*) as c FROM transactions WHERE user_id = ?').get(userId) as any).c;

  res.json({
    transactions: transactions.map((t: any) => ({
      id: t.id,
      merchant: t.merchant,
      category: t.category,
      amount: t.amount,
      roundupAmount: t.roundup_amount,
      description: t.description,
      cardNickname: t.card_nickname,
      lastFour: t.last_four,
      cardType: t.card_type,
      cardColor: t.card_color,
      createdAt: t.created_at,
    })),
    total,
    limit,
    offset,
  });
};
