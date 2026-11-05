import Link from 'next/link';
import { ArrowRight, Layers, Boxes, Folder } from 'lucide-react';
import type { HealthStatus } from '@devspace/contracts';

export default function HomePage() {
  const contractVerification: HealthStatus = {
    status: 'ok',
    service: 'devspace-api',
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-10 bg-background text-foreground">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* System Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-muted border border-border text-muted-foreground shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>DevSpace Initialized</span>
        </div>

        {/* Brand Heading without gradient text */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            DevSpace
          </h1>
          <p className="text-base sm:text-lg font-medium text-muted-foreground">
            Personal 3D Knowledge Workspace
          </p>
        </div>

        {/* Narrative Description */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Organize your engineering knowledge, projects, and personal progress through an interactive 3D spatial canvas combined with a focused 2D management interface.
        </p>

        {/* Action Link */}
        <div className="pt-2">
          <Link
            href="/workspaces"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <span>Open Workspaces</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Core Concepts Grid using semantic tokens */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 text-left">
          <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground mb-2">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <h2 className="text-xs font-semibold text-foreground">Islands</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Spatial areas representing distinct knowledge domains and focus areas.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground mb-2">
              <Folder className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <h2 className="text-xs font-semibold text-foreground">Structures</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Individual projects and milestones visually reflecting progress.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground mb-2">
              <Boxes className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <h2 className="text-xs font-semibold text-foreground">Nodes</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Connected architectural elements and relationships bridging ideas.
            </p>
          </div>
        </div>

        {/* Contracts Footer */}
        <div className="pt-6 border-t border-border/60 text-[11px] text-muted-foreground">
          Shared contracts type verification:{' '}
          <code className="font-mono text-foreground font-medium">
            {contractVerification.service}
          </code>{' '}
          ({contractVerification.status})
        </div>
      </div>
    </main>
  );
}
