import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Settings, RefreshCw, X } from 'lucide-react';

export const AdminModal = () => {
  const { showAdminModal, setShowAdminModal, loginAdmin, getGasApiUrl, updateApiUrl } = useApp();
  const [password, setPassword] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState('');

  if (!showAdminModal) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = loginAdmin(password);
    if (success) {
      setPassword('');
    }
  };

  const handleSaveApiUrl = () => {
    if (apiUrlInput.trim()) {
      updateApiUrl(apiUrlInput.trim());
    } else {
      alert('請輸入有效的網址');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
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
              placeholder="預設 8888"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
            <button type="button" className="btn-secondary" onClick={() => setShowAdminModal(false)}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              確認登入
            </button>
          </div>
        </form>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '20px 0' }} />

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#fbbf24' }}>
            <Settings size={16} /> 開發者與 API 連線設定
          </p>
          <p style={{ fontSize: '0.8rem', marginBottom: 10 }}>目前 API 網址：</p>
          <div
            style={{
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              background: 'rgba(0,0,0,0.4)',
              padding: 8,
              borderRadius: 6,
              marginBottom: 10
            }}
          >
            {getGasApiUrl()}
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="手動貼入新的 GAS API URL (需包含 /exec)"
              value={apiUrlInput}
              onChange={(e) => setApiUrlInput(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
              onClick={handleSaveApiUrl}
            >
              <RefreshCw size={14} /> 更新 API 網址並重載
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
