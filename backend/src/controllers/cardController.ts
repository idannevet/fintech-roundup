import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { calculateRoundup } from '../services/roundingService';
import { generateMockTransaction } from '../services/mockFinancial';

export const getCards = (req: AuthRequest, res: Response): void => {
  const cards = db.prepare('SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.userId);
  res.json(cards.map((c: any) => ({
    id: c.id,
    nickname: c.nickname,
    lastFour: c.last_four,
    cardType: c.card_type,
    cardColor: c.card_color,
    bankName: c.bank_name,
    isActive: !!c.is_active,
    createdAt: c.created_at,
  })));
};

export const addCard = (req: AuthRequest, res: Response): void => {
  const { nickname, lastFour, cardType, cardColor, bankName } = req.body;
  const userId = req.user!.userId;

  const count = (db.prepare('SELECT COUNT(*) as c FROM cards WHERE user_id = ?').get(userId) as any).c;
  if (count >= 5) {
    res.status(400).json({ error: 'Maximum 5 cards allowed' });
    return;
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO cards (id, user_id, nickname, last_four, card_type, card_color, bank_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, nickname, lastFour, cardType || 'visa', cardColor || '#6C63FF', bankName || 'Mock Bank');

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as any;
  res.status(201).json({
    id: card.id, nickname: card.nickname, lastFour: card.last_four,
    cardType: card.card_type, cardColor: card.card_color, bankName: card.bank_name,
    isActive: !!card.is_active, createdAt: card.created_at,
  });
};

export const deleteCard = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM cards WHERE id = ? AND user_id = ?').run(id, req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Card not found' }); return; }
  res.json({ message: 'Card removed' });
};

export const toggleCard = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(id, req.user!.userId) as any;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  db.prepare('UPDATE cards SET is_active = ? WHERE id = ?').run(card.is_active ? 0 : 1, id);
  res.json({ isActive: !card.is_active });
};

export const simulateTransaction = (req: AuthRequest, res: Response): void => {
  const { id: cardId } = req.params;
  const userId = req.user!.userId;

  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ? AND is_active = 1').get(cardId, userId) as any;
  if (!card) { res.status(404).json({ error: 'Card not found or inactive' }); return; }

  const config = db.prepare('SELECT * FROM rounding_configs WHERE user_id = ?').get(userId) as any;
  const roundingUnit = config?.rounding_unit || 1;
  const isEnabled = config?.is_enabled !== 0;

  const mock = generateMockTransaction();
  const roundupAmount = isEnabled ? calculateRoundup(mock.amount, roundingUnit) : 0;

  const txId = uuidv4();
  db.prepare(`
    INSERT INTO transactions (id, user_id, card_id, merchant, category, amount, roundup_amount, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(txId, userId, cardId, mock.merchant, mock.category, mock.amount, roundupAmount, mock.description);

  if (roundupAmount > 0) {
    db.prepare(`
      UPDATE wallets SET
        total_balance = total_balance + ?,
        monthly_balance = monthly_balance + ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(roundupAmount, roundupAmount, userId);
  }

  res.status(201).json({
    id: txId,
    merchant: mock.merchant,
    category: mock.category,
    amount: mock.amount,
    roundupAmount,
    description: mock.description,
    createdAt: new Date().toISOString(),
  });
};
