const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn("Không thể đổi DNS Server:", e.message);
}

const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://duchau141205_db_user:141205ldh@cluster0.kucm8k1.mongodb.net/mohinh_store?appName=Cluster0';

async function run() {
  await mongoose.connect(mongoURI);
  console.log("Connected to MongoDB.");

  const productSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.model('Product', productSchema);

  const products = await Product.find({}).limit(5);
  console.log("Sample products:");
  products.forEach(p => {
    console.log(`- Name: ${p.get('name')}`);
    console.log(`  Image Path: ${p.get('image')}`);
  });

  process.exit(0);
}

run().catch(console.error);
