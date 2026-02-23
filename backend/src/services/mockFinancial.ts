import { v4 as uuidv4 } from 'uuid';

const MERCHANTS = [
  { name: 'Shufersal', category: 'Groceries' },
  { name: 'Rami Levi', category: 'Groceries' },
  { name: 'McDonalds', category: 'Food & Dining' },
  { name: 'Aroma Cafe', category: 'Food & Dining' },
  { name: 'Yellow', category: 'Transport' },
  { name: 'Gett', category: 'Transport' },
  { name: 'Netflix', category: 'Entertainment' },
  { name: 'Spotify', category: 'Entertainment' },
  { name: 'Zara', category: 'Shopping' },
  { name: 'H&M', category: 'Shopping' },
  { name: 'Super-Pharm', category: 'Health' },
  { name: 'Golf & Co', category: 'Shopping' },
  { name: 'Electra', category: 'Electronics' },
  { name: 'Castro', category: 'Shopping' },
  { name: 'Fox', category: 'Shopping' },
];

export interface MockTransaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  description: string;
}

export function generateMockTransaction(): MockTransaction {
  const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
  // Generate realistic amounts in shekel (₪10 - ₪500)
  const baseAmount = Math.floor(Math.random() * 490) + 10;
  const cents = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90][Math.floor(Math.random() * 10)];
  const amount = parseFloat(`${baseAmount}.${cents}`);

  return {
    id: uuidv4(),
    merchant: merchant.name,
    category: merchant.category,
    amount,
    description: `Purchase at ${merchant.name}`,
  };
}

export function generateVirtualCardNumber(): string {
  const prefix = '4580'; // Visa-like
  let number = prefix;
  for (let i = 0; i < 12; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
}

export function generateCardExpiry(): string {
  const now = new Date();
  const year = now.getFullYear() + 3;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  return `${month}/${String(year).slice(2)}`;
}

export function generateCVV(): string {
  return String(Math.floor(Math.random() * 900) + 100);
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function simulateInvestmentReturn(principal: number): number {
  // Simulate between -2% and +8% monthly return
  const returnRate = (Math.random() * 10 - 2) / 100;
  return parseFloat((principal * (1 + returnRate)).toFixed(2));
}
