import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

export const getRoundingConfig = (req: AuthRequest, res: Response): void => {
  const config = db.prepare('SELECT * FROM rounding_configs WHERE user_id = ?').get(req.user!.userId) as any;
  if (!config) { res.status(404).json({ error: 'Config not found' }); return; }
  res.json({
    isEnabled: !!config.is_enabled,
    roundingUnit: config.rounding_unit,
    multiplier: config.multiplier ?? 1,
  });
};

export const updateRoundingConfig = (req: AuthRequest, res: Response): void => {
  const { isEnabled, roundingUnit, multiplier } = req.body;

  if (roundingUnit !== undefined && (roundingUnit <= 0 || roundingUnit > 1000)) {
    res.status(400).json({ error: 'Rounding unit must be between 1 and 1000' });
    return;
  }
  if (multiplier !== undefined && ![1, 2, 3].includes(multiplier)) {
    res.status(400).json({ error: 'Multiplier must be 1, 2, or 3' });
    return;
  }

  db.prepare(`
    UPDATE rounding_configs SET
      is_enabled = COALESCE(?, is_enabled),
      rounding_unit = COALESCE(?, rounding_unit),
      multiplier = COALESCE(?, multiplier),
      updated_at = datetime('now')
    WHERE user_id = ?
  `).run(
    isEnabled !== undefined ? (isEnabled ? 1 : 0) : null,
    roundingUnit !== undefined ? roundingUnit : null,
    multiplier !== undefined ? multiplier : null,
    req.user!.userId
  );

  const config = db.prepare('SELECT * FROM rounding_configs WHERE user_id = ?').get(req.user!.userId) as any;
  res.json({ isEnabled: !!config.is_enabled, roundingUnit: config.rounding_unit, multiplier: config.multiplier ?? 1 });
};

export const updateProfile = (req: AuthRequest, res: Response): void => {
  const { firstName, lastName, phone } = req.body;
  db.prepare('UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE id = ?')
    .run(firstName || null, lastName || null, phone || null, req.user!.userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
  res.json({
    id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name,
    phone: user.phone, isVerified: !!user.is_verified, role: user.role, avatarColor: user.avatar_color,
  });
};
