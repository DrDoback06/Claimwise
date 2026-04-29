import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import toastService from '../services/toastService';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={toastService.remove.bind(toastService)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

