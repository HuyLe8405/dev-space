'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { MessageResponse } from '@devspace/contracts';

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FR-003 Rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = newPassword.length > 0 && newPassword !== currentPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    passwordsMatch &&
    isDifferentFromCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient<MessageResponse>('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccessMessage(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to change password. Please verify your current password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-3 text-xs rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 p-3 text-xs rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="currentPassword" className="block text-xs font-medium text-foreground">
            Current password
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="block text-xs font-medium text-foreground">
            New password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmNewPassword" className="block text-xs font-medium text-foreground">
            Confirm new password
          </label>
          <input
            id="confirmNewPassword"
            type={showNew ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        {/* FR-003 Requirements Checklist */}
        <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1.5 text-[11px]">
          <span className="block font-medium text-muted-foreground mb-1">
            New password requirements:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-sky-400' : 'text-muted-foreground'}`}>
              {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>8+ characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-sky-400' : 'text-muted-foreground'}`}>
              {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>Uppercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-sky-400' : 'text-muted-foreground'}`}>
              {hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>Lowercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-sky-400' : 'text-muted-foreground'}`}>
              {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>Numeric digit</span>
            </div>
          </div>
          {newPassword.length > 0 && confirmPassword.length > 0 && (
            <div className={`flex items-center gap-1.5 pt-1 border-t border-border/40 ${passwordsMatch ? 'text-sky-400' : 'text-rose-400'}`}>
              {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Updating your password keeps this device signed in and automatically logs out all other devices.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>
      </div>
    </form>
  );
}
