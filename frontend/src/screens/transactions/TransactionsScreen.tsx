import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingDown } from 'lucide-react';
import { transactionsService } from '../../services/transactions';
import { useAppStore } from '../../store/appStore';
import type { Transaction } from '../../types';

const categoryEmoji: Record<string, string> = {
  Groceries: '🛒', Food: '🍔', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Utilities: '💡', Travel: '✈️',
  Coffee: '☕', Fitness: '💪', Other: '💳',
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export default function TransactionsScreen() {
  const { cards } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadTx = async (cardId: string, off = 0, append = false) => {
    try {
      const data = await transactionsService.getTransactions({
        limit: LIMIT, offset: off,
        card_id: cardId !== 'all' ? cardId : undefined,
      });
      if (append) setTransactions(prev => [...prev, ...data.transactions]);
      else setTransactions(data.transactions);
      setTotal(data.total);
      setOffset(off + LIMIT);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    loadTx(selectedCard, 0, false);
  }, [selectedCard]);

  const filtered = transactions.filter(tx =>
    tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
    tx.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalSaved = filtered.reduce((s, tx) => s + tx.roundup_amount, 0);
  const totalSpent = filtered.reduce((s, tx) => s + tx.amount, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="screen-padding pt-14 pb-8 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Transactions</h1>
        <p className="text-text-secondary text-sm">{total} total</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <TrendingDown size={16} className="text-red-400 mb-2" />
          <p className="text-white font-bold text-lg">₪{totalSpent.toFixed(2)}</p>
          <p className="text-text-muted text-xs">Total Spent</p>
        </div>
        <div className="glass-card p-4">
          <span className="text-neon-green text-xl mb-2 block">💰</span>
          <p className="text-neon-green font-bold text-lg">₪{totalSaved.toFixed(2)}</p>
          <p className="text-text-muted text-xs">Total Saved</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input type="text" placeholder="Search transactions..." value={search}
          onChange={e => setSearch(e.target.value)} className="input-field pl-11" />
      </div>

      {/* Card Filter */}
      {cards.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCard('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
              selectedCard === 'all' ? 'neon-gradient text-white' : 'bg-white/5 border border-white/10 text-text-secondary'}`}>
            All Cards
          </button>
          {cards.map(c => (
            <button key={c.id} onClick={() => setSelectedCard(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
                selectedCard === c.id ? 'text-white' : 'bg-white/5 border border-white/10 text-text-secondary'}`}
              style={selectedCard === c.id ? { background: c.color } : {}}>
              ••••{c.last_four}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white font-semibold mb-1">No transactions found</p>
          <p className="text-text-secondary text-sm">Simulate transactions from Cards tab</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {filtered.map(tx => (
            <motion.div key={tx.id} variants={item} className="glass-card px-4 py-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                {categoryEmoji[tx.category] || '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{tx.merchant}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-text-muted text-[10px]">{tx.category}</span>
                  {tx.card_last_four && <span className="text-text-muted text-[10px]">• ••••{tx.card_last_four}</span>}
                </div>
                <p className="text-text-muted text-[10px] mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString('en-IL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-bold">-₪{tx.amount.toFixed(2)}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  <p className="text-neon-green text-xs font-medium">+₪{tx.roundup_amount.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {offset < total && (
            <motion.button
              onClick={async () => { setLoadingMore(true); await loadTx(selectedCard, offset, true); }}
              disabled={loadingMore}
              className="w-full py-3 glass-card text-text-secondary text-sm hover:text-white transition-colors">
              {loadingMore ? 'Loading...' : 'Load more'}
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
