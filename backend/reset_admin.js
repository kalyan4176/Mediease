import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mediease';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  profileImage: String,
  phone: String,
  gender: String,
  address: String,
  otp: String,
  otpExpiry: Date,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function resetAdmin() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB...');

  const admin = await User.findOne({ email: 'admin@mediease.com' });
  if (admin) {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash('Admin@12345', salt);
    await admin.save({ validateBeforeSave: false });
    console.log('✅ Admin password reset successfully!');
    console.log('   Email:    admin@mediease.com');
    console.log('   Password: Admin@12345');
  } else {
    // Create admin if not exists
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash('Admin@12345', salt);
    await User.create({
      name: 'Mediease Administrator',
      email: 'admin@mediease.com',
      password: hashedPw,
      role: 'admin',
      phone: '18005550199',
      gender: 'other',
      isVerified: true,
    });
    console.log('✅ Admin account created!');
    console.log('   Email:    admin@mediease.com');
    console.log('   Password: Admin@12345');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

resetAdmin().catch(console.error);
