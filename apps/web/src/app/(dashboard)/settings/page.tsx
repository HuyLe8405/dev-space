'use client';

import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';
import { ProfileForm } from '@/features/auth/components/profile-form';
import { PasswordForm } from '@/features/auth/components/password-form';

type SettingsTab = 'profile' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 sm:px-6">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage your personal profile and security preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation sub-tabs */}
        <aside className="w-full md:w-52 shrink-0">
          <nav className="flex md:flex-col gap-1 p-1 rounded-lg border border-border/80 bg-card/60">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 md:flex-initial flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                activeTab === 'profile'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <User className="w-4 h-4 text-primary" />
              <span>Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 md:flex-initial flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                activeTab === 'security'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>Security & Password</span>
            </button>
          </nav>
        </aside>

        {/* Content panel */}
        <main className="flex-1 w-full max-w-xl p-6 rounded-xl border border-border bg-card">
          <div className="mb-6 pb-4 border-b border-border/60">
            <h2 className="text-base font-medium text-foreground">
              {activeTab === 'profile' ? 'Profile Details' : 'Security & Password'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'profile'
                ? 'Your personal identity information across DevSpace.'
                : 'Manage your password and active session protection.'}
            </p>
          </div>

          {activeTab === 'profile' ? <ProfileForm /> : <PasswordForm />}
        </main>
      </div>
    </div>
  );
}
