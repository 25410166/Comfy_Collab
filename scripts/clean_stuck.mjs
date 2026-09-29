import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    const coll = mongoose.connection.collection('generations');

    const res = await coll.deleteMany({
      status: { $in: ['queued', 'executing'] },
      $or: [
        { outputs: { $size: 0 } },
        { outputs: { $exists: false } }
      ]
    });

    console.log(`Deleted ${res.deletedCount} stuck generations.`);

    const remaining = await coll.find().toArray();
    console.log(`Total remaining generations: ${remaining.length}`);
    remaining.forEach((r) => {
      console.log(`- ID: ${r._id} | status: ${r.status} | outputs: ${r.outputs?.length || 0}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
