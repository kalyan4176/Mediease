import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String, // e.g., 'Monday', 'Tuesday'
    required: true,
  },
  slots: [
    {
      type: String, // e.g., '09:00 AM', '10:00 AM', '02:00 PM'
      required: true,
    }
  ]
}, { _id: false });

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    qualification: [
      {
        type: String,
        required: true,
      }
    ],
    consultationFee: {
      type: Number,
      required: true,
      default: 500,
    },
    hospitalDepartment: {
      type: String,
      required: true,
    },
    availability: [availabilitySchema],
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      }
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    documents: [
      {
        type: String, // links to certificate uploads or verification documents
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
