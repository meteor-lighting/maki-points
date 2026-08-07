import React from 'react';
import { useApp } from '../context/AppContext';
import { FileSignature, UserCheck, BarChart3, Gift, Settings } from 'lucide-react';

export const HomeView = () => {
  const { navigate, isAdmin, setPersonalStatsUser, data, setShowConnectionHelp } = useApp();

  const handlePersonalStatsClick = () => {
    if (data.users && data.users.length > 0) {
      setPersonalStatsUser(data.users[0]);
    } else {
      alert('同仁資料載入中，請稍後...');
    }
  };

  return (
    <section className="view-section glass-panel fade-in">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📊 會議積分管理系統
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>請點選您要執行的功能：</p>
        <button
          className="btn-secondary"
          onClick={() => setShowConnectionHelp(true)}
          style={{ marginTop: 12, fontSize: '0.85rem', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)' }}
        >
          <Settings size={14} /> 一直連不上？點我手動更新或診斷 API 網址
        </button>
      </div>

      <div className="action-cards">
        <div className="action-card" onClick={() => navigate('create')}>
          <div className="card-icon gradient-1">
            <FileSignature size={26} />
          </div>
          <h3>會議紀錄</h3>
          <p>開啟一場新會議，記錄團隊發問與回答的積分。</p>
        </div>

        <div className="action-card" onClick={handlePersonalStatsClick}>
          <div className="card-icon gradient-4">
            <UserCheck size={26} />
          </div>
          <h3>個人積分查詢</h3>
          <p>查看自己的搶答、發問與回答次數統計。</p>
        </div>

        <div className="action-card" onClick={() => navigate('stats')}>
          {!isAdmin && <span className="admin-tag">限管理者</span>}
          <div className="card-icon gradient-2">
            <BarChart3 size={26} />
          </div>
          <h3>查看歷史紀錄與排行</h3>
          <p>檢視積分總排行、每人發言次數與歷史會議詳細數據。</p>
        </div>

        <div className="action-card" onClick={() => navigate('exchange')}>
          {!isAdmin && <span className="admin-tag">限管理者</span>}
          <div className="card-icon gradient-3">
            <Gift size={26} />
          </div>
          <h3>積分兌換獎項</h3>
          <p>使用累積積分兌換各種超值獎勵與公司福利。</p>
        </div>
      </div>
    </section>
  );
};
