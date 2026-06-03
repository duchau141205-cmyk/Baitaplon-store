const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function restore() {
  await mongoose.connect('mongodb://localhost:27017/mohinh_store');
  const productSchema = new mongoose.Schema({ name: String, image: String, createdAt: Date, updatedAt: Date }, { strict: false });
  const Product = mongoose.model('Product', productSchema);

  const files = fs.readdirSync(path.join(__dirname, 'uploads'));
  const images = files.map(f => {
      let m = f.match(/image-(\d+)\./);
      return m ? { file: '/uploads/' + f, ts: parseInt(m[1]) } : null;
  }).filter(x => x);

  const products = await Product.find({});
  let matches = 0;
  
  for(let p of products) {
    let t1 = p.createdAt ? p.createdAt.getTime() : 0;
    let t2 = p.updatedAt ? p.updatedAt.getTime() : 0;
    
    let bestImg = null;
    let minDiff = Infinity;
    
    for (let img of images) {
      let diff1 = Math.abs(img.ts - t1);
      let diff2 = Math.abs(img.ts - t2);
      let diff = Math.min(diff1, diff2);
      if (diff < minDiff) {
        minDiff = diff;
        bestImg = img.file;
      }
    }
    
    if (minDiff < 10000) { // within 10 seconds
      console.log(`Match found: ${p.name.substring(0,30)}... -> ${bestImg} (diff: ${minDiff}ms)`);
      p.image = bestImg;
      await Product.updateOne({ _id: p._id }, { $set: { image: bestImg } });
      matches++;
    } else {
      console.log(`NO MATCH: ${p.name.substring(0,30)}... (closest diff: ${minDiff}ms)`);
      // Revert to empty or leave as is? The user said "đổi lại về hình ảnh cũ"
      // Wait, some products didn't have images in the old DB (empty string).
      await Product.updateOne({ _id: p._id }, { $set: { image: '' } });
    }
  }
  
  console.log(`Restored ${matches} out of ${products.length} products.`);
  process.exit(0);
}

restore().catch(console.error);
