import axios from 'axios';
import { config } from '../../config.js';

export interface OptimizeRequest {
  prompt: string;
  style?: 'photography' | 'fashion' | 'face' | 'asian_qwen' | 'creative';
  negativePrompt?: string;
  targetModel?: string; // 'qwen' | 'sdxl' | 'flux'
}

export interface OptimizeResult {
  originalPrompt: string;
  optimizedPrompt: string;
  negativePrompt: string;
  style: string;
  recommendedSettings: {
    width: number;
    height: number;
    steps: number;
    cfg: number;
    sampler: string;
    scheduler: string;
  };
  explanation?: string;
}

// Built-in dictionary for translating & enriching Vietnamese concepts to cinematic photography vocabulary
const VI_TRANSLATIONS: Record<string, string> = {
  'cô gái': 'beautiful young Vietnamese woman',
  'thác nước': 'cascading mountain waterfall',
  'thiếu nữ': 'graceful young Asian woman',
  'người mẫu': 'high-fashion professional model',
  'nam': 'handsome charismatic Asian man',
  'nữ': 'elegant Asian woman',
  'áo dài': 'traditional Vietnamese silk Ao Dai with delicate embroidery and flowing silk trousers',
  'áo vest': 'tailored slim-fit Italian charcoal wool suit with crisp white collar shirt',
  'váy': 'flowing elegant designer evening gown',
  'đầm dạ hội': 'luxurious haute-couture evening dress',
  'mùa thu': 'golden autumn atmosphere, falling maple leaves, soft crisp breeze',
  'mùa xuân': 'blooming spring scenery, soft peach blossoms, morning dew',
  'hà nội': 'historic Hanoi Old Quarter street, French colonial architecture, warm lanterns',
  'hồ gươm': 'Hoan Kiem Lake, ancient turtle tower, weeping willow branches reflecting in emerald water',
  'mưa': 'gentle misty rain, glistening wet pavement reflections, soft droplets',
  'nắng': 'warm golden hour sunbeams, soft lens flare, sun-drenched atmosphere',
  'hoàng hôn': 'breathtaking dramatic sunset sky, amber and violet twilight glow',
  'chân dung': 'intimate close-up portrait, expressive eyes, natural micro-skin texture',
  'studio': 'professional high-end studio lighting setup, softbox key light, subtle rim light',
  'đường phố': 'vibrant urban city street backdrop, dynamic depth of field, street photography',
  'quán cà phê': 'aesthetic vintage Parisian coffee shop, warm ambient light, wooden interior',
  'biển': 'tranquil tropical beach, gentle turquoise ocean waves, soft white sand'
};

