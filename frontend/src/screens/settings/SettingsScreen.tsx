import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Bell, Shield, Info, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../../services/settings';
import { useAuthStore } from '../../store/authStore';
import type { RoundingConfig } from '../../types';

const ROUNDING_OPTIONS = [
  { value: 1, label: '₪1', desc: 'e.g. ₪12.90 → save ₪0.10' },
  { value: 5, label: '₪5', desc: 'e.g. ₪12.90 → save ₪2.10' },
  { value: 10, label: '₪10', desc: 'e.g. ₪12.90 → save ₪7.10' },
  { value: 20, label: '₪20', desc: 'e.g. ₪12.90 → save ₪7.10' },
  { value: 50, label: '₪50', desc: 'e.g. ₪47.00 → save ₪3.00' },
  { value: 100, label: '₪100', desc: 'e.g. ₪67.00 → save ₪33.00' },
];

const MULTIPLIER_OPTIONS = [
  { value: 1, label: '1×', desc: 'Standard round-up' },
  { value: 2, label: '2×', desc: 'Double your savings' },
  { value: 3, label: '3×', desc: 'Triple your savings' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [config, setConfig] = useState<RoundingConfig>({ is_enabled: true, rounding_unit: 1, multiplier: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getRoundingConfig()
      .then(c => { setConfig(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const saveConfig = async (updates: Partial<RoundingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setSaving(true);
    try {
      const saved = await settingsService.updateRoundingConfig(newConfig);
      setConfig(saved);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'U';
  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => toast('Coming soon!'), color: 'text-neon-blue' },
    { icon: Shield, label: 'Privacy & Security', action: () => toast('Coming soon!'), color: 'text-neon-green' },
    { icon: Info, label: 'About RoundUp', action: () => toast('RoundUp v1.0 — Smart Savings'), color: 'text-neon-purple' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="screen-padding pt-14 pb-8 space-y-5">

      <motion.div variants={item}>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-text-secondary text-sm">Manage your account</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item} className="glass-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl neon-gradient flex items-center justify-center text-white text-xl font-black shadow-glow-purple">
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{user?.first_name} {user?.last_name}</h3>
          <p className="text-text-secondary text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${user?.is_verified ? 'bg-neon-green' : 'bg-yellow-400'}`} />
            <span className={`text-xs ${user?.is_verified ? 'text-neon-green' : 'text-yellow-400'}`}>
              {user?.is_verified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Rounding Settings */}
      <motion.div variants={item} className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Round-Up Savings</h3>
            <p className="text-text-secondary text-xs mt-0.5">Auto-save with every purchase</p>
          </div>
          <button onClick={() => saveConfig({ is_enabled: !config.is_enabled })} disabled={saving}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${config.is_enabled ? 'bg-neon-purple' : 'bg-white/10'}`}>
            <motion.div
              animate={{ x: config.is_enabled ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>

        {config.is_enabled && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="space-y-3">
              <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Round up to nearest:</p>
              <div className="grid grid-cols-3 gap-2">
                {ROUNDING_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => saveConfig({ rounding_unit: opt.value })}
                    className={`py-3 rounded-2xl text-center transition-all ${
                      config.rounding_unit === opt.value
                        ? 'neon-gradient text-white shadow-glow-purple'
                        : 'bg-white/5 border border-white/10 text-text-secondary hover:border-neon-purple/30'}`}>
                    <div className="font-bold text-sm">{opt.label}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl p-3 bg-neon-purple/5 border border-neon-purple/15">
                <p className="text-text-secondary text-xs">
                  <span className="text-neon-purple font-medium">Example: </span>
                  {ROUNDING_OPTIONS.find(o => o.value === config.rounding_unit)?.desc}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Round-up multiplier:</p>
              <div className="grid grid-cols-3 gap-2">
                {MULTIPLIER_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => saveConfig({ multiplier: opt.value })}
                    className={`py-3 rounded-2xl text-center transition-all ${
                      config.multiplier === opt.value
                        ? 'bg-gradient-to-br from-neon-green/30 to-neon-blue/20 border border-neon-green/50 text-neon-green shadow-[0_0_12px_rgba(0,200,150,0.2)]'
                        : 'bg-white/5 border border-white/10 text-text-secondary hover:border-neon-green/30'}`}>
                    <div className="font-black text-base">{opt.label}</div>
                    <div className="text-[9px] mt-0.5 opacity-70">{opt.desc}</div>
                  </button>
                ))}
              </div>
              {config.multiplier > 1 && (
                <div className="rounded-2xl p-3 bg-neon-green/5 border border-neon-green/15">
                  <p className="text-text-secondary text-xs">
                    <span className="text-neon-green font-medium">{config.multiplier}× active: </span>
                    Each round-up is multiplied by {config.multiplier}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Menu */}
      <motion.div variants={item} className="glass-card divide-y divide-white/5">
        {menuItems.map(({ icon: Icon, label, action, color }) => (
          <button key={label} onClick={action}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-colors first:rounded-t-[20px] last:rounded-b-[20px]">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <span className="text-white text-sm font-medium flex-1 text-left">{label}</span>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="text-center space-y-1">
        <p className="text-text-muted text-xs">RoundUp — Smart Savings</p>
        <p className="text-text-muted text-[10px]">Version 1.0.0 MVP</p>
      </motion.div>

      <motion.div variants={item}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all font-semibold text-sm">
          <LogOut size={16} />
          Sign Out
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
