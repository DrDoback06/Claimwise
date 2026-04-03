import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ id, message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500'
  };

  const Icon = icons[type] || Info;

  return (
    <div className={`${colors[type]} border-2 rounded-lg shadow-lg p-4 mb-2 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      <Icon className="w-5 h-5 text-white flex-shrink-0" />
      <p className="text-white text-sm flex-1">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-white hover:text-gray-200 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

