const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/mohinh_store');
    console.log('Connected to DB');

    const users = await User.find({}, { name: 1, email: 1, isAdmin: 1, role: 1 });
    console.log('--- USERS ---');
    console.log(users);

    await mongoose.disconnect();
}

check().catch(console.error);
