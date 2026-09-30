import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Key, HardDrive, Cpu, Cloud } from 'lucide-react';
import { api } from '../api/client.js';

export function Settings() {
  const queryClient = useQueryClient();
  const [comfyEndpoint, setComfyEndpoint] = useState('');
  const [hfToken, setHfToken] = useState('');
  const [civitaiToken, setCivitaiToken] = useState('');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      if (res.data?.comfy?.endpoint) setComfyEndpoint(res.data.comfy.endpoint);
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post('/settings', { settings: payload })).data;
    },
    onSuccess: () => {
      alert('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['runtime'] });
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Settings</h2>
        <p className="text-slate-400 text-xs mt-1">
          Configure API credentials, endpoints, and local storage directories.
        </p>
      </div>

      <div className="space-y-5">
        {/* Runtime Connection Settings */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cpu className="w-4 h-4 text-[#93C5FD]" />
            <span>ComfyUI Runtime Connection</span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Default ComfyUI Endpoint URL
            </label>
            <input
              type="text"
              value={comfyEndpoint}
              onChange={(e) => setComfyEndpoint(e.target.value)}
              placeholder="http://127.0.0.1:8188"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#0D5CFF]"
            />
          </div>
        </div>

        {/* API Tokens */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Key className="w-4 h-4 text-purple-400" />
            <span>External API Credentials</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Civitai API Key (for gated/NSFW models)
              </label>
              <input
                type="password"
                value={civitaiToken}
                onChange={(e) => setCivitaiToken(e.target.value)}
                placeholder="Civitai API Token..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#0D5CFF]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Hugging Face Token
              </label>
              <input
                type="password"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#0D5CFF]"
              />
            </div>
          </div>
        </div>

        {/* Local Storage Paths Info */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Local Storage Directories</span>
          </div>

          <div className="space-y-2 text-xs">
            {settingsData?.paths &&
              Object.entries(settingsData.paths).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 capitalize">{key}:</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-md">
                    {String(val)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              const payload: any = {};
              if (comfyEndpoint) payload['comfy_endpoint'] = comfyEndpoint;
              if (hfToken) payload['hf_token'] = hfToken;
              if (civitaiToken) payload['civitai_token'] = civitaiToken;
              saveMutation.mutate(payload);
            }}
            disabled={saveMutation.isPending}
            className="px-5 py-2 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
