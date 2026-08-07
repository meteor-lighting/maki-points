import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Award, MessageSquare, Gift, X } from 'lucide-react';
import { PRIZE_CATALOG } from '../constants/prizeData';

export const PersonalStatsModal = () => {
  const { personalStatsUser, setPersonalStatsUser, data } = useApp();
  const [selectedUserId, setSelectedUserId] = useState('');

  if (!personalStatsUser) return null;

  const currentUser = data.users.find((u) => u.id === selectedUserId) || (data.users.length > 0 ? data.users[0] : null);
  const targetId = currentUser ? currentUser.id : '';

  // Calculate points
  let earnedPoints = 0;
  let askFirstCount = 0;
  let askCount = 0;
  let replyCount = 0;
  let meetingCount = 0;

  const userMeetingsSet = new Set();

  (data.records || []).forEach((r) => {
    const rUserId = String(r.userId || r.ID || '');
    if (rUserId === targetId) {
      earnedPoints += Number(r.score || 0);
      askFirstCount += Number(r.askFirstCount || 0);
      askCount += Number(r.askCount || 0);
      replyCount += Number(r.replyCount || 0);
      if (r.meetingId) userMeetingsSet.add(r.meetingId);
    }
  });

  meetingCount = userMeetingsSet.size;

  // Calculate redemptions
  let redeemedPoints = 0;
  const userRedemptions = (data.redemptions || []).filter(
    (rd) => String(rd.userId || rd.ID || '') === targetId
  );

  userRedemptions.forEach((rd) => {
    redeemedPoints += Number(rd.points || rd.cost || 0);
  });

  const remainingBalance = earnedPoints - redeemedPoints;

  return (
    <div className="modal-overlay" onClick={() => setPersonalStatsUser(null)}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={22} className="text-glow" /> 個人積分查詢
          </h3>
          <button
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            onClick={() => setPersonalStatsUser(null)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="form-group">
          <label>請選擇同仁姓名：</label>
          <select value={targetId} onChange={(e) => setSelectedUserId(e.target.value)}>
            {data.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department || '其他'})
              </option>
            ))}
          </select>
        </div>

        {currentUser && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 20
              }}
            >
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginBottom: 4 }}>累積獲得總積分</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>{earnedPoints} 分</div>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#fcd34d', marginBottom: 4 }}>已兌換消費分數</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>{redeemedPoints} 分</div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6ee7b7', marginBottom: 4 }}>剩餘可用積分</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{remainingBalance} 分</div>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} /> 發言與會議統計
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: '0.88rem' }}>
                <div>參與會議場數：<strong>{meetingCount}</strong> 場</div>
                <div>搶答/率先發問 (30分)：<strong>{askFirstCount}</strong> 次</div>
                <div>一般發問/補充 (10分)：<strong>{askCount}</strong> 次</div>
                <div>回答次數 (3分)：<strong>{replyCount}</strong> 次</div>
              </div>
            </div>

            {userRedemptions.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Gift size={16} /> 兌換紀錄
                </h4>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>品項</th>
                        <th>消耗積分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRedemptions.map((rd, idx) => {
                        const prize = PRIZE_CATALOG.find((p) => p.id === rd.item || p.name === rd.item);
                        return (
                          <tr key={idx}>
                            <td>{rd.date || rd.timestamp || 'N/A'}</td>
                            <td>{prize ? `${prize.icon} ${prize.name}` : rd.item || rd.prizeName}</td>
                            <td style={{ color: '#fbbf24', fontWeight: 600 }}>-{rd.points || rd.cost} 分</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
