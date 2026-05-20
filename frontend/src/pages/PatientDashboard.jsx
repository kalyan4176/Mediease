import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Calendar, FileText, CreditCard, Stethoscope, Video, Send, 
  Trash2, ShieldCheck, Heart, AlertCircle, Plus, Star, CheckSquare, Loader2 
} from 'lucide-react';

export const PatientDashboard = () => {
  const { user, syncDetailedProfile } = useAuth();
  const { socket, joinRoom, sendMessage } = useSocket();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const [activeTab, setActiveTab] = useState('home'); // 'home', 'appointments', 'records', 'profile', 'billing'
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [payments, setPayments] = useState([]);

  // Medical profile states
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Live consult window state
  const [liveConsultAppointment, setLiveConsultAppointment] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [simulatedVideo, setSimulatedVideo] = useState(true);

  // Review submission state
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Checkout modal states
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutApp, setCheckoutApp] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const appRes = await API.get('/appointments');
      if (appRes.data.success) {
        setAppointments(appRes.data.appointments);
      }

      const payRes = await API.get('/payments/history');
      if (payRes.data.success) {
        setPayments(payRes.data.payments);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Bind profile values
    if (user?.patientDetails) {
      setBloodGroup(user.patientDetails.bloodGroup || '');
      setAllergiesInput(user.patientDetails.allergies?.join(', ') || '');
      setMedicalHistory(user.patientDetails.medicalHistory || '');
      setEmergencyName(user.patientDetails.emergencyContact?.name || '');
      setEmergencyPhone(user.patientDetails.emergencyContact?.phone || '');
    }
  }, [user]);

  // Bind Socket listener for consultation room chat messages
  useEffect(() => {
    if (socket && liveConsultAppointment) {
      // Listen for incoming consultation chats
      socket.on('receive-message', (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      return () => {
        socket.off('receive-message');
      };
    }
  }, [socket, liveConsultAppointment]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await API.put('/users/update-profile', {
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        bloodGroup,
        allergies: allergiesInput.split(',').map((a) => a.trim()).filter(Boolean),
        medicalHistory,
        emergencyContact: {
          name: emergencyName,
          relation: 'Emergency Desk',
          phone: emergencyPhone,
        }
      });
      if (res.data.success) {
        await syncDetailedProfile();
        alert('Medical profile details updated successfully.');
      }
    } catch (err) {
      alert('Failed to update medical details.');
    }
    setProfileLoading(false);
  };

  const handleCancelAppointment = async (appId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation slot?')) return;
    try {
      const res = await API.delete(`/appointments/cancel/${appId}`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert('Cancellation failed.');
    }
  };

  // Launch Live consultation room
  const handleJoinConsultation = (app) => {
    setLiveConsultAppointment(app);
    setChatMessages([]);
    joinRoom(app._id); // Join room in socket
  };

  // Send private consult chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sendMessage(liveConsultAppointment._id, chatInput.trim());
    setChatInput('');
  };

  const handleSimulatePayment = async () => {
    setPaymentLoading(true);
    try {
      const orderRes = await API.post('/payments/create-order', {
        appointmentId: checkoutApp._id,
        amount: checkoutApp.doctorId?.consultationFee || 500,
        paymentMethod: 'Simulated stripe billing',
      });

      if (orderRes.data.success) {
        const verifyRes = await API.post('/payments/verify', {
          paymentId: orderRes.data.payment._id,
          status: 'completed',
        });

        if (verifyRes.data.success) {
          setShowCheckout(false);
          fetchDashboardData();
          alert('Consultation fee paid successfully! Slot is now confirmed.');
        }
      }
    } catch (err) {
      alert('Checkout failed.');
    }
    setPaymentLoading(false);
  };

  // Submit doctor review and rating
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/reviews/add', {
        doctorId: reviewAppointment.doctorId._id,
        rating,
        reviewText,
      });

      if (res.data.success) {
        setReviewAppointment(null);
        setRating(5);
        setReviewText('');
        fetchDashboardData();
        alert('Thank you! Review and rating submitted successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed.');
    }
  };

  // Open direct static PDF link
  const handleDownloadPrescription = (appId) => {
    // Prescription PDFs are generated under /uploads/prescription-<id>.pdf
    // First retrieve the prescription details
    API.get(`/prescriptions/${appId}`)
      .then((res) => {
        if (res.data.success && res.data.prescription.generatedPDF) {
          const pdfLink = `http://localhost:5000${res.data.prescription.generatedPDF}`;
          window.open(pdfLink, '_blank');
        } else {
          alert('Prescription PDF is compiling. Try again in a moment.');
        }
      })
      .catch(() => alert('No digital prescription found for this visit slot.'));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Console</h1>
          <p className="text-slate-500 text-xs mt-1">
            Welcome back, <span className="font-bold text-slate-800">{user?.name}</span> • Blood Group: {user?.patientDetails?.bloodGroup || 'N/A'}
          </p>
        </div>
      </div>

      {/* Grid Layout: Sidebar Navigation + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-3xl p-5 border border-white shadow-xl flex flex-col space-y-2.5">
            {[
              { id: 'home', label: 'Dashboard Home', icon: Stethoscope },
              { id: 'appointments', label: 'Consultations Schedule', icon: Calendar },
              { id: 'profile', label: 'Clinical Medical Profile', icon: User },
              { id: 'billing', label: 'Transaction invoices', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setLiveConsultAppointment(null); // Close active consult room
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-teal-600'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* ============================================================== */}
              {/* LIVE CONSULTATION INTERACTION ROOM                             */}
              {/* ============================================================== */}
              {liveConsultAppointment ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                        V
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Dr. {liveConsultAppointment.doctorId?.name}</h3>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Active Consultation Room</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setLiveConsultAppointment(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50 text-slate-500"
                    >
                      Exit Room
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Simulated WebRTC Video block */}
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center text-white border border-slate-800">
                        {simulatedVideo ? (
                          <div className="w-full h-full flex flex-col justify-between p-4">
                            <span className="self-end px-2.5 py-0.5 rounded bg-emerald-500 text-[10px] font-bold tracking-widest uppercase shadow">
                              Live Stream
                            </span>
                            <div className="flex items-center space-x-2 text-xs bg-slate-950/60 p-2 rounded-xl border border-white/10 max-w-fit">
                              <Video className="h-4.5 w-4.5 text-teal-400" />
                              <span>Dr. Jenkins (Consultant Specialist)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            <Video className="h-8 w-8 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-500">Camera disabled</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center space-x-2.5">
                        <button
                          onClick={() => setSimulatedVideo(!simulatedVideo)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                          Toggle Video Camera
                        </button>
                      </div>
                    </div>

                    {/* Chat messaging panel */}
                    <div className="flex flex-col h-72 border border-slate-150 rounded-2xl bg-white overflow-hidden justify-between">
                      {/* Message area */}
                      <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-10 text-slate-400">
                            Consultation chat started. Send a message to describe symptoms.
                          </div>
                        ) : (
                          chatMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex flex-col max-w-[80%] rounded-2xl p-2.5 ${
                                msg.senderId === user._id
                                  ? 'bg-teal-600 text-white self-end ml-auto rounded-tr-none'
                                  : 'bg-slate-50 border border-slate-100 text-slate-800 mr-auto rounded-tl-none'
                              }`}
                            >
                              <span className="font-extrabold text-[9px] opacity-75">{msg.senderName}</span>
                              <p className="mt-0.5">{msg.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendMessage} className="border-t border-slate-150 p-2 flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type symptom advice..."
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
                        />
                        <button
                          type="submit"
                          className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow shadow-teal-500/10"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {/* ============================================================== */}
              {/* TAB: DASHBOARD HOME                                            */}
              {/* ============================================================== */}
              {activeTab === 'home' && !liveConsultAppointment && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8 animate-in fade-in duration-200"
                >
                  {/* Banner alert if patient profile incomplete */}
                  {(!bloodGroup || !medicalHistory) && (
                    <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 flex items-start space-x-3 text-xs text-amber-800">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold">Complete your Medical profile card</p>
                        <p className="mt-0.5">Please add your blood group, emergency contacts, and allergies inside the profile tab. This aggregates onto doctor consultation boards to ensure safe diagnoses.</p>
                      </div>
                    </div>
                  )}

                  {/* Summary Grid stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex items-center space-x-4">
                      <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Calendar className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <span className="block text-2xl font-extrabold text-slate-900">
                          {appointments.filter((a) => ['pending', 'confirmed'].includes(a.status)).length}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">Scheduled Consults</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex items-center space-x-4">
                      <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Heart className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <span className="block text-2xl font-extrabold text-slate-900">
                          {appointments.filter((a) => a.status === 'completed').length}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">Consultations Completed</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex items-center space-x-4">
                      <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <CreditCard className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <span className="block text-2xl font-extrabold text-slate-900">
                          ₹{payments.filter((p) => p.paymentStatus === 'completed').reduce((acc, curr) => acc + curr.amount, 0)}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">Fee Amount processed</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Consultations Grid */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Immediate Consultation Actions</h3>
                    
                    {appointments.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 bg-white border border-slate-150 rounded-2xl">
                        No appointment slots booked. Schedule a slot to begin online visits.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {appointments.map((app) => (
                          <div
                            key={app._id}
                            className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex flex-col justify-between space-y-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-xl bg-teal-50 overflow-hidden flex items-center justify-center text-teal-600 shrink-0 border border-slate-100">
                                  {app.doctorId?.profileImage ? (
                                    <img
                                      src={getImageUrl(app.doctorId.profileImage)}
                                      alt={app.doctorId?.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Stethoscope className="h-6 w-6" />
                                  )}
                                </div>
                                <div>
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                                    app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                    app.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                    app.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {app.status}
                                  </span>
                                  <h4 className="font-extrabold text-slate-900 mt-1 text-sm">Dr. {app.doctorId?.name}</h4>
                                  <p className="text-[10px] text-teal-600 font-bold">{app.doctorId?.specialization || 'Clinical Specialist'}</p>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded shrink-0">
                                ID: {app._id.toString().slice(-6).toUpperCase()}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1">
                              <p>📅 Date: {new Date(app.appointmentDate).toDateString()}</p>
                              <p>🕒 Time Slot: {app.appointmentTime}</p>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex gap-2 mt-2">
                              {app.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setCheckoutApp(app);
                                    setShowCheckout(true);
                                  }}
                                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow shadow-teal-500/10"
                                >
                                  Complete Payment
                                </button>
                              )}

                              {app.status === 'confirmed' && (
                                <button
                                  onClick={() => handleJoinConsultation(app)}
                                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md animate-pulse"
                                >
                                  Join Video Room
                                </button>
                              )}

                              {app.status === 'completed' && (
                                <>
                                  <button
                                    onClick={() => handleDownloadPrescription(app._id)}
                                    className="flex-1 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs"
                                  >
                                    Download Prescription
                                  </button>
                                  <button
                                    onClick={() => setReviewAppointment(app)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                                    title="Rate Doctor"
                                  >
                                    <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                                  </button>
                                </>
                              )}

                              {['pending', 'confirmed'].includes(app.status) && (
                                <button
                                  onClick={() => handleCancelAppointment(app._id)}
                                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Cancel Visit"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* TAB: APPOINTMENTS                                              */}
              {/* ============================================================== */}
              {activeTab === 'appointments' && !liveConsultAppointment && (
                <motion.div
                  key="appointments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Your Scheduled Consultations</h3>
                    <Link
                      to="/doctors"
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow"
                    >
                      Book New Slot
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Doctor</th>
                          <th className="pb-3">Scheduled Slot</th>
                          <th className="pb-3">Mode</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No appointment slot schedules.
                            </td>
                          </tr>
                        ) : (
                          appointments.map((app) => (
                            <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3.5">
                                <span className="font-bold block text-slate-800">Dr. {app.doctorId?.name}</span>
                                <span className="text-[10px] text-teal-600 font-bold">{app.doctorId?.specialization || 'Clinical Specialist'}</span>
                              </td>
                              <td className="py-3.5 text-slate-600">
                                <span>{new Date(app.appointmentDate).toDateString()}</span>
                                <span className="block text-[10px] text-slate-400 font-semibold">{app.appointmentTime}</span>
                              </td>
                              <td className="py-3.5 text-slate-500 font-semibold capitalize">{app.consultationType}</td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                  app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                  app.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                  app.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right space-x-2">
                                {app.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleJoinConsultation(app)}
                                    className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700"
                                  >
                                    Join Video Call
                                  </button>
                                )}
                                {app.status === 'completed' && (
                                  <button
                                    onClick={() => handleDownloadPrescription(app._id)}
                                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                                  >
                                    Prescription PDF
                                  </button>
                                )}
                                {['pending', 'confirmed'].includes(app.status) && (
                                  <button
                                    onClick={() => handleCancelAppointment(app._id)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* TAB: MEDICAL PROFILE                                           */}
              {/* ============================================================== */}
              {activeTab === 'profile' && !liveConsultAppointment && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Configure Medical Parameters Profile
                  </h3>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Blood Group */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500 focus:ring-1"
                        >
                          <option value="">Choose blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      {/* Allergies */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Allergies (Comma separated)</label>
                        <input
                          type="text"
                          value={allergiesInput}
                          onChange={(e) => setAllergiesInput(e.target.value)}
                          placeholder="e.g. Penicillin, Pollen, Peanuts"
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Emergency Contact Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Emergency Contact Name</label>
                        <input
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          placeholder="Name of contact"
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Emergency Contact Phone */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="Phone number"
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Medical History */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Chronic Medical History Logs</label>
                        <textarea
                          rows={3}
                          value={medicalHistory}
                          onChange={(e) => setMedicalHistory(e.target.value)}
                          placeholder="State previous clinical surgeries, diabetic history, cardiac parameters, etc."
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="glow-button px-6 py-3 rounded-xl bg-teal-600 text-white font-bold text-xs shadow hover:bg-teal-700 disabled:opacity-50"
                    >
                      {profileLoading ? 'Syncing...' : 'Save Medical Profile'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* TAB: INVOICES / BILLING                                        */}
              {/* ============================================================== */}
              {activeTab === 'billing' && !liveConsultAppointment && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Transaction Invoices & Receipts
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Transaction ID</th>
                          <th className="pb-3">Doctor Consultation</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No transaction invoice files compiled.
                            </td>
                          </tr>
                        ) : (
                          payments.map((pay) => (
                            <tr key={pay._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3.5 font-mono font-bold text-slate-800">
                                {pay.transactionId}
                              </td>
                              <td className="py-3.5 text-slate-600">
                                <span>Dr. consultation slot</span>
                                <span className="block text-[10px] text-slate-400">Date: {new Date(pay.createdAt).toDateString()}</span>
                              </td>
                              <td className="py-3.5 text-slate-500 font-semibold">{pay.paymentMethod}</td>
                              <td className="py-3.5 font-extrabold text-slate-900">₹{pay.amount}.00</td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wider ${
                                  pay.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                  pay.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                                  'bg-rose-50 text-rose-700'
                                }`}>
                                  {pay.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* DIRECT INLINE CHECKOUT MODAL WINDOW                            */}
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
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Consultation Checkout</h3>
                <p className="text-xs text-slate-500">
                  Complete simulated billing checkout order to confirm slot booking immediately.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Consultation Fee</span>
                  <span>₹{checkoutApp?.doctorId?.consultationFee || 500}.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Doctor Unit</span>
                  <span>Dr. {checkoutApp?.doctorId?.name}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Slot Scheduled</span>
                  <span>{checkoutApp?.appointmentTime}</span>
                </div>
              </div>

              <button
                onClick={handleSimulatePayment}
                disabled={paymentLoading}
                className="glow-button flex w-full items-center justify-center rounded-xl bg-teal-600 py-3.5 font-bold text-white text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-700 disabled:opacity-50"
              >
                {paymentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Simulate Payment (₹{checkoutApp?.doctorId?.consultationFee || 500})</span>
                )}
              </button>

              <button
                onClick={() => setShowCheckout(false)}
                className="block text-center w-full font-bold text-slate-400 hover:text-slate-500 text-xs"
              >
                Cancel Checkout
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 4. DOCTOR RATING & REVIEW INLINE FORM                          */}
      {/* ============================================================== */}
      <AnimatePresence>
        {reviewAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-8 border border-white shadow-2xl max-w-md w-full bg-white space-y-6 text-slate-800"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <Star className="h-6 w-6 fill-current" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Add Doctor Review</h3>
                <p className="text-xs text-slate-500">
                  Rate your digital consultation session with Dr. {reviewAppointment.doctorId?.name}.
                </p>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating selection stars */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Star Rating (1-5)</label>
                  <div className="flex justify-center space-x-2 text-2xl">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="transition-transform active:scale-95"
                      >
                        <Star className={`h-8 w-8 ${s <= rating ? 'fill-amber-400 stroke-amber-400 animate-pulse' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review feedback text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Review</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Provide details about diagnosis, medicine prescription, or general physician advice..."
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="glow-button block w-full py-3 rounded-xl bg-teal-600 font-extrabold text-white text-sm shadow hover:bg-teal-700"
                >
                  Submit Feedback Review
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAppointment(null)}
                  className="block text-center w-full font-bold text-slate-400 hover:text-slate-500 text-xs"
                >
                  Cancel Review
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default PatientDashboard;
