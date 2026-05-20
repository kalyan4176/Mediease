import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { motion } from 'framer-motion';
import { Search, Stethoscope, Star, SlidersHorizontal, Loader2, Sparkles } from 'lucide-react';

export const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [maxFee, setMaxFee] = useState('');

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let url = '/doctors?approvalStatus=approved';
      if (specialization) url += `&specialization=${specialization}`;
      if (maxFee) url += `&maxFee=${maxFee}`;
      if (search) url += `&search=${search}`;

      const res = await API.get(url);
      if (res.data.success) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors list:', err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialization, maxFee]); // Trigger fetch on select updates immediately

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Medical Panel</h1>
        <p className="text-slate-500 text-sm max-w-lg">
          Filter and consult with certified specialist doctors. Select a practitioner to view schedules and book consultation slots.
        </p>
      </div>

      {/* Filters & Search Header */}
      <div className="glass-card rounded-3xl p-6 border border-white shadow-xl grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors by name..."
            className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-teal-500 transition-all focus:border-teal-500 focus:ring-1"
          />
          <button type="submit" className="absolute left-3 top-3.5 text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </button>
        </form>

        {/* Specialization Filter */}
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="block w-full rounded-2xl border border-slate-200 bg-white py-3 px-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
        >
          <option value="">All Specialities</option>
          <option value="General Medicine">General Medicine</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Dermatology">Dermatology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Neurology">Neurology</option>
          <option value="Orthopedics">Orthopedics</option>
        </select>

        {/* Max Fee Filter */}
        <select
          value={maxFee}
          onChange={(e) => setMaxFee(e.target.value)}
          className="block w-full rounded-2xl border border-slate-200 bg-white py-3 px-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
        >
          <option value="">Any Consultation Fee</option>
          <option value="400">Under ₹400</option>
          <option value="600">Under ₹600</option>
          <option value="800">Under ₹800</option>
          <option value="1000">Under ₹1000</option>
        </select>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Stethoscope className="h-8 w-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">No doctors found</h3>
          <p className="text-slate-400 text-xs max-w-xs mx-auto">
            Try adjusting your search keywords, specialization tags, or maximum consultation fee limits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doc) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="hover-lift rounded-2xl bg-white p-5 border border-slate-150 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Doctor Visual Cover */}
                <div className="h-44 rounded-xl bg-teal-50 relative overflow-hidden flex items-center justify-center text-teal-600">
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

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-teal-600">{doc.specialization}</span>
                    <span className="flex items-center text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                      {doc.ratings?.average || 5.0} ({doc.ratings?.count || 12})
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Dr. {doc.userId?.name || 'Practitioner'}</h3>
                  <p className="text-xs text-slate-400">
                    {doc.qualification?.join(', ')} • {doc.experience} Years Exp
                  </p>
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                    Dep: {doc.hospitalDepartment}
                  </p>
                </div>
              </div>

              {/* Fee & Action Link */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">Consultation Fee</span>
                  <span className="font-extrabold text-slate-900 text-base">₹{doc.consultationFee}</span>
                </div>
                <Link
                  to={`/doctor-details/${doc._id}`}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs shadow-md shadow-teal-500/10 hover:bg-teal-700 transition-all"
                >
                  Book Slot
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Doctors;
