'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { ApiClientError } from '@/lib/api-client';

export function ProfileForm() {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const memberSinceFormatted = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > 60 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateProfile({ displayName: trimmed });
      setSuccessMessage('Profile updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to update profile. Please try again.');
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
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="block text-xs font-medium text-foreground">
              Email address
            </label>
            <span className="text-[11px] text-muted-foreground">Private to you</span>
          </div>
          <input
            id="email"
            type="email"
            disabled
            value={user.email}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-muted-foreground cursor-not-allowed select-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="displayName" className="block text-xs font-medium text-foreground">
              Display name
            </label>
            <span className="text-[11px] text-muted-foreground">
              {displayName.length}/60
            </span>
          </div>
          <input
            id="displayName"
            type="text"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <span>Member since {memberSinceFormatted}</span>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!displayName.trim() || isSubmitting || displayName.trim() === user.displayName}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
}
