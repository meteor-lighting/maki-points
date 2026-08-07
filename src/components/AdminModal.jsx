import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, X } from 'lucide-react';

export const AdminModal = () => {
  const { showAdminModal, setShowAdminModal, loginAdmin } = useApp();
  const [password, setPassword] = useState('');

  if (!showAdminModal) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = loginAdmin(password);
    if (success) {
      setPassword('');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={20} className="text-glow" /> 管理員權限驗證
          </h3>
          <button
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            onClick={() => setShowAdminModal(false)}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="admin-password">請輸入管理員密碼：</label>
            <input
              type="password"
              id="admin-password"
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn-secondary" onClick={() => setShowAdminModal(false)}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              確認登入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
