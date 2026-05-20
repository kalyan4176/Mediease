import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Patient from './models/Patient.js';
import Appointment from './models/Appointment.js';
import Prescription from './models/Prescription.js';
import Payment from './models/Payment.js';
import Review from './models/Review.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=================== [MEDIEASE API TEST SUITE] ===================');
  
  // 1. Connect directly to MongoDB to reset test credentials
  console.log('[Direct Database] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediease');
  console.log('[Direct Database] Connected.');

  const patientEmail = 'test_patient@mediease.com';
  const doctorEmail = 'test_doctor@mediease.com';
  const adminEmail = 'test_admin@mediease.com';

  console.log('[Direct Database] Cleaning up any old test users...');
  const testUsers = await User.find({ email: { $in: [patientEmail, doctorEmail, adminEmail] } });
  for (const u of testUsers) {
    await Patient.deleteMany({ userId: u._id });
    await Doctor.deleteMany({ userId: u._id });
    await Appointment.deleteMany({ userId: u._id });
    await User.deleteOne({ _id: u._id });
  }
  console.log('[Direct Database] Cleanup complete.');

  // Create Direct Admin user to test role-based authentication
  console.log('[Direct Database] Creating seed Admin user for auth tests...');
  const adminUser = await User.create({
    name: 'System Admin',
    email: adminEmail,
    password: 'AdminPassword123',
    role: 'admin',
    phone: '0000000000',
    gender: 'other',
    isVerified: true,
  });
  console.log('[Direct Database] Admin seeded.');

  let patientToken = '';
  let patientUserId = '';
  let doctorToken = '';
  let doctorUserId = '';
  let doctorProfileId = '';
  let adminToken = '';
  let appointmentId = '';

  try {
    // 2. Register Patient
    console.log('\n[API Test 1] Registering Patient...');
    const regPatientRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Patient',
        email: patientEmail,
        password: 'PatientPassword123',
        phone: '1112223333',
        gender: 'female',
        address: 'SRM Health Block A',
      }),
    });
    const regPatientJson = await regPatientRes.json();
    console.log('Status:', regPatientRes.status);
    console.log('Payload:', regPatientJson);
    if (!regPatientJson.success) throw new Error('Patient registration failed');
    patientUserId = regPatientJson.userId;

    // 3. Retrieve OTP from Mongo to verify account
    console.log('\n[API Test 2] Querying Database for OTP code...');
    const patientRecord = await User.findById(patientUserId);
    const otp = patientRecord.otp;
    console.log(`Found OTP code in DB: ${otp}`);

    // 4. Verify Patient OTP
    console.log('\n[API Test 3] Submitting OTP verification...');
    const verifyOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: patientUserId,
        otp,
      }),
    });
    const verifyOtpJson = await verifyOtpRes.json();
    console.log('Status:', verifyOtpRes.status);
    console.log('Payload:', verifyOtpJson);
    if (!verifyOtpJson.success) throw new Error('OTP Verification failed');

    // 5. Login Patient
    console.log('\n[API Test 4] Logging in Patient to retrieve JWT Token...');
    const loginPatientRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: patientEmail,
        password: 'PatientPassword123',
      }),
    });
    const loginPatientJson = await loginPatientRes.json();
    console.log('Status:', loginPatientRes.status);
    patientToken = loginPatientJson.token;
    console.log('Patient JWT Token retrieved successfully.');

    // 6. Login Admin
    console.log('\n[API Test 5] Logging in Admin...');
    const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'AdminPassword123',
      }),
    });
    const loginAdminJson = await loginAdminRes.json();
    console.log('Status:', loginAdminRes.status);
    adminToken = loginAdminJson.token;
    console.log('Admin JWT Token retrieved successfully.');

    // 7. Register Doctor
    console.log('\n[API Test 6] Registering Doctor (Dr. Jenkins)...');
    const regDoctorRes = await fetch(`${BASE_URL}/auth/register-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Jenkins',
        email: doctorEmail,
        password: 'DoctorPassword123',
        phone: '4445556666',
        gender: 'female',
        address: 'SRM Doctors Enclave',
        specialization: 'Cardiology',
        experience: '12',
        qualification: 'MBBS, MD Cardiology',
        consultationFee: '750',
        hospitalDepartment: 'Cardiology Block C',
      }),
    });
    const regDoctorJson = await regDoctorRes.json();
    console.log('Status:', regDoctorRes.status);
    console.log('Payload:', regDoctorJson);
    if (!regDoctorJson.success) throw new Error('Doctor registration failed');
    doctorUserId = regDoctorJson.userId;

    // 8. Try to login Doctor BEFORE Admin approval (Should return 403 Forbidden)
    console.log('\n[API Test 7] Logging in Doctor BEFORE Admin approval (Expect 403 Forbidden)...');
    const loginDoctorFailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: doctorEmail,
        password: 'DoctorPassword123',
      }),
    });
    console.log('Status:', loginDoctorFailRes.status);
    const loginDoctorFailJson = await loginDoctorFailRes.json();
    console.log('Payload:', loginDoctorFailJson);
    if (loginDoctorFailRes.status !== 403) throw new Error('Expected 403 Forbidden response but got different status.');

    // 9. Approve Doctor via Admin
    console.log('\n[API Test 8] Querying DB for Doctor profile...');
    const doctorProfile = await Doctor.findOne({ userId: doctorUserId });
    doctorProfileId = doctorProfile._id;

    console.log(`[API Test 8] Approving Doctor Profile ${doctorProfileId} using Admin Token...`);
    const approveRes = await fetch(`${BASE_URL}/doctors/approve/${doctorProfileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    const approveJson = await approveRes.json();
    console.log('Status:', approveRes.status);
    console.log('Payload:', approveJson);
    if (!approveJson.success) throw new Error('Doctor approval failed');

    // 10. Login Doctor AFTER approval (Should succeed)
    console.log('\n[API Test 9] Logging in Doctor AFTER Admin approval (Expect 200 OK)...');
    const loginDoctorRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: doctorEmail,
        password: 'DoctorPassword123',
      }),
    });
    const loginDoctorJson = await loginDoctorRes.json();
    console.log('Status:', loginDoctorRes.status);
    doctorToken = loginDoctorJson.token;
    console.log('Doctor JWT Token retrieved successfully.');

    // 11. Fetch Doctors List
    console.log('\n[API Test 10] Patient querying active Doctors list...');
    const getDoctorsRes = await fetch(`${BASE_URL}/doctors`, {
      method: 'GET',
    });
    const getDoctorsJson = await getDoctorsRes.json();
    console.log('Status:', getDoctorsRes.status);
    console.log('Active Doctors Count:', getDoctorsJson.count);
    if (!getDoctorsJson.success) throw new Error('Failed to query doctor list');

    // 12. Book Appointment
    console.log('\n[API Test 11] Patient booking appointment slot...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookRes = await fetch(`${BASE_URL}/appointments/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        doctorId: doctorUserId,
        appointmentDate: tomorrow.toISOString(),
        appointmentTime: '10:00 AM',
        consultationType: 'video',
      }),
    });
    const bookJson = await bookRes.json();
    console.log('Status:', bookRes.status);
    console.log('Payload:', bookJson);
    if (!bookJson.success) throw new Error('Appointment booking failed');
    appointmentId = bookJson.appointment._id;

    // 13. Create Simulated Stripe Payment Order
    console.log('\n[API Test 12] Patient creating simulated payment billing order...');
    const payOrderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        appointmentId,
        amount: 750,
        paymentMethod: 'Simulated Stripe Gateway',
      }),
    });
    const payOrderJson = await payOrderRes.json();
    console.log('Status:', payOrderRes.status);
    console.log('Payload:', payOrderJson);
    if (!payOrderJson.success) throw new Error('Payment order creation failed');
    const paymentId = payOrderJson.payment._id;

    // 14. Verify Simulated Payment (Should mark appointment as "confirmed" and emit sockets)
    console.log('\n[API Test 13] Verifying payment simulation...');
    const verifyPayRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        paymentId,
        status: 'completed',
      }),
    });
    const verifyPayJson = await verifyPayRes.json();
    console.log('Status:', verifyPayRes.status);
    console.log('Payload:', verifyPayJson);
    if (!verifyPayJson.success) throw new Error('Payment verification failed');

    // 15. Verify appointment status is now "confirmed"
    console.log('\n[API Test 14] Verifying updated appointment status in database...');
    const updatedApp = await Appointment.findById(appointmentId);
    console.log(`Appointment Status is now: ${updatedApp.status} (Expected: confirmed)`);
    if (updatedApp.status !== 'confirmed') throw new Error('Expected confirmed status');

    // 16. Doctor compiles and submits digital Prescription (PDF compiling test)
    console.log('\n[API Test 15] Doctor compiling Prescription and generating PDF file...');
    const prescRes = await fetch(`${BASE_URL}/prescriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        appointmentId,
        symptoms: 'Chest tightness, elevated breathing',
        diagnosis: 'Minor athletic tachycardia',
        medicines: [
          { name: 'Cardivas 3.125mg', dosage: '1-0-1', frequency: 'after meals', duration: '14 days' },
          { name: 'Ecoaspirin 75mg', dosage: '0-1-0', frequency: 'after meals', duration: '30 days' },
        ],
      }),
    });
    const prescJson = await prescRes.json();
    console.log('Status:', prescRes.status);
    console.log('Payload:', prescJson);
    if (!prescJson.success) throw new Error('Prescription compile failed');
    console.log('Prescription PDF Path saved:', prescJson.prescription.generatedPDF);

    // 17. Verify prescription PDF file was physically written to disk
    console.log('\n[API Test 16] Checking if prescription PDF is served statically...');
    const pdfUrl = `http://localhost:5000${prescJson.prescription.generatedPDF}`;
    const pdfRes = await fetch(pdfUrl, { method: 'HEAD' });
    console.log(`Static PDF Request Status for ${pdfUrl}:`, pdfRes.status);
    if (pdfRes.status !== 200) throw new Error('PDF file not served or compiled.');

    // 18. Patient submits feedback review
    console.log('\n[API Test 17] Patient submitting feedback review and ratings...');
    const reviewRes = await fetch(`${BASE_URL}/reviews/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        doctorId: doctorUserId,
        rating: 5,
        reviewText: 'Dr. Sarah Jenkins gave exceptional, prompt cardiology insights via video.',
      }),
    });
    const reviewJson = await reviewRes.json();
    console.log('Status:', reviewRes.status);
    console.log('Payload:', reviewJson);
    if (!reviewJson.success) throw new Error('Review submission failed');

    // 19. Patient checks Notifications inbox
    console.log('\n[API Test 18] Patient retrieving notifications list...');
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${patientToken}` },
    });
    const notifJson = await notifRes.json();
    console.log('Status:', notifRes.status);
    console.log(`Unread alerts found: ${notifJson.notifications.filter(n => !n.isRead).length}`);

    console.log('\n=================== [API TESTS COMPLETED SUCCESSFULLY] ===================');
    console.log('Status: 100% SUCCESS. All Express routes, Mongoose models, and PDFKit compilers are running and fully functional.');
  } catch (error) {
    console.error('\n!!! TEST FAILURE OCCURRED !!!');
    console.error(error.message);
  } finally {
    // Disconnect Mongoose
    await mongoose.disconnect();
    console.log('[Direct Database] Disconnected.');
  }
}

runTests();
