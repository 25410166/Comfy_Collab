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
  Activity,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Wand2,
  SlidersHorizontal,
  Camera,
  Shirt,
  UserCheck,
  Compass,
  Palette,
  Layers,
  Cpu,
  Library,
  Sliders
} from 'lucide-react';
import { api } from '../api/client.js';
import { Workflow, DependencyResult, PromptPreset, RuntimeInfo } from '../types/index.js';

export function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch active runtime for ComfyUI Canvas direct link
  const { data: runtime } = useQuery<RuntimeInfo>({
    queryKey: ['runtime'],
    queryFn: async () => (await api.get('/runtime')).data,
    refetchInterval: 10000
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'prompts_hub' | 'dependencies' | 'versions' | 'json'>('overview');

  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  // Prompt Optimizer states (inspired by linshenkx/prompt-optimizer)
  const [optimizerStyle, setOptimizerStyle] = useState<'photography' | 'fashion' | 'face' | 'asian_qwen' | 'creative'>('photography');
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);

  // 1000+ Prompts Hub states
  const [promptSearch, setPromptSearch] = useState('');
  const [promptCategory, setPromptCategory] = useState<'all' | 'model' | 'outfit_swap' | 'face_swap'>('all');
  const [promptPage, setPromptPage] = useState(1);

  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(fieldId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Prompt form states
  const [promptInput, setPromptInput] = useState('A cute fluffy red panda wearing a tiny wizard hat in an enchanted forest, soft magical glow, highly detailed, photorealistic');
  const [negPromptInput, setNegPromptInput] = useState('ugly, blurry, distorted, low quality, bad anatomy');
  const [width, setWidth] = useState(768);
  const [height, setHeight] = useState(768);
  const [steps, setSteps] = useState(12);
  const [cfg, setCfg] = useState(1.0);


  // Fetch workflow
  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ['workflow', id],
    queryFn: async () => (await api.get(`/workflows/${id}`)).data
  });

  // Fetch 1000+ Prompts Library
  const { data: promptsData, isLoading: promptsLoading } = useQuery<{
    items: PromptPreset[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['prompt-presets', promptCategory, promptSearch, promptPage],
    queryFn: async () => {
      const res = await api.get('/prompts', {
        params: {
          category: promptCategory,
          search: promptSearch,
          page: promptPage,
          limit: 12
        }
      });
      return res.data;
    }
  });

  const { data: promptStats } = useQuery<{
    total: number;
    model: number;
    outfit_swap: number;
    face_swap: number;
  }>({
    queryKey: ['prompt-stats'],
    queryFn: async () => (await api.get('/prompts/stats')).data
  });

  const applyPresetToRunner = (preset: PromptPreset) => {
    setPromptInput(preset.positive);
    setNegPromptInput(preset.negative);
    if (preset.width) setWidth(preset.width);
    if (preset.height) setHeight(preset.height);
    if (preset.steps) setSteps(preset.steps);
    if (preset.cfg) setCfg(preset.cfg);
    setActiveTab('overview');
    setRunMessage(`Đã nạp prompt "${preset.title}" vào bảng Runner! Bạn có thể bấm Tạo ảnh ngay.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch dependencies
  const { data: deps, isLoading: depsLoading } = useQuery<DependencyResult>({
    queryKey: ['workflow-deps', id],
    queryFn: async () => (await api.get(`/workflows/${id}/dependencies`)).data,
    enabled: !!id
  });

  // Fetch active generation progress (auto-loads latest generation if none active)
  const { data: activeGen } = useQuery<any>({
    queryKey: ['active-gen', id, activePromptId],
    queryFn: async () => {
      if (activePromptId) {
        const res = await api.get(`/generations?promptId=${activePromptId}&limit=1`);
        return res.data.items?.[0] || null;
      }
      const res = await api.get(`/generations?workflowId=${id}&limit=1`);
      return res.data.items?.[0] || null;
    },
    refetchInterval: (query) => {
      const item = query.state.data;
      if (!item) return 4000;
      if (item.status === 'queued' || item.status === 'executing') return 1500;
      return false;
    }
  });

  // Prompt Optimizer Mutation (inspired by linshenkx/prompt-optimizer)
  const optimizeMutation = useMutation({
    mutationFn: async (payload: { prompt: string; style: string }) => {
      return (await api.post('/prompts/optimize', payload)).data;
    },
    onSuccess: (data) => {
      setPromptInput(data.optimizedPrompt);
      if (data.negativePrompt) setNegPromptInput(data.negativePrompt);
      if (data.recommendedSettings) {
        if (data.recommendedSettings.width) setWidth(data.recommendedSettings.width);
        if (data.recommendedSettings.height) setHeight(data.recommendedSettings.height);
        if (data.recommendedSettings.steps) setSteps(data.recommendedSettings.steps);
        if (data.recommendedSettings.cfg) setCfg(data.recommendedSettings.cfg);
      }
      setOptimizeMessage(data.explanation || 'Đã tối ưu hóa prompt thành công!');
      setTimeout(() => setOptimizeMessage(null), 8000);
    },
    onError: (err: any) => {
      alert(`Lỗi tối ưu prompt: ${err.response?.data?.error || err.message}`);
    }
  });

  // Run Workflow Mutation with dynamic inputs
  const runMutation = useMutation({
    mutationFn: async (params?: any) => {
      setRunError(null);
      return (await api.post(`/workflows/${id}/run`, params || {})).data;
    },
    onSuccess: (data) => {
      setActivePromptId(data.promptId);
      setRunMessage(`Đã gửi vào hàng đợi GPU! Prompt ID: ${data.promptId}`);
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      queryClient.invalidateQueries({ queryKey: ['active-gen'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setRunError(msg);
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
      {/* macOS Navigation Bar & Title */}
      <div>
        <Link
          to="/workflows"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-3 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Danh sách Workflow</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-white tracking-tight">{workflow.name}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-mono">
                v{workflow.version}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {workflow.description || 'Chưa có mô tả cho workflow này.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.04] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/[0.08]"
            >
              <Cloud className="w-3.5 h-3.5 text-zinc-400" />
              <span>{syncMutation.isPending ? 'Đang đồng bộ...' : 'Sync Drive'}</span>
            </button>

            <a
              href={`/api/workflows/${workflow._id}/export`}
              download
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.04] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/[0.08]"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export</span>
            </a>

            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{runMutation.isPending ? 'Đang gửi...' : 'Chạy Workflow'}</span>
            </button>
          </div>
        </div>

        {runMessage && (
          <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{runMessage}</span>
          </div>
        )}
      </div>

      {/* Dependency Alert Banner */}
      {hasMissingDeps && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">
                Phát hiện thiếu Dependencies
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Workflow yêu cầu {missingModelsCount} model và {missingNodesCount} custom node chưa được cài đặt trong runtime hiện tại.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('dependencies')}
            className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium shrink-0 border border-white/[0.08]"
          >
            Kiểm tra & Tải về
          </button>
        </div>
      )}

      {/* macOS Segmented Tab Bar */}
      <div className="inline-flex p-1 rounded-xl bg-[#141416] border border-white/[0.08] backdrop-blur-md overflow-x-auto max-w-full">
        {[
          { key: 'overview', label: 'Tổng quan & Runner', icon: SlidersHorizontal },
          {
            key: 'prompts_hub',
            label: `Kho Prompts Hub (${promptStats?.total || '1,000'})`,
            icon: Library
          },
          {
            key: 'dependencies',
            label: `Dependencies${hasMissingDeps ? ' (Thiếu)' : ''}`,
            icon: Layers
          },
          { key: 'versions', label: `Lịch sử phiên bản (${workflow.versions?.length || 1})`, icon: History },
          { key: 'json', label: 'Cấu hình JSON', icon: Code2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#222225] text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
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
            {/* Quick Generator Panel (macOS Pro Inspector) */}
            <div className="bg-[#18181b] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Trình tạo ảnh (Prompt Runner)</h3>
                    <p className="text-[11px] text-zinc-400">Thiết lập prompt và thông số render trực tiếp trên GPU Colab</p>
                  </div>
                </div>
                <button
                  onClick={() => runMutation.mutate({
                    prompt: promptInput,
                    negativePrompt: negPromptInput,
                    steps,
                    width,
                    height,
                    cfg,
                    seed: Math.floor(Math.random() * 1000000000)
                  })}
                  disabled={runMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{runMutation.isPending ? 'Đang gửi...' : 'Tạo ảnh ngay'}</span>
                </button>
              </div>

              {/* Smart Prompt Optimizer Toolbar (macOS Pro style) */}
              <div className="p-3.5 rounded-xl bg-[#131315] border border-white/[0.08] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/[0.06] text-zinc-300">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">
                        AI Prompt Optimizer
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Nhập ý tưởng ngắn và chọn phong cách, AI sẽ tối ưu prompt 5 lớp chuẩn 8k
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => optimizeMutation.mutate({ prompt: promptInput, style: optimizerStyle })}
                    disabled={optimizeMutation.isPending || !promptInput.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{optimizeMutation.isPending ? 'Đang phân tích...' : 'Tối ưu hóa Prompt'}</span>
                  </button>
                </div>

                {/* Style Selector Chips (macOS segmented pill style with clean SF Lucide icons) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-zinc-500 shrink-0 font-medium mr-1 text-[11px] uppercase tracking-wider">Phong cách:</span>
                  {[
                    { id: 'photography', label: 'Nhiếp ảnh thực tế', icon: Camera },
                    { id: 'fashion', label: 'Thời trang & Trang phục', icon: Shirt },
                    { id: 'face', label: 'Chân dung chi tiết', icon: UserCheck },
                    { id: 'asian_qwen', label: 'Điện ảnh Á Đông', icon: Compass },
                    { id: 'creative', label: 'Sáng tạo nghệ thuật', icon: Palette }
                  ].map((s) => {
                    const StyleIcon = s.icon;
                    const isSelected = optimizerStyle === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setOptimizerStyle(s.id as any)}
                        className={`px-2.5 py-1 rounded-lg shrink-0 font-medium text-xs flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#27272a] text-white shadow-sm border border-white/10'
                            : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent'
                        }`}
                      >
                        <StyleIcon className="w-3 h-3 text-zinc-400" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {optimizeMessage && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5 flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{optimizeMessage}</span>
                  </div>
                )}
              </div>

              {/* Error notice if runtime disconnected */}
              {runError && (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-rose-300 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-200">Không thể kết nối đến GPU Colab:</p>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">{runError}</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Đường hầm Cloudflare có thể đã hết hạn. Hãy copy link Cloudflare mới từ Colab và dán vào trang Runtime.</p>
                    </div>
                  </div>
                  <Link
                    to="/runtime"
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-rose-200 font-semibold text-xs shrink-0 flex items-center gap-1 border border-white/[0.08]"
                  >
                    Trang Runtime →
                  </Link>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Positive Prompt (Mô tả hình ảnh)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyText(promptInput, 'runner-pos')}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition-colors"
                  >
                    {copiedId === 'runner-pos' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  rows={3}
                  placeholder="Nhập mô tả ảnh bằng tiếng Anh hoặc tiếng Việt rồi bấm Tối ưu hóa..."
                  className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Negative Prompt (Tránh các chi tiết lỗi)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyText(negPromptInput, 'runner-neg')}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition-colors"
                  >
                    {copiedId === 'runner-neg' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={negPromptInput}
                  onChange={(e) => setNegPromptInput(e.target.value)}
                  placeholder="ugly, blurry, distorted, low quality..."
                  className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">Resolution</label>
                  <select
                    value={`${width}x${height}`}
                    onChange={(e) => {
                      const [w, h] = e.target.value.split('x').map(Number);
                      setWidth(w);
                      setHeight(h);
                    }}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                  >
                    <option value="768x768">768 x 768 (Khuyến nghị)</option>
                    <option value="1024x1024">1024 x 1024 (Chuẩn HD)</option>
                    <option value="832x1216">832 x 1216 (Dọc / Portrait)</option>
                    <option value="1216x832">1216 x 832 (Ngang / Landscape)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">Steps</label>
                  <input
                    type="number"
                    min={4}
                    max={40}
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">CFG Scale</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={10}
                    value={cfg}
                    onChange={(e) => setCfg(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                  />
                </div>
              </div>

              {runMessage && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{runMessage}</span>
                  </div>
                  <Link
                    to="/outputs"
                    className="px-2.5 py-1 rounded bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium shrink-0"
                  >
                    Xem Gallery →
                  </Link>
                </div>
              )}

              {/* Live Generation Progress Monitor (macOS System HUD Card) */}
              {activeGen && (
                <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] shadow-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        activeGen.status === 'completed' ? 'bg-emerald-400' :
                        activeGen.status === 'failed' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <span className="text-xs font-semibold text-zinc-200">
                        {activeGen.status === 'queued' && 'Đang xếp hàng chờ GPU'}
                        {activeGen.status === 'executing' && 'GPU đang xử lý tạo ảnh'}
                        {activeGen.status === 'completed' && 'Hoàn thành tạo ảnh'}
                        {activeGen.status === 'failed' && 'Lỗi tạo ảnh'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-zinc-300">
                        {activeGen.status === 'completed' ? '100%' : `${activeGen.progress || 0}%`}
                      </span>

                      {runtime?.endpoint && (
                        <a
                          href={runtime.endpoint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                          title="Mở ComfyUI Canvas trên Colab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>ComfyUI Canvas</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (macOS System Blue) */}
                  {(activeGen.status === 'queued' || activeGen.status === 'executing') && (
                    <div className="space-y-1.5">
                      <div className="w-full bg-[#121214] rounded-full h-2 overflow-hidden border border-white/[0.08]">
                        <div
                          className="bg-[#0071e3] h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(5, activeGen.progress || 0)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{activeGen.currentNode ? `Node ${activeGen.currentNode}` : (activeGen.status === 'executing' ? 'KSampler Sampling...' : 'Đang nạp Model...')}</span>
                        <span>{activeGen.progress || 0}%</span>
                      </div>
                    </div>
                  )}

                  {/* Completed Output Preview */}
                  {activeGen.status === 'completed' && activeGen.outputs?.[0] && (
                    <div className="pt-2 space-y-3 border-t border-white/[0.08]">
                      <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                        <img
                          src={activeGen.outputs[0].url}
                          alt="Generated output"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                        <span>Lưu tại: <strong className="text-zinc-200">Google Drive & data/outputs</strong></span>
                        {activeGen.executionTimeMs && (
                          <span className="text-zinc-200 font-medium">
                            ⏱️ {(activeGen.executionTimeMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>

                      {/* Prompt & Parameters Details */}
                      {activeGen.parameters && (
                        <div className="p-3 rounded-xl bg-[#121214] border border-white/[0.08] space-y-2 text-[11px]">
                          {activeGen.parameters.prompt && (
                            <div>
                              <div className="flex items-center justify-between text-zinc-400 mb-1">
                                <span className="font-semibold text-zinc-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-zinc-400" /> Positive Prompt
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyText(activeGen.parameters.prompt, 'done-pos')}
                                  className="text-zinc-300 hover:text-white flex items-center gap-1 text-[10px]"
                                >
                                  {copiedId === 'done-pos' ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-zinc-300 line-clamp-3 bg-zinc-900/80 p-2 rounded-lg text-[11px] select-text">
                                {activeGen.parameters.prompt}
                              </p>
                            </div>
                          )}

                          {activeGen.parameters.negativePrompt && (
                            <div>
                              <span className="font-semibold text-zinc-400 block mb-0.5">Negative Prompt</span>
                              <p className="text-zinc-400 line-clamp-2 bg-zinc-900/80 p-1.5 rounded-lg text-[10px] select-text">
                                {activeGen.parameters.negativePrompt}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-4 gap-1.5 pt-1.5 text-[10px] font-mono text-zinc-300 border-t border-white/[0.08]">
                            <span className="bg-zinc-900 px-1.5 py-1 rounded text-center border border-white/[0.06]" title="Độ phân giải">
                              {activeGen.parameters.width ? `${activeGen.parameters.width}x${activeGen.parameters.height}` : '768x768'}
                            </span>
                            <span className="bg-zinc-900 px-1.5 py-1 rounded text-center border border-white/[0.06]" title="Số bước render">
                              Steps: {activeGen.parameters.steps ?? 12}
                            </span>
                            <span className="bg-zinc-900 px-1.5 py-1 rounded text-center border border-white/[0.06]" title="CFG Scale">
                              CFG: {activeGen.parameters.cfg ?? 1.0}
                            </span>
                            <span className="bg-zinc-900 px-1.5 py-1 rounded text-center border border-white/[0.06] truncate" title={`Seed: ${activeGen.parameters.seed}`}>
                              Seed: {activeGen.parameters.seed ?? 'Random'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <a
                          href={activeGen.outputs[0].url}
                          download={activeGen.outputs[0].filename}
                          className="flex-1 py-2 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải ảnh về máy
                        </a>
                        <Link
                          to="/outputs"
                          className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/[0.08]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Xem Gallery
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Failed Notice */}
                  {activeGen.status === 'failed' && (
                    <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs">
                      <p className="font-semibold mb-1">Chi tiết lỗi từ ComfyUI:</p>
                      <p className="font-mono text-[11px] text-rose-400">{activeGen.error || 'Unknown error'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Realistic Character Presets Section */}
            {workflow.samplePrompts && workflow.samplePrompts.length > 0 && (
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🎭 Realistic Character Prompt Presets</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                        {workflow.samplePrompts.length} Mẫu có sẵn
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bộ prompt chuẩn tối ưu ánh sáng Chiaroscuro, kết cấu da (skin pores) & ống kính chân thực
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {workflow.samplePrompts.map((preset, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 transition-all group"
                    >
                      {/* Thumbnail Preview */}
                      {preset.imageUrl && (
                        <div className="w-full md:w-44 h-44 shrink-0 rounded-lg overflow-hidden bg-slate-950 relative border border-slate-800">
                          <img
                            src={preset.imageUrl}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {preset.category && (
                            <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white">
                              {preset.category}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Content & Actions */}
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {preset.title}
                            </h4>
                            <button
                              onClick={() => {
                                setPromptInput(preset.positive);
                                setNegPromptInput(preset.negative);
                                if (preset.steps) setSteps(preset.steps);
                                if (preset.width && preset.height) {
                                  setWidth(preset.width);
                                  setHeight(preset.height);
                                }
                                if (preset.cfg) setCfg(preset.cfg);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              Dùng mẫu này (Apply)
                            </button>
                          </div>

                          {/* Positive Prompt Box */}
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase">
                                Positive Prompt
                              </span>
                              <button
                                type="button"
                                onClick={() => copyText(preset.positive, `pos-${idx}`)}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              >
                                {copiedId === `pos-${idx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Đã chép!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-400" />
                                    <span>Copy Positive</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono line-clamp-2 selection:bg-indigo-500">
                              {preset.positive}
                            </p>
                          </div>

                          {/* Negative Prompt Box */}
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-rose-400 tracking-wide uppercase">
                                Negative Prompt
                              </span>
                              <button
                                type="button"
                                onClick={() => copyText(preset.negative, `neg-${idx}`)}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              >
                                {copiedId === `neg-${idx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Đã chép!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-400" />
                                    <span>Copy Negative</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono line-clamp-1">
                              {preset.negative}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                          <span>Steps: <b className="text-slate-400">{preset.steps || 12}</b></span>
                          <span>Size: <b className="text-slate-400">{preset.width || 768}x{preset.height || 768}</b></span>
                          <span>CFG: <b className="text-slate-400">{preset.cfg || 1.0}</b></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {activeTab === 'prompts_hub' && (
        <div className="space-y-6">
          {/* Header Banner (macOS Pro Card) */}
          <div className="bg-[#18181b] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300">
                    <Library className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    Kho 1,000+ Prompt Siêu Thực Chuyên Nghiệp (Civitai Optimized)
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-3xl leading-relaxed">
                  Tổng hợp 1,000 bộ prompt chất lượng 8k UHD được tối ưu theo kỹ thuật nhiếp ảnh hiện đại (Hasselblad, Sony A7R V, ánh sáng Rembrandt, Chiaroscuro). Hỗ trợ đầy đủ bộ nút 1-click <strong>Sao chép Positive</strong>, <strong>Sao chép Negative</strong> và nút <strong>Dùng ngay</strong> để nạp trực tiếp vào Runner tạo ảnh.
                </p>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-[#121214] border border-white/[0.08] text-center">
                  <span className="block text-base font-semibold text-zinc-100 font-mono">{promptStats?.total || 1000}</span>
                  <span className="text-[10px] text-zinc-400 uppercase font-medium">Tổng Prompt</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'Tất cả', icon: SlidersHorizontal, count: promptStats?.total || 1000 },
                  { id: 'model', label: 'Người mẫu (Model)', icon: Camera, count: promptStats?.model || 350 },
                  { id: 'outfit_swap', label: 'Trang phục (Fashion)', icon: Shirt, count: promptStats?.outfit_swap || 350 },
                  { id: 'face_swap', label: 'Chân dung (Face Swap)', icon: UserCheck, count: promptStats?.face_swap || 300 }
                ].map((cat) => {
                  const CatIcon = cat.icon;
                  const isSelected = promptCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setPromptCategory(cat.id as any);
                        setPromptPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#27272a] text-white shadow-sm border border-white/10'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent'
                      }`}
                    >
                      <CatIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{cat.label}</span>
                      <span className="ml-1 opacity-60 font-mono text-[10px]">({cat.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm prompt (Áo dài, Kimono, Bikini, Rembrandt...)"
                  value={promptSearch}
                  onChange={(e) => {
                    setPromptSearch(e.target.value);
                    setPromptPage(1);
                  }}
                  className="w-full bg-[#0f0f11] border border-white/[0.08] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Prompts Grid */}
          {promptsLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Đang tải kho prompt...</div>
          ) : promptsData?.items.length === 0 ? (
            <div className="p-12 text-center bg-[#111827] border border-slate-800 rounded-xl text-xs text-slate-400">
              Không tìm thấy prompt phù hợp với từ khóa "{promptSearch}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptsData?.items.map((preset) => (
                <div
                  key={preset._id}
                  className="bg-[#111827] border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-sm group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {preset.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            preset.category === 'model' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            preset.category === 'outfit_swap' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {preset.category === 'model' ? 'Người mẫu' : preset.category === 'outfit_swap' ? 'Swap Trang Phục' : 'Swap Face'}
                          </span>
                          {preset.tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => applyPresetToRunner(preset)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all shadow-md shadow-indigo-600/20"
                      >
                        <span>Dùng ngay</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Positive Prompt Box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">Positive Prompt:</span>
                        <button
                          type="button"
                          onClick={() => copyText(preset.positive, `pos-${preset._id}`)}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                        >
                          {copiedId === `pos-${preset._id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy Positive</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 font-mono line-clamp-3 leading-relaxed">
                        {preset.positive}
                      </div>
                    </div>

                    {/* Negative Prompt Box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">Negative Prompt:</span>
                        <button
                          type="button"
                          onClick={() => copyText(preset.negative, `neg-${preset._id}`)}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                        >
                          {copiedId === `neg-${preset._id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy Negative</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[10px] text-slate-400 font-mono line-clamp-2">
                        {preset.negative}
                      </div>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Khuyến nghị: {preset.width}x{preset.height} | Steps: {preset.steps}</span>
                    <span className="text-indigo-400">CFG: {preset.cfg}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {promptsData && promptsData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                Trang {promptsData.page} / {promptsData.totalPages} (Tổng {promptsData.total} prompts)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={promptPage <= 1}
                  onClick={() => setPromptPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
                >
                  Trang trước
                </button>
                <button
                  disabled={promptPage >= promptsData.totalPages}
                  onClick={() => setPromptPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
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
