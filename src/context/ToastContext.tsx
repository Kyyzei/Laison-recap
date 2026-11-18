import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types/common';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message: string, duration = 4000) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message: string) => addToast('success', title, message), [addToast]);
  const error = useCallback((title: string, message: string) => addToast('error', title, message, 6000), [addToast]);
  const warning = useCallback((title: string, message: string) => addToast('warning', title, message, 5000), [addToast]);
  const info = useCallback((title: string, message: string) => addToast('info', title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => {
          let bgStyle = 'bg-white border-slate-200 text-slate-800';
          let icon = <Info className="w-5 h-5 text-sky-500" />;

          if (toast.type === 'success') {
            bgStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
          } else if (toast.type === 'error') {
            bgStyle = 'bg-rose-50 border-rose-300 text-rose-950';
            icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgStyle = 'bg-amber-50 border-amber-300 text-amber-950';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
          } else {
            bgStyle = 'bg-sky-50 border-sky-300 text-sky-950';
            icon = <Info className="w-5 h-5 text-sky-600 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border transition-all duration-300 animate-in slide-in-from-bottom-3 ${bgStyle}`}
            >
              <div className="mr-3 mt-0.5">{icon}</div>
              <div className="flex-1 mr-2 min-w-0">
                <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
                <p className="text-xs mt-1 text-slate-600 break-words leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

