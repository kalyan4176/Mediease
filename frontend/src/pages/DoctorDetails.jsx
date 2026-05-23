import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Star, Calendar, Clock, CreditCard, ShieldCheck, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useDialog();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Slot booking states
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Billing checkout modal states
  const [showCheckout, setShowCheckout] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        const res = await API.get(`/doctors/${id}`);
        if (res.data.success) {
          setDoctor(res.data.doctor);
          // Auto select first available day
          if (res.data.doctor.availability?.length > 0) {
            setSelectedDay(res.data.doctor.availability[0].day);
          }
        }
      } catch (err) {
        console.error('Failed to load doctor details:', err.message);
        setError('Doctor details not found.');
      }
      setLoading(false);
    };

    fetchDoctorDetails();
  }, [id]);

  const handleBookAppointment = async () => {
    if (!user) {
      // Redirect to login if unauthenticated
      return navigate('/login');
    }

    if (!selectedDay || !selectedSlot) {
      return toast('Please select an available weekday slot.', 'error');
    }

    setBookingLoading(true);
    setError('');

    // Generate date for the weekday selected
    const getNextWeekdayDate = (dayName) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const targetDay = days.indexOf(dayName);
      const currentDay = today.getDay();
      
      let difference = targetDay - currentDay;
      if (difference <= 0) difference += 7; // get next week's occurrence
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + difference);
      return targetDate;
    };

    const targetDate = getNextWeekdayDate(selectedDay);

    try {
      const res = await API.post('/appointments/book', {
        doctorId: doctor.userId._id,
        appointmentDate: targetDate.toISOString(),
        appointmentTime: selectedSlot,
        consultationType: 'video',
      });

      if (res.data.success) {
        setBookingDetails(res.data.appointment);
        setShowCheckout(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Double booking error. Select another slot.');
    }
    setBookingLoading(false);
  };

  const handleSimulatePayment = async () => {
    setPaymentLoading(true);
    try {
      // 1. Create Simulated Stripe/Razorpay order
      const orderRes = await API.post('/payments/create-order', {
        appointmentId: bookingDetails._id,
        amount: doctor.consultationFee,
        paymentMethod: 'Stripe Simulated Gateway',
      });

      if (orderRes.data.success) {
        const paymentId = orderRes.data.payment._id;

        // 2. Verify payment simulation
        const verifyRes = await API.post('/payments/verify', {
          paymentId,
          status: 'completed',
        });

        if (verifyRes.data.success) {
          setPaymentSuccess(true);
        }
      }
    } catch (err) {
      console.error('Simulated billing error:', err.message);
      toast('Payment processing failed.', 'error');
    }
    setPaymentLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="mx-auto max-w-md py-20 text-center space-y-4 min-h-[60vh] flex flex-col justify-center items-center">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h3 className="text-xl font-bold text-slate-800">Error loading doctor</h3>
        <p className="text-slate-500 text-xs">{error || 'Practitioner details are missing.'}</p>
        <Link to="/doctors" className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold">
          Return to directory
        </Link>
      </div>
    );
  }

  // Find available slots for the selected day
  const activeDaySchedule = doctor.availability?.find((a) => a.day === selectedDay);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate('/doctors')}
        className="flex items-center text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        <span>Return to Specialists list</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Doctor Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white shadow-xl space-y-6">
            <div className="h-56 rounded-2xl bg-teal-50/50 relative overflow-hidden flex items-center justify-center text-teal-600">
              {doctor.userId?.profileImage ? (
                <img
                  src={getImageUrl(doctor.userId.profileImage)}
                  alt={doctor.userId.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Stethoscope className="h-20 w-20" />
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider">
                  {doctor.specialization}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Dr. {doctor.userId.name}</h2>
                <p className="text-xs text-slate-400 font-medium">
                  {doctor.qualification?.join(', ')} • {doctor.experience} Years Experience
                </p>
              </div>

              <div className="flex items-center text-xs text-amber-500 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Star className="h-4 w-4 fill-current mr-1 shrink-0" />
                <span>{doctor.ratings?.average || 5.0} Ratings out of {doctor.ratings?.count || 12} Patient Reviews</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 font-medium">Consultation Fee</span>
                  <span className="font-extrabold text-slate-900 text-lg">₹{doctor.consultationFee}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 font-medium">Hospital Unit</span>
                  <span className="font-extrabold text-slate-900 text-xs line-clamp-1">{doctor.hospitalDepartment}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Availability Schedules & Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Schedule Consultation</h3>
              <p className="text-slate-500 text-xs">
                Select an available day and convenient slots below to construct a secure video visit.
              </p>
            </div>

            {/* Weekdays tabs selector */}
            <div className="flex flex-wrap gap-2">
              {doctor.availability?.map((sched) => (
                <button
                  key={sched.day}
                  onClick={() => {
                    setSelectedDay(sched.day);
                    setSelectedSlot('');
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    selectedDay === sched.day
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-teal-600'
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-1.5 shrink-0" />
                  {sched.day}
                </button>
              ))}
            </div>

            {/* Time slots Selector */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Available Slots</h4>
              {activeDaySchedule?.slots?.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {activeDaySchedule.slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 rounded-xl font-bold text-xs tracking-wide transition-all ${
                        selectedSlot === slot
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                          : 'bg-slate-50 border border-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 inline mr-1 shrink-0" />
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No consultation slots configured for this day
                </div>
              )}
            </div>

            {/* Terms and action button */}
            <div className="border-t border-slate-100/60 pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-2 text-[10.5px] text-slate-400 max-w-sm">
                <ShieldCheck className="h-4.5 w-4.5 text-teal-600 shrink-0 mt-0.5" />
                <span>By booking, you accept our patient terms. A video consultation link is generated instantly.</span>
              </div>
              <button
                onClick={handleBookAppointment}
                disabled={bookingLoading || !selectedDay || !selectedSlot}
                className="glow-button px-8 py-3.5 rounded-xl bg-teal-600 font-bold text-white text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-700 disabled:opacity-50"
              >
                {bookingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Book Visit Slot</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SIMULATED CHECKOUT MODAL WINDOW (Interactive Portal Element) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-8 border border-white shadow-2xl max-w-md w-full bg-white space-y-6 text-slate-800"
            >
              {!paymentSuccess ? (
                <>
                  {/* Payment checkout panel */}
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">Secure Billing checkout</h3>
                    <p className="text-xs text-slate-500">
                      Simulated Stripe integration order generated. Complete payment to confirm slot.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Doctor Visit fee</span>
                      <span>₹{doctor.consultationFee}.00</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Appointment ID</span>
                      <span>{bookingDetails?._id?.toString().slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Slot Details</span>
                      <span>{selectedDay}, {selectedSlot}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulatePayment}
                    disabled={paymentLoading}
                    className="glow-button flex w-full items-center justify-center rounded-xl bg-teal-600 py-3.5 font-bold text-white text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-700 disabled:opacity-50"
                  >
                    {paymentLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <span>Simulate Payment (₹{doctor.consultationFee})</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      navigate('/patient'); // Send to dashboard where they can see pending bills
                    }}
                    className="block text-center w-full font-bold text-slate-400 hover:text-slate-500 text-xs pt-1"
                  >
                    Pay later from Patient inbox
                  </button>
                </>
              ) : (
                <>
                  {/* Payment Success Invoice panel */}
                  <div className="text-center space-y-6 py-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 animate-bounce">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-extrabold text-slate-900">Slot Confirmed!</h3>
                      <p className="text-xs text-slate-500">
                        Consultation fee processed successfully. A video consultation channel is now active.
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-dashed border-slate-100 p-5 space-y-2 text-xs text-left bg-emerald-50/20">
                      <p className="font-bold text-emerald-800 text-center text-sm border-b border-slate-100 pb-2 mb-2">RECEIPT MEMO</p>
                      <p><strong>Beneficiary:</strong> Dr. {doctor.userId.name}</p>
                      <p><strong>Paid Amount:</strong> ₹{doctor.consultationFee}.00</p>
                      <p><strong>Gateway Ref:</strong> stripe_sim_{Math.random().toString(36).slice(2,8).toUpperCase()}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowCheckout(false);
                        navigate('/patient');
                      }}
                      className="glow-button block w-full py-3.5 rounded-xl bg-teal-600 font-extrabold text-white text-sm shadow-md hover:bg-teal-700"
                    >
                      Go to Consultation Desk
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default DoctorDetails;
