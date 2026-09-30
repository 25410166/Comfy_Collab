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
  Sliders,
  Plus,
  Trash2,
  Zap
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

  // Model, LoRA & Advanced Sampler controls
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loras, setLoras] = useState<Array<{ name: string; strength: number }>>([]);
  const [sampler, setSampler] = useState('euler');
  const [scheduler, setScheduler] = useState('beta');

  // Fetch all workflows for quick switcher
  const { data: allWorkflows } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => (await api.get('/workflows')).data
  });

  const handleAddLora = (defaultName = 'KNP_000003000.safetensors', defaultStrength = 1.0) => {
    setLoras(prev => [...prev, { name: defaultName, strength: defaultStrength }]);
  };

  const handleRemoveLora = (index: number) => {
    setLoras(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLora = (index: number, key: 'name' | 'strength', value: any) => {
    setLoras(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const applyModelPreset = (presetName: 'krea2' | 'realistic_vision' | 'sdxl_lightning' | 'realvisxl') => {
    if (presetName === 'krea2') {
      setSelectedModel('lustify-v10-krea-turbo-int8_convrot.safetensors');
      setSteps(8);
      setCfg(1.0);
      setSampler('euler');
      setScheduler('beta');
      setWidth(1152);
      setHeight(1536);
      setLoras([{ name: 'KNP_000003000.safetensors', strength: 1.0 }]);
      setPromptInput('A woman is captured as a melancholic succubus with horns and wings, posed against a backdrop of ethereal white cherry blossoms and cool blue atmospheric lighting, very realistic, 8k, cinematic photography');
      setNegPromptInput('worst quality, low quality, bad anatomy, deformed, distorted, blurry, cartoon, 3d render');
      setRunMessage('Đã nạp thông số Krea 2 / LUSTIFY Turbo (8 steps, Euler+Beta, 1152x1536, LoRA V4 1.0x)!');
    } else if (presetName === 'realistic_vision') {
      setSelectedModel('realisticVisionV60B1_v51HyperVAE_418901.safetensors');
      setSteps(20);
      setCfg(6.0);
      setSampler('dpmpp_sde');
      setScheduler('karras');
      setWidth(512);
      setHeight(768);
      setLoras([]);
      setPromptInput('RAW street style photography of a beautiful model in Paris, natural candid smile, stylish beige trench coat, soft golden hour sunlight, 50mm f/1.8, bokeh, hyperdetailed skin, authentic look, 8k');
      setNegPromptInput('deformed, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, ugly, disgusting, blurred, watermark');
      setRunMessage('Đã nạp thông số Realistic Vision V6.0 (20 steps, DPMPP_SDE Karras, 512x768)!');
    } else if (presetName === 'sdxl_lightning') {
      setSelectedModel('sdxl_lightning_4step.safetensors');
      setSteps(4);
      setCfg(1.5);
      setSampler('euler');
      setScheduler('sgm_uniform');
      setWidth(1024);
      setHeight(1024);
      setLoras([{ name: 'add-detail-xl.safetensors', strength: 0.8 }]);
      setRunMessage('Đã nạp thông số SDXL Lightning (4 steps, CFG 1.5, Gen 2s)!');
    } else if (presetName === 'realvisxl') {
      setSelectedModel('realvisxlV40_v40Bakedvae.safetensors');
      setSteps(20);
      setCfg(5.5);
      setSampler('dpmpp_2m');
      setScheduler('karras');
      setWidth(832);
      setHeight(1216);
      setLoras([{ name: 'add-detail-xl.safetensors', strength: 0.8 }]);
      setRunMessage('Đã nạp thông số RealVisXL V4.0 Studio Chiaroscuro!');
    }
  };

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
  const [promptInput, setPromptInput] = useState('A woman is captured as a melancholic succubus with horns and wings, posed against a backdrop of ethereal white cherry blossoms and cool blue atmospheric lighting, very realistic, 8k, cinematic photography');
  const [negPromptInput, setNegPromptInput] = useState('ugly, blurry, distorted, low quality, bad anatomy');
  const [width, setWidth] = useState(1152);
  const [height, setHeight] = useState(1536);
  const [steps, setSteps] = useState(8);
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
              className="px-4 py-1.5 rounded-lg bg-[#0D5CFF] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-3.5 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Trình tạo ảnh (Prompt Runner)</h3>
                    <p className="text-[11px] text-zinc-400">Chọn Workflow, Model, ghép nhiều LoRA & render GPU</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runMutation.mutate({
                      prompt: promptInput,
                      negativePrompt: negPromptInput,
                      steps,
                      width,
                      height,
                      cfg,
                      sampler,
                      scheduler,
                      model: selectedModel || undefined,
                      loras: loras.length > 0 ? loras : undefined,
                      seed: Math.floor(Math.random() * 1000000000)
                    })}
                    disabled={runMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-[#0D5CFF] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{runMutation.isPending ? 'Đang gửi...' : 'Tạo ảnh ngay'}</span>
                  </button>
                </div>
              </div>

              {/* 1. Workflow Quick Switcher */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <FolderGit2 className="w-4 h-4 text-[#0D5CFF] shrink-0 ml-1" />
                <span className="text-[11px] font-medium text-zinc-400 shrink-0">Workflow hiện tại:</span>
                <select
                  value={id}
                  onChange={(e) => navigate(`/workflows/${e.target.value}`)}
                  className="w-full bg-transparent text-xs text-zinc-100 font-medium focus:outline-none cursor-pointer"
                >
                  {allWorkflows?.map((w) => (
                    <option key={w._id} value={w._id} className="bg-[#18181b] text-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. One-click Model Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 mr-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">Preset Model:</span>
                </span>
                <button
                  type="button"
                  onClick={() => applyModelPreset('krea2')}
                  className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 text-[11px] font-medium transition-colors"
                >
                  🔥 Krea 2 / LUSTIFY Turbo (8s)
                </button>
                <button
                  type="button"
                  onClick={() => applyModelPreset('realistic_vision')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium transition-colors"
                >
                  📷 Realistic Vision V6 (5s)
                </button>
                <button
                  type="button"
                  onClick={() => applyModelPreset('sdxl_lightning')}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-medium transition-colors"
                >
                  ⚡ SDXL Lightning (2s)
                </button>
                <button
                  type="button"
                  onClick={() => applyModelPreset('realvisxl')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-medium transition-colors"
                >
                  🎨 RealVisXL V4.0 (15s)
                </button>
              </div>

              {/* Error notice if runtime disconnected */}
              {runError && (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-rose-300 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-200">Không thể kết nối đến GPU Colab:</p>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">{runError}</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Đường hầm có thể đã hết hạn. Hãy kiểm tra endpoint trong trang Runtime.</p>
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

              {/* Positive Prompt */}
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
                  className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] focus:border-[#0D5CFF] focus:ring-1 focus:ring-[#0D5CFF] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Negative Prompt */}
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
                  placeholder="worst quality, low quality, bad anatomy, deformed..."
                  className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] focus:border-[#0D5CFF] focus:ring-1 focus:ring-[#0D5CFF] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>

              {/* 3. Model & LoRA Management Box */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-3.5">
                {/* Model Checkpoint Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-[#0D5CFF]" />
                      <span>Chọn Model (Checkpoint / UNET)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">Tự động nạp vào bộ nhớ</span>
                  </div>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                  >
                    <option value="">-- Mặc định theo Workflow ({workflow.models?.[0]?.name || 'Auto'}) --</option>
                    <option value="lustify-v10-krea-turbo-int8_convrot.safetensors">lustify-v10-krea-turbo-int8_convrot.safetensors (LUSTIFY Krea 2 Turbo int8)</option>
                    <option value="lustifyNSFWCheckpoint_v10Krea2_2997637.safetensors">lustifyNSFWCheckpoint_v10Krea2_2997637.safetensors (LUSTIFY Checkpoint Krea 2)</option>
                    <option value="realisticVisionV60B1_v51HyperVAE_418901.safetensors">realisticVisionV60B1_v51HyperVAE_418901.safetensors (Realistic Vision V6.0 Hyper)</option>
                    <option value="realisticVisionV60B1_v51VAE.safetensors">realisticVisionV60B1_v51VAE.safetensors (Realistic Vision V5.1 VAE)</option>
                    <option value="sdxl_lightning_4step.safetensors">sdxl_lightning_4step.safetensors (SDXL Lightning - 2s)</option>
                    <option value="sd_xl_turbo_1.0_fp16.safetensors">sd_xl_turbo_1.0_fp16.safetensors (SDXL Turbo - 1s)</option>
                    <option value="realvisxlV40_v40Bakedvae.safetensors">realvisxlV40_v40Bakedvae.safetensors (RealVisXL V4.0)</option>
                    <option value="qwen_image_2.1_int8_convrot.safetensors">qwen_image_2.1_int8_convrot.safetensors (Qwen-Image 2.1)</option>
                  </select>
                </div>

                {/* LoRA Stack (Hỗ trợ 1 hoặc nhiều LoRA) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-zinc-300">LoRA Stack</span>
                      {loras.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                          {loras.length} LoRA
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddLora('KNP_000003000.safetensors', 1.0)}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm LoRA</span>
                    </button>
                  </div>

                  {loras.length === 0 ? (
                    <div
                      onClick={() => handleAddLora('KNP_000003000.safetensors', 1.0)}
                      className="p-3 rounded-xl border border-dashed border-white/[0.1] hover:border-white/[0.2] text-center text-xs text-zinc-500 hover:text-zinc-400 cursor-pointer transition-colors"
                    >
                      + Chưa gắn LoRA. Bấm để thêm LoRA Krea 2 NSFW V4 hoặc Add-Detail-XL
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {loras.map((lora, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#121214] border border-white/[0.08] flex flex-col md:flex-row md:items-center gap-2.5">
                          <div className="flex-1">
                            <select
                              value={lora.name}
                              onChange={(e) => handleUpdateLora(idx, 'name', e.target.value)}
                              className="w-full bg-[#18181b] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                            >
                              <option value="KNP_000003000.safetensors">KNP_000003000.safetensors (Krea 2 NSFW V4)</option>
                              <option value="add-detail-xl.safetensors">add-detail-xl.safetensors (Add Detail XL)</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 md:w-56 shrink-0">
                            <span className="text-[10px] text-zinc-400">Weight:</span>
                            <input
                              type="range"
                              min="0.1"
                              max="2.0"
                              step="0.05"
                              value={lora.strength}
                              onChange={(e) => handleUpdateLora(idx, 'strength', parseFloat(e.target.value))}
                              className="flex-1 accent-[#0D5CFF] h-1.5 cursor-pointer"
                            />
                            <span className="text-[11px] font-mono text-zinc-300 w-10 text-right">
                              {lora.strength.toFixed(2)}x
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLora(idx)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors self-end md:self-auto shrink-0"
                            title="Xóa LoRA này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Generation Parameters Grid (Resolution, Steps, CFG, Sampler, Scheduler) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Resolution</label>
                  <select
                    value={`${width}x${height}`}
                    onChange={(e) => {
                      const [w, h] = e.target.value.split('x').map(Number);
                      setWidth(w);
                      setHeight(h);
                    }}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                  >
                    <option value="1152x1536">1152 x 1536 (Krea 2 Dọc)</option>
                    <option value="1536x1152">1536 x 1152 (Krea 2 Ngang)</option>
                    <option value="1024x1024">1024 x 1024 (SDXL Vuông)</option>
                    <option value="832x1216">832 x 1216 (SDXL Dọc)</option>
                    <option value="1216x832">1216 x 832 (SDXL Ngang)</option>
                    <option value="512x768">512 x 768 (SD1.5 Dọc)</option>
                    <option value="768x768">768 x 768 (SD1.5 Vuông)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Steps</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">CFG Scale</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={15}
                    value={cfg}
                    onChange={(e) => setCfg(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Sampler</label>
                  <select
                    value={sampler}
                    onChange={(e) => setSampler(e.target.value)}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                  >
                    <option value="euler">euler</option>
                    <option value="dpmpp_sde">dpmpp_sde</option>
                    <option value="dpmpp_2m">dpmpp_2m</option>
                    <option value="heun">heun</option>
                    <option value="ddim">ddim</option>
                    <option value="uni_pc">uni_pc</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">Scheduler</label>
                  <select
                    value={scheduler}
                    onChange={(e) => setScheduler(e.target.value)}
                    className="w-full rounded-xl bg-[#0f0f11] border border-white/[0.08] px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#0D5CFF]"
                  >
                    <option value="beta">beta (Krea 2)</option>
                    <option value="simple">simple</option>
                    <option value="karras">karras</option>
                    <option value="sgm_uniform">sgm_uniform</option>
                    <option value="normal">normal</option>
                    <option value="exponential">exponential</option>
                  </select>
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
                    className="px-2.5 py-1 rounded bg-[#0D5CFF] hover:bg-[#0077ed] text-white font-medium shrink-0"
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
                          className="bg-[#0D5CFF] h-full rounded-full transition-all duration-500 ease-out"
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
                  {activeGen.status === 'completed' && activeGen.outputs && activeGen.outputs.length > 0 && (
                    <div className="pt-2 space-y-3 border-t border-white/[0.08]">
                      <div className={`grid gap-2 ${activeGen.outputs.length > 1 ? 'grid-cols-2 place-content-center' : 'grid-cols-1 max-w-sm mx-auto'}`}>
                        {activeGen.outputs.map((out: any, idx: number) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                            <img
                              src={out.url}
                              alt={`Generated output ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
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
                          className="flex-1 py-2 rounded-lg bg-[#0D5CFF] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
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
                            <h4 className="text-xs font-bold text-white group-hover:text-[#93C5FD] transition-colors">
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
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0D5CFF]/20 hover:bg-[#0D5CFF]/40 text-[#93C5FD] font-semibold flex items-center gap-1.5 transition-colors"
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
                            <p className="text-[11px] text-slate-300 font-mono line-clamp-2 selection:bg-[#0D5CFF]">
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
                  <span key={t} className="px-2.5 py-1 rounded-md bg-[#0D5CFF]/10 text-[#93C5FD] text-xs">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Prompt Optimizer */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#050811]/60 backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_-10px_rgba(0,0,0,0.5)] space-y-4 sticky top-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#0D5CFF]/15 text-[#00F0FF] border border-[#0D5CFF]/30 shadow-[0_0_15px_rgba(13,92,255,0.3)]">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    AI Optimizer
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed pl-1">
                  Chọn phong cách nghệ thuật, AI sẽ tự động phân tích và viết lại prompt 5 lớp đạt chuẩn 8k UHD.
                </p>
              </div>

              {/* Vertical Style Selector */}
              <div className="flex flex-col gap-2 pt-2">
                {[
                  { id: 'photography', label: 'Nhiếp ảnh thực tế', icon: Camera, desc: 'Canon EOS, 85mm, Chiaroscuro' },
                  { id: 'fashion', label: 'Thời trang & Trang phục', icon: Shirt, desc: 'Vogue editorial, studio lighting' },
                  { id: 'face', label: 'Chân dung chi tiết', icon: UserCheck, desc: 'Skin pores, highly detailed face' },
                  { id: 'asian_qwen', label: 'Điện ảnh Á Đông', icon: Compass, desc: 'Cinematic lighting, Wong Kar-wai' },
                  { id: 'creative', label: 'Sáng tạo nghệ thuật', icon: Palette, desc: 'Digital art, concept illustration' }
                ].map((s) => {
                  const StyleIcon = s.icon;
                  const isSelected = optimizerStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setOptimizerStyle(s.id as any)}
                      className={`px-3.5 py-3 rounded-xl flex items-center justify-between transition-all w-full text-left group ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#0D5CFF]/20 to-[#00F0FF]/10 border border-[#0D5CFF]/40 shadow-[0_0_20px_-5px_rgba(13,92,255,0.4)]'
                          : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#0D5CFF]/20 text-[#00F0FF]' : 'bg-white/[0.05] text-zinc-400 group-hover:text-zinc-200'}`}>
                          <StyleIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                            {s.label}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 mt-0.5 line-clamp-1">{s.desc}</span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => optimizeMutation.mutate({ prompt: promptInput, style: optimizerStyle })}
                  disabled={optimizeMutation.isPending || !promptInput.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D5CFF] to-[#0077ed] hover:to-[#00F0FF] active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(13,92,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{optimizeMutation.isPending ? 'Đang phân tích 5 lớp...' : 'Tối ưu hóa Prompt'}</span>
                </button>
              </div>

              {optimizeMessage && (
                <div className="text-[11px] text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-xl p-3 flex items-start gap-2.5 animate-fade-in mt-2 shadow-inner">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{optimizeMessage}</span>
                </div>
              )}
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
                  className="w-full bg-[#0f0f11] border border-white/[0.08] focus:border-[#0D5CFF] focus:ring-1 focus:ring-[#0D5CFF] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all"
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
                        className="px-3 py-1.5 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-white text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all shadow-md shadow-[0_0_15px_rgba(13,92,255,0.3)]"
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
                    <span className="text-[#93C5FD]">CFG: {preset.cfg}</span>
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
                  className="px-3 py-1.5 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric disabled:opacity-40 text-white text-xs font-semibold transition-colors"
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
                    className="px-3 py-1.5 rounded-lg bg-[#0D5CFF] hover:bg-[#246BFF] shadow-glow-electric text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
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
