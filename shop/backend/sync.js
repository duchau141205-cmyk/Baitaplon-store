const mongoose = require('mongoose');

async function sync() {
  await mongoose.connect('mongodb://localhost:27017/mohinh_store');
  const productSchema = new mongoose.Schema({ name: String, image: String }, { strict: false });
  const Product = mongoose.model('Product', productSchema);

  const products = await Product.find({});
  for(let p of products) {
    let name = p.name.toLowerCase();
    let image = 'assets/images/ai_car.png'; // default
    if (name.includes('gundam') || name.includes('astray') || name.includes('rồng')) {
      image = 'assets/images/ai_gundam.png';
    } else if (name.includes('xe') || name.includes('lamborghini') || name.includes('bugatti') || name.includes('porsche')) {
      image = 'assets/images/ai_car.png';
    } else if (name.includes('máy bay') || name.includes('plane') || name.includes('a-10') || name.includes('f-35') || name.includes('mig-29') || name.includes('an-225') || name.includes('sentry') || name.includes('apache')) {
      image = 'assets/images/ai_plane.png';
    } else if (name.includes('siêu anh hùng') || name.includes('marvel') || name.includes('hulk') || name.includes('loki') || name.includes('thor') || name.includes('iron man') || name.includes('captain') || name.includes('black panther')) {
      image = 'assets/images/ai_superhero.png';
    } else if (name.includes('tank') || name.includes('humvee') || name.includes('battleship') || name.includes('missouri')) {
      image = 'assets/images/ai_car.png'; 
    }
    
    await Product.updateOne({ _id: p._id }, { $set: { image: image } });
  }
  console.log('Updated', products.length, 'products.');
  process.exit(0);
}

sync().catch(console.error);
