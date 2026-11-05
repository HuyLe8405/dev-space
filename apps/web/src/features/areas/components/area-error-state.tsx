'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AreaErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function AreaErrorState({ error, onRetry }: AreaErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center flex flex-col items-center justify-center space-y-3"
    >
      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          Failed to load workspace areas
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
      >
        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
