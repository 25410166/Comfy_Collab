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
  ExternalLink
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
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ComfyUI Studio
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Local Workstation</p>
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Runtime Status Pill in Sidebar Bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <Link
            to="/runtime"
            className="block p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:border-indigo-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">GPU Runtime</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    runtime?.status === 'ready'
                      ? 'bg-emerald-400 animate-pulse'
                      : runtime?.status === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-[11px] font-medium capitalize text-slate-400">
                  {runtime?.status || 'Offline'}
                </span>
              </span>
            </div>
            {runtime?.gpu?.name && (
              <div className="text-[11px] text-slate-400 truncate">
                {runtime.gpu.name} ({runtime.gpu.vram} GB)
              </div>
            )}
            <div className="mt-2 text-[10px] text-indigo-400 hover:underline">
              Manage Connection →
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {activeGen ? (
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs">
                <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Generating ({activeGen.progress}%)</span>
                {activeGen.node && <span className="text-slate-400">Node: {activeGen.node}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HardDrive className="w-4 h-4 text-slate-500" />
                <span>Local MongoDB & Filesystem Active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {runtime?.endpoint && (
              <a
                href={runtime.endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-emerald-300 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Mở giao diện ComfyUI trên Google Colab để theo dõi trực tiếp node graph và tiến trình render"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>🖥️ ComfyUI Canvas (Live)</span>
              </a>
            )}

            <Link
              to="/workflows"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Generation
            </Link>
          </div>

        </header>

        {/* Routed Page Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
