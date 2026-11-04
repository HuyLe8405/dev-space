'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { UserMenu } from './user-menu';

export function ApplicationHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={isAuthenticated ? '/workspaces' : '/'}
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
              D
            </div>
            <span className="text-sm">DevSpace</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : isAuthPage ? (
            pathname === '/login' ? (
              <Link
                href="/register"
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                Create Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                Sign In
              </Link>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
