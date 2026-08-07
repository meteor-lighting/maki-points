import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="toast-container">
      <div className="toast">
        <CheckCircle size={18} style={{ color: '#34d399' }} />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
