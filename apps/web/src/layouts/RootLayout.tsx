import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderGit2,
  Boxes,
  Download,
  Image as ImageIcon,
  Cpu,
  Cloud,
  Settings,
  Sparkles,
  Activity,
  HardDrive,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { RuntimeInfo } from '../types/index.js';

export function RootLayout() {
  const queryClient = useQueryClient();
  const [activeGen, setActiveGen] = useState<any>(null);

  const { data: runtime } = useQuery<RuntimeInfo>({
    queryKey: ['runtime'],
    queryFn: async () => (await api.get('/runtime')).data,
    refetchInterval: 15000
  });

  useSocketEvent('runtime.status_update', () => {
    queryClient.invalidateQueries({ queryKey: ['runtime'] });
  });

  useSocketEvent('generation.progress', (data) => {
    setActiveGen(data);
  });

  useSocketEvent('generation.completed', () => {
    setActiveGen(null);
    queryClient.invalidateQueries({ queryKey: ['generations'] });
  });

  useSocketEvent('generation.failed', () => {
    setActiveGen(null);
  });

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/workflows', label: 'Workflows', icon: FolderGit2 },
    { to: '/models', label: 'Model Hub', icon: Boxes },
    { to: '/downloads', label: 'Downloads', icon: Download },
    { to: '/outputs', label: 'Outputs', icon: ImageIcon },
    { to: '/runtime', label: 'Runtime GPU', icon: Cpu },
    { to: '/drive', label: 'Google Drive', icon: Cloud },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#050811] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Trend 2027 Bioluminescent Azure */}
      <aside className="w-64 bg-[#080D1A]/90 backdrop-blur-2xl border-r border-[#1E293B]/80 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1E293B]/80">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D5CFF] to-[#0048E0] flex items-center justify-center text-white shadow-glow-electric">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-[#93C5FD] to-[#0D5CFF] bg-clip-text text-transparent">
                ComfyUI Studio
              </h1>
              <p className="text-[9px] text-[#60A5FA]/80 uppercase tracking-widest font-semibold flex items-center gap-1">
                <span>PRO WORKSTATION</span>
                <span className="w-1 h-1 rounded-full bg-[#00F0FF] animate-pulse" />
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#0D5CFF]/15 text-[#93C5FD] border border-[#0D5CFF]/30 shadow-[0_0_16px_rgba(13,92,255,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F172A]/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-30" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Runtime Status Card in Sidebar Bottom */}
        <div className="p-4 border-t border-[#1E293B]/80 bg-[#070B16]/60">
          <Link
            to="/runtime"
            className="block p-3 rounded-xl bg-[#0B1120]/80 border border-[#1E293B] hover:border-[#0D5CFF]/50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-300">Colab Cloud GPU</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    runtime?.status === 'ready'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                      : runtime?.status === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {runtime?.status || 'Offline'}
                </span>
              </span>
            </div>
            {runtime?.gpu?.name && (
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {runtime.gpu.name} ({runtime.gpu.vram} GB VRAM)
              </div>
            )}
            <div className="mt-2 text-[10px] text-[#0D5CFF] group-hover:text-[#60A5FA] font-medium flex items-center gap-1 transition-colors">
              <span>Inspect Telemetry</span>
              <ChevronRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#050811]">
        {/* Top Header */}
        <header className="h-16 bg-[#080D1A]/80 backdrop-blur-xl border-b border-[#1E293B]/80 px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            {activeGen ? (
              <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#0D5CFF]/15 border border-[#0D5CFF]/40 text-[#93C5FD] text-xs shadow-glow-electric">
                <Activity className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                <span className="font-medium">Generating ({activeGen.progress}%)</span>
                {activeGen.node && <span className="text-slate-400 font-mono text-[11px]">Node: {activeGen.node}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-[#0D5CFF]" />
                <span className="text-[11px]">Comfy Studio 2027 Pro • Workstation Connected</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {runtime?.endpoint && (
              <a
                href={runtime.endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#0B1120] hover:bg-[#0F172A] border border-[#1E293B] hover:border-[#0D5CFF]/40 text-slate-200 transition-all flex items-center gap-2 shadow-sm"
                title="Mở giao diện ComfyUI trên Google Colab để theo dõi trực tiếp node graph và tiến trình render"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>ComfyUI Canvas (Live)</span>
              </a>
            )}

            <Link
              to="/workflows"
              className="electric-btn px-4 py-1.5 text-xs font-semibold rounded-xl text-white flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Workflows</span>
            </Link>
          </div>
        </header>

        {/* Routed Page Container */}
        <main className="flex-1 overflow-y-auto p-8 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
