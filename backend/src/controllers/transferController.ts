import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

export const getTransfers = (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const transfers = db.prepare('SELECT * FROM transfers WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
  res.json(transfers.map((t: any) => ({
    id: t.id,
    amount: t.amount,
    transferType: t.transfer_type,
    destinationLabel: t.destination_label,
    status: t.status,
    notes: t.notes,
    createdAt: t.created_at,
  })));
};

export const createTransfer = (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { amount, transferType, notes } = req.body;

  if (!['virtual_card', 'investment'].includes(transferType)) {
    res.status(400).json({ error: 'Invalid transfer type' });
    return;
  }

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as any;
  if (!wallet || wallet.total_balance < amount) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }

  let destinationLabel = '';
  if (transferType === 'virtual_card') {
    const vc = db.prepare('SELECT * FROM virtual_cards WHERE user_id = ?').get(userId) as any;
    if (!vc) { res.status(404).json({ error: 'Virtual card not found' }); return; }
    db.prepare('UPDATE virtual_cards SET balance = balance + ? WHERE user_id = ?').run(amount, userId);
    destinationLabel = `Virtual Card •••• ${vc.card_number.slice(-4)}`;
  } else {
    const portfolio = db.prepare('SELECT * FROM investment_portfolios WHERE user_id = ?').get(userId) as any;
    if (!portfolio) { res.status(404).json({ error: 'Portfolio not found' }); return; }
    db.prepare('UPDATE investment_portfolios SET balance = balance + ?, total_invested = total_invested + ?, updated_at = datetime(\'now\') WHERE user_id = ?')
      .run(amount, amount, userId);
    destinationLabel = 'Investment Portfolio';
  }

  // Deduct from wallet
  db.prepare('UPDATE wallets SET total_balance = total_balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(amount, userId);

  const id = uuidv4();
  db.prepare(`INSERT INTO transfers (id, user_id, amount, transfer_type, destination_label, notes) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, userId, amount, transferType, destinationLabel, notes || null);

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id) as any;
  res.status(201).json({
    id: transfer.id, amount: transfer.amount, transferType: transfer.transfer_type,
    destinationLabel: transfer.destination_label, status: transfer.status,
    notes: transfer.notes, createdAt: transfer.created_at,
  });
};

export const getVirtualCard = (req: AuthRequest, res: Response): void => {
  const vc = db.prepare('SELECT * FROM virtual_cards WHERE user_id = ?').get(req.user!.userId) as any;
  if (!vc) { res.status(404).json({ error: 'Virtual card not found' }); return; }
  res.json({
    id: vc.id,
    cardNumber: vc.card_number,
    expiry: vc.expiry,
    cvv: vc.cvv,
    balance: vc.balance,
    isActive: !!vc.is_active,
    createdAt: vc.created_at,
  });
};

export const getInvestment = (req: AuthRequest, res: Response): void => {
  const portfolio = db.prepare('SELECT * FROM investment_portfolios WHERE user_id = ?').get(req.user!.userId) as any;
  if (!portfolio) { res.status(404).json({ error: 'Portfolio not found' }); return; }

  // Simulate a slight random drift in return percent
  const drift = (Math.random() - 0.4) * 0.5;
  const newReturn = parseFloat(Math.max(-10, Math.min(25, (portfolio.return_percent || 0) + drift)).toFixed(2));
  db.prepare('UPDATE investment_portfolios SET return_percent = ? WHERE user_id = ?').run(newReturn, req.user!.userId);

  res.json({
    id: portfolio.id,
    balance: portfolio.balance,
    totalInvested: portfolio.total_invested,
    returnPercent: newReturn,
    profit: parseFloat((portfolio.balance - portfolio.total_invested).toFixed(2)),
    updatedAt: portfolio.updated_at,
  });
};
