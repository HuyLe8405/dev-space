import type { HealthStatus } from '@devspace/contracts';

export default function HomePage() {
  // Verification that packages/contracts can be imported by the frontend
  const contractVerification: HealthStatus = {
    status: 'ok',
    service: 'devspace-api',
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          DevSpace Monorepo Initialized
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
          DevSpace
        </h1>

        <p className="text-xl text-slate-400">
          Personal 3D Knowledge Workspace
        </p>

        <p className="text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Organize your knowledge, projects, and personal progress through an interactive 3D spatial canvas combined with a focused 2D management interface.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
            <h3 className="font-semibold text-cyan-400 mb-1">Islands</h3>
            <p className="text-xs text-slate-400">Spatial areas representing distinct knowledge domains and focus areas.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
            <h3 className="font-semibold text-sky-400 mb-1">Structures</h3>
            <p className="text-xs text-slate-400">Individual projects and milestones visually reflecting progress.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
            <h3 className="font-semibold text-indigo-400 mb-1">Nodes</h3>
            <p className="text-xs text-slate-400">Connected elements and relationships bridging ideas across your workspace.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-500">
          Shared contracts type verification: <code className="text-cyan-400">{contractVerification.service}</code> ({contractVerification.status})
        </div>
      </div>
    </main>
  );
}
