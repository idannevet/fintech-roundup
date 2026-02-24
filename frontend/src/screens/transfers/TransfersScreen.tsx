import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, TrendingUp, X, ArrowRight, Eye, EyeOff, Plus, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { transfersService } from '../../services/transfers';
import { recurringService } from '../../services/recurring';
import { walletService } from '../../services/wallet';
import { useAppStore } from '../../store/appStore';
import type { Transfer, VirtualCard, InvestmentPortfolio, RecurringDeposit } from '../../types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const RISK_LEVELS = [
  {
    key: 'conservative' as const,
    label: 'Conservative',
    rate: '4%',
    color: 'text-neon-blue',
    border: 'border-neon-blue/40',
    bg: 'bg-neon-blue/10',
    glow: 'shadow-[0_0_12px_rgba(0,212,255,0.2)]',
    allocation: [
      { name: 'Bonds', pct: 60, color: '#00D4FF' },
      { name: 'Stocks', pct: 25, color: '#7C5CFC' },
      { name: 'Real Estate', pct: 15, color: '#00C896' },
    ],
  },
  {
    key: 'moderate' as const,
    label: 'Moderate',
    rate: '7%',
    color: 'text-neon-purple',
    border: 'border-neon-purple/40',
    bg: 'bg-neon-purple/10',
    glow: 'shadow-[0_0_12px_rgba(124,92,252,0.2)]',
    allocation: [
      { name: 'Stocks', pct: 55, color: '#7C5CFC' },
      { name: 'Bonds', pct: 25, color: '#00D4FF' },
      { name: 'Real Estate', pct: 15, color: '#00C896' },
      { name: 'Crypto', pct: 5, color: '#FF6B9D' },
    ],
  },
  {
    key: 'aggressive' as const,
    label: 'Aggressive',
    rate: '12%',
    color: 'text-neon-green',
    border: 'border-neon-green/40',
    bg: 'bg-neon-green/10',
    glow: 'shadow-[0_0_12px_rgba(0,200,150,0.2)]',
    allocation: [
      { name: 'Stocks', pct: 75, color: '#7C5CFC' },
      { name: 'Crypto', pct: 15, color: '#FF6B9D' },
      { name: 'Real Estate', pct: 10, color: '#00C896' },
    ],
  },
];

