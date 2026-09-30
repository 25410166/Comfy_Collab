import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Search,
  Download,
  CheckCircle2,
  HardDrive,
  Cloud,
  ExternalLink,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../api/client.js';
import { ModelItem } from '../types/index.js';

export function ModelHub() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<'civitai' | 'huggingface' | 'local'>('civitai');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Checkpoint');

  // Selected file for download modal
  const [downloadModal, setDownloadModal] = useState<{
    open: boolean;
    model: any;
    selectedFile: any;
    destination: 'local' | 'drive';
  }>({
    open: false,
    model: null,
    selectedFile: null,
    destination: 'local'
  });

  // Query local models
  const { data: localModels = [], isLoading: isLocalLoading } = useQuery<ModelItem[]>({
    queryKey: ['models', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      return (await api.get('/models', { params })).data;
    },
    enabled: source === 'local'
  });

  // Query Civitai models
  const { data: civitaiData, isLoading: isCivitaiLoading } = useQuery({
    queryKey: ['civitai', search, category],
    queryFn: async () => {
      return (
        await api.get('/models/search/civitai', {
          params: { query: search, types: category }
        })
      ).data;
    },
    enabled: source === 'civitai'
  });

  // Query HuggingFace models
  const { data: hfData, isLoading: isHfLoading } = useQuery({
    queryKey: ['hf', search],
    queryFn: async () => {
      return (
        await api.get('/models/search/huggingface', {
          params: { query: search }
        })
      ).data;
    },
    enabled: source === 'huggingface'
  });

  // Rescan local models mutation
  const rescanMutation = useMutation({
    mutationFn: async () => {
      return (await api.post('/models/scan')).data;
    },
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['models'] });
    }
  });

  // Trigger download mutation
  const downloadMutation = useMutation({
    mutationFn: async (payload: {
      source: string;
      sourceUrl: string;
      modelName: string;
      category: string;
      filename: string;
      destination: string;
    }) => {
      return (await api.post('/downloads', payload)).data;
    },
    onSuccess: () => {
      alert('Download queued! Track progress in Downloads tab.');
      setDownloadModal({ open: false, model: null, selectedFile: null, destination: 'local' });
    }
  });

  const categories = ['Checkpoint', 'LORA', 'VAE', 'ControlNet', 'Upscaler', 'Embedding'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Model Hub</h2>
          <p className="text-slate-400 text-xs mt-1">
            Search and download models directly from Civitai and Hugging Face to Local or Google Drive.
          </p>
        </div>

        {source === 'local' && (
          <button
            onClick={() => rescanMutation.mutate()}
            disabled={rescanMutation.isPending}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescanMutation.isPending ? 'animate-spin' : ''}`} />
            Rescan Disk
          </button>
        )}
      </div>

      {/* Source selector & search bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111827] border border-slate-800 p-3 rounded-xl">
        {/* Source Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {[
            { key: 'civitai', label: 'Civitai' },
            { key: 'huggingface', label: 'Hugging Face' },
            { key: 'local', label: 'Local Library' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSource(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 md:flex-none ${
                source === tab.key
                  ? 'bg-[#0D5CFF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={
              source === 'civitai'
                ? 'Search Civitai models...'
                : source === 'huggingface'
                ? 'Search Hugging Face models...'
                : 'Search local models...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#0D5CFF]"
          />
        </div>
      </div>

      {/* Category Pills (Civitai) */}
      {source === 'civitai' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-[#0D5CFF]/20 text-[#93C5FD] border border-[#0D5CFF]/30'
                  : 'bg-[#111827] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Models */}
      {source === 'local' && (
        <div>
          {isLocalLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading local models...</div>
          ) : localModels.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#111827] border border-slate-800 rounded-xl">
              No local models cataloged. Click "Rescan Disk" to discover downloaded models.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localModels.map((m) => (
                <div
                  key={m._id}
                  className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm text-white line-clamp-1">{m.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 uppercase">
                        {m.type}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                      {m.files?.map((f) => (
                        <div key={f._id} className="p-2 rounded bg-slate-900 font-mono text-[11px] truncate">
                          {f.filename} ({(f.size / (1024 * 1024 * 1024)).toFixed(2)} GB)
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Inference
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {source === 'civitai' && (
        <div>
          {isCivitaiLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Searching Civitai...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(civitaiData?.items || []).map((model: any) => {
                const preview = model.previewImages?.[0];
                return (
                  <div
                    key={model.id}
                    className="bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                        {preview ? (
                          <img
                            src={preview}
                            alt={model.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                            No Preview Available
                          </div>
                        )}
                        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white font-medium uppercase">
                          {model.baseModel || model.type}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h4 className="font-semibold text-sm text-white line-clamp-1">{model.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {model.description || 'No description provided.'}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>By {model.author}</span>
                          <span>•</span>
                          <span>{model.downloadsCount?.toLocaleString() || 0} downloads</span>
                        </div>
                      </div>
                    </div>

                    {/* Download Action */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => {
                          const file = model.files?.[0];
                          if (file) {
                            setDownloadModal({
                              open: true,
                              model,
                              selectedFile: file,
                              destination: 'local'
                            });
                          } else {
                            alert('No direct download files found.');
                          }
                        }}
                        className="w-full py-2 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Model
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {source === 'huggingface' && (
        <div>
          {isHfLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Searching Hugging Face...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(hfData?.items || []).map((model: any) => (
                <div
                  key={model.id}
                  className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-white line-clamp-1">{model.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{model.id}</p>
                    <div className="mt-3 space-y-1">
                      {model.files?.slice(0, 3).map((f: any) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-900 text-xs"
                        >
                          <span className="font-mono text-slate-300 truncate max-w-[200px]">
                            {f.filename}
                          </span>
                          <button
                            onClick={() => {
                              setDownloadModal({
                                open: true,
                                model,
                                selectedFile: f,
                                destination: 'local'
                              });
                            }}
                            className="px-2 py-1 rounded bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-[11px] text-white font-medium"
                          >
                            Get
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Download Destination Modal */}
      {downloadModal.open && downloadModal.model && downloadModal.selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Download Model</h3>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">File:</div>
              <div className="font-mono text-[#93C5FD] truncate">
                {downloadModal.selectedFile.filename}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">
                Storage Destination
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDownloadModal((prev) => ({ ...prev, destination: 'local' }))
                  }
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    downloadModal.destination === 'local'
                      ? 'border-[#0D5CFF] bg-[#0D5CFF]/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400'
                  }`}
                >
                  <HardDrive className="w-4 h-4 mb-2 text-[#93C5FD]" />
                  <span className="text-xs font-semibold">Local Storage</span>
                  <span className="text-[10px] text-slate-500">data/models/</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDownloadModal((prev) => ({ ...prev, destination: 'drive' }))
                  }
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    downloadModal.destination === 'drive'
                      ? 'border-[#0D5CFF] bg-[#0D5CFF]/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400'
                  }`}
                >
                  <Cloud className="w-4 h-4 mb-2 text-purple-400" />
                  <span className="text-xs font-semibold">Google Drive</span>
                  <span className="text-[10px] text-slate-500">MyDrive/ComfyStudio/</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() =>
                  setDownloadModal({ open: false, model: null, selectedFile: null, destination: 'local' })
                }
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={downloadMutation.isPending}
                onClick={() => {
                  downloadMutation.mutate({
                    source: downloadModal.model.source,
                    sourceUrl: downloadModal.selectedFile.downloadUrl,
                    modelName: downloadModal.model.name,
                    category: downloadModal.model.type || 'checkpoint',
                    filename: downloadModal.selectedFile.filename,
                    destination: downloadModal.destination
                  });
                }}
                className="px-4 py-2 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-white text-xs font-medium"
              >
                {downloadMutation.isPending ? 'Starting...' : 'Start Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
