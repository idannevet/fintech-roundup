import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

function nextDateForFrequency(frequency: string): string {
  const d = new Date();
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1); // monthly
  return d.toISOString().split('T')[0];
}

function mapDeposit(r: any) {
  return {
    id: r.id,
    amount: r.amount,
    frequency: r.frequency,
    nextDate: r.next_date,
    isActive: !!r.is_active,
    createdAt: r.created_at,
  };
}

export const getRecurring = (req: AuthRequest, res: Response): void => {
  const deposits = db.prepare('SELECT * FROM recurring_deposits WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.userId);
  res.json((deposits as any[]).map(mapDeposit));
};

export const createRecurring = (req: AuthRequest, res: Response): void => {
  const { amount, frequency } = req.body;
  const valid = ['daily', 'weekly', 'monthly'];
  if (!amount || amount <= 0 || !valid.includes(frequency)) {
    res.status(400).json({ error: 'Valid amount and frequency (daily/weekly/monthly) required' });
    return;
  }
  const id = uuidv4();
  const nextDate = nextDateForFrequency(frequency);
  db.prepare(`
    INSERT INTO recurring_deposits (id, user_id, amount, frequency, next_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user!.userId, amount, frequency, nextDate);
  const deposit = db.prepare('SELECT * FROM recurring_deposits WHERE id = ?').get(id) as any;
  res.status(201).json(mapDeposit(deposit));
};

export const toggleRecurring = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const deposit = db.prepare('SELECT * FROM recurring_deposits WHERE id = ? AND user_id = ?').get(id, req.user!.userId) as any;
  if (!deposit) { res.status(404).json({ error: 'Recurring deposit not found' }); return; }
  db.prepare('UPDATE recurring_deposits SET is_active = ? WHERE id = ?').run(deposit.is_active ? 0 : 1, id);
  res.json({ isActive: !deposit.is_active });
};

export const deleteRecurring = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM recurring_deposits WHERE id = ? AND user_id = ?').run(id, req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Recurring deposit not found' }); return; }
  res.json({ message: 'Recurring deposit deleted' });
};
