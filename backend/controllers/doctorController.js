import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

// @desc    Get All Approved Doctors (with optional filters)
// @route   GET /api/doctors
// @access  Public
export const getDoctors = async (req, res) => {
  try {
    const { specialization, hospitalDepartment, search, experience, minFee, maxFee, rating } = req.query;

    let query = { approvalStatus: 'approved' };

    // Apply specialization filter
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Apply department filter
    if (hospitalDepartment) {
      query.hospitalDepartment = { $regex: hospitalDepartment, $options: 'i' };
    }

    // Filter by experience
    if (experience) {
      query.experience = { $gte: Number(experience) };
    }

    // Filter by fee range
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }

    // Filter by ratings
    if (rating) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    // Find doctors matching clinical criteria
    let doctors = await Doctor.find(query).populate('userId', 'name email profileImage phone gender address');

    // If text search is specified, filter by doctor name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter((doc) => doc.userId && searchRegex.test(doc.userId.name));
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Doctor Details
// @route   GET /api/doctors/:id
// @access  Public
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      'userId',
      'name email profileImage phone gender address'
    );

    if (!doctor) {
      // Fallback: search by userId
      const doctorByUser = await Doctor.findOne({ userId: req.params.id }).populate(
        'userId',
        'name email profileImage phone gender address'
      );
      if (!doctorByUser) {
        return res.status(404).json({ success: false, message: 'Doctor details not found' });
      }
      return res.status(200).json({ success: true, doctor: doctorByUser });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject Doctor Profile (Admin Only)
// @route   PUT /api/doctors/approve/:id
// @access  Private (Admin Only)
export const approveDoctor = async (req, res) => {
  try {
    const { status } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor details not found' });
    }

    doctor.approvalStatus = status;
    await doctor.save();

    // Mark corresponding User verified if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(doctor.userId, { isVerified: true });
    }

    res.status(200).json({
      success: true,
      message: `Doctor status successfully marked as ${status}`,
      doctor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Pending Approval Doctors (Admin Only)
// @route   GET /api/doctors/admin/pending
// @access  Private (Admin Only)
export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ approvalStatus: 'pending' }).populate(
      'userId',
      'name email profileImage phone gender address'
    );

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Doctor Availability
// @route   POST /api/doctors/availability
// @access  Private (Doctor Only)
export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    doctor.availability = availability;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availability: doctor.availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

