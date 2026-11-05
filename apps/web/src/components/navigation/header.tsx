'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { UserMenu } from './user-menu';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';

export function ApplicationHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <Link
            href={isAuthenticated ? '/workspaces' : '/'}
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity shrink-0"
          >
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
              D
            </div>
            <span className="text-sm">DevSpace</span>
          </Link>

          {isAuthenticated && (
            <>
              <span className="text-muted-foreground/40 text-xs select-none shrink-0">/</span>
              <WorkspaceSwitcher />
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isLoading ? (
            <div
              role="status"
              aria-label="Loading user session"
              className="w-8 h-8 rounded-full bg-muted/40 animate-pulse flex items-center justify-center"
            >
              <span className="sr-only">Loading user session...</span>
            </div>
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
