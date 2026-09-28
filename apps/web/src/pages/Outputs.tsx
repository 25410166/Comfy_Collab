import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Image as ImageIcon,
  Play,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
  Download,
  X
} from 'lucide-react';
import { api } from '../api/client.js';
import { Generation } from '../types/index.js';

export function Outputs() {
  const queryClient = useQueryClient();
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);

  const { data, isLoading } = useQuery<{ items: Generation[]; total: number }>({
    queryKey: ['generations'],
    queryFn: async () => (await api.get('/generations?limit=50')).data
  });

  const generations = data?.items || [];

  const rerunMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/generations/${id}/rerun`)).data,
    onSuccess: () => {
      alert('Generation re-queued!');
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      setSelectedGen(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/generations/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      setSelectedGen(null);
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Generation Gallery</h2>
        <p className="text-slate-400 text-xs mt-1">
          Review outputs, inspect generation seeds & parameters, and re-run workflows.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading gallery...</div>
      ) : generations.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-200">No outputs generated yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Run any workflow from the Workflows tab to start generating and storing artwork.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {generations.map((gen) => {
            const firstOutput = gen.outputs?.[0];
            return (
              <div
                key={gen._id}
                onClick={() => setSelectedGen(gen)}
                className="group relative aspect-square bg-[#111827] border border-slate-800 hover:border-indigo-500/50 rounded-xl overflow-hidden cursor-pointer transition-all shadow-sm"
              >
                {firstOutput ? (
                  firstOutput.mediaType === 'video' ? (
                    <video
                      src={firstOutput.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={firstOutput.url}
                      alt={gen.workflowName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                    {gen.status === 'executing' ? 'Generating...' : gen.status}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{gen.workflowName}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{new Date(gen.createdAt).toLocaleDateString()}</span>
                    {gen.executionTimeMs ? <span>{(gen.executionTimeMs / 1000).toFixed(1)}s</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Inspector Modal */}
      {selectedGen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            {/* Media Preview Column */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[350px]">
              {selectedGen.outputs?.[0]?.mediaType === 'video' ? (
                <video
                  src={selectedGen.outputs[0].url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-lg object-contain"
                />
              ) : selectedGen.outputs?.[0] ? (
                <img
                  src={selectedGen.outputs[0].url}
                  alt={selectedGen.workflowName}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain"
                />
              ) : (
                <span className="text-xs text-slate-500">No output media</span>
              )}
            </div>

            {/* Metadata & Actions Column */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-white line-clamp-1">
                    {selectedGen.workflowName}
                  </h3>
                  <button
                    onClick={() => setSelectedGen(null)}
                    className="p-1 rounded-lg text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Status</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 capitalize">
                      {selectedGen.status}
                    </span>
                  </div>

                  {selectedGen.executionTimeMs ? (
                    <div>
                      <span className="text-slate-500 block mb-1">Render Time</span>
                      <span className="text-slate-300 font-mono">
                        {(selectedGen.executionTimeMs / 1000).toFixed(2)} seconds
                      </span>
                    </div>
                  ) : null}

                  {selectedGen.outputs?.[0] && (
                    <div>
                      <span className="text-slate-500 block mb-1">File</span>
                      <span className="text-slate-300 font-mono truncate block">
                        {selectedGen.outputs[0].filename}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 block mb-1">Generated At</span>
                    <span className="text-slate-300">
                      {new Date(selectedGen.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => rerunMutation.mutate(selectedGen._id)}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Re-run Generation
                </button>

                {selectedGen.outputs?.[0] && (
                  <a
                    href={selectedGen.outputs[0].url}
                    download={selectedGen.outputs[0].filename}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Image
                  </a>
                )}

                <button
                  onClick={() => {
                    if (confirm('Delete this generation output?')) {
                      deleteMutation.mutate(selectedGen._id);
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
