import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Gift, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { PRIZE_CATALOG } from '../constants/prizeData';

export const ExchangeView = () => {
  const { data, navigate, saveRedemptionData, deleteRedemptionData, loadData, showToast } = useApp();

  const [selectedUserId, setSelectedUserId] = useState(() => (data.users?.length > 0 ? data.users[0].id : ''));
  const [selectedPrizeId, setSelectedPrizeId] = useState('p1');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Selected User point calculations
  const currentUser = data.users.find((u) => u.id === selectedUserId) || (data.users?.length > 0 ? data.users[0] : null);
  const targetId = currentUser ? currentUser.id : '';

  let earnedPoints = 0;
  (data.records || []).forEach((r) => {
    if (String(r.userId || r.ID || '') === targetId) {
      earnedPoints += Number(r.score || 0);
    }
  });

  let redeemedPoints = 0;
  (data.redemptions || []).forEach((rd) => {
    if (String(rd.userId || rd.ID || '') === targetId) {
      redeemedPoints += Number(rd.points || rd.cost || 0);
    }
  });

  const availableBalance = earnedPoints - redeemedPoints;
  const selectedPrize = PRIZE_CATALOG.find((p) => p.id === selectedPrizeId) || PRIZE_CATALOG[0];

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('請選擇同仁！');
    if (availableBalance < selectedPrize.points) {
      return alert(`積分不足！${currentUser.name} 剩餘 ${availableBalance} 分，而 ${selectedPrize.name} 需要 ${selectedPrize.points} 分。`);
    }

    if (!window.confirm(`確認幫 ${currentUser.name} 兌換「${selectedPrize.name}」(${selectedPrize.points} 分)？`)) return;

    setSubmitting(true);
    try {
      const redemptionPayload = {
        redemptionId: `R${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.id,
        userName: currentUser.name,
        item: selectedPrize.name,
        points: selectedPrize.points
      };

      await saveRedemptionData(redemptionPayload);
      showToast(`🎁 成功完成 ${currentUser.name} 的「${selectedPrize.name}」兌換！`);
      await loadData();
    } catch (err) {
      alert('兌換失敗：' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRedemption = async (redemptionId) => {
    if (!window.confirm('確定要取消此筆兌換紀錄？相關分數將歸還同仁。')) return;
    setDeletingId(redemptionId);
    try {
      await deleteRedemptionData(redemptionId);
      showToast('🗑️ 兌換紀錄已刪除，點數已歸還');
      await loadData();
    } catch (err) {
      alert('刪除失敗：' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter redemptions
  const filteredRedemptions = (data.redemptions || []).filter((rd) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = String(rd.userName || rd.name || '').toLowerCase();
    const item = String(rd.item || rd.prizeName || '').toLowerCase();
    return name.includes(q) || item.includes(q);
  });

  return (
    <section className="view-section glass-panel fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn-secondary" onClick={() => navigate('home')}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h2>🎁 積分兌換獎項 (管理員)</h2>
      </div>

      {/* Redemption Form & User Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
        <form onSubmit={handleRedeemSubmit} className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gift size={20} className="text-glow" /> 兌換操作
          </h3>

          <div className="form-group">
            <label>1. 選擇兌換同仁：</label>
            <select value={targetId} onChange={(e) => setSelectedUserId(e.target.value)}>
              {data.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department || '其他'})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>同仁剩餘可用積分</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{availableBalance} 分</div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              累積: {earnedPoints}分<br />已扣: {redeemedPoints}分
            </div>
          </div>

          <div className="form-group">
            <label>2. 選擇兌換獎項：</label>
            <select value={selectedPrizeId} onChange={(e) => setSelectedPrizeId(e.target.value)}>
              {PRIZE_CATALOG.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} ({p.points} 分)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: 14, fontSize: '1rem', marginTop: 10 }}
            disabled={submitting || availableBalance < selectedPrize.points}
          >
            <CheckCircle2 size={18} /> {submitting ? '處理中...' : `確認兌換 (${selectedPrize.points} 分)`}
          </button>
        </form>

        {/* Prize Catalog Cards */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>🏆 獎項清單 (Prize Catalog)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {PRIZE_CATALOG.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPrizeId(p.id)}
                style={{
                  background: selectedPrizeId === p.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid ' + (selectedPrizeId === p.id ? '#6366f1' : 'var(--glass-border)'),
                  borderRadius: 14,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{p.icon}</div>
                <h4 style={{ fontSize: '1rem', marginBottom: 4 }}>{p.name}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{p.desc}</p>
                <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.1rem' }}>{p.points} 分</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem' }}>📜 歷史兌換紀錄</h3>

          <div style={{ position: 'relative', width: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="搜尋姓名或品項..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>兌換日期</th>
                <th>同仁姓名</th>
                <th>兌換品項</th>
                <th>扣除積分</th>
                <th>管理員操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRedemptions.map((rd) => (
                <tr key={rd.redemptionId || rd.id}>
                  <td>{rd.date || rd.timestamp}</td>
                  <td><strong>{rd.userName || rd.name}</strong></td>
                  <td>{rd.item || rd.prizeName}</td>
                  <td><strong style={{ color: '#fbbf24' }}>-{rd.points || rd.cost}</strong> 分</td>
                  <td>
                    <button
                      className="btn-danger"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => handleDeleteRedemption(rd.redemptionId || rd.id)}
                      disabled={deletingId === (rd.redemptionId || rd.id)}
                    >
                      <Trash2 size={14} /> 刪除紀錄
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
