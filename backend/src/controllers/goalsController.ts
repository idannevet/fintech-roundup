import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

function mapGoal(g: any) {
  return {
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    targetAmount: g.target_amount,
    currentAmount: g.current_amount,
    deadline: g.deadline,
    isCompleted: !!g.is_completed,
    createdAt: g.created_at,
  };
}

export const getGoals = (req: AuthRequest, res: Response): void => {
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.userId);
  res.json((goals as any[]).map(mapGoal));
};

export const createGoal = (req: AuthRequest, res: Response): void => {
  const { name, emoji, targetAmount, deadline } = req.body;
  if (!name || !targetAmount || targetAmount <= 0) {
    res.status(400).json({ error: 'Name and a positive target amount are required' });
    return;
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO goals (id, user_id, name, emoji, target_amount, deadline)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.userId, name, emoji || '🎯', targetAmount, deadline || null);
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any;
  res.status(201).json(mapGoal(goal));
};

export const updateGoal = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { name, emoji, targetAmount, deadline } = req.body;
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, req.user!.userId) as any;
  if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }
  db.prepare(`
    UPDATE goals SET
      name = COALESCE(?, name),
      emoji = COALESCE(?, emoji),
      target_amount = COALESCE(?, target_amount),
      deadline = COALESCE(?, deadline)
    WHERE id = ?
  `).run(name || null, emoji || null, targetAmount || null, deadline || null, id);
  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any;
  res.json(mapGoal(updated));
};

export const deleteGoal = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(id, req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Goal not found' }); return; }
  res.json({ message: 'Goal deleted' });
};

export const contributeToGoal = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Amount must be positive' });
    return;
  }

  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }
  if (goal.is_completed) { res.status(400).json({ error: 'Goal already completed' }); return; }

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as any;
  if (!wallet || wallet.total_balance < amount) {
    res.status(400).json({ error: 'Insufficient wallet balance' });
    return;
  }

  const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
  const actualContribution = newAmount - goal.current_amount;
  const isCompleted = newAmount >= goal.target_amount ? 1 : 0;

  db.prepare('UPDATE goals SET current_amount = ?, is_completed = ? WHERE id = ?')
    .run(newAmount, isCompleted, id);
  db.prepare('UPDATE wallets SET total_balance = total_balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?')
    .run(actualContribution, userId);

  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any;
  res.json({ ...mapGoal(updated), justCompleted: !!isCompleted });
};
