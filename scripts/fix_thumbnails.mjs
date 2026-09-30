import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    const c = mongoose.connection.collection('workflows');
    
    await c.updateOne(
      { name: 'Standard SD1.5 Text2Image' }, 
      { $set: { thumbnailUrl: '/static/outputs/sd15_realistic_vision.png' } }
    );
    
    await c.updateOne(
      { name: 'Qwen 2.1 Text to Image (INT8)' }, 
      { $set: { thumbnailUrl: '/static/outputs/Qwen2.1_00002_.png' } }
    );

    console.log('Updated');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
