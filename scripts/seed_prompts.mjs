import mongoose from 'mongoose';

const subjects = [
  { name: 'Vietnamese female model', tone: 'fair radiant skin, soft dark brown almond eyes, glossy lips', style: 'elegant graceful poise' },
  { name: 'East Asian fashion muse', tone: 'porcelain skin, high cheekbones, sleek dark hair', style: 'haute couture high-fashion attitude' },
  { name: 'Scandinavian blonde beauty', tone: 'light golden skin, piercing ice blue eyes, faint natural freckles', style: 'effortless Scandinavian minimalism' },
  { name: 'Latina supermodel', tone: 'warm sun-kissed olive complexion, expressive hazel eyes, wavy brunette hair', style: 'radiant confident allure' },
  { name: 'Afro-diaspora editorial model', tone: 'rich deep mahogany skin with velvet glow, sculpted facial features, buzzcut crown', style: 'statuesque powerful presence' },
  { name: 'Mediterranean gentleman', tone: 'chiseled jawline, neat trimmed stubble beard, intense dark eyes', style: 'classic Italian sprezzatura' },
  { name: 'Korean male K-pop style icon', tone: 'dewy flawless complexion, sharp jawline, textured curtain hair', style: 'modern trendsetter charisma' },
  { name: 'Tokyo streetstyle model', tone: 'smooth natural skin, dyed platinum highlights, sharp winged gaze', style: 'edgy cyberpunk urban attitude' },
  { name: 'French Parisian muse', tone: 'natural matte skin, subtle tousled bob haircut, intelligent relaxed gaze', style: 'chic timeless Parisian je ne sais quoi' },
  { name: 'Middle Eastern beauty', tone: 'golden honey undertones, captivating deep kohl-lined almond eyes, long thick dark waves', style: 'regal magnetic presence' }
];

const modelOutfits = [
  'wearing tailored white oversized blazer with minimal silk camisole',
  'draped in luxury emerald green velvet slip dress',
  'in structured monochrome trench coat with belted waist',
  'wearing distressed vintage denim jacket over ribbed cotton crop top',
  'in fluid champagne satin blouse with pleated high-waisted palazzo trousers',
  'wearing sculptural architectural corset top with wide-leg tailoring',
  'draped in bohemian hand-embroidered floral linen sundress',
  'in midnight blue cashmere turtleneck sweater',
  'wearing futuristic matte black leather biker jacket with silver hardware',
  'in minimalist ribbed athletic knit bodysuit'
];

const swapOutfits = [
  { outfit: 'traditional Vietnamese silk Ao Dai with intricate lotus embroidery and flowing organza pants', category: 'outfit_swap', tag: 'Traditional / Ao Dai' },
  { outfit: 'dramatic scarlet red couture ballgown with tiered tulle skirt and plunging sweetheart neckline', category: 'outfit_swap', tag: 'Haute Couture / Ballgown' },
  { outfit: 'bespoke British double-breasted charcoal wool tuxedo with silk lapels and bowtie', category: 'outfit_swap', tag: 'Gentleman / Formal Suit' },
  { outfit: 'authentic Kyoto silk Kimono with gold-leaf crane patterns and wide brocade obi sash', category: 'outfit_swap', tag: 'Traditional / Kimono' },
  { outfit: 'futuristic waterproof tactical techwear jacket with multi-straps, harness, and modular utility pockets', category: 'outfit_swap', tag: 'Cyberpunk / Techwear' },
  { outfit: 'designer metallic cut-out swimsuit paired with sheer linen resort cover-up', category: 'outfit_swap', tag: 'Resort / Swimwear' },
  { outfit: 'vintage 90s oversized bomber jacket, raw denim baggy jeans, and retro skate sneakers', category: 'outfit_swap', tag: 'Streetwear / 90s Vintage' },
  { outfit: 'intricate medieval warrior leather armor with engraved bronze shoulder pauldrons and linen tunic', category: 'outfit_swap', tag: 'Fantasy / Warrior Armor' },
  { outfit: 'handcrafted mermaid bridal gown with French chantilly lace and delicate cathedral train', category: 'outfit_swap', tag: 'Bridal / Wedding Gown' },
  { outfit: 'gothic Victorian black lace corseted dress with puffed velvet sleeves and dark choker', category: 'outfit_swap', tag: 'Gothic / Victorian' },
  { outfit: 'modern neon-accented cyberpunk streetwear hoodie with holographic cargo joggers', category: 'outfit_swap', tag: 'Sci-Fi / Streetwear' },
  { outfit: 'pastel silk Hanbok with embroidered jeogori jacket and billowing high-waisted chima skirt', category: 'outfit_swap', tag: 'Traditional / Hanbok' },
  { outfit: 'luxury ribbed cashmere lounge set with matching floor-length duster cardigan', category: 'outfit_swap', tag: 'Loungewear / Luxury' },
  { outfit: 'urban motorcycle leather racing suit with bold sponsor stripes and matte finish', category: 'outfit_swap', tag: 'Biker / Racing' },
  { outfit: 'glamour 1920s flapper dress adorned with glittering champagne glass beads and tassel fringe', category: 'outfit_swap', tag: 'Vintage / 1920s Glam' }
];

