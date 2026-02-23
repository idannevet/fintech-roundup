import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-12 bg-dark-bg relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-neon-purple/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center relative z-10">
        <div className="mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-3xl neon-gradient flex items-center justify-center mb-6 shadow-glow-purple">
            <span className="text-2xl font-black text-white">R</span>
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-text-secondary text-sm">Sign in to your RoundUp account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                className={`input-field pl-11 ${errors.email ? 'border-red-500/50' : ''}`} autoComplete="email" />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                className={`input-field pl-11 pr-12 ${errors.password ? 'border-red-500/50' : ''}`}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-neon-purple hover:opacity-80 transition-opacity">
              Forgot password?
            </Link>
          </div>

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="btn-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </motion.button>
        </form>

        <div className="mt-6 p-4 rounded-2xl bg-neon-purple/5 border border-neon-purple/20">
          <p className="text-xs text-text-secondary text-center">
            <span className="text-neon-purple font-medium">New here?</span> Register a new account to get started
          </p>
        </div>

        <p className="text-center text-sm text-text-secondary mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-neon-purple font-semibold hover:opacity-80">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
