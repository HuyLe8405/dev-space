'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export function WorkspaceNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground mb-5 shadow-sm">
        <Compass className="w-7 h-7" />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Workspace Not Found
      </h1>

      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        The workspace you are looking for does not exist or you do not have
        permission to view it.
      </p>

      <div className="mt-6">
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go to My Workspaces</span>
        </Link>
      </div>
    </div>
  );
}

