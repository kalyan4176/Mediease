import mongoose from 'mongoose';
import Department from '../models/Department.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mediease');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default departments if empty
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const defaultDepts = [
        { name: 'General Medicine', description: 'Primary healthcare and general medical conditions.' },
        { name: 'Cardiology', description: 'Heart and cardiovascular system care.' },
        { name: 'Dermatology', description: 'Skin, hair, and nail treatments.' },
        { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents.' },
        { name: 'Neurology', description: 'Brain, spinal cord, and nervous system disorders.' },
        { name: 'Orthopedics', description: 'Musculoskeletal system care, bones, and joints.' }
      ];
      await Department.insertMany(defaultDepts);
      console.log('🎉 Default Departments Seeded successfully!');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