export class OptimizerService {
  /**
   * Main optimize method: tries LLM if API key exists, otherwise uses built-in smart expander engine
   */
  async optimize(req: OptimizeRequest): Promise<OptimizeResult> {
    const rawPrompt = (req.prompt || '').trim();
    const style = req.style || 'photography';
    const targetModel = req.targetModel || 'qwen';

    if (!rawPrompt) {
      throw new Error('Prompt cannot be empty');
    }

    // 1. Try LLM optimization if Gemini / OpenAI API key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const llmResult = await this.optimizeWithGemini(rawPrompt, style, geminiKey);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('[Optimizer] Gemini API fallback to local engine:', (err as any).message);
      }
    } else if (openaiKey) {
      try {
        const llmResult = await this.optimizeWithOpenAI(rawPrompt, style, openaiKey);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('[Optimizer] OpenAI API fallback to local engine:', (err as any).message);
      }
    }

    // 2. Built-in Smart Expander Engine (inspired by linshenkx/prompt-optimizer text2image rules)
    return this.optimizeWithBuiltInEngine(rawPrompt, style, targetModel);
  }

  /**
   * Built-in rule & knowledge-based prompt optimizer
   */
  private optimizeWithBuiltInEngine(rawPrompt: string, style: string, targetModel: string): OptimizeResult {
    let subject = rawPrompt;

    // Detect and translate Vietnamese tokens if present
    let lower = rawPrompt.toLowerCase();
    let detectedAddons: string[] = [];

    for (const [vi, en] of Object.entries(VI_TRANSLATIONS)) {
      if (lower.includes(vi)) {
        detectedAddons.push(en);
      }
    }

    // Build optimized components according to photography-optimize specifications:
    // 1. Core Subject & Action
    // 2. Wardrobe & Material Textures
    // 3. Lighting & Time of Day
    // 4. Composition, Angle & Depth of Field
    // 5. Camera Optics & Realism Render Engine Tags

    let optimizedPrompt = '';
    let negativePrompt = '';
    let settings = {
      width: 768,
      height: 768,
      steps: 14,
      cfg: 1.0,
      sampler: 'euler',
      scheduler: 'simple'
    };

    switch (style) {
      case 'fashion':
        settings.width = 832;
        settings.height = 1216;
        settings.steps = 15;
        settings.cfg = 1.0;

        optimizedPrompt = [
          `Haute-couture fashion editorial: ${detectedAddons.length > 0 ? detectedAddons.join(', ') : rawPrompt}`,
          'intricate fabric weave, flowing material textures, impeccable sartorial tailoring and stitching details',
          'dramatic magazine cover lighting, high-contrast studio softbox, subtle backlight accentuating fabric silhouette',
          'elegant high-fashion pose, sophisticated expression, clean minimalist studio background with soft gradient shadow',
          'shot on Hasselblad H6D-100c, 100mm f/2.2 portrait lens, shallow depth of field, photorealistic 8k, ultra-sharp raw details'
        ].join(', ');

        negativePrompt = 'wrinkled messy clothing, distorted seams, bad anatomy, deformed body proportions, plastic texture, flat lighting, blurry fabric, lowres, oversaturated, amateur photography';
        break;

      case 'face':
        settings.width = 768;
        settings.height = 768;
        settings.steps = 14;
        settings.cfg = 1.0;

        optimizedPrompt = [
          `Consistent character face portrait: ${detectedAddons.length > 0 ? detectedAddons.join(', ') : rawPrompt}`,
          'natural facial micro-textures, authentic visible skin pores, fine peach fuzz, delicate subsurface scattering',
          'razor-sharp focus on iris details with natural catchlight reflections, individually delineated eyelashes, natural eyebrows',
          'subtle Rembrandt chiaroscuro lighting, warm key light, soft wrap-around fill light, gentle rim light on hair strands',
          'shot on Sony A7R V with Sony FE 85mm f/1.4 GM lens, f/1.8 aperture, smooth creamy bokeh background, 8k UHD raw photograph, masterwork'
        ].join(', ');

        negativePrompt = 'blurry face, airbrushed plastic skin, doll skin, asymmetrical eyes, weird teeth, unnatural skin texture, distorted jawline, cartoon, 3d render, illustration, bad anatomy, low quality';
        break;

      case 'asian_qwen':
        settings.width = 832;
        settings.height = 1216;
        settings.steps = 14;
        settings.cfg = 1.0;

        optimizedPrompt = [
          `Cinematic East Asian aesthetic: ${detectedAddons.length > 0 ? detectedAddons.join(', ') : rawPrompt}`,
          'delicate Asian facial features, luminous porcelain skin tone, graceful poise, flowing silk garments with traditional cultural motifs',
          'dreamy atmospheric lighting, soft golden lantern glow, misty morning haze, harmonious color palette inspired by East Asian fine art',
          'masterful composition with thoughtful negative space, poetic mood, cinematic wide-aperture depth of field',
          'photorealistic 8k resolution, highly detailed, film grain texture, Leica SL2, 50mm f/1.2 Summilux lens, natural colors'
        ].join(', ');

        negativePrompt = 'ugly, deformed, Westernized facial features, harsh lighting, plastic skin, distorted anatomy, blurry, cartoonish, oversaturated, artifacts';
        break;

      case 'creative':
        settings.width = 1024;
        settings.height = 1024;
        settings.steps = 16;
        settings.cfg = 1.5;

        optimizedPrompt = [
          `Imaginative visual concept: ${detectedAddons.length > 0 ? detectedAddons.join(', ') : rawPrompt}`,
          'ethereal atmospheric depth, magical volumetric light beams, floating dust particles catching illumination',
          'rich dynamic color grading, harmonious complementary palette, surreal yet grounded hyper-detailed textures',
          'epic cinematic composition, rule of thirds, dramatic foreground framing, expansive sense of wonder and scale',
          '8k masterwork, award-winning cinematography, trending on ArtStation, photorealistic rendering'
        ].join(', ');

        negativePrompt = 'muddy colors, blurry, flat lighting, amateurish, distorted proportions, low quality, artifacts, watermark, signature';
        break;

      case 'photography':
      default:
        settings.width = 832;
        settings.height = 1216;
        settings.steps = 14;
        settings.cfg = 1.0;

        optimizedPrompt = [
          `Photorealistic portrait: ${detectedAddons.length > 0 ? detectedAddons.join(', ') : rawPrompt}`,
          'authentic human expression, detailed facial anatomy, natural skin tones with genuine micro-texture and subtle pores',
          'cinematic natural lighting, soft golden hour sunlight filtering through background, gentle rim light defining silhouettes',
          'medium close-up framing, eye-level angle, beautifully balanced environmental composition',
          'captured on Canon EOS R5 with RF 85mm f/1.2L USM, shallow depth of field, creamy background blur, 8k resolution, uncompressed RAW photograph'
        ].join(', ');

        negativePrompt = 'ugly, deformed, disfigured, lowres, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, floating limbs, blurred, watermark, signature, oversaturated, plastic skin, doll-like, bad eyes, crossed eyes, distorted facial features';
        break;
    }

    return {
      originalPrompt: rawPrompt,
      optimizedPrompt,
      negativePrompt,
      style,
      recommendedSettings: settings,
      explanation: `Tối ưu hóa theo phong cách "${style}" với 5 lớp cấu trúc (Chủ thể, Bối cảnh & Ánh sáng, Trang phục & Chất liệu, Góc máy & Tiêu cự, Chuẩn màu sắc 8k RAW).`
    };
  }

  /**
   * Optimize using Gemini API with prompt-optimizer system prompts
   */
  private async optimizeWithGemini(rawPrompt: string, style: string, apiKey: string): Promise<OptimizeResult | null> {
    const systemInstruction = `# Role: Photography & Image Prompt Optimization Expert (prompt-optimizer)
Transform user descriptions into 3-5 structured, natural language photography sentences.
Focus on:
1. Subject & Action with 2-3 precise modifiers
2. Lighting & Atmosphere (time of day, light quality, mood)
3. Composition & Camera optics (focal length, depth of field, lens)
4. Material & Skin Micro-texture (photorealistic 8k, raw texture)
Do not use parameters, weights (--ar, ::) or negative lists in the positive prompt.
Return strict JSON:
{
  "optimizedPrompt": "...",
  "negativePrompt": "...",
  "recommendedSettings": { "width": 832, "height": 1216, "steps": 14, "cfg": 1.0 }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser input to optimize (Style: ${style}): "${rawPrompt}"` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      },
      { timeout: 12000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      originalPrompt: rawPrompt,
      optimizedPrompt: parsed.optimizedPrompt,
      negativePrompt: parsed.negativePrompt || 'ugly, deformed, blurry, bad anatomy, low quality',
      style,
      recommendedSettings: parsed.recommendedSettings || { width: 832, height: 1216, steps: 14, cfg: 1.0 },
      explanation: 'Tối ưu hóa bằng AI LLM Engine (Gemini Pro / Flash).'
    };
  }

  /**
   * Optimize using OpenAI API
   */
  private async optimizeWithOpenAI(rawPrompt: string, style: string, apiKey: string): Promise<OptimizeResult | null> {
    const systemInstruction = `You are an expert AI Image Prompt Optimizer (from prompt-optimizer).
Transform the user prompt into a high-end photorealistic photography prompt with subject, lighting, composition, camera lens, and 8k raw texture.
Return strict JSON format:
{
  "optimizedPrompt": "...",
  "negativePrompt": "...",
  "recommendedSettings": { "width": 832, "height": 1216, "steps": 14, "cfg": 1.0 }
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Optimize this prompt for style '${style}': ${rawPrompt}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 12000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      originalPrompt: rawPrompt,
      optimizedPrompt: parsed.optimizedPrompt,
      negativePrompt: parsed.negativePrompt || 'ugly, deformed, blurry, bad anatomy, low quality',
      style,
      recommendedSettings: parsed.recommendedSettings || { width: 832, height: 1216, steps: 14, cfg: 1.0 },
      explanation: 'Tối ưu hóa bằng AI LLM Engine (OpenAI).'
    };
  }
}

export const optimizerService = new OptimizerService();
