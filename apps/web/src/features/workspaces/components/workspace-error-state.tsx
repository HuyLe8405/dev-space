'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface WorkspaceErrorStateProps {
  title?: string;
  error?: string | null;
  onRetry: () => Promise<void> | void;
}

export function WorkspaceErrorState({
  title = 'Unable to Load Workspaces',
  error,
  onRetry,
}: WorkspaceErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto animate-in fade-in duration-200"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>

      <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-sm">
        {error || 'An unexpected error occurred while communicating with the server. Please check your connection and try again.'}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
        </button>
      </div>
    </div>
  );
}

