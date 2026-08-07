import React from 'react';
import { useApp } from '../context/AppContext';
import { FileSignature, UserCheck, BarChart3, Gift, AlertTriangle, RefreshCw } from 'lucide-react';

export const HomeView = () => {
  const { navigate, isAdmin, setPersonalStatsUser, data, error, loadData, connectionStatus, t } = useApp();

  const handlePersonalStatsClick = () => {
    if (data.users && data.users.length > 0) {
      setPersonalStatsUser(data.users[0]);
    } else {
      alert('同仁資料載入中或無法連線，請稍後重試。');
    }
  };

  return (
    <section className="view-section glass-panel fade-in">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📊 {t('homeTitle')}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>{t('homeSubtitle')}</p>
      </div>

      {connectionStatus === 'offline' && error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171' }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => loadData(true)}>
            <RefreshCw size={14} /> 重試連線
          </button>
        </div>
      )}

      <div className="action-cards">
        <div className="action-card" onClick={() => navigate('create')}>
          <div className="card-icon gradient-1">
            <FileSignature size={26} />
          </div>
          <h3>{t('createMeeting')}</h3>
          <p>{t('createMeetingDesc')}</p>
        </div>

        <div className="action-card" onClick={handlePersonalStatsClick}>
          <div className="card-icon gradient-4">
            <UserCheck size={26} />
          </div>
          <h3>{t('personalStats')}</h3>
          <p>{t('personalStatsDesc')}</p>
        </div>

        <div className="action-card" onClick={() => navigate('stats')}>
          <div className="card-icon gradient-2">
            <BarChart3 size={26} />
          </div>
          <h3>{t('historyAndRankings')}</h3>
          <p>{t('historyAndRankingsDesc')}</p>
        </div>

        <div className="action-card" onClick={() => navigate('exchange')}>
          {!isAdmin && <span className="admin-tag">{t('adminTag')}</span>}
          <div className="card-icon gradient-3">
            <Gift size={26} />
          </div>
          <h3>{t('prizeExchange')}</h3>
          <p>{t('prizeExchangeDesc')}</p>
        </div>
      </div>
    </section>
  );
};
