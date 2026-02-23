import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { setPendingEmail } = useAuthStore();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.email) e.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password required';
    else if (form.password.length < 8) e.password = 'At least 8 chars';
    else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.password)) e.password = 'Need uppercase & number';
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register({ email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name, phone: form.phone || undefined });
      setPendingEmail(form.email);
      toast.success('Account created! Check console for OTP.');
      navigate('/otp', { state: { type: 'verification', email: form.email } });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 bg-dark-bg overflow-y-auto relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center relative z-10 py-8">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-3xl neon-gradient flex items-center justify-center mb-5 shadow-glow-purple">
            <span className="text-xl font-black text-white">R</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Create account</h1>
          <p className="text-text-secondary text-sm">Start saving with every purchase</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[{k:'first_name',p:'First name',ic:<User size={15}/>},{k:'last_name',p:'Last name',ic:<User size={15}/>}].map(f => (
              <div key={f.k}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{f.ic}</div>
                  <input type="text" placeholder={f.p} value={(form as any)[f.k]} onChange={update(f.k)}
                    className={`input-field pl-9 text-sm ${errors[f.k] ? 'border-red-500/50' : ''}`} />
                </div>
                {errors[f.k] && <p className="text-[10px] text-red-400 mt-1">{errors[f.k]}</p>}
              </div>
            ))}
          </div>

          <div>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="email" placeholder="Email address" value={form.email} onChange={update('email')}
                className={`input-field pl-11 ${errors.email ? 'border-red-500/50' : ''}`} autoComplete="email" />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1 ml-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={update('phone')}
              className="input-field pl-11" />
          </div>

          <div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password}
                onChange={update('password')} className={`input-field pl-11 pr-12 ${errors.password ? 'border-red-500/50' : ''}`}
                autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{errors.password}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="password" placeholder="Confirm password" value={form.confirmPassword}
                onChange={update('confirmPassword')} className={`input-field pl-11 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                autoComplete="new-password" />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1 ml-1">{errors.confirmPassword}</p>}
          </div>

          <div className="pt-1">
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="btn-primary">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </div>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-neon-purple font-semibold hover:opacity-80">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
