import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Users, CreditCard, Stethoscope, CheckCircle, 
  XCircle, Award, Layout, Briefcase, Plus, Loader2, Trash2 
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors', 'departments', 'payments'
  const [loading, setLoading] = useState(true);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [payments, setPayments] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending doctors
      const pendingRes = await API.get('/doctors/admin/pending');
      if (pendingRes.data.success) {
        setPendingDoctors(pendingRes.data.doctors);
      }

      // 2. Fetch approved doctors
      const approvedRes = await API.get('/doctors');
      if (approvedRes.data.success) {
        setApprovedDoctors(approvedRes.data.doctors);
      }

      // 3. Fetch payment logs
      const payRes = await API.get('/payments/history');
      if (payRes.data.success) {
        setPayments(payRes.data.payments);
      }

      // 4. Fetch departments
      const deptRes = await API.get('/departments');
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return alert('Department name is required');
    setDeptLoading(true);
    try {
      const res = await API.post('/departments', {
        name: newDeptName.trim(),
        description: newDeptDesc.trim(),
      });
      if (res.data.success) {
        alert('Department created successfully');
        setShowDeptModal(false);
        setNewDeptName('');
        setNewDeptDesc('');
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
    setDeptLoading(false);
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await API.delete(`/departments/${deptId}`);
      if (res.data.success) {
        alert('Department deleted successfully');
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleApproveDoctor = async (docId) => {
    if (!window.confirm('Do you verify these qualifications and approve this doctor slot?')) return;
    try {
      const res = await API.put(`/doctors/approve/${docId}`, { status: 'approved' });
      if (res.data.success) {
        alert('Doctor activated and approved successfully.');
        fetchAdminData();
      }
    } catch (err) {
      alert('Verification approval failed.');
    }
  };

  const handleRejectDoctor = async (docId) => {
    if (!window.confirm('Are you sure you want to reject this clinical application?')) return;
    try {
      const res = await API.put(`/doctors/approve/${docId}`, { status: 'rejected' });
      if (res.data.success) {
        alert('Doctor application status updated to rejected.');
        fetchAdminData();
      }
    } catch (err) {
      alert('Rejection failed.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-left">Admin Console</h1>
          <p className="text-slate-500 text-xs mt-1">
            Welcome, System Administrator <span className="font-bold text-slate-800">{user?.name}</span>
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-slate-900">
              {pendingDoctors.length}
            </span>
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Pending audits</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Stethoscope className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-slate-900">
              {approvedDoctors.length}
            </span>
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Active Physicians</span>
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
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Gross revenue</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Layout className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-slate-900">
              {departments.length}
            </span>
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Hospital Units</span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Sidebar Navigation + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-3xl p-5 border border-white shadow-xl flex flex-col space-y-2.5">
            {[
              { id: 'doctors', label: 'Doctor Applications Desk', icon: Stethoscope },
              { id: 'departments', label: 'Hospital departments', icon: Layout },
              { id: 'payments', label: 'Financial Transactions', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
              {/* TAB: DOCTOR APPLICATIONS DESK                                  */}
              {/* ============================================================== */}
              {activeTab === 'doctors' && (
                <motion.div
                  key="doctors"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Pending applications list */}
                  <div className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                      Pending Doctor applications ({pendingDoctors.length})
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3">Practitioner Details</th>
                            <th className="pb-3">Qualifications</th>
                            <th className="pb-3">Expected Unit</th>
                            <th className="pb-3">Consult Fee</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingDoctors.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                No doctor applications awaiting review.
                              </td>
                            </tr>
                          ) : (
                            pendingDoctors.map((doc) => (
                              <tr key={doc._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-4">
                                  <span className="font-bold block text-slate-800">Dr. {doc.userId?.name}</span>
                                  <span className="text-[10px] text-slate-400">Exp: {doc.experience} Years</span>
                                </td>
                                <td className="py-4 text-slate-600">
                                  <div className="flex flex-wrap gap-1">
                                    {doc.qualification?.map((q) => (
                                      <span key={q} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[9px] font-bold">
                                        {q}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-4 text-slate-500 font-semibold">{doc.specialization}</td>
                                <td className="py-4 font-extrabold text-slate-900">₹{doc.consultationFee}</td>
                                <td className="py-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleApproveDoctor(doc._id)}
                                    className="p-2 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shrink-0"
                                    title="Verify Credentials"
                                  >
                                    <CheckCircle className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectDoctor(doc._id)}
                                    className="p-2 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 shrink-0"
                                    title="Reject Application"
                                  >
                                    <XCircle className="h-4.5 w-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Active doctors audit */}
                  <div className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6 bg-white">
                    <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                      Active Medical Panel ({approvedDoctors.length})
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3">Doctor</th>
                            <th className="pb-3">Specialty</th>
                            <th className="pb-3">Qualifications</th>
                            <th className="pb-3">Hospital Department</th>
                            <th className="pb-3 text-right">Consultations Logged</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedDoctors.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400">
                                No active physicians on the panel.
                              </td>
                            </tr>
                          ) : (
                            approvedDoctors.map((doc) => (
                              <tr key={doc._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-3 font-bold text-slate-800">
                                  Dr. {doc.userId?.name}
                                </td>
                                <td className="py-3 text-teal-600 font-bold">{doc.specialization}</td>
                                <td className="py-3 text-slate-400">{doc.qualification?.join(', ')}</td>
                                <td className="py-3 text-slate-500 font-semibold">{doc.hospitalDepartment}</td>
                                <td className="py-3 text-right font-extrabold text-slate-900">
                                  {doc.ratings?.count || 12} visits
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* TAB: HOSPITAL DEPARTMENTS                                       */}
              {/* ============================================================== */}
              {activeTab === 'departments' && (
                <motion.div
                  key="departments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Active Hospital Specialties</h3>
                    <button
                      onClick={() => setShowDeptModal(true)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow"
                    >
                      Create Department
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {departments.length === 0 ? (
                      <div className="sm:col-span-2 py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                        No specialties configured yet. Create a department using the button above.
                      </div>
                    ) : (
                      departments.map((dept) => (
                        <div
                          key={dept._id}
                          className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4 relative"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base">{dept.name}</h4>
                              {dept.description && (
                                <p className="text-slate-500 text-xs mt-1">{dept.description}</p>
                              )}
                              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-1.5">Clinical Unit</p>
                            </div>
                            <button
                              onClick={() => handleDeleteDepartment(dept._id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-150">
                              <span className="block text-slate-400 font-medium">Physicians</span>
                              <span className="font-extrabold text-slate-900 text-lg">{dept.activeDoctors || 0} Slots</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-150">
                              <span className="block text-slate-400 font-medium">Consultations</span>
                              <span className="font-extrabold text-slate-900 text-lg">{dept.grossConsults || 0} Visits</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Create Department Modal */}
                  {showDeptModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <h4 className="font-extrabold text-slate-900 text-sm">Create New Department</h4>
                          <button
                            onClick={() => setShowDeptModal(false)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                          >
                            Close
                          </button>
                        </div>
                        <form onSubmit={handleCreateDepartment} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Department Name *</label>
                            <input
                              type="text"
                              required
                              value={newDeptName}
                              onChange={(e) => setNewDeptName(e.target.value)}
                              placeholder="e.g. Cardiology"
                              className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                            <textarea
                              value={newDeptDesc}
                              onChange={(e) => setNewDeptDesc(e.target.value)}
                              placeholder="Describe clinical care details..."
                              rows={3}
                              className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-teal-500"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={deptLoading}
                            className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow flex items-center justify-center"
                          >
                            {deptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Specialty Unit'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* TAB: FINANCIAL TRANSACTIONS                                     */}
              {/* ============================================================== */}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-3xl p-8 border border-white shadow-xl space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Secure Hospital Transaction logs
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Transaction ID</th>
                          <th className="pb-3">Patient Account</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No financial invoice transactions found.
                            </td>
                          </tr>
                        ) : (
                          payments.map((pay) => (
                            <tr key={pay._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3.5 font-mono font-bold text-slate-800">
                                {pay.transactionId}
                              </td>
                              <td className="py-3.5 text-slate-600 font-bold">
                                {pay.userId?.name || 'Patient Account'}
                                <span className="block text-[10px] text-slate-400 font-medium">{pay.userId?.email}</span>
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
    </div>
  );
};
export default AdminDashboard;
