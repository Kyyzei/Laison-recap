import React from 'react';
import { AlertTriangle, Trash2, RefreshCw, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  let icon = <Trash2 className="w-6 h-6 text-rose-600" />;
  let iconBg = 'bg-rose-100';
  let buttonStyle = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200';

  if (variant === 'warning') {
    icon = <AlertTriangle className="w-6 h-6 text-amber-600" />;
    iconBg = 'bg-amber-100';
    buttonStyle = 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200';
  } else if (variant === 'info') {
    icon = <Info className="w-6 h-6 text-sky-600" />;
    iconBg = 'bg-sky-100';
    buttonStyle = 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>{icon}</div>
            <div className="space-y-1 pr-6">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all ${buttonStyle}`}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

