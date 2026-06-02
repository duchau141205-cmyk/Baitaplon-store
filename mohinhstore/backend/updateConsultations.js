const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mohinh_store');
const Consultation = mongoose.model('Consultation', new mongoose.Schema({ status: String, notes: String }, { strict: false }));

async function run() {
    try {
        const result = await Consultation.updateMany({}, { $set: { status: 'Resolved' } });
        console.log('Updated consultations:', result.modifiedCount);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
