import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Pause,
  Play,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cloud
} from 'lucide-react';
import { api } from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { DownloadJob } from '../types/index.js';

export function Downloads() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');

  const { data: jobs = [], isLoading } = useQuery<DownloadJob[]>({
    queryKey: ['downloads', filter],
    queryFn: async () => {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      return (await api.get('/downloads', { params })).data;
    }
  });

  // Socket updates
  useSocketEvent('download.progress', (data) => {
    queryClient.setQueryData(['downloads', filter], (old: DownloadJob[] = []) =>
      old.map((j) =>
        j._id === data.jobId
          ? {
              ...j,
              progress: data.progress,
              downloadedBytes: data.downloadedBytes,
              totalBytes: data.totalBytes,
              speed: data.speed,
              status: 'downloading'
            }
          : j
      )
    );
  });

  useSocketEvent('download.completed', () => {
    queryClient.invalidateQueries({ queryKey: ['downloads'] });
    queryClient.invalidateQueries({ queryKey: ['models'] });
  });

  useSocketEvent('download.failed', () => {
    queryClient.invalidateQueries({ queryKey: ['downloads'] });
  });

  useSocketEvent('download.status', () => {
    queryClient.invalidateQueries({ queryKey: ['downloads'] });
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/downloads/${id}/pause`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] })
  });

  const resumeMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/downloads/${id}/resume`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] })
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/downloads/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] })
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/downloads/${id}/retry`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] })
  });

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Download Queue</h2>
        <p className="text-slate-400 text-xs mt-1">
          Monitor model downloads, speeds, and manage pause/resume operations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {['all', 'downloading', 'queued', 'completed', 'failed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === st
                ? 'bg-[#0D5CFF]/20 text-[#93C5FD] border border-[#0D5CFF]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading downloads...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center">
          <Download className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-xs text-slate-400">No active or past downloads in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-white">{job.filename}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {job.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>Source: {job.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {job.destination === 'drive' ? (
                        <>
                          <Cloud className="w-3.5 h-3.5 text-purple-400" /> Google Drive
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-3.5 h-3.5 text-[#93C5FD]" /> Local
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {job.status === 'downloading' && (
                    <button
                      onClick={() => pauseMutation.mutate(job._id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {job.status === 'paused' && (
                    <button
                      onClick={() => resumeMutation.mutate(job._id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400"
                      title="Resume"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button
                      onClick={() => retryMutation.mutate(job._id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                      title="Retry"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {['downloading', 'queued', 'paused'].includes(job.status) && (
                    <button
                      onClick={() => cancelMutation.mutate(job._id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === 'completed'
                        ? 'bg-emerald-500'
                        : job.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-[#0D5CFF]'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {formatBytes(job.downloadedBytes)} / {formatBytes(job.totalBytes)} ({job.progress}%)
                  </span>
                  <span>
                    {job.status === 'downloading'
                      ? `${formatBytes(job.speed)}/s`
                      : job.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {job.error && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Error: {job.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
