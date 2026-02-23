import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { cardsService } from '../../services/cards';
import { useAppStore } from '../../store/appStore';
import CreditCardDisplay from '../../components/cards/CreditCardDisplay';
import type { Card } from '../../types';

const COLORS = ['#7C5CFC', '#00C896', '#FF6B9D', '#00D4FF', '#F59E0B', '#EF4444'];
const CARD_TYPES = ['visa', 'mastercard', 'amex'];
const BANKS = ['Bank Hapoalim', 'Bank Leumi', 'Discount Bank', 'Mizrahi Tefahot', 'Bank Yahav'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function CardsScreen() {
  const { cards, setCards } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [form, setForm] = useState({ last_four: '', card_type: 'visa', nickname: '', color: COLORS[0], bank_name: BANKS[0] });

  useEffect(() => {
    cardsService.getCards().then(c => { setCards(c); setLoading(false); }).catch(() => setLoading(false));
  }, [setCards]);

  const handleAdd = async () => {
    if (!form.last_four || form.last_four.length !== 4 || !/^\d+$/.test(form.last_four)) {
      toast.error('Enter 4-digit card number'); return;
    }
    if (!form.nickname.trim()) { toast.error('Enter a nickname'); return; }
    setAdding(true);
    try {
      const card = await cardsService.addCard(form);
      setCards([...cards, card]);
      setShowAddModal(false);
      setForm({ last_four: '', card_type: 'visa', nickname: '', color: COLORS[0], bank_name: BANKS[0] });
      toast.success('Card added!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add card');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cardsService.deleteCard(id);
      setCards(cards.filter(c => c.id !== id));
      setSelectedCard(null);
      toast.success('Card removed');
    } catch { toast.error('Failed to remove card'); }
  };

  const handleToggle = async (id: string) => {
    try {
      const { is_active } = await cardsService.toggleCard(id);
      setCards(cards.map(c => c.id === id ? { ...c, is_active } : c));
    } catch { toast.error('Failed to toggle card'); }
  };

  const handleSimulate = async (cardId: string) => {
    setSimulating(cardId);
    try {
      const { transaction, roundup_amount } = await cardsService.simulateTransaction(cardId);
      toast.success(`Saved ₪${roundup_amount.toFixed(2)} from ${transaction.merchant}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Simulation failed');
    } finally {
      setSimulating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="screen-padding pt-14 pb-8 space-y-5">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">My Cards</h1>
          <p className="text-text-secondary text-sm">{cards.length} of 5 connected</p>
        </div>
        {cards.length < 5 && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-2xl neon-gradient flex items-center justify-center shadow-glow-purple">
            <Plus size={20} className="text-white" />
          </motion.button>
        )}
      </motion.div>

      {cards.length === 0 ? (
        <motion.div variants={item} className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">💳</div>
          <h3 className="text-white font-semibold mb-2">No cards yet</h3>
          <p className="text-text-secondary text-sm mb-6">Add a card to start saving with every purchase</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddModal(true)}
            className="btn-primary max-w-[200px] mx-auto">
            Add Your First Card
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {cards.map(card => (
              <motion.div key={card.id} variants={item}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <CreditCardDisplay card={card} onPress={() => setSelectedCard(selectedCard?.id === card.id ? null : card)} />
                <AnimatePresence>
                  {selectedCard?.id === card.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="glass-card mt-2 p-4 grid grid-cols-3 gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleSimulate(card.id)}
                          disabled={!!simulating || !card.is_active}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 disabled:opacity-50">
                          {simulating === card.id
                            ? <div className="w-5 h-5 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
                            : <Zap size={20} className="text-neon-purple" />}
                          <span className="text-[10px] text-neon-purple font-medium">Simulate</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleToggle(card.id)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
                          {card.is_active ? <ToggleRight size={20} className="text-neon-green" /> : <ToggleLeft size={20} className="text-text-muted" />}
                          <span className="text-[10px] text-neon-blue font-medium">{card.is_active ? 'Enabled' : 'Disabled'}</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(card.id)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <Trash2 size={20} className="text-red-400" />
                          <span className="text-[10px] text-red-400 font-medium">Remove</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card w-full max-w-[430px] rounded-t-3xl p-6 pb-10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Add New Card</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-text-secondary" /></button>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Last 4 Digits</label>
                <input type="text" inputMode="numeric" maxLength={4} placeholder="1234"
                  value={form.last_four} onChange={e => setForm(f => ({ ...f, last_four: e.target.value.replace(/\D/g, '') }))}
                  className="input-field text-center text-2xl font-bold tracking-widest" />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Nickname</label>
                <input type="text" placeholder="My Visa Card" value={form.nickname}
                  onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Card Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_TYPES.map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, card_type: type }))}
                      className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                        form.card_type === type ? 'neon-gradient text-white' : 'bg-white/5 border border-white/10 text-text-secondary'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map(bank => (
                    <button key={bank} onClick={() => setForm(f => ({ ...f, bank_name: bank }))}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all text-left ${
                        form.bank_name === bank ? 'border border-neon-purple/50 bg-neon-purple/10 text-neon-purple' : 'bg-white/5 border border-white/10 text-text-secondary'}`}>
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Color</label>
                <div className="flex gap-3">
                  {COLORS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-bg scale-110' : ''}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={adding} className="btn-primary">
                {adding ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Adding...
                  </span>
                ) : 'Add Card'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
