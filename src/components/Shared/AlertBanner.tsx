import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface AlertBannerProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  details?: string;
  onClose?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  details,
  onClose,
  className = '',
}) => {
  const styles = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      detailText: 'text-rose-700 bg-rose-100/60',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      detailText: 'text-amber-800 bg-amber-100/60',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      icon: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />,
      detailText: 'text-indigo-800 bg-indigo-100/60',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      detailText: 'text-emerald-800 bg-emerald-100/60',
    },
  }[type];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${styles.bg} ${className}`}>
      {styles.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold mb-0.5">{title}</h4>}
        <p className="text-sm leading-relaxed">{message}</p>
        {details && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer font-medium hover:underline opacity-80">
              Technical Details
            </summary>
            <pre className={`mt-1.5 p-2 rounded overflow-x-auto font-mono text-[11px] ${styles.detailText}`}>
              {details}
            </pre>
          </details>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
