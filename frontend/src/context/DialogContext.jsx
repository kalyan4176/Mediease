import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, HelpCircle, X } from 'lucide-react';

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null); // { type: 'alert'|'confirm', title, message, resolve }

  // 1. Toast function
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // 2. Alert function (returns Promise)
  const showAlert = useCallback((message, title = 'Notification') => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        title,
        message,
        resolve: () => {
          setDialog(null);
          resolve(true);
        }
      });
    });
  }, []);

  // 3. Confirm function (returns Promise)
  const showConfirm = useCallback((message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        title,
        message,
        resolve: (result) => {
          setDialog(null);
          resolve(result);
        }
      });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ toast: showToast, alert: showAlert, confirm: showConfirm }}>
      {children}

      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-md border ${
                t.type === 'success'
                  ? 'bg-emerald-500/90 border-emerald-400 text-white'
                  : t.type === 'error'
                  ? 'bg-rose-500/90 border-rose-400 text-white'
                  : 'bg-slate-800/90 border-slate-700 text-white'
              }`}
            >
              <div className="mt-0.5">
                {t.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-100" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-rose-100" />
                ) : (
                  <Info className="h-5 w-5 text-slate-100" />
                )}
              </div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                className="text-white/75 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Dialog Container */}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-150 p-6 shadow-2xl max-w-sm w-full space-y-5 text-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  dialog.type === 'confirm' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
                }`}>
                  {dialog.type === 'confirm' ? (
                    <HelpCircle className="h-6 w-6" />
                  ) : (
                    <Info className="h-6 w-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {dialog.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {dialog.message}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                {dialog.type === 'confirm' && (
                  <button
                    onClick={() => dialog.resolve(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => dialog.resolve(true)}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md transition-all ${
                    dialog.type === 'confirm' 
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' 
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/10'
                  }`}
                >
                  {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
