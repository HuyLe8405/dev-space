'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AreaToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function AreaToast({ toast, onDismiss }: AreaToastProps) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-primary shrink-0" />,
  };

  const badgeStyles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    info: 'border-primary/30 bg-primary/10 text-primary',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-card/95 text-foreground shadow-xl backdrop-blur-md max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
    >
      <div className={`p-1 rounded-md border ${badgeStyles[toast.type]}`}>
        {icons[toast.type]}
      </div>
      <p className="text-xs font-medium text-foreground pr-2">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="relative text-muted-foreground hover:text-foreground p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md transition-colors ml-auto focus:outline-none focus-visible:ring-1 focus-visible:ring-primary after:absolute after:-inset-2 after:content-[''] sm:after:hidden cursor-pointer"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
