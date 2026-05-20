import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Book an Appointment
// @route   POST /api/appointments/book
// @access  Private
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, consultationType } = req.body;
    const patientId = req.user.id;

    // Check if doctor exists and is approved
    const doctorProfile = await Doctor.findOne({ userId: doctorId });
    if (!doctorProfile || doctorProfile.approvalStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Doctor is not available for booking' });
    }

    // Check for double booking
    const isDoubleBooked = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (isDoubleBooked) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked for this doctor. Please select another slot.',
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      consultationType: consultationType || 'video',
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Notify doctor
    const patientUser = await User.findById(patientId);
    await Notification.create({
      receiverId: doctorId,
      message: `New appointment requested by ${patientUser.name} for ${appointmentTime} on ${new Date(appointmentDate).toDateString()}`,
      type: 'appointment',
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. Please complete the consultation fee payment.',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let appointments;

    // Query based on role
    if (role === 'patient') {
      appointments = await Appointment.find({ patientId: userId })
        .populate('doctorId', 'name email profileImage phone specializations')
        .sort({ appointmentDate: -1, appointmentTime: -1 });
    } else if (role === 'doctor') {
      appointments = await Appointment.find({ doctorId: userId })
        .populate('patientId', 'name email profileImage phone gender')
        .sort({ appointmentDate: -1, appointmentTime: -1 });
    } else if (role === 'admin') {
      appointments = await Appointment.find()
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name email specialization')
        .sort({ appointmentDate: -1 });
    }

    // Join doctor details table to fill spec information if patient views
    if (role === 'patient') {
      // Map appointments and add doctor specialization manually
      const appointmentsWithSpecialization = await Promise.all(
        appointments.map(async (app) => {
          const appObj = app.toObject();
          if (app.doctorId) {
            const spec = await Doctor.findOne({ userId: app.doctorId._id }).select('specialization');
            appObj.doctorId.specialization = spec ? spec.specialization : 'General Medicine';
          }
          return appObj;
        })
      );
      return res.status(200).json({ success: true, count: appointmentsWithSpecialization.length, appointments: appointmentsWithSpecialization });
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Appointment Status
// @route   PUT /api/appointments/update/:id
// @access  Private
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, appointmentDate, appointmentTime } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Role visual guard check: Patients cannot mark completed, Doctors cannot modify random fields
    if (status) {
      appointment.status = status;
    }
    if (appointmentDate) {
      appointment.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime) {
      appointment.appointmentTime = appointmentTime;
    }

    await appointment.save();

    // Trigger user notification
    const senderName = req.user.name;
    const targetUserId = req.user.role === 'patient' ? appointment.doctorId : appointment.patientId;
    
    await Notification.create({
      receiverId: targetUserId,
      message: `Appointment details updated by ${senderName}. Status is now: ${appointment.status}`,
      type: 'appointment',
    });

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel Appointment
// @route   DELETE /api/appointments/cancel/:id
// @access  Private
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Mark as cancelled rather than deleting for system history tracking
    appointment.status = 'cancelled';
    await appointment.save();

    // Trigger user notification
    const targetUserId = req.user.role === 'patient' ? appointment.doctorId : appointment.patientId;
    await Notification.create({
      receiverId: targetUserId,
      message: `Appointment cancelled by ${req.user.name}`,
      type: 'appointment',
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
