/**
 * Reset Password Page
 *
 * WI-12.3: Supabase Auth integration
 *
 * Page shown when users click the password reset link from email.
 * Allows them to set a new password.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength calculation
  const passwordStrength = (() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: '#B54A4A' };
    if (score <= 3) return { score, label: 'Fair', color: '#D4A853' };
    if (score <= 4) return { score, label: 'Good', color: '#6B8E6B' };
    return { score, label: 'Strong', color: '#3D7A3D' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(password);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-[1.5rem] overflow-hidden"
          style={{
            background: '#FFFFFF',
            boxShadow:
              '0 25px 50px -12px rgba(44, 36, 23, 0.15), 0 0 0 1px rgba(44, 36, 23, 0.05)',
          }}
        >
          {/* Decorative top accent */}
          <div
            className="h-1"
            style={{
              background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #C45830 100%)',
            }}
          />

          <div className="p-8">
            {isSuccess ? (
              // Success state
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(107, 142, 107, 0.15) 0%, rgba(61, 122, 61, 0.15) 100%)',
                  }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: '#3D7A3D' }} />
                </div>

                <h1
                  className="text-2xl font-semibold mb-2"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    color: '#2C2417',
                  }}
                >
                  Password Updated
                </h1>

                <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
                  Your password has been successfully reset. You can now sign in with your new
                  password.
                </p>

                <motion.button
                  onClick={() => navigate('/')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl py-3.5 font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                    boxShadow: '0 4px 14px rgba(196, 88, 48, 0.35)',
                  }}
                >
                  Continue to App
                </motion.button>
              </motion.div>
            ) : (
              // Form state
              <>
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
                    }}
                  >
                    <Lock className="w-8 h-8" style={{ color: '#C45830' }} />
                  </div>

                  <h1
                    className="text-2xl font-semibold mb-2"
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      color: '#2C2417',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Set New Password
                  </h1>
                  <p className="text-sm" style={{ color: '#8B7355' }}>
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="flex items-start gap-3 rounded-xl p-4 text-sm"
                          style={{
                            background: 'rgba(181, 74, 74, 0.08)',
                            color: '#B54A4A',
                            border: '1px solid rgba(181, 74, 74, 0.15)',
                          }}
                        >
                          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <p>{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium"
                      style={{ color: '#2C2417' }}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none"
                        style={{ color: '#8B7355' }}
                      />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a new password"
                        className={cn(
                          'w-full rounded-xl py-3 pl-12 pr-12 text-[#2C2417] placeholder-[#C4B8A5]',
                          'transition-all duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                        )}
                        style={{
                          background: '#F5F0E8',
                          border: '1px solid #E5DDD0',
                        }}
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2C2417] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className="h-1 flex-1 rounded-full transition-colors"
                              style={{
                                background:
                                  level <= passwordStrength.score
                                    ? passwordStrength.color
                                    : 'rgba(139, 115, 85, 0.2)',
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                          <span style={{ color: '#8B7355' }}>Min 6 characters</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Password requirements */}
                    <div className="space-y-1 pt-1">
                      {[
                        { check: password.length >= 6, text: '6+ characters' },
                        { check: /[A-Z]/.test(password), text: 'Uppercase letter' },
                        { check: /[0-9]/.test(password), text: 'Number' },
                      ].map(({ check, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: check ? '#3D7A3D' : '#8B7355' }}
                        >
                          <Check
                            className={cn(
                              'h-3 w-3 transition-opacity',
                              check ? 'opacity-100' : 'opacity-30'
                            )}
                          />
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium"
                      style={{ color: '#2C2417' }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none"
                        style={{ color: '#8B7355' }}
                      />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className={cn(
                          'w-full rounded-xl py-3 pl-12 pr-12 text-[#2C2417] placeholder-[#C4B8A5]',
                          'transition-all duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-[#C45830]',
                          password &&
                            confirmPassword &&
                            password !== confirmPassword &&
                            'ring-2 ring-[#B54A4A]'
                        )}
                        style={{
                          background: '#F5F0E8',
                          border: '1px solid #E5DDD0',
                        }}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2C2417] transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-xs" style={{ color: '#B54A4A' }}>
                        Passwords do not match
                      </p>
                    )}
                    {password && confirmPassword && password === confirmPassword && (
                      <p className="text-xs flex items-center gap-1" style={{ color: '#3D7A3D' }}>
                        <Check className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={
                      isLoading ||
                      password.length < 6 ||
                      !confirmPassword ||
                      password !== confirmPassword
                    }
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className={cn(
                      'w-full rounded-xl py-3.5 font-semibold text-white',
                      'transition-all duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    style={{
                      background: isLoading
                        ? '#8B7355'
                        : 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                      boxShadow: isLoading ? 'none' : '0 4px 14px rgba(196, 88, 48, 0.35)',
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Updating...
                      </span>
                    ) : (
                      'Update Password'
                    )}
                  </motion.button>
                </form>
              </>
            )}
          </div>

          {/* Bottom accent */}
          <div
            className="h-1"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.3) 50%, transparent 100%)',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
