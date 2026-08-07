import React from 'react';
import { useApp } from '../context/AppContext';
import { Signal, Edit, RotateCcw, X } from 'lucide-react';

export const ConnectionHelpModal = () => {
  const { showConnectionHelp, setShowConnectionHelp, getGasApiUrl, updateApiUrl } = useApp();

  if (!showConnectionHelp) return null;

  const handleManualChange = () => {
    const current = getGasApiUrl();
    const nextUrl = prompt('請貼上新的 Google Apps Script 網頁應用程式網址 (需包含 /exec)：', current);
    if (nextUrl && nextUrl.trim().startsWith('http')) {
      updateApiUrl(nextUrl.trim());
    } else if (nextUrl !== null) {
      alert('網址格式不正確，請確認包含 http 與 /exec');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowConnectionHelp(false)}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24' }}>
            <Signal size={20} /> 連線診斷與設定
          </h3>
          <button
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            onClick={() => setShowConnectionHelp(false)}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ marginBottom: 14, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          系統無法成功取得 API 資料。請確認 Google Apps Script 部署與連線設定：
        </p>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.85rem' }}>目前的 GAS API URL：</label>
          <div
            style={{
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              background: 'rgba(0,0,0,0.4)',
              padding: 10,
              borderRadius: 6,
              marginTop: 4
            }}
          >
            {getGasApiUrl()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" onClick={handleManualChange}>
            <Edit size={16} /> 手動重新設定網址
          </button>
          <button className="btn-secondary" onClick={() => window.location.reload()} style={{ justifyContent: 'center' }}>
            <RotateCcw size={16} /> 重新整理網頁
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowConnectionHelp(false)}
            style={{ justifyContent: 'center', background: 'transparent', border: 'none' }}
          >
            暫時關閉
          </button>
        </div>
      </div>
    </div>
  );
};
