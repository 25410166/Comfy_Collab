import axios from 'axios';
import { config } from '../config.js';

export interface ModelHubItem {
  id: string;
  name: string;
  source: 'civitai' | 'huggingface';
  type: string;
  baseModel?: string;
  description: string;
  author: string;
  previewImages: string[];
  tags: string[];
  downloadsCount?: number;
  rating?: number;
  files: Array<{
    id: string;
    filename: string;
    size: number;
    downloadUrl: string;
    format: string;
  }>;
}

export class ModelHubService {
  async searchCivitai(params: {
    query?: string;
    types?: string;
    limit?: number;
    page?: number;
    sort?: string;
  }): Promise<{ items: ModelHubItem[]; total: number }> {
    try {
      const url = 'https://civitai.com/api/v1/models';
      const headers: Record<string, string> = {};
      if (config.tokens.civitai) {
        headers['Authorization'] = `Bearer ${config.tokens.civitai}`;
      }

      const res = await axios.get(url, {
        params: {
          query: params.query || '',
          types: params.types || undefined,
          limit: params.limit || 20,
          page: params.page || 1,
          sort: params.sort || 'Highest Rated'
        },
        headers,
        timeout: 10000
      });

      const items: ModelHubItem[] = (res.data.items || []).map((m: any) => {
        const latestVersion = m.modelVersions?.[0];
        const files = (latestVersion?.files || []).map((f: any) => ({
          id: f.id?.toString() || f.name,
          filename: f.name,
          size: f.sizeKB ? Math.round(f.sizeKB * 1024) : 0,
          downloadUrl: f.downloadUrl,
          format: f.metadata?.format || 'safetensors'
        }));

        const previewImages = (latestVersion?.images || []).map((img: any) => img.url);

        return {
          id: m.id.toString(),
          name: m.name,
          source: 'civitai',
          type: (m.type || 'checkpoint').toLowerCase(),
          baseModel: latestVersion?.baseModel || 'Unknown',
          description: m.description ? m.description.replace(/<[^>]*>?/gm, '').slice(0, 300) : '',
          author: m.creator?.username || 'Unknown',
          previewImages,
          tags: m.tags || [],
          downloadsCount: m.stats?.downloadCount,
          rating: m.stats?.rating,
          files
        };
      });

      return { items, total: res.data.metadata?.totalItems || items.length };
    } catch (err: any) {
      console.error('[Civitai API error]:', err.message);
      return { items: [], total: 0 };
    }
  }

  async searchHuggingFace(params: {
    query?: string;
    limit?: number;
  }): Promise<{ items: ModelHubItem[]; total: number }> {
    try {
      const url = 'https://huggingface.co/api/models';
      const headers: Record<string, string> = {};
      if (config.tokens.hf) {
        headers['Authorization'] = `Bearer ${config.tokens.hf}`;
      }

      const res = await axios.get(url, {
        params: {
          search: params.query || '',
          filter: 'diffusers',
          limit: params.limit || 20,
          full: true
        },
        headers,
        timeout: 10000
      });

      const items: ModelHubItem[] = (res.data || []).map((m: any) => {
        const repoId = m.id;
        const author = repoId.includes('/') ? repoId.split('/')[0] : 'Community';
        const name = repoId.includes('/') ? repoId.split('/')[1] : repoId;

        // HuggingFace siblings/files
        const files = (m.siblings || [])
          .filter((s: any) => {
            const ext = s.rfilename.toLowerCase();
            return ext.endsWith('.safetensors') || ext.endsWith('.ckpt') || ext.endsWith('.gguf');
          })
          .map((s: any) => ({
            id: s.rfilename,
            filename: s.rfilename.split('/').pop() || s.rfilename,
            size: 0,
            downloadUrl: `https://huggingface.co/${repoId}/resolve/main/${s.rfilename}`,
            format: s.rfilename.endsWith('.safetensors') ? 'safetensors' : 'checkpoint'
          }));

        return {
          id: repoId,
          name,
          source: 'huggingface',
          type: 'checkpoint',
          baseModel: m.tags?.find((t: string) => t.includes('sd') || t.includes('flux')) || 'Diffusers',
          description: `Hugging Face repository: ${repoId}`,
          author,
          previewImages: [],
          tags: m.tags?.slice(0, 5) || [],
          downloadsCount: m.downloads,
          rating: m.likes,
          files
        };
      });

      return { items, total: items.length };
    } catch (err: any) {
      console.error('[HuggingFace API error]:', err.message);
      return { items: [], total: 0 };
    }
  }
}

export const modelHubService = new ModelHubService();