const faceAngles = [
  { angle: 'close-up front portrait, intense direct gaze into camera lens, bilateral symmetry', tag: 'Front Close-Up' },
  { angle: 'dramatic three-quarter profile angle, chin slightly raised, confident piercing look', tag: '3/4 Profile' },
  { angle: 'sharp side-profile silhouette, crisp jawline definition, soft ambient backlight', tag: 'Side Profile' },
  { angle: 'low-angle heroic portrait perspective looking upward, authoritative cinematic framing', tag: 'Low Angle' },
  { angle: 'extreme macro facial close-up, focusing on iris details, individual eyelashes, and skin pores', tag: 'Macro Focus' },
  { angle: 'candid laughing mid-smile expression, soft authentic eye wrinkles, natural dynamic vitality', tag: 'Candid Smile' },
  { angle: 'moody over-the-shoulder glance, turning towards camera with mysterious expression', tag: 'Over-The-Shoulder' },
  { angle: 'serene contemplative expression with relaxed soft mouth, downcast lashes, gentle introspective mood', tag: 'Contemplative' }
];

const lightings = [
  'golden hour sunset rim lighting, warm halo glow, soft volumetric sun rays',
  'high-contrast studio Chiaroscuro Rembrandt lighting, deep velvety shadows, sculpted cheekbones',
  'diffused overcast softbox light, clean shadowless illumination, true skin tone rendition',
  'cinematic neon cyberpunk illumination, teal and magenta duel light reflections on glossy skin',
  'vintage 35mm film Kodak Portra 400 aesthetic, gentle grain, nostalgic organic color palette',
  'natural window light cascading across face, organic lace shadow patterns, cozy atmospheric feel',
  'dramatic moody rain-drenched lighting, glistening raindrops on skin and hair, high reflective highlights',
  'high-fashion editorial strobe flash lighting, sharp crisp micro-contrast, vibrant pop colors'
];

const environments = [
  'in luxury modern minimalist architectural penthouse with panoramic floor-to-ceiling glass windows',
  'on cobblestone alleyway in rainy European city at dusk, blurry warm cafe bokeh in background',
  'in sun-drenched Mediterranean villa courtyard with terracotta tiles and blooming bougainvillea',
  'inside contemporary art gallery with clean white walls and concrete polished floors',
  'in lush misty bamboo forest with morning fog filtering through leaves',
  'on rooftop terrace overlooking vibrant Tokyo neon skyline at twilight',
  'in vintage mid-century library with dark mahogany shelves and warm amber desk lamps',
  'against seamless neutral warm taupe studio cyclorama backdrop'
];

const cameraSettings = [
  'Hasselblad H6D-100c, 85mm f/1.4 lens, shallow depth of field, 8k UHD, raw photo, masterclass photography, lifelike skin texture with visible micro pores, photorealistic',
  'Sony A7R V, 50mm f/1.2 GM lens, razor sharp focus, cinematic color grading, 8k resolution, photorealistic, intricate fabric weave and skin subsurface scattering',
  'Canon EOS R5, 105mm f/1.4 lens, creamy bokeh, ultra-detailed skin rendition, ray-traced reflections in eyes, hyperrealistic magazine cover quality',
  'Leica M11, Noctilux 50mm f/0.95 lens, authentic analog depth, organic micro-contrast, photorealistic studio lighting'
];

const standardNegative = 'ugly, deformed, noisy, blurry, distorted, low quality, bad anatomy, bad hands, missing fingers, extra limbs, plastic skin, doll-like, artificial, oversaturated, watermark, signature, cartoon, 3d render, illustration, bad teeth, bad eyes';

