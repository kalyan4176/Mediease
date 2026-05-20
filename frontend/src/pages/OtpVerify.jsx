import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const OtpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const userId = location.state?.userId;
  const email = location.state?.email || 'your email';

  useEffect(() => {
    // If no userId in state, kick back to signup
    if (!userId) {
      navigate('/signup');
    }
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return setError('Please enter a 6-digit code.');
    }

    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/verify-otp', {
        userId,
        otp,
      });

      setLoading(false);
      if (res.data.success) {
        // Save verification details in localstorage
        localStorage.setItem('mediease_token', res.data.token);
        localStorage.setItem('mediease_user', JSON.stringify(res.data.user));
        
        // Refresh page or trigger context login state manually to sync
        window.location.href = '/patient';
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'OTP verification failed. Please check the code.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-6 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-md">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Verify Your Email</h2>
          <p className="text-slate-500 text-sm">
            We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{email}</span>.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-left">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="block w-full text-center tracking-[15px] font-mono text-2xl rounded-xl border border-slate-200 bg-white py-3 outline-none ring-teal-500 transition-all focus:border-teal-500 focus:ring-1"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="glow-button flex w-full items-center justify-center rounded-xl bg-teal-600 py-3 font-bold text-white text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <span>Verify Account</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400">
            Check your spam folder if you haven't received the verification email.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default OtpVerify;
