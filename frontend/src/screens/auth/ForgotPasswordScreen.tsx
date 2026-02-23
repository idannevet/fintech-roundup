import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'email' | 'reset'>((location.state as any)?.step || 'email');
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [otp] = useState((location.state as any)?.otp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('OTP sent! Check your console.');
      navigate('/otp', { state: { type: 'password_reset', email } });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 8) { toast.error('Min 8 characters'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-12 bg-dark-bg relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-neon-pink/10 rounded-full blur-3xl pointer-events-none" />
      <button onClick={() => navigate(-1)} className="relative z-10 flex items-center gap-2 text-text-secondary hover:text-white mb-8">
        <ArrowLeft size={16} /><span className="text-sm">Back</span>
      </button>

      {step === 'email' ? (
        <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col justify-center relative z-10">
          <div className="mb-10">
            <div className="w-16 h-16 rounded-3xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center mb-6">
              <Mail size={28} className="text-neon-pink" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Reset Password</h1>
            <p className="text-text-secondary text-sm">Enter your email to receive a reset code</p>
          </div>
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field pl-11" autoComplete="email" />
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="btn-primary">
              {loading ? 'Sending...' : 'Send Reset Code'}
            </motion.button>
          </form>
          <p className="text-center text-sm text-text-secondary mt-8">
            Remember it?{' '}
            <Link to="/login" className="text-neon-purple font-semibold">Sign in</Link>
          </p>
        </motion.div>
      ) : (
        <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col justify-center relative z-10">
          <div className="mb-10">
            <div className="w-16 h-16 rounded-3xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mb-6">
              <Lock size={28} className="text-neon-green" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">New Password</h1>
            <p className="text-text-secondary text-sm">Set a strong new password</p>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type={showPassword ? 'text' : 'password'} placeholder="New password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} className="input-field pl-11 pr-12" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="password" placeholder="Confirm password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} className="input-field pl-11" autoComplete="new-password" />
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="btn-primary">
              {loading ? 'Resetting...' : 'Reset Password'}
            </motion.button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
