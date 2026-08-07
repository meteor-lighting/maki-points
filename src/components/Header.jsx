import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Lock, Unlock, Loader2, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

export const Header = () => {
  const {
    connectionStatus,
    data,
    isAdmin,
    logoutAdmin,
    setShowAdminModal,
    navigate,
    currentView,
    loadData,
    showToast,
    lang,
    toggleLang,
    t
  } = useApp();

  const handleLogoClick = () => {
    if (currentView === 'recording') {
      if (window.confirm('確定返回？目前進行中的會議紀錄將不會儲存。')) {
        navigate('home');
      }
    } else {
      navigate('home');
    }
  };

  const handleForceRefreshData = async () => {
    if (connectionStatus === 'connecting') return;
    try {
      showToast('🔄 正在與 Google 試算表強制同步數據...');
      await loadData(true);
      showToast('✅ 數據已與試算表同步完成！');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="glass-header">
      <div className="header-content">
        <h1 className="logo" onClick={handleLogoClick}>
          <Zap className="text-glow" size={26} /> {t('appName')} <span className="subtitle">{t('appSubtitle')}</span>
        </h1>

        <div className="nav-actions">
          {/* Language Toggle Button */}
          <button
            className="btn-secondary"
            onClick={toggleLang}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            title="切換語言 / Switch Language"
          >
            <Globe size={14} /> {lang === 'zh' ? 'EN' : '中文'}
          </button>

          {connectionStatus === 'connecting' && (
            <div className="status-badge connecting" title={t('connecting')}>
              <Loader2 className="animate-spin" size={14} /> {t('connecting')}
            </div>
          )}

          {connectionStatus === 'online' && (
            <div
              className="status-badge online"
              onClick={handleForceRefreshData}
              title="點擊強制與 Google 試算表同步更新數據"
            >
              <CheckCircle2 size={14} /> {t('connected')} ({data.users?.length || 0} {t('peopleCount')})
            </div>
          )}

          {connectionStatus === 'offline' && (
            <div
              className="status-badge offline"
              onClick={handleForceRefreshData}
              title="點擊重試與 Google 試算表連線"
            >
              <AlertTriangle size={14} /> {t('offline')}
            </div>
          )}

          {isAdmin ? (
            <button className="btn-secondary" onClick={logoutAdmin}>
              <Unlock size={16} /> {t('adminLogout')}
            </button>
          ) : (
            <button className="btn-secondary" onClick={() => setShowAdminModal(true)}>
              <Lock size={16} /> {t('adminLogin')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
