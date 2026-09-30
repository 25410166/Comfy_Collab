import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Upload,
  Search,
  Tag,
  Download,
  Trash2,
  Play,
  ArrowRight,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Cpu
} from 'lucide-react';
import { api } from '../api/client.js';
import { Workflow } from '../types/index.js';

export function Workflows() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Import form state
  const [importName, setImportName] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', search, selectedTag],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (selectedTag) params.tag = selectedTag;
      return (await api.get('/workflows', { params })).data;
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        if (importName) formData.append('name', importName);
        return (await api.post('/workflows/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })).data;
      } else {
        const parsed = JSON.parse(importJsonText);
        return (await api.post('/workflows/import', {
          name: importName || 'Imported Workflow',
          workflowData: parsed
        })).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsImportOpen(false);
      setFileToUpload(null);
      setImportJsonText('');
      setImportName('');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    }
  });

  // Gather unique tags
  const allTags = Array.from(
    new Set(workflows.flatMap((w) => w.tags || []))
  );

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Workflows Matrix</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0D5CFF]/15 text-[#93C5FD] border border-[#0D5CFF]/30">
              {workflows.length} Loaded
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Production pipelines optimized for SDXL, Realistic Vision, LoRA, and ControlNet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportOpen(true)}
            className="electric-btn px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow-electric"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search workflows by name, tags, or engine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#080D1A]/90 border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#0D5CFF] focus:ring-1 focus:ring-[#0D5CFF]/50 transition-all"
          />
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedTag === null
                  ? 'bg-[#0D5CFF]/20 text-[#93C5FD] border border-[#0D5CFF]/40 shadow-[0_0_12px_rgba(13,92,255,0.25)]'
                  : 'bg-[#0B1120] border border-[#1E293B] text-slate-400 hover:text-slate-200 hover:border-[#1E293B]/80'
              }`}
            >
              All Pipelines
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-[#0D5CFF]/20 text-[#93C5FD] border border-[#0D5CFF]/40 shadow-[0_0_12px_rgba(13,92,255,0.25)]'
                    : 'bg-[#0B1120] border border-[#1E293B] text-slate-400 hover:text-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0D5CFF] border-t-transparent animate-spin" />
          <span>Synchronizing workflows from local MongoDB...</span>
        </div>
      ) : workflows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto border border-[#1E293B]">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-200">No workflows found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Import your existing ComfyUI workflow JSON files to manage and run them here.
          </p>
          <button
            onClick={() => setIsImportOpen(true)}
            className="electric-btn px-4 py-2 rounded-xl text-white text-xs font-medium inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <div
              key={wf._id}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:border-[#0D5CFF]/50 hover:shadow-glow-electric relative overflow-hidden"
            >
              {/* Subtle top ambient rim light */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0D5CFF]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {wf.thumbnailUrl && (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-3.5 bg-black/60 border border-[#1E293B] relative group">
                    <img
                      src={wf.thumbnailUrl}
                      alt={wf.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    {wf.samplePrompts && wf.samplePrompts.length > 0 && (
                      <span className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#050811]/85 backdrop-blur-md text-[#93C5FD] border border-[#0D5CFF]/40 shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#00F0FF]" />
                        <span>{wf.samplePrompts.length} Presets</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/workflows/${wf._id}`}
                    className="font-semibold text-sm text-slate-100 hover:text-[#93C5FD] line-clamp-1 transition-colors"
                  >
                    {wf.name}
                  </Link>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#080D1A] text-slate-400 font-mono border border-[#1E293B]">
                    v{wf.version}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[32px] leading-relaxed">
                  {wf.description || 'No description provided.'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {wf.tags?.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-[#0D5CFF]/10 text-[#93C5FD] border border-[#0D5CFF]/20">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Dependencies badge */}
                <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400 border-t border-[#1E293B]/80 pt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
                    <span>{wf.models?.length || 0} Models</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                    <span>{wf.customNodes?.length || 0} Nodes</span>
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3.5 border-t border-[#1E293B] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <Cloud className="w-3.5 h-3.5 text-[#0D5CFF]" />
                  <span className="capitalize">{wf.sync?.status || 'local'}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (confirm(`Delete workflow "${wf.name}"?`)) {
                        deleteMutation.mutate(wf._id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`/api/workflows/${wf._id}/export`}
                    download
                    className="p-2 rounded-lg hover:bg-[#0B1120] text-slate-400 hover:text-slate-200 transition-colors"
                    title="Export JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <Link
                    to={`/workflows/${wf._id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0D5CFF]/15 hover:bg-[#0D5CFF]/25 border border-[#0D5CFF]/30 text-[#93C5FD] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-surface border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#0D5CFF]" />
                <span>Import Workflow</span>
              </h3>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Workflow Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SDXL Ultra Realistic Studio"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0D5CFF] focus:ring-1 focus:ring-[#0D5CFF]/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Upload Workflow JSON File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFileToUpload(e.target.files[0]);
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0D5CFF]/15 file:text-[#93C5FD] file:border file:border-[#0D5CFF]/30 hover:file:bg-[#0D5CFF]/25 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Or Paste Workflow JSON
                </label>
                <textarea
                  rows={6}
                  placeholder='{"nodes": [...], ...}'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#0D5CFF] focus:ring-1 focus:ring-[#0D5CFF]/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0B1120] hover:bg-[#0F172A] border border-[#1E293B] text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={(!fileToUpload && !importJsonText) || importMutation.isPending}
                onClick={() => importMutation.mutate()}
                className="electric-btn px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 transition-all shadow-glow-electric"
              >
                {importMutation.isPending ? 'Importing...' : 'Save & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
