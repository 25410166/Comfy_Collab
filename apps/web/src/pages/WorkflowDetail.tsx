import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2,
  Play,
  Cloud,
  Download,
  History,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Code2,
  Search,
  ExternalLink,
  ChevronLeft,
  Activity
} from 'lucide-react';
import { api } from '../api/client.js';
import { Workflow, DependencyResult } from '../types/index.js';

export function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'dependencies' | 'versions' | 'json'>('overview');
  const [runMessage, setRunMessage] = useState<string | null>(null);

  // Fetch workflow
  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ['workflow', id],
    queryFn: async () => (await api.get(`/workflows/${id}`)).data
  });

  // Fetch dependencies
  const { data: deps, isLoading: depsLoading } = useQuery<DependencyResult>({
    queryKey: ['workflow-deps', id],
    queryFn: async () => (await api.get(`/workflows/${id}/dependencies`)).data,
    enabled: !!id
  });

  // Run Workflow Mutation
  const runMutation = useMutation({
    mutationFn: async () => {
      return (await api.post(`/workflows/${id}/run`)).data;
    },
    onSuccess: (data) => {
      setRunMessage(`Workflow queued! Prompt ID: ${data.promptId}`);
      setTimeout(() => setRunMessage(null), 5000);
      queryClient.invalidateQueries({ queryKey: ['generations'] });
    },
    onError: (err: any) => {
      alert(`Run error: ${err.response?.data?.error || err.message}`);
    }
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return (await api.post(`/workflows/${id}/sync`)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      alert(data.message || 'Synced successfully!');
    }
  });

  if (isLoading || !workflow) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading workflow...</div>;
  }

  const missingModelsCount = deps?.models?.missing?.length || 0;
  const missingNodesCount = deps?.customNodes?.missing?.length || 0;
  const hasMissingDeps = missingModelsCount > 0 || missingNodesCount > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Title */}
      <div>
        <Link
          to="/workflows"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Workflows
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{workflow.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono">
                Version {workflow.version}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {workflow.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
              {syncMutation.isPending ? 'Syncing...' : 'Sync to Drive'}
            </button>

            <a
              href={`/api/workflows/${workflow._id}/export`}
              download
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </a>

            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Play className="w-4 h-4 fill-current" />
              {runMutation.isPending ? 'Queuing...' : 'Run Workflow'}
            </button>
          </div>
        </div>

        {runMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{runMessage}</span>
          </div>
        )}
      </div>

      {/* Dependency Alert Banner */}
      {hasMissingDeps && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-200">
                Missing Dependencies Detected
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                This workflow requires {missingModelsCount} model(s) and {missingNodesCount} custom node(s) not yet installed in your runtime.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('dependencies')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shrink-0"
          >
            Review & Download
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { key: 'overview', label: 'Overview', icon: FolderGit2 },
          {
            key: 'dependencies',
            label: `Dependencies (${missingModelsCount + missingNodesCount > 0 ? '⚠️' : '✓'})`,
            icon: Boxes
          },
          { key: 'versions', label: `Version History (${workflow.versions?.length || 1})`, icon: History },
          { key: 'json', label: 'Workflow JSON', icon: Code2 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Workflow Metadata
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-slate-500">Total Versions</dt>
                  <dd className="font-semibold text-white mt-0.5">{workflow.versions?.length || 1}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Storage Sync</dt>
                  <dd className="font-semibold text-white mt-0.5 capitalize">
                    {workflow.sync?.status || 'local'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-300 mt-0.5">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Last Modified</dt>
                  <dd className="text-slate-300 mt-0.5">
                    {new Date(workflow.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Tags & Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {workflow.tags?.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Dependency Overview Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Required Models
              </h3>
              <div className="space-y-2">
                {workflow.models?.map((m, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 text-xs">
                    <div className="font-mono text-slate-300 truncate">{m.name}</div>
                    <div className="text-[10px] text-purple-400 uppercase mt-0.5">{m.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div className="space-y-6">
          {/* Missing Models */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Models Checklist</h3>
              <span className="text-xs text-slate-400">
                {deps?.models.installed.length || 0} installed / {deps?.models.missing.length || 0} missing
              </span>
            </div>

            <div className="space-y-2">
              {deps?.models.missing.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-mono font-medium text-amber-200">{m.name}</span>
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 uppercase">
                        {m.type}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/models?search=${encodeURIComponent(m.name.replace(/\.[^/.]+$/, ''))}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search & Download
                  </Link>
                </div>
              ))}

              {deps?.models.installed.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-mono text-slate-200">{m.name}</span>
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {m.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">Ready</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Nodes */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Custom Nodes Checklist</h3>
            <div className="space-y-2">
              {workflow.customNodes?.map((cn, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-purple-400" />
                    <span className="font-mono text-slate-300">{cn.classType}</span>
                    <span className="text-[11px] text-slate-500">({cn.name})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Required</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Version History</h3>
          <div className="space-y-3">
            {workflow.versions?.slice().reverse().map((v) => (
              <div
                key={v.version}
                className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Version {v.version}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(v.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{v.comment || 'No comment'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'json' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <pre className="p-4 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto max-h-[600px]">
            {JSON.stringify(workflow.workflowData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
