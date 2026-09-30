import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Archive,
  Download,
  FolderGit2
} from 'lucide-react';
import { api } from '../api/client.js';

export function DriveSync() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['drive-status'],
    queryFn: async () => (await api.get('/drive/status')).data
  });

  const { data: records = [] } = useQuery({
    queryKey: ['drive-records'],
    queryFn: async () => (await api.get('/drive/records')).data
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post('/drive/sync')).data,
    onSuccess: (data) => {
      alert(`Sync finished: ${data.results?.length || 0} workflows processed.`);
      queryClient.invalidateQueries({ queryKey: ['drive-status'] });
      queryClient.invalidateQueries({ queryKey: ['drive-records'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    }
  });

  const backupMutation = useMutation({
    mutationFn: async () => (await api.post('/drive/backup')).data,
    onSuccess: (data) => {
      alert(`Backup created successfully! File: ${data.path}`);
      queryClient.invalidateQueries({ queryKey: ['drive-records'] });
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Google Drive & Persistence</h2>
        <p className="text-slate-400 text-xs mt-1">
          Synchronize workflows, models, and outputs with Google Drive storage.
        </p>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Google Drive Storage</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {status?.configured ? 'Connected' : 'Local Archive Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Folder: <span className="font-mono text-slate-300">MyDrive/ComfyStudio</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Archive className="w-3.5 h-3.5" />
              {backupMutation.isPending ? 'Archiving...' : 'Create Backup Zip'}
            </button>

            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync All Workflows'}
            </button>
          </div>
        </div>

        {/* Sync Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">Total Workflows Synced</span>
            <span className="text-base font-bold text-white mt-1 block">
              {status?.stats?.totalWorkflowsSynced || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">Pending Conflicts</span>
            <span className="text-base font-bold text-amber-400 mt-1 block">
              {status?.stats?.pendingConflicts || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">Last Sync Time</span>
            <span className="text-xs font-medium text-slate-300 mt-1.5 block">
              {status?.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Records History */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white">Recent Sync Operations</h3>

        {records.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No sync logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {records.map((rec: any) => (
              <div
                key={rec._id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-medium text-white">{rec.name}</span>
                    <span className="text-slate-500 ml-2 font-mono text-[11px]">
                      ({rec.direction})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span className="capitalize">{rec.status}</span>
                  <span>{new Date(rec.syncedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
