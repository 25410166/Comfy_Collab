import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Power,
  Server,
  Cloud,
  Layers
} from 'lucide-react';
import { api } from '../api/client.js';
import { RuntimeInfo } from '../types/index.js';

export function Runtime() {
  const queryClient = useQueryClient();
  const [endpointInput, setEndpointInput] = useState('');

  const { data: runtime, isLoading } = useQuery<RuntimeInfo>({
    queryKey: ['runtime'],
    queryFn: async () => {
      const res = await api.get('/runtime');
      if (res.data?.endpoint) setEndpointInput(res.data.endpoint);
      return res.data;
    }
  });

  const connectMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      return (await api.post('/runtime/connect', { endpoint })).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['runtime'] });
      alert(`Runtime connected! Status: ${data.status}`);
    },
    onError: (err: any) => {
      alert(`Connection failed: ${err.response?.data?.error || err.message}`);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return (await api.post('/runtime/disconnect')).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime'] });
    }
  });

  const healthMutation = useMutation({
    mutationFn: async () => {
      return (await api.get('/runtime/health')).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['runtime'] });
      alert(data.ok ? 'Runtime is healthy and connected!' : `Runtime error: ${data.error}`);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Runtime Provider</h2>
        <p className="text-slate-400 text-xs mt-1">
          Connect your Google Colab instance, local ComfyUI, or remote GPU server.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                runtime?.status === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{runtime?.name || 'Google Colab'}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                    runtime?.status === 'ready'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {runtime?.status || 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Provider: <span className="font-medium text-slate-300">{runtime?.provider || 'google-colab'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => healthMutation.mutate()}
              disabled={healthMutation.isPending}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthMutation.isPending ? 'animate-spin' : ''}`} />
              Health Check
            </button>

            {runtime?.status === 'ready' ? (
              <button
                onClick={() => disconnectMutation.mutate()}
                className="px-3.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-rose-800/50"
              >
                <Power className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : null}
          </div>
        </div>

        {/* Endpoint Input */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            ComfyUI Tunnel / Endpoint URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. https://your-tunnel.trycloudflare.com or http://127.0.0.1:8188"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => connectMutation.mutate(endpointInput)}
              disabled={connectMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              {connectMutation.isPending ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Paste the Cloudflare Tunnel URL printed by the Colab notebook or your local address.
          </p>
        </div>

        {/* Hardware & Version Specs */}
        {runtime?.status === 'ready' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">GPU Model</span>
              <span className="text-xs font-bold text-white mt-1 block">
                {runtime.gpu?.name || 'NVIDIA GPU'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">VRAM Available</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block">
                {runtime.gpu?.freeVram ? `${runtime.gpu.freeVram} GB free / ` : ''}
                {runtime.gpu?.vram || 0} GB total
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">ComfyUI Version</span>
              <span className="text-xs font-bold text-white mt-1 block">
                {runtime.comfyVersion || 'Latest'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Colab Notebook Quickstart Guide */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Google Colab Quickstart</h3>
          </div>
          <a
            href="https://colab.research.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Open Colab <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
          <li>
            Upload and open <span className="font-mono text-indigo-300">colab/ComfyStudio.ipynb</span> in Google Colab.
          </li>
          <li>
            Run Cell 1 to mount Google Drive (<span className="font-mono text-slate-400">MyDrive/ComfyStudio</span>).
          </li>
          <li>
            Run Cell 2 to install ComfyUI and set up persistent model symlinks.
          </li>
          <li>
            Run Cell 3 to start ComfyUI with Cloudflare Tunnel. Copy the generated <span className="font-mono text-emerald-400">https://xxxx.trycloudflare.com</span> URL into the endpoint field above and click <strong>Connect</strong>.
          </li>
        </ol>
      </div>
    </div>
  );
}
