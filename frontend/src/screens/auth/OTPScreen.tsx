import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';

export default function OTPScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setPendingEmail } = useAuthStore();
  const type = (location.state as any)?.type || 'verification';
  const email = (location.state as any)?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); inputRefs.current[5]?.focus(); }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter 6-digit code'); return; }
    setLoading(true);
    try {
      const result = await authService.verifyOTP(email, code, type);
      if (type === 'verification') {
        if (result.user) setUser(result.user);
        setPendingEmail(null);
        toast.success('Verified! Welcome to RoundUp');
        navigate('/');
      } else {
        toast.success('OTP verified! Reset your password.');
        navigate('/forgot-password', { state: { step: 'reset', email, otp: code } });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-12 bg-dark-bg relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-neon-green/10 rounded-full blur-3xl pointer-events-none" />

      <button onClick={() => navigate(-1)} className="relative z-10 flex items-center gap-2 text-text-secondary hover:text-white mb-8">
        <ArrowLeft size={16} /><span className="text-sm">Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center relative z-10">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={36} className="text-neon-green" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Verify Code</h1>
          <p className="text-text-secondary text-sm">
            We sent a 6-digit code to<br />
            <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-text-muted text-xs mt-2">(Check the server console for the OTP in demo mode)</p>
        </div>

        <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input key={i} ref={el => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
              value={digit} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border transition-all bg-white/5 text-white
                ${digit ? 'border-neon-purple shadow-glow-purple' : 'border-white/10'}
                focus:outline-none focus:border-neon-purple`} />
          ))}
        </div>

        <motion.button onClick={handleVerify} disabled={loading || otp.join('').length !== 6}
          whileTap={{ scale: 0.97 }} className="btn-primary">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Verifying...
            </span>
          ) : 'Verify & Continue'}
        </motion.button>
      </motion.div>
    </div>
  );
}
