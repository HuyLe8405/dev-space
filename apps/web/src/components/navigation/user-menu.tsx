'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

function getInitials(name?: string, email?: string): string {
  const target = (name && name.trim()) || (email && email.split('@')[0]) || 'U';
  const parts = target.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return target.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const initials = getInitials(user.displayName, user.email);

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold tracking-wider border border-border bg-card text-foreground hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
      >
        {initials}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg py-1.5 text-xs text-foreground z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 border-b border-border/60">
            <p className="font-medium text-foreground truncate">{user.displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="border-t border-border/60 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              role="menuitem"
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
