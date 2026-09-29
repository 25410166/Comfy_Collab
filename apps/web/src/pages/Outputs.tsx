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
  X,
  Copy,
  Check,
  Cpu,
  Sliders,
  Layers,
  Settings2,
  Calendar,
  Maximize2
} from 'lucide-react';
import { api } from '../api/client.js';
import { Generation, RuntimeInfo } from '../types/index.js';

export function Outputs() {
  const queryClient = useQueryClient();
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDuration = (gen: Generation) => {
    const ms = gen.executionTimeMs || (gen.completedAt && gen.startedAt ? new Date(gen.completedAt).getTime() - new Date(gen.startedAt).getTime() : null);
    if (!ms || ms <= 0) return null;
    const sec = ms / 1000;
    if (sec < 60) return `${sec.toFixed(1)}s`;
    const min = Math.floor(sec / 60);
    const remSec = Math.round(sec % 60);
    return `${min}m ${remSec}s`;
  };

  // Fetch active runtime for direct ComfyUI Canvas link
  const { data: runtime } = useQuery<RuntimeInfo>({
    queryKey: ['runtime'],
    queryFn: async () => (await api.get('/runtime')).data,
    refetchInterval: 10000
  });

  const { data, isLoading } = useQuery<{ items: Generation[]; total: number }>({
    queryKey: ['generations'],
    queryFn: async () => (await api.get('/generations?limit=50')).data,
    refetchInterval: (query) => {
      const items = query.state.data?.items || [];
      const hasActive = items.some((i) => i.status === 'queued' || i.status === 'executing');
      return hasActive ? 2000 : false;
    }
  });

  const generations = data?.items || [];

  const rerunMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/generations/${id}/rerun`)).data,
    onSuccess: () => {
      alert('Đã gửi lại yêu cầu tạo ảnh vào hàng đợi GPU!');
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

  const clearAllMutation = useMutation({
    mutationFn: async () => (await api.delete('/generations/clear/all')).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      setSelectedGen(null);
    }
  });

  const comfyUiUrl = runtime?.endpoint || 'https://convinced-edward-betty-preferred.trycloudflare.com/';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Generation Gallery</h2>
          <p className="text-slate-400 text-xs mt-1">
            Quản lý các tác phẩm đã tạo, theo dõi tiến độ thời gian thực trên GPU Colab và xem chi tiết mọi thông số cấu hình.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {comfyUiUrl && (
            <a
              href={comfyUiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
              title="Mở giao diện ComfyUI gốc trên Google Colab để theo dõi luồng node graph và tiến trình render từng step"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>🖥️ Mở ComfyUI Canvas (Live)</span>
            </a>
          )}

          {generations.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa sạch toàn bộ tác phẩm và các tác vụ bị kẹt trong danh sách?')) {
                  clearAllMutation.mutate();
                }
              }}
              disabled={clearAllMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/40 flex items-center gap-1.5 self-start transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearAllMutation.isPending ? 'Đang dọn...' : 'Dọn sạch danh sách'}</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Đang tải thư viện ảnh...</div>
      ) : generations.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-200">Chưa có tác phẩm nào</h3>
          <p className="text-xs text-slate-400 mt-1">
            Vào mục Workflows để chọn prompt và bắt đầu tạo ảnh trên GPU.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {generations.map((gen) => {
            const firstOutput = gen.outputs?.[0];
            const isProcessing = gen.status === 'queued' || gen.status === 'executing';

            return (
              <div
                key={gen._id}
                onClick={() => setSelectedGen(gen)}
                className={`group relative aspect-square bg-[#111827] border rounded-xl overflow-hidden cursor-pointer transition-all shadow-sm ${
                  isProcessing
                    ? 'border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-indigo-500/50 hover:shadow-md'
                }`}
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
                ) : isProcessing ? (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-b from-indigo-950/40 to-slate-950/80">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        gen.status === 'executing'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                        {gen.status === 'executing' ? 'Đang tạo...' : 'Hàng đợi GPU'}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-indigo-300">
                          {gen.progress || 0}%
                        </span>
                        <button
                          type="button"
                          title="Hủy bỏ và xóa tác vụ này"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Bỏ tác vụ này và xóa khỏi danh sách?')) {
                              deleteMutation.mutate(gen._id);
                            }
                          }}
                          className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="my-auto text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-200 line-clamp-1">
                        {gen.currentNode ? `Node ${gen.currentNode}` : (gen.status === 'executing' ? 'Đang xử lý KSampler...' : 'Đang chờ slot GPU...')}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {gen.workflowName}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(5, gen.progress || 0)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>{gen.status === 'executing' ? 'Đang render' : 'Chờ nạp'}</span>
                        <span>{gen.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-slate-500">
                    <span className="text-slate-400 mb-1 capitalize">{gen.status}</span>
                    {gen.error && <span className="text-[10px] text-rose-400 line-clamp-2">{gen.error}</span>}
                  </div>
                )}

                {/* Completed Hover Overlay */}
                {firstOutput && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <h4 className="text-xs font-semibold text-white line-clamp-1">{gen.workflowName}</h4>
                    <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">
                      {gen.parameters?.prompt || 'No prompt recorded'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-700/60 font-mono">
                      <span>{gen.parameters?.width ? `${gen.parameters.width}x${gen.parameters.height}` : '768x768'}</span>
                      {formatDuration(gen) ? <span>⏱️ {formatDuration(gen)}</span> : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Inspector Modal with Detailed Metadata */}
      {selectedGen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* Media Preview Column */}
            <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 min-h-[350px] relative group">
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
                <div className="text-center p-6 text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Đang xử lý hoặc chưa có hình ảnh xuất</p>
                </div>
              )}

              {selectedGen.outputs?.[0] && (
                <a
                  href={selectedGen.outputs[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1.5"
                  title="Xem kích thước gốc"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Kích thước gốc</span>
                </a>
              )}
            </div>

            {/* Metadata & Actions Column */}
            <div className="w-full md:w-[440px] border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      {selectedGen.workflowName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        selectedGen.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : selectedGen.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {selectedGen.status}
                      </span>
                      {formatDuration(selectedGen) && (
                        <span className="text-[11px] text-slate-300 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                          ⏱️ {formatDuration(selectedGen)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGen(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Positive Prompt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Positive Prompt
                    </span>
                    {selectedGen.parameters?.prompt && (
                      <button
                        onClick={() => copyToClipboard(selectedGen.parameters.prompt || '', 'pos')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        {copiedField === 'pos' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Positive</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 max-h-32 overflow-y-auto leading-relaxed select-text">
                    {selectedGen.parameters?.prompt || <span className="text-slate-500 italic">Không có thông tin prompt</span>}
                  </div>
                </div>

                {/* Negative Prompt */}
                {selectedGen.parameters?.negativePrompt && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        Negative Prompt
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedGen.parameters.negativePrompt || '', 'neg')}
                        className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'neg' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Negative</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 max-h-20 overflow-y-auto leading-relaxed select-text">
                      {selectedGen.parameters.negativePrompt}
                    </div>
                  </div>
                )}

                {/* Setup Parameters Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                    Thông Số Cấu Hình (Setup Parameters)
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Độ phân giải (Resolution)</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {selectedGen.parameters?.width ? `${selectedGen.parameters.width} x ${selectedGen.parameters.height}` : '768 x 768'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Số bước (Steps)</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {selectedGen.parameters?.steps ?? 12}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">CFG Scale</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {selectedGen.parameters?.cfg ?? 1.0}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Seed</span>
                      <span className="text-slate-200 font-mono font-medium truncate block" title={String(selectedGen.parameters?.seed)}>
                        {selectedGen.parameters?.seed ?? 'Random'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 col-span-2">
                      <span className="text-slate-500 block text-[10px]">Sampler & Scheduler</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {selectedGen.parameters?.samplerName || 'euler'} / {selectedGen.parameters?.scheduler || 'simple'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 col-span-2">
                      <span className="text-slate-500 block text-[10px]">Mô hình (Model / UNET)</span>
                      <span className="text-indigo-300 font-mono text-[10px] truncate block" title={selectedGen.parameters?.model || 'qwen_image_2.1_int8_convrot.safetensors'}>
                        {selectedGen.parameters?.model || 'qwen_image_2.1_int8_convrot.safetensors'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp & File Details */}
                <div className="pt-2 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian tạo:</span>
                    <span>{new Date(selectedGen.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {selectedGen.outputs?.[0] && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tệp lưu:</span>
                      <span className="truncate max-w-[200px]" title={selectedGen.outputs[0].filename}>
                        {selectedGen.outputs[0].filename}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => rerunMutation.mutate(selectedGen._id)}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Chạy lại (Re-run)
                  </button>

                  {selectedGen.outputs?.[0] && (
                    <a
                      href={selectedGen.outputs[0].url}
                      download={selectedGen.outputs[0].filename}
                      className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải về máy
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  {comfyUiUrl && (
                    <a
                      href={comfyUiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-medium border border-emerald-800/40 flex items-center justify-center gap-1.5 transition-colors"
                      title="Mở giao diện ComfyUI trên Google Colab để kiểm tra graph và các node"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở ComfyUI Canvas
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('Xóa tác phẩm này khỏi danh sách và ổ đĩa?')) {
                        deleteMutation.mutate(selectedGen._id);
                      }
                    }}
                    className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-800 hover:border-rose-800/40"
                    title="Xóa tác phẩm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
