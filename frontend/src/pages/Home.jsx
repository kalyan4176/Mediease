import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { motion } from 'framer-motion';
import { Stethoscope, Video, MessageSquare, Clock, ShieldCheck, Heart, Users, Star, HelpCircle, PhoneCall, Sparkles } from 'lucide-react';

export const Home = () => {
  const [topDoctors, setTopDoctors] = useState([]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await API.get('/doctors?limit=3');
        if (res.data.success) {
          setTopDoctors(res.data.doctors.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load top doctors:', err.message);
      }
    };
    fetchDoctors();
  }, []);

  const stats = [
    { count: '10k+', label: 'Digital Consultation Sessions', icon: Video },
    { count: '150+', label: 'Super Specialist Doctors', icon: Stethoscope },
    { count: '99.2%', label: 'Positive Patient Feedbacks', icon: Heart },
    { count: '24/7', label: 'Emergency Support Desks', icon: Clock },
  ];

  const specialties = [
    { name: 'General Medicine', desc: 'Routine audits, viral flu care, and general wellbeing.', icon: Stethoscope, bg: 'bg-teal-50 text-teal-600' },
    { name: 'Cardiology', desc: 'Heart checks, vascular blocks, and hypertension.', icon: Heart, bg: 'bg-rose-50 text-rose-600' },
    { name: 'Dermatology', desc: 'Skincare, psoriasis treatments, and allergies.', icon: Sparkles, bg: 'bg-amber-50 text-amber-600' },
    { name: 'Pediatrics', desc: 'Neonatal consults, vaccinations, and child development.', icon: Users, bg: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="space-y-20 pb-20 bg-slate-50">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-24 bg-gradient-to-br from-teal-50/60 via-white to-indigo-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold ring-1 ring-teal-600/10">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>NABL Certified Clinical Portal</span>
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-none">
              Consult Top Specialists <br />
              <span className="text-teal-600">Anytime, Anywhere.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-lg">
              Skip clinic queues. Get securely paired with certified clinical doctors for video consults, live chat advice, and digital prescription dispatches within minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <Link
                to="/doctors"
                className="glow-button flex items-center justify-center px-8 py-3.5 rounded-xl bg-teal-600 font-bold text-white text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-700"
              >
                Find Specialists
              </Link>
              <Link
                to="/services"
                className="flex items-center justify-center px-8 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 text-sm hover:bg-slate-50 transition-colors"
              >
                View Hospital Services
              </Link>
            </div>
          </motion.div>

          {/* Right Image/Design Overlay */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto max-w-md lg:max-w-none flex justify-center"
          >
            {/* Visual Glassmorphic Grid Card mockups instead of placeholders */}
            <div className="relative w-full aspect-square max-w-md rounded-3xl bg-gradient-to-br from-teal-500 to-indigo-600 p-8 shadow-2xl flex flex-col justify-between text-white overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between z-10">
                <span className="font-extrabold tracking-widest text-lg opacity-80">MEDIEASE</span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur">Active Room</span>
              </div>

              {/* Consultation Video UI Mockup */}
              <div className="glass-card rounded-2xl p-4 border border-white/20 text-slate-800 space-y-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                    Dr
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">Dr. Sarah Jenkins</p>
                    <p className="text-[10px] text-teal-200">Consultant Cardiologist</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/90 bg-white/10 p-2 rounded-xl border border-white/10">
                  <span className="flex items-center"><Video className="h-3 w-3 mr-1 text-emerald-300" /> WebRTC Active</span>
                  <span>14 mins logged</span>
                </div>
              </div>

              <div className="text-xs opacity-75 z-10 flex items-center justify-between pt-4 border-t border-white/10">
                <span>Secure H.264 Stream</span>
                <span>HIPAA Encrypted</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Stats Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center space-y-2 border border-slate-100"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.count}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. Clinical Specialties */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900">Explore Medical Specialties</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Book appointment slots across active departments with fully trained practitioners.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialties.map((spec, idx) => {
            const Icon = spec.icon;
            return (
              <div
                key={idx}
                className="hover-lift rounded-2xl bg-white p-6 border border-slate-150 shadow-sm space-y-4 cursor-pointer"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${spec.bg}`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">{spec.name}</h3>
                  <p className="text-xs text-slate-500 leading-normal">{spec.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4.Curated Top Doctors List */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Our Panel of Top Doctors</h2>
            <p className="text-slate-500 text-sm">
              Highly verified clinical practitioners with decades of active hospital service.
            </p>
          </div>
          <Link
            to="/doctors"
            className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center shrink-0"
          >
            <span>Browse all doctors</span>
            <span className="ml-1">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {topDoctors.length === 0 ? (
            // Curved visual fallbacks if database seeds are completely empty
            [1, 2, 3].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-slate-100/60 shadow-md flex flex-col space-y-4">
                <div className="h-40 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-xl">
                  Dr. Verified Specialist
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Cardiology Dept</span>
                    <span className="flex items-center text-amber-500"><Star className="h-3.5 w-3.5 fill-current mr-0.5" /> 4.9</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900">Dr. Sarah Jenkins</h3>
                  <p className="text-xs text-slate-400">12+ Years Experience • MD, MBBS</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-bold text-slate-900">₹700 / consult</span>
                  <Link to="/doctors" className="px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-bold hover:bg-teal-100">
                    Book Slot
                  </Link>
                </div>
              </div>
            ))
          ) : (
            topDoctors.map((doc) => (
              <div key={doc._id} className="hover-lift rounded-2xl bg-white p-5 border border-slate-150 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-44 rounded-xl bg-teal-50/50 relative overflow-hidden flex items-center justify-center text-teal-600">
                    {doc.userId?.profileImage ? (
                      <img
                        src={getImageUrl(doc.userId.profileImage)}
                        alt={doc.userId?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="h-16 w-16" />
                    )}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-teal-600">{doc.specialization}</span>
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                        {doc.ratings?.average || 5.0} ({doc.ratings?.count || 12})
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">Dr. {doc.userId?.name}</h3>
                    <p className="text-xs text-slate-400">
                      {doc.qualification?.join(', ')} • {doc.experience} Years Exp
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                  <span className="font-extrabold text-slate-900 text-sm">₹{doc.consultationFee} fee</span>
                  <Link
                    to={`/doctor-details/${doc._id}`}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs shadow-md shadow-teal-500/10 hover:bg-teal-700 transition-all"
                  >
                    View Schedule
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 5. Support / Emergency Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center z-10 relative">
            <div className="lg:col-span-2 space-y-4">
              <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
                Emergency Support
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">Need Urgent Clinical Support?</h2>
              <p className="text-slate-400 text-sm max-w-md">
                Our premium emergency ICU coordinates and dedicated clinical practitioners operate 24 hours a day, 7 days a week. Connect immediately.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <a
                href="tel:18004569000"
                className="flex items-center justify-center space-x-2.5 px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base transition-colors shadow-lg shadow-rose-600/20"
              >
                <PhoneCall className="h-5 w-5 animate-pulse" />
                <span>Call 1800-456-9000</span>
              </a>
              <span className="text-center text-xs text-slate-500">Free priority line for ambulance dispatches</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Frequently Answered Queries</h2>
          <p className="text-slate-500 text-sm">Got questions? We have compiled standard clinic operations details.</p>
        </div>

        <div className="space-y-4">
          {[
            { q: 'How does digital consultation operate?', a: 'You select a certified doctor based on department and availability, schedule a slot, and clear the consultation fee. Once confirmed, you can launch a secure audio-video WebRTC panel inside your dashboard to consult directly.' },
            { q: 'Where do I fetch my prescription PDFs?', a: 'Immediately after your consultation, your doctor compiles your medication dossier in the Doctor Portal. A verified PDF sheet is generated, which appears instantly on your Patient dashboard records list for downloads.' },
            { q: 'Is my medical history secure?', a: 'Absolutely. Mediease portal systems are completely HIPAA compliant, securing files behind verified JWT layers, role visual authorization filters, and secure MongoDB data mapping.' }
          ].map((faq, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-100/60 shadow-sm space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center">
                <HelpCircle className="h-4.5 w-4.5 text-teal-600 mr-2 shrink-0" />
                {faq.q}
              </h3>
              <p className="text-xs text-slate-500 leading-normal pl-6.5">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default Home;
