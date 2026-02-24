import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { walletService } from '../../services/wallet';
import { cardsService } from '../../services/cards';
import { transactionsService } from '../../services/transactions';
import SavingsChart from '../../components/charts/SavingsChart';
import DonutChart from '../../components/charts/DonutChart';
import CreditCardDisplay from '../../components/cards/CreditCardDisplay';
import type { Transaction, WalletHistory } from '../../types';
import toast from 'react-hot-toast';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const categoryEmoji: Record<string, string> = {
  Groceries: '🛒', Food: '🍔', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Utilities: '💡', Travel: '✈️',
  Coffee: '☕', Fitness: '💪', Other: '💳',
};

function projectGrowth(principal: number, monthlyContrib: number, years: number, annualRate: number) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return { futureValue: Math.round(principal + monthlyContrib * n), points: [] };
  const futureValue = principal * Math.pow(1 + r, n) + monthlyContrib * (Math.pow(1 + r, n) - 1) / r;
  const step = Math.max(1, Math.floor(n / 24));
  const points = [];
  for (let m = 0; m <= n; m += step) {
    const fv = principal * Math.pow(1 + r, m) + monthlyContrib * (Math.pow(1 + r, m) - 1) / r;
    points.push({ m, value: Math.round(fv) });
  }
  return { futureValue: Math.round(futureValue), points };
}

function calcStreak(txs: Transaction[]): number {
  if (!txs.length) return 0;
  const days = new Set(txs.map(t => t.created_at.split('T')[0]));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (days.has(key)) streak++;
    else break;
  }
  return streak;
}

