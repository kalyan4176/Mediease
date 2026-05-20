import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Stethoscope, Mail, Lock, Phone, MapPin, Clipboard, Award, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

export const Signup = () => {
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCard, setSuccessCard] = useState(false);
  const navigate = useNavigate();

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [address, setAddress] = useState('');

  // Doctor specific fields
  const [specialization, setSpecialization] = useState('General Medicine');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');
  const [hospitalDepartment, setHospitalDepartment] = useState('Outpatient Services');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await API.get('/departments');
        if (res.data.success) {
          setDepartments(res.data.departments);
          if (res.data.departments.length > 0) {
            setSpecialization(res.data.departments[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&_\-#]/.test(pwd)) score++;
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Very Weak', color: 'bg-rose-500' },
      { score: 2, label: 'Weak', color: 'bg-orange-500' },
      { score: 3, label: 'Fair', color: 'bg-amber-500' },
      { score: 4, label: 'Strong', color: 'bg-teal-500' },
      { score: 5, label: 'Very Strong', color: 'bg-emerald-500' },
    ];
    return levels[score];
  };

  const passwordStrength = getPasswordStrength(password);

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ characters with uppercase, lowercase, a number, and a special character (@$!%*?&_-#).');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in all mandatory fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (role === 'patient') {
        const res = await API.post('/auth/register', {
          name, email, password, phone, gender, address,
        });
        setLoading(false);
        if (res.data.success) {
          setSuccessCard(true);
        }
      } else {
        const res = await API.post('/auth/register-doctor', {
          name, email, password, phone, gender, address,
          specialization, experience,
          qualification: qualification.split(',').map((q) => q.trim()),
          consultationFee, hospitalDepartment,
        });
        setLoading(false);
        if (res.data.success) {
          setSuccessCard(true);
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  if (successCard) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 glass-card rounded-3xl p-10 border border-white shadow-2xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <CheckCircle className="h-10 w-10 animate-bounce" />
          </div>

          {role === 'patient' ? (
            <>
              <h2 className="text-3xl font-extrabold text-slate-900">Account Created!</h2>
              <p className="text-slate-500 text-sm">
                Welcome to Mediease, <span className="font-bold text-slate-800">{name}</span>! Your account is ready. Sign in to book consultations.
              </p>
              <div className="rounded-2xl bg-emerald-50 p-4 text-left text-xs text-emerald-700 border border-emerald-100">
                <p className="font-bold mb-1">✅ You can now log in with:</p>
                <p>Email: <span className="font-mono font-bold">{email}</span></p>
                <p>Password: your chosen password</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-extrabold text-slate-900">Application Received</h2>
              <p className="text-slate-500 text-sm">
                Thank you for registering, Dr. <span className="font-bold text-slate-800">{name}</span>! Your application is pending review.
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs text-slate-600 border border-slate-100">
                <p className="font-bold text-slate-800 mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Our admin desk will audit your qualification records.</li>
                  <li>After approval, you can log in and manage appointments.</li>
                </ul>
              </div>
            </>
          )}

          <Link
            to="/login"
            className="glow-button block w-full py-3 rounded-xl bg-teal-600 font-semibold text-white text-sm shadow-md hover:bg-teal-700"
          >
            {role === 'patient' ? 'Sign In Now' : 'Return to Login'}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Join Mediease Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Register below to book consultations or consult patients online
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex justify-center p-1 rounded-2xl bg-slate-150/70 border border-slate-200/50 backdrop-blur max-w-sm mx-auto">
          <button
            onClick={() => { setRole('patient'); setError(''); }}
            className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              role === 'patient'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-teal-600'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Patient Onboarding</span>
          </button>
          <button
            onClick={() => { setRole('doctor'); setError(''); }}
            className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              role === 'doctor'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-teal-600'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Doctor Application</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 border border-white shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
                <ShieldAlert className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Password with strength meter */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                    placeholder="Min 8 chars, uppercase, number, symbol"
                  />
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all ${
                            passwordStrength.score >= i ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] font-bold ${
                      passwordStrength.score <= 2 ? 'text-rose-500' :
                      passwordStrength.score === 3 ? 'text-amber-500' : 'text-emerald-600'
                    }`}>
                      {passwordStrength.label} — must include uppercase, lowercase, number & special char (@$!%*?&_-#)
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm Password *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-1 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200 bg-white focus:border-teal-500 ring-teal-500'
                    }`}
                    placeholder="Re-enter your password"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[10px] font-bold text-rose-500">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[10px] font-bold text-emerald-600">✓ Passwords match</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                    placeholder="Streets, City, Zip"
                  />
                </div>
              </div>
            </div>

            {/* Doctor Specific Form Fields */}
            <AnimatePresence mode="wait">
              {role === 'doctor' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5 border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-teal-500 pl-2">Clinical Details</h3>
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Specialization</label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                    >
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept._id} value={dept.name}>{dept.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="General Medicine">General Medicine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Orthopedics">Orthopedics</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Experience */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Experience (Years) *</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Clipboard className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        required
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                        placeholder="e.g. 8"
                      />
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Qualifications (Comma Separated) *</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Award className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                        placeholder="MBBS, MD Cardiology"
                      />
                    </div>
                  </div>

                  {/* Consultation Fee */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Fee (INR) *</label>
                    <input
                      type="number"
                      required
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                      placeholder="500"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital Department *</label>
                    <input
                      type="text"
                      required
                      value={hospitalDepartment}
                      onChange={(e) => setHospitalDepartment(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
                      placeholder="Outpatient Services, Cardiology Block C"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="glow-button flex w-full items-center justify-center rounded-xl bg-teal-600 py-3 font-bold text-white text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-700 focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100/60 pt-6">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Signup;


