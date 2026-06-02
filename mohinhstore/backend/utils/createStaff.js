const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const email = 'nhanvien@gmail.com';
        const exist = await User.findOne({ email });
        if (exist) {
            console.log('Staff user already exists!');
            exist.role = 'staff';
            exist.password = '123456';
            await exist.save();
            console.log('Existing user updated to staff with password: 123456');
        } else {
            await User.create({
                name: 'Nhân viên Tư vấn',
                email,
                password: '123456',
                role: 'staff'
            });
            console.log('Staff user created successfully!');
            console.log('Email: nhanvien@gmail.com');
            console.log('Password: 123456');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createStaff();
