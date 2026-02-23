import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt';
import { generateOTP, generateVirtualCardNumber, generateCardExpiry, generateCVV } from '../services/mockFinancial';

function createUserResources(userId: string): void {
  // Create wallet
  db.prepare(`INSERT OR IGNORE INTO wallets (id, user_id) VALUES (?, ?)`).run(uuidv4(), userId);
  // Create rounding config
  db.prepare(`INSERT OR IGNORE INTO rounding_configs (id, user_id) VALUES (?, ?)`).run(uuidv4(), userId);
  // Create virtual card
  db.prepare(`INSERT OR IGNORE INTO virtual_cards (id, user_id, card_number, expiry, cvv) VALUES (?, ?, ?, ?, ?)`)
    .run(uuidv4(), userId, generateVirtualCardNumber(), generateCardExpiry(), generateCVV());
  // Create investment portfolio
  db.prepare(`INSERT OR IGNORE INTO investment_portfolios (id, user_id) VALUES (?, ?)`).run(uuidv4(), userId);
}

export const register = (req: Request, res: Response): void => {
  const { email, password, firstName, lastName, phone } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const userId = uuidv4();
  const avatarColors = ['#6C63FF', '#00D4FF', '#00E5A0', '#FF6B6B', '#FFD93D'];
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  db.prepare(`
    INSERT INTO users (id, email, phone, first_name, last_name, password_hash, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, email.toLowerCase(), phone || null, firstName, lastName, passwordHash, avatarColor);

  createUserResources(userId);

  // Create OTP for email verification
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO otp_codes (id, user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), userId, email.toLowerCase(), otp, 'verify', expiresAt);

  console.log(`[MOCK OTP] Verification code for ${email}: ${otp}`);

  res.status(201).json({
    message: 'Registration successful. Check your email for the verification code.',
    email: email.toLowerCase(),
    // In development, expose OTP for testing
    ...(process.env.NODE_ENV === 'development' && { otp }),
  });
};

export const verifyOTP = (req: Request, res: Response): void => {
  const { email, code, type } = req.body;

  const record = db.prepare(`
    SELECT otp_codes.*, users.id as userId FROM otp_codes
    JOIN users ON users.id = otp_codes.user_id
    WHERE otp_codes.email = ? AND otp_codes.code = ? AND otp_codes.type = ? AND otp_codes.used = 0
    ORDER BY otp_codes.created_at DESC LIMIT 1
  `).get(email.toLowerCase(), code, type) as any;

  if (!record) {
    res.status(400).json({ error: 'Invalid or expired code' });
    return;
  }

  if (new Date(record.expires_at) < new Date()) {
    res.status(400).json({ error: 'Code has expired' });
    return;
  }

  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(record.id);

  if (type === 'verify') {
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(record.userId);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(record.userId) as any;
  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  db.prepare(`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), user.id, hashToken(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

  res.json({
    message: type === 'verify' ? 'Email verified successfully' : 'OTP verified',
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isVerified: !!user.is_verified,
      role: user.role,
      avatarColor: user.avatar_color,
    },
  });
};

export const login = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  db.prepare(`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), user.id, hashToken(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isVerified: !!user.is_verified,
      role: user.role,
      avatarColor: user.avatar_color,
    },
  });
};

export const forgotPassword = (req: Request, res: Response): void => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as any;

  // Always return success to prevent email enumeration
  if (user) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare(`INSERT INTO otp_codes (id, user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), user.id, email.toLowerCase(), otp, 'reset', expiresAt);
    console.log(`[MOCK OTP] Password reset code for ${email}: ${otp}`);
    if (process.env.NODE_ENV === 'development') {
      res.json({ message: 'Reset code sent', otp });
      return;
    }
  }

  res.json({ message: 'If the email exists, a reset code has been sent.' });
};

export const resetPassword = (req: Request, res: Response): void => {
  const { email, newPassword } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);
  res.json({ message: 'Password reset successfully' });
};

export const getMe = (req: any, res: Response): void => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId) as any;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    isVerified: !!user.is_verified,
    role: user.role,
    avatarColor: user.avatar_color,
    createdAt: user.created_at,
  });
};

export const refreshToken = (req: Request, res: Response): void => {
  const { refreshToken: token } = req.body;
  if (!token) { res.status(400).json({ error: 'Refresh token required' }); return; }

  try {
    const payload = verifyRefreshToken(token);
    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND user_id = ?')
      .get(hashToken(token), payload.userId) as any;

    if (!stored || new Date(stored.expires_at) < new Date()) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = (req: any, res: Response): void => {
  const { refreshToken: token } = req.body;
  if (token) {
    db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hashToken(token));
  }
  res.json({ message: 'Logged out successfully' });
};
