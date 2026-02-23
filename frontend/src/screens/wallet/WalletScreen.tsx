import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PiggyBank } from 'lucide-react';
import { walletService } from '../../services/wallet';
import { useAppStore } from '../../store/appStore';
import SavingsChart from '../../components/charts/SavingsChart';
import DonutChart from '../../components/charts/DonutChart';
import type { WalletHistory, WalletStats } from '../../types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function WalletScreen() {
  const { wallet, setWallet } = useAppStore();
  const [history, setHistory] = useState<WalletHistory[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([walletService.getSummary(), walletService.getHistory(30), walletService.getStats()])
      .then(([w, h, s]) => { setWallet(w); setHistory(h); setStats(s); })
      .finally(() => setLoading(false));
  }, [setWallet]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 rounded-full border-2 border-neon-green border-t-transparent animate-spin" />
    </div>
  );

  const totalBalance = wallet?.total_balance || 0;
  const monthlyBalance = wallet?.monthly_balance || 0;
  const progressPct = Math.min((monthlyBalance / 100) * 100, 100);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="screen-padding pt-14 pb-8 space-y-5">

      <motion.div variants={item}>
        <h1 className="text-2xl font-black text-white">Savings Wallet</h1>
        <p className="text-text-secondary text-sm">Your round-up savings growth</p>
      </motion.div>

      {/* Main Balance */}
      <motion.div variants={item} className="relative rounded-3xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(0,200,150,0.2) 0%, rgba(0,212,255,0.1) 100%)', border: '1px solid rgba(0,200,150,0.3)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-green/20 flex items-center justify-center">
              <PiggyBank size={24} className="text-neon-green" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Total Saved</p>
              <h2 className="text-3xl font-black text-white">₪{totalBalance.toFixed(2)}</h2>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">This Month</span>
              <span className="text-neon-green font-semibold">₪{monthlyBalance.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full green-gradient" />
            </div>
            <p className="text-white/40 text-xs text-right">₪{Math.max(0, 100 - monthlyBalance).toFixed(2)} to ₪100 goal</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Transactions', value: stats?.total_transactions?.toString() || '0', Icon: BarChart3, color: 'text-neon-purple' },
          { label: 'Avg Round-up', value: `₪${(stats?.avg_roundup || 0).toFixed(2)}`, Icon: TrendingUp, color: 'text-neon-green' },
          { label: 'Total Spent', value: `₪${(stats?.total_spent || 0).toFixed(0)}`, Icon: BarChart3, color: 'text-neon-blue' },
          { label: 'Avg Transaction', value: `₪${(stats?.avg_transaction || 0).toFixed(2)}`, Icon: TrendingUp, color: 'text-neon-pink' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <s.Icon size={18} className={`${s.color} mb-2`} />
            <div className="text-white font-bold text-lg">{s.value}</div>
            <div className="text-text-muted text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={item} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">30-Day Savings</h3>
          <span className="text-neon-green text-xs font-medium">
            +₪{history.reduce((s, d) => s + d.daily_total, 0).toFixed(2)}
          </span>
        </div>
        {history.length > 0 ? <SavingsChart data={history} /> : (
          <div className="flex items-center justify-center h-[120px]">
            <p className="text-text-muted text-xs">No savings history yet</p>
          </div>
        )}
      </motion.div>

      {/* Card Breakdown */}
      {wallet?.card_breakdown && wallet.card_breakdown.length > 0 && (
        <motion.div variants={item} className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Savings by Card</h3>
          <div className="mb-4"><DonutChart data={wallet.card_breakdown} /></div>
          <div className="space-y-3">
            {wallet.card_breakdown.map((c, i) => {
              const colors = ['#7C5CFC', '#00C896', '#FF6B9D', '#00D4FF', '#F59E0B'];
              const pct = totalBalance > 0 ? (c.total_saved / totalBalance * 100) : 0;
              return (
                <div key={c.card_id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white font-medium">{c.nickname || `••••${c.last_four}`}</span>
                      <span className="text-text-secondary">{c.transaction_count} txns</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full" style={{ background: colors[i % colors.length] }} />
                    </div>
                  </div>
                  <span className="text-white font-bold text-sm">₪{c.total_saved.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Daily History */}
      {history.length > 0 && (
        <motion.div variants={item} className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Daily History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.slice().reverse().map(d => (
              <div key={d.date} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-xs font-medium">
                    {new Date(d.date).toLocaleDateString('en-IL', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-text-muted text-[10px]">{d.transaction_count} transactions</p>
                </div>
                <span className="text-neon-green text-sm font-semibold">+₪{d.daily_total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
