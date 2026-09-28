import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Boxes,
  Download,
  Cpu,
  Play,
  ArrowRight,
  HardDrive,
  Cloud,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client.js';
import { Workflow, RuntimeInfo, Generation, ModelItem } from '../types/index.js';

export function Dashboard() {
  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => (await api.get('/workflows')).data
  });

  const { data: models = [] } = useQuery<ModelItem[]>({
    queryKey: ['models'],
    queryFn: async () => (await api.get('/models')).data
  });

  const { data: runtime } = useQuery<RuntimeInfo>({
    queryKey: ['runtime'],
    queryFn: async () => (await api.get('/runtime')).data
  });

  const { data: generationsData } = useQuery<{ items: Generation[]; total: number }>({
    queryKey: ['generations', 1],
    queryFn: async () => (await api.get('/generations?limit=6')).data
  });

  const generations = generationsData?.items || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI Workstation Architecture
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
            ComfyUI Studio
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Persistent local workspace for ComfyUI. Manage workflows, download models directly to Google Drive, and run generations seamlessly on Google Colab GPU runtime.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Runtime Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Runtime Status</span>
            <div className={`p-2 rounded-lg ${runtime?.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-white capitalize">{runtime?.status || 'Offline'}</div>
            <div className="text-xs text-slate-400 mt-1">
              {runtime?.gpu?.name ? `${runtime.gpu.name} (${runtime.gpu.vram} GB)` : 'Connect to Colab or Local GPU'}
            </div>
          </div>
          <Link to="/runtime" className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Configure Runtime <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Workflows Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saved Workflows</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{workflows.length}</div>
            <div className="text-xs text-slate-400 mt-1">Versioned & saved in local DB</div>
          </div>
          <Link to="/workflows" className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View Workflows <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Models Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Model Library</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{models.length}</div>
            <div className="text-xs text-slate-400 mt-1">Checkpoints, LoRAs, VAEs</div>
          </div>
          <Link to="/models" className="mt-4 text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1">
            Browse Models <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Drive Sync Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Google Drive Sync</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-white">Active</div>
            <div className="text-xs text-slate-400 mt-1">MyDrive/ComfyStudio</div>
          </div>
          <Link to="/drive" className="mt-4 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">
            Sync & Backup <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Launch Workflows */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Quick Workflows</h3>
          <Link to="/workflows" className="text-xs text-indigo-400 hover:underline">
            View All ({workflows.length})
          </Link>
        </div>

        {workflows.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-8 text-center">
            <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">No workflows imported yet.</p>
            <Link
              to="/workflows"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              Import Workflow
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.slice(0, 3).map((wf) => (
              <div
                key={wf._id}
                className="bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-slate-100 line-clamp-1">{wf.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      v{wf.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {wf.description || 'ComfyUI Workflow'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {wf.tags?.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {wf.models?.length || 0} models required
                  </span>
                  <Link
                    to={`/workflows/${wf._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium transition-colors"
                  >
                    Open & Run <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Generations Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Recent Outputs</h3>
          <Link to="/outputs" className="text-xs text-indigo-400 hover:underline">
            View All ({generationsData?.total || 0})
          </Link>
        </div>

        {generations.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-8 text-center">
            <p className="text-xs text-slate-500">No generation outputs yet. Run a workflow to create images!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {generations.map((gen) => {
              const output = gen.outputs?.[0];
              return (
                <div
                  key={gen._id}
                  className="group relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-colors"
                >
                  {output ? (
                    <img
                      src={output.url}
                      alt={gen.workflowName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                      Processing...
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-[11px] font-medium text-white line-clamp-1">{gen.workflowName}</p>
                    <span className="text-[10px] text-slate-400 capitalize">{gen.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