const MILESTONES = [
  { label: '₪50', value: 50 },
  { label: '₪100', value: 100 },
  { label: '₪500', value: 500 },
  { label: '₪1K', value: 1000 },
];

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cards, wallet, setCards, setWallet } = useAppStore();
  const [history, setHistory] = useState<WalletHistory[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [allTx, setAllTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [projMonthly, setProjMonthly] = useState(100);
  const [projYears, setProjYears] = useState(10);

  const load = useCallback(async () => {
    try {
      const [walletData, cardsData, histData, txData, allTxData] = await Promise.all([
        walletService.getSummary(),
        cardsService.getCards(),
        walletService.getHistory(14),
        transactionsService.getTransactions({ limit: 5 }),
        transactionsService.getTransactions({ limit: 500 }),
      ]);
      setWallet(walletData);
      setCards(cardsData);
      setHistory(histData);
      setRecentTx(txData.transactions);
      setAllTx(allTxData.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setWallet, setCards]);

  useEffect(() => { load(); }, [load]);

  const handleSimulate = async () => {
    const activeCard = cards.find(c => c.is_active);
    if (!activeCard) { toast.error('Add a card first'); navigate('/cards'); return; }
    setSimulating(true);
    try {
      const { transaction, roundup_amount } = await cardsService.simulateTransaction(activeCard.id);
      toast.success(`Saved ₪${roundup_amount.toFixed(2)} from ${transaction.merchant}!`);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const streak = calcStreak(allTx);
  const totalSaved = wallet?.total_balance || 0;
  const { futureValue, points } = projectGrowth(totalSaved, projMonthly, projYears, 0.07);

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="screen-padding pt-14 pb-8 space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{greeting()},</p>
          <h1 className="text-xl font-bold text-white">{user?.first_name} {user?.last_name} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/25">
              <span className="text-sm">🔥</span>
              <span className="text-orange-400 text-xs font-bold">{streak}d streak</span>
            </motion.div>
          )}
          <motion.button onClick={load} whileTap={{ scale: 0.9 }}
            className="w-10 h-10 glass-card flex items-center justify-center text-text-secondary hover:text-white">
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Main Balance Card */}
      <motion.div variants={item} className="relative rounded-3xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.3) 0%, rgba(0,212,255,0.15) 100%)', border: '1px solid rgba(124,92,252,0.3)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-blue/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-1">Total Saved</p>
              <h2 className="text-4xl font-black text-white">₪{totalSaved.toFixed(2)}</h2>
              <p className="text-neon-green text-sm font-medium mt-1 flex items-center gap-1">
                <TrendingUp size={14} />₪{(wallet?.monthly_balance || 0).toFixed(2)} this month
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl neon-gradient flex items-center justify-center shadow-glow-purple">
              <Zap size={22} className="text-white" />
            </div>
          </div>
          <motion.button onClick={handleSimulate} disabled={simulating || !cards.some(c => c.is_active)} whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition-all disabled:opacity-50">
            {simulating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Simulating...
              </span>
            ) : '⚡ Simulate Transaction'}
          </motion.button>
        </div>
      </motion.div>

      {/* Milestones */}
      <motion.div variants={item} className="glass-card p-4 space-y-2">
        <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Milestones</p>
        <div className="flex gap-2">
          {MILESTONES.map(m => {
            const reached = totalSaved >= m.value;
            return (
              <div key={m.value} className={`flex-1 py-2 rounded-xl text-center transition-all ${
                reached
                  ? 'bg-neon-green/15 border border-neon-green/40 text-neon-green'
                  : 'bg-white/5 border border-white/10 text-text-muted'
              }`}>
                <div className="text-base">{reached ? '✅' : '⬜'}</div>
                <div className="text-[10px] font-semibold mt-0.5">{m.label}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cards', value: cards.length.toString(), icon: '💳', color: 'text-neon-purple' },
          { label: 'This Month', value: `₪${(wallet?.monthly_balance || 0).toFixed(0)}`, icon: '📅', color: 'text-neon-green' },
          { label: 'Breakdowns', value: `${wallet?.card_breakdown?.length || 0}`, icon: '📊', color: 'text-neon-blue' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`font-bold text-sm ${s.color}`}>{s.value}</div>
            <div className="text-text-muted text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Growth Projection Widget */}
      <motion.div variants={item} className="glass-card p-5 space-y-4"
        style={{ border: '1px solid rgba(0,200,150,0.15)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">Growth Projection</h3>
            <p className="text-text-muted text-xs">7% annual return (estimated)</p>
          </div>
          <div className="text-right">
            <p className="text-neon-green font-black text-lg">₪{futureValue.toLocaleString()}</p>
            <p className="text-text-muted text-[10px]">in {projYears} yr{projYears > 1 ? 's' : ''}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={points} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="glass-card px-2 py-1 text-xs">
                    <span className="text-neon-green font-semibold">₪{(payload[0].value as number).toLocaleString()}</span>
                  </div>
                ) : null
              }
            />
            <Area type="monotone" dataKey="value" stroke="#00C896" strokeWidth={2} fill="url(#projGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted text-xs">Monthly contribution</span>
              <span className="text-white text-xs font-semibold">₪{projMonthly}</span>
            </div>
            <input type="range" min={10} max={500} step={10} value={projMonthly}
              onChange={e => setProjMonthly(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-neon-green" />
          </div>
          <div className="flex gap-2">
            {[1, 5, 10, 20].map(y => (
              <button key={y} onClick={() => setProjYears(y)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  projYears === y
                    ? 'bg-neon-green/20 border border-neon-green/50 text-neon-green'
                    : 'bg-white/5 border border-white/10 text-text-muted hover:text-white'
                }`}>
                {y}yr
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Savings Chart */}
      <motion.div variants={item} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Savings Trend</h3>
          <span className="text-text-muted text-xs">Last 14 days</span>
        </div>
        {history.length > 0 ? <SavingsChart data={history} /> : (
          <div className="flex items-center justify-center h-[120px] text-text-muted text-xs">
            Simulate transactions to see your savings chart
          </div>
        )}
      </motion.div>

      {/* Card Breakdown Donut */}
      {wallet?.card_breakdown && wallet.card_breakdown.length > 0 && (
        <motion.div variants={item} className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">By Card</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1"><DonutChart data={wallet.card_breakdown} /></div>
            <div className="flex-1 space-y-2">
              {wallet.card_breakdown.map((c, i) => {
                const colors = ['#7C5CFC', '#00C896', '#FF6B9D', '#00D4FF', '#F59E0B'];
                return (
                  <div key={c.card_id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                    <span className="text-text-secondary text-xs flex-1 truncate">{c.nickname || `••••${c.last_four}`}</span>
                    <span className="text-white text-xs font-medium">₪{c.total_saved.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Card Preview */}
      {cards.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">My Cards</h3>
            <button onClick={() => navigate('/cards')} className="text-neon-purple text-xs hover:opacity-80">View all</button>
          </div>
          <CreditCardDisplay card={cards[0]} onPress={() => navigate('/cards')} />
        </motion.div>
      )}

      {/* Add Card CTA */}
      {cards.length === 0 && (
        <motion.div variants={item}>
          <motion.button onClick={() => navigate('/cards')} whileTap={{ scale: 0.97 }}
            className="glass-card w-full p-5 flex items-center gap-4 hover:border-neon-purple/30 transition-colors text-left">
            <div className="w-12 h-12 rounded-2xl neon-gradient flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Add Your First Card</p>
              <p className="text-text-secondary text-xs">Connect a card to start saving</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </motion.button>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {recentTx.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Recent Transactions</h3>
            <button onClick={() => navigate('/transactions')} className="text-neon-purple text-xs hover:opacity-80">See all</button>
          </div>
          <div className="space-y-2">
            {recentTx.map(tx => (
              <div key={tx.id} className="glass-card px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                  {categoryEmoji[tx.category] || '💳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tx.merchant}</p>
                  <p className="text-text-muted text-xs">{tx.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-sm font-semibold">-₪{tx.amount.toFixed(2)}</p>
                  <p className="text-neon-green text-[10px] font-medium">+₪{tx.roundup_amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <motion.button onClick={() => navigate('/goals')} whileTap={{ scale: 0.97 }}
          className="glass-card p-4 flex items-center gap-3 hover:border-neon-green/30 transition-colors">
          <div className="w-10 h-10 rounded-2xl bg-neon-green/10 flex items-center justify-center text-lg">🎯</div>
          <div className="text-left">
            <p className="text-white text-sm font-semibold">Goals</p>
            <p className="text-text-muted text-xs">Track targets</p>
          </div>
        </motion.button>
        <motion.button onClick={() => navigate('/transfers')} whileTap={{ scale: 0.97 }}
          className="glass-card p-4 flex items-center gap-3 hover:border-neon-blue/30 transition-colors">
          <div className="w-10 h-10 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-lg">📈</div>
          <div className="text-left">
            <p className="text-white text-sm font-semibold">Invest</p>
            <p className="text-text-muted text-xs">Grow funds</p>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
