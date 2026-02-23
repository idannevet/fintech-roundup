import { NavLink } from 'react-router-dom';
import { Home, CreditCard, Wallet, ArrowLeftRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/cards', icon: CreditCard, label: 'Cards' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfer' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="tab-bar">
      <div className="flex items-center justify-around px-2 py-3">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className="flex-1">
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-1 py-1 relative"
                whileTap={{ scale: 0.9 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 neon-gradient rounded-xl opacity-10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 p-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-neon-purple' : 'text-text-muted'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-neon-purple' : 'text-text-muted'
                }`}>
                  {label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
