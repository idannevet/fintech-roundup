import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import OTPScreen from './screens/auth/OTPScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import CardsScreen from './screens/cards/CardsScreen';
import WalletScreen from './screens/wallet/WalletScreen';
import TransactionsScreen from './screens/transactions/TransactionsScreen';
import TransfersScreen from './screens/transfers/TransfersScreen';
import SettingsScreen from './screens/settings/SettingsScreen';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl neon-gradient flex items-center justify-center shadow-glow-purple">
          <span className="text-2xl font-black text-white">R</span>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen />;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <div className="mobile-container bg-dark-bg">
        {/* Ambient glow effects */}
        <div className="fixed inset-0 max-w-[430px] mx-auto pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-neon-blue/5 rounded-full blur-3xl" />
        </div>

        <Routes>
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterScreen /></PublicRoute>} />
          <Route path="/otp" element={<OTPScreen />} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordScreen /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<DashboardScreen />} />
            <Route path="cards" element={<CardsScreen />} />
            <Route path="wallet" element={<WalletScreen />} />
            <Route path="transactions" element={<TransactionsScreen />} />
            <Route path="transfers" element={<TransfersScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 35, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '14px',
              fontSize: '14px',
              backdropFilter: 'blur(20px)',
            },
            success: { iconTheme: { primary: '#00C896', secondary: '#090914' } },
            error: { iconTheme: { primary: '#FF6B9D', secondary: '#090914' } },
          }}
        />
      </div>
    </BrowserRouter>
  );
}
