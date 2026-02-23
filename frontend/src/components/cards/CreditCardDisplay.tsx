import { motion } from 'framer-motion';
import type { Card } from '../../types';

interface Props {
  card: Card;
  compact?: boolean;
  onPress?: () => void;
}

const CARD_GRADIENTS: Record<string, string> = {
  '#7C5CFC': 'from-[#7C5CFC] to-[#5B3FE0]',
  '#00C896': 'from-[#00C896] to-[#009B72]',
  '#FF6B9D': 'from-[#FF6B9D] to-[#E0386B]',
  '#00D4FF': 'from-[#00D4FF] to-[#0096B8]',
  '#F59E0B': 'from-[#F59E0B] to-[#D97706]',
  '#EF4444': 'from-[#EF4444] to-[#C43A3A]',
};

export default function CreditCardDisplay({ card, compact = false, onPress }: Props) {
  const gradient = CARD_GRADIENTS[card.color] || 'from-[#7C5CFC] to-[#5B3FE0]';

  return (
    <motion.div
      onClick={onPress}
      whileTap={onPress ? { scale: 0.97 } : undefined}
      className={`relative bg-gradient-to-br ${gradient} rounded-3xl overflow-hidden shadow-xl ${
        compact ? 'p-4' : 'p-6'
      } ${onPress ? 'cursor-pointer' : ''}`}
      style={!compact ? { aspectRatio: '1.586 / 1' } : {}}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/20 -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/20 translate-y-1/4 -translate-x-1/4" />
      </div>

      {!compact ? (
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-white/60 text-xs font-medium mb-0.5">{card.bank_name}</div>
              <div className="text-white font-semibold text-sm">{card.nickname}</div>
            </div>
            <div className="w-8 h-6 rounded bg-white/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border border-white/60" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="flex gap-0.5">
                  {[0,1,2,3].map(j => <div key={j} className="w-1 h-1 rounded-full bg-white/60" />)}
                </div>
              ))}
            </div>
            <span className="text-white font-medium text-sm tracking-widest">{card.last_four}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider">Type</div>
              <div className="text-white/80 text-xs font-medium capitalize">{card.card_type}</div>
            </div>
            <div className="text-white font-black text-lg italic">VISA</div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[10px] font-medium">{card.bank_name}</div>
            <div className="text-white font-semibold text-sm">{card.nickname}</div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs font-mono">•••• {card.last_four}</div>
            <div className={`text-[10px] font-medium mt-0.5 ${card.is_active ? 'text-green-300' : 'text-white/40'}`}>
              {card.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
