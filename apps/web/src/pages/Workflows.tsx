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
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client.js';
import { Workflow } from '../types/index.js';

export function Workflows() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Workflows</h2>
          <p className="text-slate-400 text-xs mt-1">
            Store, manage, version and inspect dependencies for ComfyUI workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search workflows by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTag === null
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-[#111827] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-[#111827] border border-slate-800 text-slate-400 hover:text-slate-200'
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
        <div className="p-12 text-center text-xs text-slate-500">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-200">No workflows found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Import your existing ComfyUI workflow JSON files to manage and run them here.
          </p>
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <div
              key={wf._id}
              className="bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all group overflow-hidden"
            >
              <div>
                {wf.thumbnailUrl && (
                  <div className="w-full h-36 rounded-lg overflow-hidden mb-3 bg-slate-950 border border-slate-800 relative">
                    <img
                      src={wf.thumbnailUrl}
                      alt={wf.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {wf.samplePrompts && wf.samplePrompts.length > 0 && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-indigo-300 border border-indigo-500/30">
                        ✨ {wf.samplePrompts.length} Presets
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/workflows/${wf._id}`}
                    className="font-semibold text-sm text-slate-100 hover:text-indigo-400 line-clamp-1 transition-colors"
                  >
                    {wf.name}
                  </Link>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    v{wf.version}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[32px]">
                  {wf.description || 'No description provided.'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {wf.tags?.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Dependencies badge */}
                <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {wf.models?.length || 0} Models
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {wf.customNodes?.length || 0} Custom Nodes
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-600" />
                  <span className="capitalize">{wf.sync?.status || 'local'}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm(`Delete workflow "${wf.name}"?`)) {
                        deleteMutation.mutate(wf._id);
                      }
                    }}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`/api/workflows/${wf._id}/export`}
                    download
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Export JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <Link
                    to={`/workflows/${wf._id}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Import Workflow</h3>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Workflow Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anime Character XL"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={(!fileToUpload && !importJsonText) || importMutation.isPending}
                onClick={() => importMutation.mutate()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium"
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