function generate1000Prompts() {
  const prompts = [];
  let idCount = 1;

  // 1. Category: model (~350 prompts)
  for (let i = 0; i < 350; i++) {
    const subj = subjects[i % subjects.length];
    const outfit = modelOutfits[i % modelOutfits.length];
    const angle = faceAngles[i % faceAngles.length];
    const light = lightings[i % lightings.length];
    const env = environments[i % environments.length];
    const cam = cameraSettings[i % cameraSettings.length];

    const title = `${subj.name} - ${angle.tag} (${light.split(',')[0].trim()})`;
    const positive = `Award-winning realistic portrait of a stunning ${subj.name}, ${subj.tone}, ${subj.style}, ${outfit}, ${angle.angle}, ${env}, ${light}, ${cam}`;

    prompts.push({
      title: `[Model #${idCount}] ${title}`,
      category: 'model',
      positive,
      negative: standardNegative,
      tags: ['Realistic Model', 'Fashion Editorial', subj.name.split(' ')[0], angle.tag],
      width: 768,
      height: 768,
      steps: 14,
      cfg: 1.0,
      samplerName: 'euler'
    });
    idCount++;
  }

  // 2. Category: outfit_swap (~350 prompts)
  for (let i = 0; i < 350; i++) {
    const subj = subjects[i % subjects.length];
    const swap = swapOutfits[i % swapOutfits.length];
    const angle = faceAngles[(i + 2) % faceAngles.length];
    const light = lightings[(i + 3) % lightings.length];
    const env = environments[(i + 1) % environments.length];
    const cam = cameraSettings[(i + 2) % cameraSettings.length];

    const title = `${swap.tag} Swap - ${subj.name}`;
    const positive = `High-fashion clothing swap transformation, featuring a photorealistic ${subj.name}, ${subj.tone}, flawlessly ${swap.outfit}, styled with exquisite tailoring and luxury fabric texture, ${angle.angle}, ${env}, ${light}, ${cam}`;

    prompts.push({
      title: `[Outfit #${idCount}] ${title}`,
      category: 'outfit_swap',
      positive,
      negative: standardNegative,
      tags: ['Outfit Swap', 'Fashion Dressing', swap.tag, subj.name.split(' ')[0]],
      width: 768,
      height: 768,
      steps: 14,
      cfg: 1.0,
      samplerName: 'euler'
    });
    idCount++;
  }

  // 3. Category: face_swap (~300 prompts)
  for (let i = 0; i < 300; i++) {
    const subj = subjects[i % subjects.length];
    const angle = faceAngles[i % faceAngles.length];
    const light = lightings[(i + 4) % lightings.length];
    const env = environments[(i + 3) % environments.length];
    const cam = cameraSettings[(i + 1) % cameraSettings.length];

    const title = `Consistent Face & Identity - ${angle.tag} (${subj.name.split(' ')[0]})`;
    const positive = `Consistent character face identity benchmark, featuring identical facial bone structure of a ${subj.name}, ${subj.tone}, ${angle.angle}, natural genuine facial expression, perfect eye contact, razor-sharp focus on iris details and individual lashes, natural pore-level skin texture, ${env}, ${light}, ${cam}`;

    prompts.push({
      title: `[FaceSwap #${idCount}] ${title}`,
      category: 'face_swap',
      positive,
      negative: standardNegative,
      tags: ['Face Swap', 'Identity Consistency', angle.tag, 'Realistic Portrait'],
      width: 768,
      height: 768,
      steps: 14,
      cfg: 1.0,
      samplerName: 'euler'
    });
    idCount++;
  }

  return prompts;
}

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    console.log('Connected! Generating 1000 prompt presets...');

    const promptPresets = generate1000Prompts();
    console.log(`Generated ${promptPresets.length} prompt presets.`);

    const collection = mongoose.connection.collection('promptpresets');
    await collection.deleteMany({});
    console.log('Cleared old promptpresets collection.');

    // Insert in batches of 200
    for (let i = 0; i < promptPresets.length; i += 200) {
      const batch = promptPresets.slice(i, i + 200);
      await collection.insertMany(batch);
      console.log(`Inserted batch ${i + 1} to ${Math.min(i + 200, promptPresets.length)}`);
    }

    const totalCount = await collection.countDocuments();
    const modelCount = await collection.countDocuments({ category: 'model' });
    const outfitCount = await collection.countDocuments({ category: 'outfit_swap' });
    const faceCount = await collection.countDocuments({ category: 'face_swap' });

    console.log('\n=== SEED COMPLETED SUCCESSFULLY ===');
    console.log(`Total Prompts in DB: ${totalCount}`);
    console.log(`- Model & Realistic Portrait: ${modelCount}`);
    console.log(`- Swap Trang Phục (Outfits): ${outfitCount}`);
    console.log(`- Swap Face & Identity: ${faceCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
})();
