import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { sendEmail } from '../services/emailService.js';

// JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mediease_super_secure_jwt_secret_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register Patient
// @route   POST /api/auth/register
// @access  Public
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, gender, address } = req.body;

    // Strict email format validation
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Strong password validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&_-#).',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create User — immediately verified, no OTP required
    const user = await User.create({
      name,
      email,
      password,
      role: 'patient',
      phone,
      gender,
      address,
      isVerified: true,
    });

    // Create Patient Profile extension
    await Patient.create({
      userId: user._id,
      bloodGroup: '',
      allergies: [],
      medicalHistory: '',
    });

    // Generate auth token so they can log in immediately
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register Doctor
// @route   POST /api/auth/register-doctor
// @access  Public
export const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      address,
      specialization,
      experience,
      qualification,
      consultationFee,
      hospitalDepartment,
    } = req.body;

    // Strict email format validation
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&_-#).',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create User (starting as unverified and role 'doctor')
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phone,
      gender,
      address,
      isVerified: false,
    });

    // Create Doctor details extension (approval starts as 'pending')
    await Doctor.create({
      userId: user._id,
      specialization,
      experience: Number(experience),
      qualification: Array.isArray(qualification) ? qualification : [qualification],
      consultationFee: Number(consultationFee || 500),
      hospitalDepartment,
      availability: [
        { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      ],
      approvalStatus: 'pending',
    });

    // Notify admins (in development, print or log)
    console.log(`[Admin Notice] New doctor registered: Dr. ${name} (Pending Approval)`);

    res.status(201).json({
      success: true,
      message: 'Doctor account registered. Your application is pending review and approval by administrators.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    // Validate OTP
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account successfully verified! You can now log in.',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Role-specific check: if doctor, must be approved by Admin
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id });
      if (!doctorProfile) {
        return res.status(404).json({ success: false, message: 'Doctor details not found' });
      }

      if (doctorProfile.approvalStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your profile is pending approval. Please wait for an administrator to activate your account.',
        });
      }

      if (doctorProfile.approvalStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your application has been rejected by administrators. Contact support for details.',
        });
      }
    }

    // Log user details (excluding password)
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with that email' });
    }

    // Generate 6 digit OTP for reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`\n🔑 [RESET OTP DISPATCH] User: ${email} | CODE: ${otp} (Copy & Paste this in your password reset verify window)\n`);

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: 'Mediease - Reset Password Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #0d9488;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use this OTP to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 4px;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">This OTP is valid for 10 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP code sent successfully to email.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify OTP
    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Change password
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.isVerified = true; // resets also verify users
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
