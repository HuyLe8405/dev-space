'use client';

import React from 'react';

export function AreaLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading workspace areas">
      {/* Tab strip skeleton */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-2">
        <div className="h-8 w-28 bg-muted/60 rounded-lg" />
        <div className="h-8 w-32 bg-muted/40 rounded-lg" />
        <div className="h-8 w-24 bg-muted/30 rounded-lg" />
        <div className="ml-auto h-8 w-24 bg-muted/50 rounded-lg" />
      </div>

      {/* Status bar skeleton */}
      <div className="h-12 w-full bg-card/60 rounded-xl border border-border/60" />

      {/* Canvas container skeleton */}
      <div className="h-64 w-full rounded-2xl border border-dashed border-border/60 bg-card/20" />

      <span className="sr-only">Loading workspace areas...</span>
    </div>
  );
}

