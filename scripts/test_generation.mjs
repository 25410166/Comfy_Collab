import axios from 'axios';

(async () => {
  try {
    console.log('1. Submitting test generation...');
    const runRes = await axios.post('http://127.0.0.1:5000/api/workflows/6abb42e9581ae069b28b2b20/run', {
      prompt: 'Studio portrait of a glamorous Vietnamese female model in red evening dress, 85mm portrait, photorealistic, raw photo',
      negativePrompt: 'ugly, deformed, bad anatomy, blurry',
      steps: 8,
      width: 768,
      height: 768,
      cfg: 1.0,
      seed: 12345
    });
    console.log('Run response:', runRes.data);
    const promptId = runRes.data.promptId;
    const genId = runRes.data.generationId;

    console.log('2. Monitoring generation progress...');
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const genRes = await axios.get('http://127.0.0.1:5000/api/generations/' + genId);
      const gen = genRes.data;
      console.log(`[${(i + 1) * 3}s] Status: ${gen.status} | Progress: ${gen.progress}% | Node: ${gen.currentNode || 'Init'} | Outputs: ${gen.outputs?.length || 0}`);
      
      if (gen.status === 'completed') {
        console.log('\n🎉 GENERATION COMPLETED SUCCESSFULLY!');
        console.log('Execution Time:', (gen.executionTimeMs / 1000).toFixed(1), 's');
        console.log('Output image URL:', gen.outputs[0]?.url);

        const imgCheck = await axios.get('http://127.0.0.1:5000' + gen.outputs[0].url, { responseType: 'arraybuffer' });
        console.log('Image HTTP status:', imgCheck.status, 'Size:', imgCheck.data.length, 'bytes');
        process.exit(0);
      }
      if (gen.status === 'failed') {
        console.error('\n❌ Generation failed:', gen.error);
        process.exit(1);
      }
    }
    console.log('Test timed out after 120s.');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err.message, err.response?.data);
    process.exit(1);
  }
})();
