import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Lock, Unlock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const Header = () => {
  const { connectionStatus, data, isAdmin, logoutAdmin, setShowAdminModal, navigate, currentView } = useApp();

  const handleLogoClick = () => {
    if (currentView === 'recording') {
      if (window.confirm('確定返回？目前進行中的會議紀錄將不會儲存。')) {
        navigate('home');
      }
    } else {
      navigate('home');
    }
  };

  return (
    <header className="glass-header">
      <div className="header-content">
        <h1 className="logo" onClick={handleLogoClick}>
          <Zap className="text-glow" size={26} /> MAKI <span className="subtitle">會議積分系統</span>
        </h1>

        <div className="nav-actions">
          {connectionStatus === 'connecting' && (
            <div className="status-badge connecting">
              <Loader2 className="animate-spin" size={14} /> 連線中...
            </div>
          )}

          {connectionStatus === 'online' && (
            <div className="status-badge online">
              <CheckCircle2 size={14} /> 已連線 ({data.users?.length || 0} 人)
            </div>
          )}

          {connectionStatus === 'offline' && (
            <div className="status-badge offline">
              <AlertTriangle size={14} /> 連線失敗
            </div>
          )}

          {isAdmin ? (
            <button className="btn-secondary" onClick={logoutAdmin}>
              <Unlock size={16} /> 管理員登出
            </button>
          ) : (
            <button className="btn-secondary" onClick={() => setShowAdminModal(true)}>
              <Lock size={16} /> 管理員登入
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