function AllocationBar({ allocation }: { allocation: { name: string; pct: number; color: string }[] }) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {allocation.map(a => (
          <div key={a.name} style={{ width: `${a.pct}%`, background: a.color }} className="rounded-full" />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {allocation.map(a => (
          <div key={a.name} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
            <span className="text-text-muted text-[10px]">{a.name} {a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export default function TransfersScreen() {
  const { wallet, setWallet } = useAppStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio | null>(null);
  const [recurring, setRecurring] = useState<RecurringDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'card' | 'investment' | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [updatingRisk, setUpdatingRisk] = useState(false);

  // Recurring form
  const [recAmt, setRecAmt] = useState('');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [creatingRec, setCreatingRec] = useState(false);

  const load = async () => {
    try {
      const [vc, inv, trs, w, rec] = await Promise.all([
        transfersService.getVirtualCard(),
        transfersService.getInvestment(),
        transfersService.getTransfers(),
        walletService.getSummary(),
        recurringService.getRecurring(),
      ]);
      setVirtualCard(vc); setPortfolio(inv); setTransfers(trs); setWallet(w); setRecurring(rec);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleTransfer = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > (wallet?.total_balance || 0)) { toast.error('Insufficient balance'); return; }
    if (amt < 1) { toast.error('Minimum transfer ₪1'); return; }
    setTransferring(true);
    try {
      const transferType = showModal === 'card' ? 'virtual_card' : 'investment';
      await transfersService.createTransfer({ amount: amt, type: transferType, notes: notes || undefined });
      toast.success(`₪${amt.toFixed(2)} transferred!`);
      setShowModal(null); setAmount(''); setNotes('');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Transfer failed');
    } finally { setTransferring(false); }
  };

  const handleRiskChange = async (riskLevel: 'conservative' | 'moderate' | 'aggressive') => {
    if (portfolio?.risk_level === riskLevel) return;
    setUpdatingRisk(true);
    try {
      await transfersService.updateRiskLevel(riskLevel);
      setPortfolio(prev => prev ? { ...prev, risk_level: riskLevel } : prev);
      toast.success(`Risk level set to ${riskLevel}`);
    } catch { toast.error('Failed to update risk level'); } finally { setUpdatingRisk(false); }
  };

  const handleCreateRecurring = async () => {
    const amt = parseFloat(recAmt);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setCreatingRec(true);
    try {
      const dep = await recurringService.createRecurring({ amount: amt, frequency: recFreq });
      setRecurring(prev => [dep, ...prev]);
      setShowRecurringModal(false);
      setRecAmt('');
      toast.success('Auto-invest set up!');
    } catch { toast.error('Failed to create'); } finally { setCreatingRec(false); }
  };

  const handleToggleRecurring = async (id: string) => {
    try {
      const res = await recurringService.toggle(id);
      setRecurring(prev => prev.map(r => r.id === id ? { ...r, isActive: res.isActive } : r));
    } catch { toast.error('Failed to toggle'); }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      await recurringService.deleteRecurring(id);
      setRecurring(prev => prev.filter(r => r.id !== id));
      toast.success('Removed');
    } catch { toast.error('Failed to delete'); }
  };

  const formatCardNum = (num: string, show: boolean) => {
    if (!num) return '';
    const groups = num.match(/.{1,4}/g) || [];
    return groups.map((g, i) => (show || i === groups.length - 1) ? g : '••••').join(' ');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 rounded-full border-2 border-neon-blue border-t-transparent animate-spin" />
    </div>
  );

  const balance = wallet?.total_balance || 0;
  const returnAmt = portfolio ? (portfolio.balance * portfolio.return_percent / 100) : 0;
  const isPositive = returnAmt >= 0;
  const activeRisk = RISK_LEVELS.find(r => r.key === (portfolio?.risk_level || 'moderate')) || RISK_LEVELS[1];
  const nextRecurring = recurring.filter(r => r.isActive).sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())[0];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="screen-padding pt-14 pb-8 space-y-5">

      <motion.div variants={item}>
        <h1 className="text-2xl font-black text-white">Invest</h1>
        <p className="text-text-secondary text-sm">Grow your round-up savings</p>
      </motion.div>

      {/* Balance */}
      <motion.div variants={item} className="glass-card p-5 text-center" style={{ border: '1px solid rgba(124,92,252,0.2)' }}>
        <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Available Balance</p>
        <h2 className="text-4xl font-black neon-gradient-text">₪{balance.toFixed(2)}</h2>
        {nextRecurring && (
          <p className="text-text-muted text-xs mt-2">
            Next auto-invest: ₪{nextRecurring.amount} in {daysUntil(nextRecurring.nextDate)}d
          </p>
        )}
      </motion.div>

      {/* Transfer Options */}
      <motion.div variants={item} className="space-y-3">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowModal('card')}
          className="glass-card w-full p-5 flex items-center gap-4 text-left hover:border-neon-purple/30 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/10 flex items-center justify-center flex-shrink-0">
            <CreditCard size={26} className="text-neon-purple" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Virtual Debit Card</h3>
            <p className="text-text-secondary text-xs mt-0.5">Transfer to your RoundUp virtual card</p>
            <p className="text-neon-purple text-xs font-medium mt-1">Balance: ₪{(virtualCard?.balance || 0).toFixed(2)}</p>
          </div>
          <ArrowRight size={18} className="text-text-muted" />
        </motion.button>

        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowModal('investment')}
          className="glass-card w-full p-5 flex items-center gap-4 text-left hover:border-neon-green/30 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={26} className="text-neon-green" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Investment Portfolio</h3>
            <p className="text-text-secondary text-xs mt-0.5">Invest your savings for growth</p>
            <p className={`text-xs font-medium mt-1 ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{(portfolio?.return_percent || 0).toFixed(1)}% return · ₪{(portfolio?.balance || 0).toFixed(2)} invested
            </p>
          </div>
          <ArrowRight size={18} className="text-text-muted" />
        </motion.button>
      </motion.div>

      {/* Risk Level Selector */}
      <motion.div variants={item} className="glass-card p-5 space-y-4">
        <h3 className="text-white font-semibold text-sm">Investment Strategy</h3>
        <div className="grid grid-cols-3 gap-2">
          {RISK_LEVELS.map(r => (
            <button key={r.key} onClick={() => handleRiskChange(r.key)} disabled={updatingRisk}
              className={`py-3 px-2 rounded-2xl text-center transition-all ${
                portfolio?.risk_level === r.key
                  ? `${r.bg} border ${r.border} ${r.color} ${r.glow}`
                  : 'bg-white/5 border border-white/10 text-text-secondary hover:border-white/20'
              }`}>
              <div className="font-bold text-xs">{r.label}</div>
              <div className={`text-base font-black mt-0.5 ${portfolio?.risk_level === r.key ? r.color : 'text-text-muted'}`}>{r.rate}</div>
            </button>
          ))}
        </div>
        {/* Allocation bar */}
        <AllocationBar allocation={activeRisk.allocation} />
      </motion.div>

      {/* Auto-Invest / Recurring Deposits */}
      <motion.div variants={item} className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">Auto-Invest</h3>
            <p className="text-text-muted text-xs">Recurring deposits to portfolio</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowRecurringModal(true)}
            className="w-8 h-8 rounded-xl neon-gradient flex items-center justify-center shadow-glow-purple">
            <Plus size={14} className="text-white" />
          </motion.button>
        </div>

        {recurring.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-text-muted text-xs">No recurring deposits yet</p>
            <button onClick={() => setShowRecurringModal(true)} className="text-neon-purple text-xs mt-1 hover:opacity-80">Set one up →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {recurring.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.isActive ? 'bg-neon-green/10' : 'bg-white/5'}`}>
                  <RefreshCw size={16} className={r.isActive ? 'text-neon-green' : 'text-text-muted'} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">₪{r.amount} {r.frequency}</p>
                  <p className="text-text-muted text-[10px]">Next: {r.nextDate} · {daysUntil(r.nextDate)}d away</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleToggleRecurring(r.id)}
                    className={`relative w-10 h-5 rounded-full transition-all ${r.isActive ? 'bg-neon-green' : 'bg-white/10'}`}>
                    <motion.div
                      animate={{ x: r.isActive ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                    />
                  </button>
                  <button onClick={() => handleDeleteRecurring(r.id)}
                    className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Virtual Card Details */}
      {virtualCard && (
        <motion.div variants={item} className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Your Virtual Card</h3>
            <button onClick={() => setShowCardDetails(!showCardDetails)} className="text-text-muted hover:text-white transition-colors">
              {showCardDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-neon-purple/20 to-neon-blue/10 border border-neon-purple/20 space-y-3">
            {[
              { label: 'Card Number', value: formatCardNum(virtualCard.card_number, showCardDetails) },
              { label: 'Expiry', value: `${String(virtualCard.expiry_month).padStart(2,'0')}/${virtualCard.expiry_year}` },
              { label: 'CVV', value: showCardDetails ? virtualCard.cvv : '•••' },
              { label: 'Balance', value: `₪${virtualCard.balance.toFixed(2)}`, color: 'text-neon-purple' },
            ].map(f => (
              <div key={f.label} className="flex justify-between">
                <span className="text-white/50 text-xs">{f.label}</span>
                <span className={`text-xs font-mono ${f.color || 'text-white'}`}>{f.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Portfolio */}
      {portfolio && (
        <motion.div variants={item} className="glass-card p-5 space-y-3">
          <h3 className="text-white font-semibold text-sm">Investment Portfolio</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Invested', value: `₪${portfolio.total_invested.toFixed(2)}` },
              { label: 'Current Value', value: `₪${portfolio.balance.toFixed(2)}` },
              { label: 'P&L', value: `${isPositive ? '+' : ''}₪${Math.abs(returnAmt).toFixed(2)}`, color: isPositive ? 'text-neon-green' : 'text-red-400' },
              { label: 'Return', value: `${isPositive ? '+' : ''}${portfolio.return_percent.toFixed(1)}%`, color: isPositive ? 'text-neon-green' : 'text-red-400' },
            ].map(f => (
              <div key={f.label} className="rounded-2xl p-3 bg-white/5">
                <p className="text-text-muted text-xs mb-1">{f.label}</p>
                <p className={`font-bold ${f.color || 'text-white'}`}>{f.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Transfer History */}
      {transfers.length > 0 && (
        <motion.div variants={item} className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Transfer History</h3>
          <div className="space-y-3">
            {transfers.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'virtual_card' ? 'bg-neon-purple/10' : 'bg-neon-green/10'}`}>
                  {t.type === 'virtual_card' ? <CreditCard size={18} className="text-neon-purple" /> : <TrendingUp size={18} className="text-neon-green" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-medium">{t.destination_label}</p>
                  <p className="text-text-muted text-[10px]">
                    {new Date(t.created_at).toLocaleDateString('en-IL', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-neon-green text-sm font-bold">₪{t.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Transfer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card w-full max-w-[430px] rounded-t-3xl p-6 pb-10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">
                  Transfer to {showModal === 'card' ? 'Virtual Card' : 'Investment'}
                </h3>
                <button onClick={() => setShowModal(null)}><X size={20} className="text-text-secondary" /></button>
              </div>
              <div className="text-center py-2">
                <p className="text-text-muted text-xs mb-1">Available</p>
                <p className="text-3xl font-black neon-gradient-text">₪{balance.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Amount (₪)</label>
                <input type="number" inputMode="decimal" placeholder="0.00" value={amount}
                  onChange={e => setAmount(e.target.value)} className="input-field text-xl text-center font-bold" min="1" max={balance} />
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50, 100].map(v => (
                    <button key={v} onClick={() => setAmount(Math.min(v, balance).toString())}
                      className="flex-1 py-1.5 rounded-xl text-xs bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-colors">
                      ₪{v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Note (optional)</label>
                <input type="text" placeholder="Add a note..." value={notes}
                  onChange={e => setNotes(e.target.value)} className="input-field" maxLength={100} />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleTransfer} disabled={transferring || !amount} className="btn-primary">
                {transferring ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Transferring...
                  </span>
                ) : `Transfer ₪${amount || '0'}`}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recurring Modal */}
      <AnimatePresence>
        {showRecurringModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowRecurringModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card w-full max-w-[430px] rounded-t-3xl p-6 pb-10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Set Up Auto-Invest</h3>
                <button onClick={() => setShowRecurringModal(false)}><X size={20} className="text-text-secondary" /></button>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Amount per deposit (₪)</label>
                <input type="number" inputMode="decimal" placeholder="0.00" value={recAmt}
                  onChange={e => setRecAmt(e.target.value)} className="input-field text-xl text-center font-bold" min="1" />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(f => (
                    <button key={f} onClick={() => setRecFreq(f)}
                      className={`py-3 rounded-2xl text-center text-sm font-semibold capitalize transition-all ${
                        recFreq === f
                          ? 'neon-gradient text-white shadow-glow-purple'
                          : 'bg-white/5 border border-white/10 text-text-secondary hover:border-neon-purple/30'
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateRecurring} disabled={creatingRec || !recAmt} className="btn-primary">
                {creatingRec ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Setting up...
                  </span>
                ) : 'Activate Auto-Invest'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
