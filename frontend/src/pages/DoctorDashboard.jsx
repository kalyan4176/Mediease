import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useDialog } from '../context/DialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, Calendar, Clock, FileText, Send, User, 
  Video, ShieldCheck, AlertCircle, Plus, Trash2, CheckCircle, Loader2 
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user, syncDetailedProfile } = useAuth();
  const { socket, joinRoom, sendMessage } = useSocket();
  const { toast } = useDialog();

  const [activeTab, setActiveTab] = useState('home'); // 'home', 'appointments', 'schedule', 'profile'
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  // Availability state
  const [availability, setAvailability] = useState([]);
  const [newDay, setNewDay] = useState('Monday');
  const [newSlotsInput, setNewSlotsInput] = useState('09:00 AM, 11:00 AM, 02:00 PM');
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Consultation Room states
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [simulatedVideo, setSimulatedVideo] = useState(true);

  // Prescription Form states
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '1-0-1', frequency: 'after meals', duration: '5 days' }]);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // Profile editing states
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileGender, setProfileGender] = useState('male');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileSpecialization, setProfileSpecialization] = useState('');
  const [profileConsultFee, setProfileConsultFee] = useState('');
  const [profileDept, setProfileDept] = useState('');
  const [profileExp, setProfileExp] = useState('');
  const [profileQuals, setProfileQuals] = useState('');
  const [profileImg, setProfileImg] = useState('');
  
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const appRes = await API.get('/appointments');
      if (appRes.data.success) {
        setAppointments(appRes.data.appointments);
      }

      const docRes = await API.get(`/doctors/${user?.doctorDetails?._id || user?._id}`);
      if (docRes.data.success) {
        setAvailability(docRes.data.doctor.availability || []);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchDoctorData();
      
      // Bind profile values
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileGender(user.gender || 'male');
      setProfileAddress(user.address || '');
      setProfileImg(user.profileImage || '');
      
      if (user.doctorDetails) {
        setProfileSpecialization(user.doctorDetails.specialization || '');
        setProfileConsultFee(user.doctorDetails.consultationFee || '500');
        setProfileDept(user.doctorDetails.hospitalDepartment || '');
        setProfileExp(user.doctorDetails.experience || '');
        setProfileQuals(user.doctorDetails.qualification?.join(', ') || '');
      }
    }
  }, [user]);

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setUploadingImage(true);
    try {
      const res = await API.post('/users/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        setProfileImg(res.data.fileUrl);
        toast('Avatar uploaded successfully! Click "Save Profile Changes" to update.');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to upload avatar image.', 'error');
    }
    setUploadingImage(false);
  };

  const handleUpdateDoctorProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    try {
      const res = await API.put('/users/profile', {
        name: profileName,
        phone: profilePhone,
        gender: profileGender,
        address: profileAddress,
        profileImage: profileImg,
        specialization: profileSpecialization,
        consultationFee: profileConsultFee,
        hospitalDepartment: profileDept,
        experience: profileExp,
        qualification: profileQuals.split(',').map((q) => q.trim()).filter(Boolean),
      });
      if (res.data.success) {
        await syncDetailedProfile();
        toast('Doctor profile updated successfully!');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile.', 'error');
    }
    setProfileUpdating(false);
  };

  // Bind Socket listener for consultation room chat messages
  useEffect(() => {
    if (socket && activeConsultation) {
      // Listen for incoming consultation chats
      socket.on('receive-message', (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      return () => {
        socket.off('receive-message');
      };
    }
  }, [socket, activeConsultation]);

  const handleUpdateAvailability = async (e) => {
    e.preventDefault();
    setScheduleLoading(true);

    const formattedSlots = newSlotsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const updatedAvailability = [...availability];
    
    // Check if day already exists, if so overwrite slots
    const dayIndex = updatedAvailability.findIndex((a) => a.day === newDay);
    if (dayIndex >= 0) {
      updatedAvailability[dayIndex].slots = formattedSlots;
    } else {
      updatedAvailability.push({ day: newDay, slots: formattedSlots });
    }

    try {
      const res = await API.post('/doctors/availability', {
        availability: updatedAvailability,
      });

      if (res.data.success) {
        setAvailability(res.data.availability);
        toast('Weekly availability updated successfully.');
      }
    } catch (err) {
      toast('Failed to update clinical availability.', 'error');
    }
    setScheduleLoading(false);
  };

  const handleRemoveDayAvailability = async (dayToRemove) => {
    const updatedAvailability = availability.filter((a) => a.day !== dayToRemove);
    setScheduleLoading(true);
    try {
      const res = await API.post('/doctors/availability', {
        availability: updatedAvailability,
      });

      if (res.data.success) {
        setAvailability(res.data.availability);
        toast('Availability removed successfully.');
      }
    } catch (err) {
      toast('Removal failed.', 'error');
    }
    setScheduleLoading(false);
  };

  // Launch Active consultation room
  const handleLaunchConsultation = (app) => {
    setActiveConsultation(app);
    setChatMessages([]);
    setDiagnosis('');
    setSymptoms('');
    setMedicines([{ name: '', dosage: '1-0-1', frequency: 'after meals', duration: '5 days' }]);
    joinRoom(app._id); // Join room in socket
  };

  // Send private consult chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sendMessage(activeConsultation._id, chatInput.trim());
    setChatInput('');
  };

  // Compile and submit prescription
  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '1-0-1', frequency: 'after meals', duration: '5 days' }]);
  };

  const handleRemoveMedicineRow = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, field, val) => {
    const updatedMedicines = medicines.map((med, i) =>
      i === idx ? { ...med, [field]: val } : med
    );
    setMedicines(updatedMedicines);
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!diagnosis || !symptoms || medicines.some((m) => !m.name)) {
      return toast('Please fill in complete clinical parameters and medicines.', 'error');
    }

    setPrescriptionLoading(true);
    try {
      const res = await API.post('/prescriptions/add', {
        appointmentId: activeConsultation._id,
        symptoms,
        diagnosis,
        medicines,
      });

      if (res.data.success) {
        toast('Digital prescription PDF generated and compiled successfully!');
        setActiveConsultation(null);
        fetchDoctorData();
      }
    } catch (err) {
      toast('Failed to compile prescription.', 'error');
    }
    setPrescriptionLoading(false);
  };

  // Prompt pending verification screen if doctor pending admin audit
  if (user?.doctorDetails?.approvalStatus === 'pending') {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 glass-card rounded-3xl p-10 border border-white shadow-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertCircle className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Verification Pending</h2>
          <p className="text-slate-500 text-xs">
            Hello Dr. {user?.name}, your clinical certification documents are currently undergoing audit.
          </p>
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-left text-slate-600 border border-slate-100">
            <p className="font-bold text-slate-800 mb-1">Audit Details:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Assigned Department: {user?.doctorDetails?.hospitalDepartment || 'N/A'}</li>
              <li>Consultation Fee Cap: ₹{user?.doctorDetails?.consultationFee || 500}</li>
              <li>Expected Activation Timeline: 24-48 Hours</li>
            </ul>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">MEDIEASE ADMIN DESK</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-2xl bg-teal-50/50 relative overflow-hidden flex items-center justify-center text-teal-600 border border-slate-200 shrink-0">
            {user?.profileImage ? (
              <img
                src={getImageUrl(user.profileImage)}
                alt={user?.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Stethoscope className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Console</h1>
            <p className="text-slate-500 text-xs mt-1">
              Welcome, <span className="font-bold text-slate-800">Dr. {user?.name}</span> • Specialization: {user?.doctorDetails?.specialization}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-3xl p-5 border border-white shadow-xl flex flex-col space-y-2.5">
            {[
              { id: 'home', label: 'Clinical Home', icon: Stethoscope },
              { id: 'schedule', label: 'Manage Slot availability', icon: Calendar },
              { id: 'profile', label: 'Clinical Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveConsultation(null); // Close active consult room
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
              {/* ACTIVE CONSULTATION & PRESCRIPTION ISSUING DESK                */}
              {/* ============================================================== */}
              {activeConsultation ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="glass-card rounded-3xl p-6 border border-white shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <h3 className="font-extrabold text-slate-900 text-sm">Consultation with {activeConsultation.userId?.name}</h3>
                      </div>
                      <button
                        onClick={() => setActiveConsultation(null)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Exit Session
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Video call block */}
                      <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center text-white border border-slate-800">
                        {simulatedVideo ? (
                          <div className="w-full h-full flex flex-col justify-between p-4">
                            <span className="self-end px-2.5 py-0.5 rounded bg-emerald-500 text-[10px] font-bold tracking-widest uppercase">
                              Live Stream
                            </span>
                            <div className="flex items-center space-x-2 text-xs bg-slate-950/60 p-2 rounded-xl border border-white/10 max-w-fit">
                              <User className="h-4.5 w-4.5 text-teal-400" />
                              <span>{activeConsultation.userId?.name} (Patient)</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Camera Off</p>
                        )}
                      </div>

                      {/* private chat consult */}
                      <div className="flex flex-col h-64 border border-slate-150 rounded-2xl bg-white overflow-hidden justify-between">
                        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                          {chatMessages.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                              Private Consultation Feeds active. Exchange message parameters.
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
                        <form onSubmit={handleSendMessage} className="border-t border-slate-150 p-2 flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type advice parameters..."
                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
                          />
                          <button type="submit" className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700">
                            <Send className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* DIGITAL PRESCRIPTION COMPILER PANEL */}
                  <div className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6 bg-white">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Compile Patient digital prescription</h4>
                      <p className="text-slate-500 text-xs">Add symptoms, diagnoses, and medicines. Compiles HIPAA approved PDFKit invoice sheets.</p>
                    </div>

                    <form onSubmit={handleSubmitPrescription} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Symptoms</label>
                          <input
                            type="text"
                            required
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="e.g. Dry cough, high grade viral fever"
                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Diagnosis</label>
                          <input
                            type="text"
                            required
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="e.g. Acute bronchitis, viral influenza"
                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Medicines Grid rows */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prescribed Medicines</h5>
                          <button
                            type="button"
                            onClick={handleAddMedicineRow}
                            className="flex items-center text-xs font-bold text-teal-600 hover:text-teal-700"
                          >
                            <Plus className="h-4 w-4 mr-1 shrink-0" />
                            Add medicine row
                          </button>
                        </div>

                        {medicines.map((med, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                            {/* Med name */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine Name *</label>
                              <input
                                type="text"
                                required
                                value={med.name}
                                onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                                placeholder="e.g. Paracetamol 650mg"
                                className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-teal-500"
                              />
                            </div>

                            {/* Dosage */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosage *</label>
                              <input
                                type="text"
                                required
                                value={med.dosage}
                                onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                                placeholder="1-0-1"
                                className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-teal-500"
                              />
                            </div>

                            {/* Frequency */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequency *</label>
                              <input
                                type="text"
                                required
                                value={med.frequency}
                                onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                                placeholder="after meals"
                                className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-teal-500"
                              />
                            </div>

                            {/* Duration */}
                            <div className="space-y-1 flex gap-2 items-center">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration *</label>
                                <input
                                  type="text"
                                  required
                                  value={med.duration}
                                  onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                                  placeholder="5 days"
                                  className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-teal-500"
                                />
                              </div>
                              {medicines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedicineRow(idx)}
                                  className="p-2 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 shrink-0 self-end mt-4"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={prescriptionLoading}
                        className="glow-button flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
                      >
                        {prescriptionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <span>Complete Visit & Issue prescription PDF</span>
                        )}
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : null}

              {/* ============================================================== */}
              {/* TAB: CLINICAL HOME (VISITS QUEUE)                              */}
              {/* ============================================================== */}
              {activeTab === 'home' && !activeConsultation && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Active consultations timeline
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Patient</th>
                          <th className="pb-3">Scheduled Slot</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Billing Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No consultations booked in your queue.
                            </td>
                          </tr>
                        ) : (
                          appointments.map((app) => (
                            <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3.5">
                                <span className="font-bold block text-slate-800">{app.userId?.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Gender: {app.userId?.gender || 'male'}</span>
                              </td>
                              <td className="py-3.5 text-slate-600">
                                <span>{new Date(app.appointmentDate).toDateString()}</span>
                                <span className="block text-[10px] text-slate-400 font-semibold">{app.appointmentTime}</span>
                              </td>
                              <td className="py-3.5 text-slate-500 font-semibold capitalize">{app.consultationType}</td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wider ${
                                  app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                  app.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                  app.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                {app.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleLaunchConsultation(app)}
                                    className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-bold text-xs shadow shadow-teal-500/10 active:scale-95 transition-transform"
                                  >
                                    Join Video Room
                                  </button>
                                )}
                                {app.status === 'completed' && (
                                  <span className="text-[11px] text-slate-400 font-bold">Diagnosed</span>
                                )}
                                {app.status === 'pending' && (
                                  <span className="text-[11px] text-amber-500 font-bold">Awaiting Checkout</span>
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
              {/* TAB: MANAGE SCHEDULE AVAILABILITY                              */}
              {/* ============================================================== */}
              {activeTab === 'schedule' && !activeConsultation && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-8 bg-white"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Manage Slot Availability</h3>
                    <p className="text-slate-500 text-xs">Configure your weekly weekday planners. Patients can query and book these slots.</p>
                  </div>

                  <form onSubmit={handleUpdateAvailability} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {/* Day selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Weekday</label>
                      <select
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Slots array input */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Slots (Comma separated)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newSlotsInput}
                          onChange={(e) => setNewSlotsInput(e.target.value)}
                          placeholder="e.g. 09:00 AM, 11:00 AM, 02:00 PM"
                          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                        <button
                          type="submit"
                          disabled={scheduleLoading}
                          className="glow-button px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 shadow shadow-teal-500/10"
                        >
                          Sync
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Availability grids display */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Configured schedule</h4>
                    {availability.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                        No weekly clinical hours synchronized yet. Fill in values above to activate booking.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availability.map((dayObj) => (
                          <div
                            key={dayObj.day}
                            className="p-4 border border-slate-150 rounded-2xl bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <span className="font-extrabold text-slate-800 text-xs">{dayObj.day} Hours</span>
                              <div className="flex flex-wrap gap-1.5">
                                {dayObj.slots?.map((s) => (
                                  <span key={s} className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-bold">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveDayAvailability(dayObj.day)}
                              disabled={scheduleLoading}
                              className="px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 text-rose-600 font-bold text-xs shrink-0"
                            >
                              Remove Hours
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* TAB: CLINICAL PROFILE (PHOTO + PERSONAL DETAILS)               */}
              {/* ============================================================== */}
              {activeTab === 'profile' && !activeConsultation && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-8 bg-white"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Clinical Profile</h3>
                    <p className="text-slate-500 text-xs">Update your professional details and profile photo. Changes are visible to patients when booking.</p>
                  </div>

                  {/* Avatar Upload Block */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="h-28 w-28 rounded-2xl bg-teal-50/50 overflow-hidden flex items-center justify-center text-teal-600 border border-slate-200 shrink-0">
                      {profileImg ? (
                        <img
                          src={getImageUrl(profileImg)}
                          alt="Doctor Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Stethoscope className="h-12 w-12" />
                      )}
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                      <p className="text-sm font-bold text-slate-800">Profile Photo</p>
                      <p className="text-xs text-slate-400">Upload a professional headshot (.jpg, .png, .webp, max 5MB). This photo appears on your public doctor card.</p>
                      <label className={`inline-flex items-center px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer transition-colors ${
                        uploadingImage ? 'opacity-60 pointer-events-none' : ''
                      }`}>
                        {uploadingImage ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Uploading...</>
                        ) : (
                          'Upload Photo'
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleUploadAvatar}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={handleUpdateDoctorProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone</label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</label>
                        <select
                          value={profileGender}
                          onChange={(e) => setProfileGender(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Specialization</label>
                        <input
                          type="text"
                          value={profileSpecialization}
                          onChange={(e) => setProfileSpecialization(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Fee (₹)</label>
                        <input
                          type="number"
                          value={profileConsultFee}
                          onChange={(e) => setProfileConsultFee(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Years of Experience</label>
                        <input
                          type="number"
                          value={profileExp}
                          onChange={(e) => setProfileExp(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital Department</label>
                        <input
                          type="text"
                          value={profileDept}
                          onChange={(e) => setProfileDept(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Qualifications (comma-separated)</label>
                        <input
                          type="text"
                          value={profileQuals}
                          onChange={(e) => setProfileQuals(e.target.value)}
                          placeholder="e.g. MBBS, MD, FRCS"
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Address / Clinic Location</label>
                        <input
                          type="text"
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileUpdating}
                      className="glow-button flex items-center justify-center px-8 py-3 rounded-xl bg-teal-600 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
                    >
                      {profileUpdating ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
export default DoctorDashboard;
