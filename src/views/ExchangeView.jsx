import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Gift, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { PRIZE_CATALOG } from '../constants/prizeData';
import { formatDateDisplay } from '../utils/formatters';

export const ExchangeView = () => {
  const { data, navigate, saveRedemptionData, deleteRedemptionData, loadData, showToast, t, lang } = useApp();
  const activeUsers = (data.users || []).filter((u) => u.isActive !== false);
  const inactiveUserIds = new Set((data.users || []).filter((u) => u.isActive === false).map((u) => u.id));

  const [selectedUserId, setSelectedUserId] = useState(() => (activeUsers.length > 0 ? activeUsers[0].id : ''));
  const [selectedPrizeId, setSelectedPrizeId] = useState('p1');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Selected User point calculations
  const currentUser = activeUsers.find((u) => u.id === selectedUserId) || (activeUsers.length > 0 ? activeUsers[0] : null);
  const targetId = currentUser ? currentUser.id : '';

  let earnedPoints = 0;
  (data.records || []).forEach((r) => {
    if (String(r.userId || r.ID || '') === targetId) {
      const askFirst = Number(r.askFirstCount || r.firstAskCount || r.askFirst || r['快問次數'] || r['搶答次數'] || 0);
      const ask = Number(r.askCount || r.ask || r['發問次數'] || 0);
      const reply = Number(r.replyCount || r.answerCount || r.reply || r.answer || r['回答次數'] || 0);
      const score = Number(r.score || r.points || r['個人積分'] || (askFirst * 30 + ask * 10 + reply * 3));
      earnedPoints += score;
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
        prize: selectedPrize.name,
        item: selectedPrize.name,
        points: selectedPrize.points
      };

      await saveRedemptionData(redemptionPayload);
      showToast(`🎁 成功完成 ${currentUser.name} 的「${selectedPrize.name}」兌換！`);
      await loadData(true);
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
      await loadData(true);
    } catch (err) {
      alert('刪除失敗：' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Sort redemptions descending by date (newest first)
  const sortedRedemptions = [...(data.redemptions || [])].sort((a, b) => {
    const timeA = new Date(a.date || a.timestamp || 0).getTime();
    const timeB = new Date(b.date || b.timestamp || 0).getTime();
    return timeB - timeA;
  });

  // Filter redemptions
  const filteredRedemptions = sortedRedemptions.filter((rd) => {
    if (inactiveUserIds.has(String(rd.userId || rd.ID || ''))) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = String(rd.userName || rd.name || '').toLowerCase();
    const item = String(rd.prize || rd.item || rd.prizeName || '').toLowerCase();
    return name.includes(q) || item.includes(q);
  });

  return (
    <section className="view-section glass-panel fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => navigate('home')}>
          <ArrowLeft size={16} /> {t('back')}
        </button>
        <h2>🎁 {t('exchangeTitle')}</h2>
      </div>

      {/* Redemption Form & User Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32, width: '100%', boxSizing: 'border-box' }}>
        <form onSubmit={handleRedeemSubmit} className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.6)', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gift size={20} className="text-glow" /> {t('exchangeOps')}
          </h3>

          <div className="form-group" style={{ width: '100%', boxSizing: 'border-box' }}>
            <label>{t('selectUser')}</label>
            <select value={targetId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
              {activeUsers.map((u) => (
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
              padding: 12,
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('userBalanceLabel')}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>{availableBalance} {t('points')}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              {t('totalEarnedLabel')}: {earnedPoints}{t('points')}<br />{t('totalDeductedLabel')}: {redeemedPoints}{t('points')}
            </div>
          </div>

          <div className="form-group" style={{ width: '100%', boxSizing: 'border-box' }}>
            <label>{t('selectPrize')}</label>
            <select value={selectedPrizeId} onChange={(e) => setSelectedPrizeId(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
              {PRIZE_CATALOG.map((p) => {
                const prizeTitle = lang === 'en' ? (p.nameEn || p.name) : p.name;
                return (
                  <option key={p.id} value={p.id}>
                    {p.icon} {prizeTitle} ({p.points} {t('points')})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', marginTop: 10, boxSizing: 'border-box' }}
            disabled={submitting || availableBalance < selectedPrize.points}
          >
            <CheckCircle2 size={18} /> {submitting ? t('processing') : `${t('confirmRedeemBtn')} (${selectedPrize.points} ${t('points')})`}
          </button>
        </form>

        {/* Prize Catalog Cards */}
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>{t('prizeCatalogTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {PRIZE_CATALOG.map((p) => {
              const prizeTitle = lang === 'en' ? (p.nameEn || p.name) : p.name;
              const prizeDesc = lang === 'en' ? (p.descEn || p.desc) : p.desc;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPrizeId(p.id)}
                  style={{
                    background: selectedPrizeId === p.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid ' + (selectedPrizeId === p.id ? '#6366f1' : 'var(--glass-border)'),
                    borderRadius: 14,
                    padding: 14,
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{p.icon}</div>
                  <h4 style={{ fontSize: '0.92rem', marginBottom: 4 }}>{prizeTitle}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.3 }}>{prizeDesc}</p>
                  <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1rem' }}>{p.points} {t('points')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t('historyLogsTitle')}</h3>

          <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
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
                <th>{t('redeemDate')}</th>
                <th>{t('userName')}</th>
                <th>{t('redeemItem')}</th>
                <th>{t('deductedPoints')}</th>
                <th>{t('adminOps')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRedemptions.map((rd) => {
                const itemName = rd.prize || rd.item || rd.prizeName || '';
                const prizeObj = PRIZE_CATALOG.find((p) => p.id === itemName || p.name === itemName || p.nameEn === itemName);
                const displayPrizeTitle = prizeObj
                  ? `${prizeObj.icon} ${lang === 'en' ? (prizeObj.nameEn || prizeObj.name) : prizeObj.name}`
                  : itemName || 'Unspecified';

                return (
                  <tr key={rd.redemptionId || rd.id}>
                    <td>{formatDateDisplay(rd.date || rd.timestamp)}</td>
                    <td><strong>{rd.userName || rd.name}</strong></td>
                    <td>{displayPrizeTitle}</td>
                    <td><strong style={{ color: '#fbbf24' }}>-{rd.points || rd.cost}</strong> {t('points')}</td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => handleDeleteRedemption(rd.redemptionId || rd.id)}
                        disabled={deletingId === (rd.redemptionId || rd.id)}
                      >
                        <Trash2 size={14} /> {t('delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
