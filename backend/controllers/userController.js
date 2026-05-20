import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

// @desc    Get Current User Profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profileData = { ...user.toObject() };

    // Fetch role-specific details
    if (user.role === 'patient') {
      const patientDetails = await Patient.findOne({ userId: user._id });
      profileData.patientDetails = patientDetails || {};
    } else if (user.role === 'doctor') {
      const doctorDetails = await Doctor.findOne({ userId: user._id });
      profileData.doctorDetails = doctorDetails || {};
    }

    res.status(200).json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Current User Profile
// @route   PUT /api/users/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, gender, address, profileImage, ...extraDetails } = req.body;

    // Update core User details
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.gender = gender || user.gender;
    user.address = address || user.address;
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }
    
    await user.save();

    // Update role-specific extension tables
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        patient.bloodGroup = extraDetails.bloodGroup || patient.bloodGroup;
        patient.allergies = extraDetails.allergies !== undefined ? extraDetails.allergies : patient.allergies;
        patient.medicalHistory = extraDetails.medicalHistory || patient.medicalHistory;
        
        if (extraDetails.emergencyContact) {
          patient.emergencyContact = {
            name: extraDetails.emergencyContact.name || patient.emergencyContact.name,
            relation: extraDetails.emergencyContact.relation || patient.emergencyContact.relation,
            phone: extraDetails.emergencyContact.phone || patient.emergencyContact.phone,
          };
        }
        await patient.save();
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) {
        doctor.specialization = extraDetails.specialization || doctor.specialization;
        doctor.consultationFee = extraDetails.consultationFee !== undefined ? Number(extraDetails.consultationFee) : doctor.consultationFee;
        doctor.hospitalDepartment = extraDetails.hospitalDepartment || doctor.hospitalDepartment;
        doctor.experience = extraDetails.experience !== undefined ? Number(extraDetails.experience) : doctor.experience;
        
        if (extraDetails.qualification) {
          doctor.qualification = Array.isArray(extraDetails.qualification) ? extraDetails.qualification : [extraDetails.qualification];
        }
        if (extraDetails.availability) {
          doctor.availability = extraDetails.availability;
        }
        await doctor.save();
      }
    }

    // Return full updated profile
    const updatedUser = await User.findById(user._id).select('-password');
    let profileData = { ...updatedUser.toObject() };
    if (updatedUser.role === 'patient') {
      profileData.patientDetails = await Patient.findOne({ userId: updatedUser._id }) || {};
    } else if (updatedUser.role === 'doctor') {
      profileData.doctorDetails = await Doctor.findOne({ userId: updatedUser._id }) || {};
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: profileData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Account
// @route   DELETE /api/users/delete-account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete child profiles
    if (req.user.role === 'patient') {
      await Patient.findOneAndDelete({ userId });
    } else if (req.user.role === 'doctor') {
      await Doctor.findOneAndDelete({ userId });
    }

    // Delete core user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account successfully removed from Mediease.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
