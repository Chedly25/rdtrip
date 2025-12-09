/**
 * Account Settings Component
 *
 * WI-12.3: Supabase Auth integration
 *
 * Allows users to manage their account:
 * - Update profile (name, avatar)
 * - Change email
 * - Change password
 * - Delete account (GDPR compliance)
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Trash2,
  AlertTriangle,
  Check,
  AlertCircle,
  Camera,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface AccountSettingsProps {
  onClose?: () => void;
}

type SettingsSection = 'profile' | 'email' | 'password' | 'delete' | null;

export function AccountSettings({ onClose }: AccountSettingsProps) {
  const { user, updateUserProfile, changeEmail, changePassword, deleteUserAccount, isGuest } =
    useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email state
  const [newEmail, setNewEmail] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await updateUserProfile({ displayName });
      setSuccess('Profile updated successfully');
      setActiveSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await changeEmail(newEmail);
      setSuccess('Verification email sent to your new address');
      setNewEmail('');
      setActiveSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsLoading(true);

    try {
      await deleteUserAccount();
      // User will be logged out automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsLoading(false);
    }
  };

  if (isGuest) {
    return (
      <div className="p-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'rgba(212, 168, 83, 0.12)',
          }}
        >
          <User className="w-8 h-8" style={{ color: '#D4A853' }} />
        </div>
        <h2
          className="text-xl font-semibold mb-2"
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            color: '#2C2417',
          }}
        >
          Guest Account
        </h2>
        <p className="text-sm mb-4" style={{ color: '#8B7355' }}>
          Create an account to access account settings and save your trips.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            color: '#2C2417',
          }}
        >
          Account Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8B7355] transition-all hover:bg-[#2C2417]/5"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 rounded-xl p-4 text-sm"
              style={{
                background: 'rgba(61, 122, 61, 0.08)',
                color: '#3D7A3D',
                border: '1px solid rgba(61, 122, 61, 0.15)',
              }}
            >
              <Check className="h-5 w-5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          </motion.div>
        )}

        {error && activeSection === null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 rounded-xl p-4 text-sm"
              style={{
                background: 'rgba(181, 74, 74, 0.08)',
                color: '#B54A4A',
                border: '1px solid rgba(181, 74, 74, 0.15)',
              }}
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Info */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{ background: 'rgba(139, 115, 85, 0.05)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
          }}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-7 h-7" style={{ color: '#C45830' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: '#2C2417' }}>
            {user?.displayName || 'Traveler'}
          </p>
          <p className="text-sm truncate" style={{ color: '#8B7355' }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-3">
        {/* Profile Section */}
        <SettingsItem
          icon={User}
          label="Edit Profile"
          description="Update your name and photo"
          isActive={activeSection === 'profile'}
          onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden cursor-pointer group"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" style={{ color: '#C45830' }} />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={() => {
                  // TODO: Handle avatar upload
                }}
              />
              <div className="text-sm" style={{ color: '#8B7355' }}>
                Click to upload new photo
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: '#2C2417' }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  'w-full rounded-xl py-3 px-4 text-[#2C2417] placeholder-[#C4B8A5]',
                  'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                )}
                style={{ background: '#F5F0E8', border: '1px solid #E5DDD0' }}
                disabled={isLoading}
              />
            </div>

            <SubmitButton isLoading={isLoading} text="Save Changes" />
          </form>
        </SettingsItem>

        {/* Email Section */}
        <SettingsItem
          icon={Mail}
          label="Change Email"
          description={user?.email || 'Update your email address'}
          isActive={activeSection === 'email'}
          onClick={() => setActiveSection(activeSection === 'email' ? null : 'email')}
        >
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <p className="text-sm" style={{ color: '#8B7355' }}>
              We'll send a verification link to your new email address.
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: '#2C2417' }}>
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className={cn(
                  'w-full rounded-xl py-3 px-4 text-[#2C2417] placeholder-[#C4B8A5]',
                  'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                )}
                style={{ background: '#F5F0E8', border: '1px solid #E5DDD0' }}
                required
                disabled={isLoading}
              />
            </div>

            {error && activeSection === 'email' && <ErrorMessage message={error} />}

            <SubmitButton isLoading={isLoading} text="Update Email" />
          </form>
        </SettingsItem>

        {/* Password Section */}
        <SettingsItem
          icon={Lock}
          label="Change Password"
          description="Update your password"
          isActive={activeSection === 'password'}
          onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: '#2C2417' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className={cn(
                  'w-full rounded-xl py-3 px-4 text-[#2C2417] placeholder-[#C4B8A5]',
                  'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                )}
                style={{ background: '#F5F0E8', border: '1px solid #E5DDD0' }}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: '#2C2417' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={cn(
                  'w-full rounded-xl py-3 px-4 text-[#2C2417] placeholder-[#C4B8A5]',
                  'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                )}
                style={{ background: '#F5F0E8', border: '1px solid #E5DDD0' }}
                required
                disabled={isLoading}
              />
            </div>

            {error && activeSection === 'password' && <ErrorMessage message={error} />}

            <SubmitButton isLoading={isLoading} text="Update Password" />
          </form>
        </SettingsItem>

        {/* Delete Account Section */}
        <SettingsItem
          icon={Trash2}
          label="Delete Account"
          description="Permanently delete your account and data"
          isActive={activeSection === 'delete'}
          onClick={() => setActiveSection(activeSection === 'delete' ? null : 'delete')}
          isDanger
        >
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div
              className="flex items-start gap-3 rounded-xl p-4 text-sm"
              style={{
                background: 'rgba(181, 74, 74, 0.08)',
                border: '1px solid rgba(181, 74, 74, 0.15)',
              }}
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#B54A4A' }} />
              <div style={{ color: '#B54A4A' }}>
                <p className="font-medium mb-1">This action cannot be undone</p>
                <p>
                  This will permanently delete your account, trips, memories, and all associated
                  data.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: '#2C2417' }}>
                Type <span className="font-mono text-[#B54A4A]">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                className={cn(
                  'w-full rounded-xl py-3 px-4 text-[#2C2417] placeholder-[#C4B8A5]',
                  'focus:outline-none focus:ring-2 focus:ring-[#B54A4A]'
                )}
                style={{ background: '#F5F0E8', border: '1px solid #E5DDD0' }}
                required
                disabled={isLoading}
              />
            </div>

            {error && activeSection === 'delete' && <ErrorMessage message={error} />}

            <motion.button
              type="submit"
              disabled={isLoading || deleteConfirmation !== 'DELETE'}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className={cn(
                'w-full rounded-xl py-3 font-semibold text-white',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              style={{
                background: isLoading ? '#8B7355' : '#B54A4A',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Deleting...
                </span>
              ) : (
                'Delete My Account'
              )}
            </motion.button>
          </form>
        </SettingsItem>
      </div>
    </div>
  );
}

// Settings Item Component
function SettingsItem({
  icon: Icon,
  label,
  description,
  isActive,
  onClick,
  isDanger,
  children,
}: {
  icon: typeof User;
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  isDanger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #E5DDD0' }}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-4 p-4 text-left transition-colors',
          isActive ? 'bg-[#F5F0E8]' : 'hover:bg-[#FAF7F2]'
        )}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: isDanger
              ? 'rgba(181, 74, 74, 0.1)'
              : 'rgba(196, 88, 48, 0.1)',
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: isDanger ? '#B54A4A' : '#C45830' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-medium"
            style={{ color: isDanger ? '#B54A4A' : '#2C2417' }}
          >
            {label}
          </p>
          <p className="text-sm truncate" style={{ color: '#8B7355' }}>
            {description}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: '#8B7355' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isActive && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t" style={{ borderColor: '#E5DDD0' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Submit Button Component
function SubmitButton({ isLoading, text }: { isLoading: boolean; text: string }) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      whileHover={{ scale: isLoading ? 1 : 1.01 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      className={cn(
        'w-full rounded-xl py-3 font-semibold text-white',
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
          Saving...
        </span>
      ) : (
        text
      )}
    </motion.button>
  );
}

// Error Message Component
function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      style={{ color: '#B54A4A' }}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  );
}
