import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mediease';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    const adminEmail = 'admin@mediease.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account with email "${adminEmail}" already exists.`);
    } else {
      await User.create({
        name: 'Mediease Administrator',
        email: adminEmail,
        password: 'Admin@12345', // Will be hashed automatically by User model pre-save hook
        role: 'admin',
        phone: '18005550199',
        gender: 'other',
        isVerified: true,
      });
      console.log('--------------------------------------------------');
      console.log('🎉 Default Administrator Seeded Successfully!');
      console.log(`Email:    ${adminEmail}`);
      console.log('Password: Admin@12345');
      console.log('--------------------------------------------------');
    }
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedAdmin();
