import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, Trophy, Gift, Calendar } from 'lucide-react';
import { PRIZE_CATALOG } from '../constants/prizeData';
import { formatDateDisplay } from '../utils/formatters';

export const PersonalStatsModal = () => {
  const { personalStatsUser, setPersonalStatsUser, data, t, lang } = useApp();
  const [selectedUid, setSelectedUid] = useState(() => (personalStatsUser ? personalStatsUser.id : ''));

  if (!personalStatsUser) return null;

  const targetId = selectedUid || personalStatsUser.id;
  const targetUser = data.users.find((u) => u.id === targetId) || personalStatsUser;

  // Calculate user stats
  let askFirstCount = 0;
  let askCount = 0;
  let replyCount = 0;
  let earnedPoints = 0;

  (data.records || []).forEach((r) => {
    if (String(r.userId || r.ID || '') === targetId) {
      const askFirst = Number(r.askFirstCount || r.firstAskCount || r.askFirst || r['快問次數'] || r['搶答次數'] || 0);
      const ask = Number(r.askCount || r.ask || r['發問次數'] || 0);
      const reply = Number(r.replyCount || r.answerCount || r.reply || r.answer || r['回答次數'] || 0);
      const score = Number(r.score || r.points || r['個人積分'] || (askFirst * 30 + ask * 10 + reply * 3));

      askFirstCount += askFirst;
      askCount += ask;
      replyCount += reply;
      earnedPoints += score;
    }
  });

  // Calculate redemptions & history
  let redeemedPoints = 0;
  const userRedemptions = [];
  (data.redemptions || []).forEach((rd) => {
    if (String(rd.userId || rd.ID || '') === targetId) {
      const cost = Number(rd.points || rd.cost || 0);
      redeemedPoints += cost;
      userRedemptions.push(rd);
    }
  });

  // Sort redemptions descending by date
  userRedemptions.sort((a, b) => {
    const timeA = new Date(a.date || a.timestamp || 0).getTime();
    const timeB = new Date(b.date || b.timestamp || 0).getTime();
    return timeB - timeA;
  });

  const availableBalance = earnedPoints - redeemedPoints;

  return (
    <div className="modal-overlay fade-in" onClick={() => setPersonalStatsUser(null)}>
      <div className="modal-content glass-panel" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setPersonalStatsUser(null)} title="關閉視窗">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}
          >
            <User size={24} />
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('queryUser')}</label>
            <select
              value={targetId}
              onChange={(e) => setSelectedUid(e.target.value)}
              style={{ width: '100%', padding: '6px 12px', marginTop: 4, fontWeight: 700 }}
            >
              {data.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department || '其他'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 12, textAlign: 'center', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{t('earnedTotalStat')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8' }}>{earnedPoints} {t('points')}</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 12, textAlign: 'center', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{t('redeemedTotalStat')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{redeemedPoints} {t('points')}</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 12, textAlign: 'center', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{t('balanceTotalStat')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{availableBalance} {t('points')}</div>
          </div>
        </div>

        {/* Speech breakdown */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 14, borderRadius: 12, marginBottom: 20, border: '1px solid var(--glass-border)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={16} className="text-glow" /> {t('speechStatsTitle')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fbbf24' }}>{askFirstCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('firstAskStat')}</div>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#60a5fa' }}>{askCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('askStat')}</div>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399' }}>{replyCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('replyStat')}</div>
            </div>
          </div>
        </div>

        {/* Redemption History list */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Gift size={16} /> {t('userRedemptionHistory')} ({userRedemptions.length}):
          </div>

          {userRedemptions.length > 0 ? (
            <div style={{ maxHeight: 160, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>{t('redeemDate')}</th>
                    <th>{t('redeemItem')}</th>
                    <th>{t('deductedPoints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userRedemptions.map((rd, i) => {
                    const itemName = rd.prize || rd.item || rd.prizeName || '';
                    const prizeObj = PRIZE_CATALOG.find((p) => p.id === itemName || p.name === itemName || p.nameEn === itemName);
                    const displayItemName = prizeObj
                      ? `${prizeObj.icon} ${lang === 'en' ? (prizeObj.nameEn || prizeObj.name) : prizeObj.name}`
                      : itemName || 'Unspecified';

                    return (
                      <tr key={i}>
                        <td>{formatDateDisplay(rd.date || rd.timestamp)}</td>
                        <td>{displayItemName}</td>
                        <td><span style={{ color: '#fbbf24' }}>-{rd.points || rd.cost} {t('points')}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
              {t('noRedemptions')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
