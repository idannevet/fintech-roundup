import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { goalsService } from '../../services/goals';
import { walletService } from '../../services/wallet';
import { useAppStore } from '../../store/appStore';
import type { Goal } from '../../types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const EMOJI_OPTIONS = ['🎯', '🏠', '✈️', '🚗', '💍', '📱', '🎓', '🌴', '💰', '🎮', '👟', '🎸'];

export default function GoalsScreen() {
  const { wallet, setWallet } = useAppStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmt, setContributeAmt] = useState('');
  const [contributing, setContributing] = useState(false);

  // New goal form state
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const [g, w] = await Promise.all([goalsService.getGoals(), walletService.getSummary()]);
      setGoals(g);
      setWallet(w);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newTarget || parseFloat(newTarget) <= 0) {
      toast.error('Enter a name and target amount');
      return;
    }
    setCreating(true);
    try {
      const goal = await goalsService.createGoal({
        name: newName.trim(),
        emoji: newEmoji,
        targetAmount: parseFloat(newTarget),
        deadline: newDeadline || undefined,
      });
      setGoals(prev => [goal, ...prev]);
      setShowAddModal(false);
      setNewName(''); setNewEmoji('🎯'); setNewTarget(''); setNewDeadline('');
      toast.success('Goal created!');
    } catch { toast.error('Failed to create goal'); } finally { setCreating(false); }
  };

  const handleContribute = async () => {
    if (!contributeGoal) return;
    const amt = parseFloat(contributeAmt);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > (wallet?.total_balance || 0)) { toast.error('Insufficient balance'); return; }
    setContributing(true);
    try {
      const updated = await goalsService.contribute(contributeGoal.id, amt);
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      const w = await walletService.getSummary();
      setWallet(w);
      setContributeGoal(null);
      setContributeAmt('');
      if (updated.justCompleted) {
        toast.success(`🎉 Goal "${updated.name}" completed!`, { duration: 4000 });
      } else {
        toast.success(`₪${amt.toFixed(2)} added to ${updated.name}!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Contribution failed');
    } finally { setContributing(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await goalsService.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Goal removed');
    } catch { toast.error('Failed to delete'); }
  };

  const balance = wallet?.total_balance || 0;
  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

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
          <h1 className="text-2xl font-black text-white">Goals</h1>
          <p className="text-text-secondary text-sm">Save towards what matters</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(true)}
          className="w-10 h-10 rounded-2xl neon-gradient flex items-center justify-center shadow-glow-purple">
          <Plus size={18} className="text-white" />
        </motion.button>
      </motion.div>

      {/* Wallet balance pill */}
      <motion.div variants={item} className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
          <Wallet size={18} className="text-neon-green" />
        </div>
        <div>
          <p className="text-text-muted text-xs">Available to contribute</p>
          <p className="text-white font-bold">₪{balance.toFixed(2)}</p>
        </div>
      </motion.div>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <motion.div variants={item} className="glass-card p-8 text-center space-y-3">
          <div className="text-5xl mb-2">🎯</div>
          <p className="text-white font-semibold">No goals yet</p>
          <p className="text-text-muted text-sm">Tap + to set your first savings goal</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddModal(true)}
            className="btn-primary mt-2">Create a Goal</motion.button>
        </motion.div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Active Goals</p>
              {activeGoals.map(goal => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                const daysLeft = goal.deadline
                  ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
                  : null;
                return (
                  <motion.div key={goal.id} variants={item} className="glass-card p-5 space-y-3"
                    style={{ border: '1px solid rgba(124,92,252,0.15)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{goal.emoji}</span>
                        <div>
                          <p className="text-white font-semibold">{goal.name}</p>
                          <p className="text-text-muted text-xs">
                            ₪{goal.currentAmount.toFixed(2)} / ₪{goal.targetAmount.toFixed(2)}
                            {daysLeft !== null && <span className="ml-2">· {daysLeft}d left</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setContributeGoal(goal); setContributeAmt(''); }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold neon-gradient text-white shadow-glow-purple">
                          Add
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(goal.id)}
                          className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </motion.button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #7C5CFC, #00D4FF)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted text-[10px]">{pct.toFixed(0)}% complete</span>
                        <span className="text-text-muted text-[10px]">₪{(goal.targetAmount - goal.currentAmount).toFixed(2)} to go</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {completedGoals.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Completed 🎉</p>
              {completedGoals.map(goal => (
                <div key={goal.id} className="glass-card p-4 flex items-center gap-3 opacity-70">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm line-through">{goal.name}</p>
                    <p className="text-neon-green text-xs">₪{goal.targetAmount.toFixed(2)} saved ✓</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(goal.id)}
                    className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card w-full max-w-[430px] rounded-t-3xl p-6 pb-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">New Goal</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-text-secondary" /></button>
              </div>

              {/* Emoji picker */}
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Choose emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => setNewEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        newEmoji === e ? 'bg-neon-purple/30 border border-neon-purple/60' : 'bg-white/5 border border-white/10'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Goal name</label>
                <input type="text" placeholder="e.g. Vacation fund" value={newName}
                  onChange={e => setNewName(e.target.value)} className="input-field" maxLength={50} />
              </div>

              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Target amount (₪)</label>
                <input type="number" inputMode="decimal" placeholder="0.00" value={newTarget}
                  onChange={e => setNewTarget(e.target.value)} className="input-field" min="1" />
              </div>

              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Deadline (optional)</label>
                <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                  className="input-field" min={new Date().toISOString().split('T')[0]} />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={creating} className="btn-primary">
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Target size={16} /> Create Goal
                  </span>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribute Modal */}
      <AnimatePresence>
        {contributeGoal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setContributeGoal(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card w-full max-w-[430px] rounded-t-3xl p-6 pb-10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">
                  {contributeGoal.emoji} {contributeGoal.name}
                </h3>
                <button onClick={() => setContributeGoal(null)}><X size={20} className="text-text-secondary" /></button>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs mb-1">Balance available</p>
                <p className="text-3xl font-black neon-gradient-text">₪{balance.toFixed(2)}</p>
                <p className="text-text-secondary text-xs mt-1">
                  ₪{(contributeGoal.targetAmount - contributeGoal.currentAmount).toFixed(2)} needed to complete
                </p>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Amount (₪)</label>
                <input type="number" inputMode="decimal" placeholder="0.00" value={contributeAmt}
                  onChange={e => setContributeAmt(e.target.value)} className="input-field text-xl text-center font-bold" min="1" />
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50].map(v => (
                    <button key={v} onClick={() => setContributeAmt(Math.min(v, balance).toFixed(2))}
                      className="flex-1 py-1.5 rounded-xl text-xs bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-colors">
                      ₪{v}
                    </button>
                  ))}
                  <button onClick={() => setContributeAmt(Math.min(contributeGoal.targetAmount - contributeGoal.currentAmount, balance).toFixed(2))}
                    className="flex-1 py-1.5 rounded-xl text-xs bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-colors">
                    Max
                  </button>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleContribute} disabled={contributing || !contributeAmt} className="btn-primary">
                {contributing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Contributing...
                  </span>
                ) : `Contribute ₪${contributeAmt || '0'}`}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
