import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Initiate Consultation Payment (Mock Order Creation)
// @route   POST /api/payments/create-order
// @access  Private
export const createPaymentOrder = async (req, res) => {
  try {
    const { appointmentId, amount, paymentMethod } = req.body;
    const patientId = req.user.id;

    // Verify appointment details
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment details not found' });
    }

    // Generate mock order details
    const transactionId = `txn_${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

    // Create payment in pending state
    const payment = await Payment.create({
      patientId,
      appointmentId,
      amount: Number(amount || 500),
      paymentMethod: paymentMethod || 'Stripe (Simulated)',
      transactionId,
      paymentStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Simulated payment order successfully initialized.',
      payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Payment Receipt (Simulation)
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body; // status: 'completed' or 'failed'

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (status === 'completed') {
      payment.paymentStatus = 'completed';
      await payment.save();

      // Flag appointment paymentStatus as paid and confirm appointment
      const appointment = await Appointment.findById(payment.appointmentId);
      if (appointment) {
        appointment.paymentStatus = 'paid';
        appointment.status = 'confirmed';
        await appointment.save();

        // Notify Doctor about confirmed booking
        const patientUser = await User.findById(payment.patientId);
        await Notification.create({
          receiverId: appointment.doctorId,
          message: `Consultation fee paid by patient ${patientUser.name}. Appointment slot ${appointment.appointmentTime} is confirmed.`,
          type: 'payment',
        });
      }
    } else {
      payment.paymentStatus = 'failed';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: `Simulated transaction verified as: ${payment.paymentStatus}`,
      payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User Payment History
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let payments;

    if (role === 'patient') {
      payments = await Payment.find({ patientId: userId })
        .populate('appointmentId')
        .sort({ createdAt: -1 });
    } else if (role === 'doctor') {
      // Find appointments this doctor has, and find matching completed payments
      const doctorAppointments = await Appointment.find({ doctorId: userId }).select('_id');
      const appointmentIds = doctorAppointments.map((app) => app._id);

      payments = await Payment.find({ appointmentId: { $in: appointmentIds }, paymentStatus: 'completed' })
        .populate('patientId', 'name email phone')
        .populate('appointmentId')
        .sort({ createdAt: -1 });
    } else if (role === 'admin') {
      payments = await Payment.find()
        .populate('patientId', 'name email phone')
        .populate('appointmentId')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
