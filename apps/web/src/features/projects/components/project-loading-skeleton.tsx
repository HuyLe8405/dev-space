'use client';

import React from 'react';

export function ProjectLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Loading projects">
      {/* Control bar skeleton */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="h-6 w-28 bg-muted/60 rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-44 bg-muted/40 rounded-lg" />
          <div className="h-8 w-32 bg-muted/40 rounded-lg" />
          <div className="h-8 w-24 bg-muted/50 rounded-lg" />
        </div>
      </div>

      {/* Grid of project cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-xl border border-border/60 bg-card/40 p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-muted/60" />
              <div className="w-6 h-6 rounded bg-muted/40" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-muted/60 rounded" />
              <div className="h-3 w-1/2 bg-muted/40 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="h-3 w-16 bg-muted/40 rounded" />
              <div className="h-3 w-20 bg-muted/40 rounded" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading projects...</span>
    </div>
  );
}

