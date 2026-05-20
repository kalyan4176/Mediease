import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { generatePrescriptionPDF } from '../services/pdfService.js';
import path from 'path';
import fs from 'fs';

// @desc    Create Digital Prescription
// @route   POST /api/prescriptions/create
// @access  Private (Doctor Only)
export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, notes } = req.body;
    const doctorId = req.user.id;

    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment details not found' });
    }

    const patientId = appointment.patientId;

    // Create prescription record in DB first to get ID
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId,
      medicines,
      notes,
      generatedPDF: '',
    });

    // Retrieve doctor and patient names for the PDF
    const doctorUser = await User.findById(doctorId);
    const patientUser = await User.findById(patientId);

    // Set output file path for PDF
    const fileName = `prescription-${prescription._id}.pdf`;
    const outputPath = path.join('uploads', fileName);

    // Generate physical PDF
    await generatePrescriptionPDF(
      prescription,
      doctorUser.name,
      patientUser.name,
      outputPath
    );

    // Save public relative link path
    prescription.generatedPDF = `/uploads/${fileName}`;
    await prescription.save();

    // Automatically flag appointment as completed
    appointment.status = 'completed';
    await appointment.save();

    // Trigger notification to Patient
    await Notification.create({
      receiverId: patientId,
      message: `Dr. ${doctorUser.name} has generated a new digital prescription for your appointment.`,
      type: 'prescription',
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully and PDF generated.',
      prescription,
    });
  } catch (error) {
    console.error('Prescription Generation Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Prescription by ID or Appointment ID
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req, res) => {
  try {
    // Search by prescription ID or appointment ID
    let prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name email profileImage')
      .populate('patientId', 'name email phone gender address');

    if (!prescription) {
      prescription = await Prescription.findOne({ appointmentId: req.params.id })
        .populate('doctorId', 'name email profileImage')
        .populate('patientId', 'name email phone gender address');
    }

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription records not found' });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download PDF Prescription
// @route   GET /api/prescriptions/download/:id
// @access  Private
export const downloadPrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const fileName = `prescription-${prescription._id}.pdf`;
    const filePath = path.join('uploads', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Prescription PDF file was not found on server' });
    }

    // Return file download
    res.download(filePath, `Prescription-${prescription._id.toString().slice(-6)}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
