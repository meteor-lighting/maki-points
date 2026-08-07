import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Save, Plus, RotateCcw, CheckSquare, Users } from 'lucide-react';
import { POINT_VALUES } from '../constants/prizeData';

export const CreateMeetingView = () => {
  const { data, navigate, saveMeetingAndRecords, loadData, showToast } = useApp();

  const [step, setStep] = useState('setup'); // 'setup' | 'recording'
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recorderName, setRecorderName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Active score records: { userId: { askFirstCount: 0, askCount: 0, replyCount: 0 } }
  const [records, setRecords] = useState({});

  // History stack for Undo capability
  const [historyStack, setHistoryStack] = useState([]);

  // Filter department buttons
  const departments = Array.from(new Set((data.users || []).map((u) => u.department || '其他'))).filter(Boolean);

  const handleSelectAllToggle = () => {
    if (selectedUserIds.length === data.users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(data.users.map((u) => u.id));
    }
  };

  const handleDeptSelect = (dept) => {
    const deptUsers = data.users.filter((u) => (u.department || '其他').toUpperCase() === dept.toUpperCase()).map((u) => u.id);
    const allDeptSelected = deptUsers.every((id) => selectedUserIds.includes(id));

    if (allDeptSelected) {
      setSelectedUserIds(selectedUserIds.filter((id) => !deptUsers.includes(id)));
    } else {
      setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...deptUsers])));
    }
  };

  const handleUserCheckboxChange = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleStartMeeting = (e) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return alert('請輸入會議名稱！');
    if (!recorderName) return alert('請選擇填表人！');
    if (selectedUserIds.length === 0) return alert('請至少勾選一位與會人員！');

    // Initialize records object for selected participants
    const initRecords = {};
    selectedUserIds.forEach((uid) => {
      initRecords[uid] = { askFirstCount: 0, askCount: 0, replyCount: 0 };
    });

    setRecords(initRecords);
    setHistoryStack([]);
    setStep('recording');
  };

  const addPoint = (userId, type) => {
    setRecords((prev) => {
      const userRec = prev[userId] || { askFirstCount: 0, askCount: 0, replyCount: 0 };
      const updatedUserRec = { ...userRec };

      if (type === 'askFirst') updatedUserRec.askFirstCount += 1;
      else if (type === 'ask') updatedUserRec.askCount += 1;
      else if (type === 'reply') updatedUserRec.replyCount += 1;

      return { ...prev, [userId]: updatedUserRec };
    });

    setHistoryStack((prev) => [...prev, { userId, type }]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const lastAction = historyStack[historyStack.length - 1];

    setRecords((prev) => {
      const userRec = prev[lastAction.userId];
      if (!userRec) return prev;

      const updatedUserRec = { ...userRec };
      if (lastAction.type === 'askFirst' && updatedUserRec.askFirstCount > 0) updatedUserRec.askFirstCount -= 1;
      else if (lastAction.type === 'ask' && updatedUserRec.askCount > 0) updatedUserRec.askCount -= 1;
      else if (lastAction.type === 'reply' && updatedUserRec.replyCount > 0) updatedUserRec.replyCount -= 1;

      return { ...prev, [lastAction.userId]: updatedUserRec };
    });

    setHistoryStack((prev) => prev.slice(0, -1));
  };

  const handleFinishMeeting = async () => {
    if (!window.confirm('確定要儲存此會議紀錄並上傳？')) return;

    setSubmitting(true);
    try {
      const meetingId = `M${Date.now()}`;
      const meetingPayload = {
        meetingId,
        date: meetingDate,
        title: meetingTitle,
        recorderName
      };

      const recordsPayload = selectedUserIds.map((uid) => {
        const u = data.users.find((usr) => usr.id === uid) || {};
        const rec = records[uid] || { askFirstCount: 0, askCount: 0, replyCount: 0 };
        const score =
          rec.askFirstCount * POINT_VALUES.ASK_FIRST +
          rec.askCount * POINT_VALUES.ASK +
          rec.replyCount * POINT_VALUES.REPLY;

        return {
          meetingId,
          userId: uid,
          userName: u.name || '',
          askFirstCount: rec.askFirstCount,
          askCount: rec.askCount,
          replyCount: rec.replyCount,
          score
        };
      });

      await saveMeetingAndRecords(meetingPayload, recordsPayload);
      showToast('🎉 會議紀錄已成功儲存並同步至試算表！');
      await loadData();
      navigate('home');
    } catch (err) {
      alert('儲存失敗：' + (err.message || '網路異常'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="view-section glass-panel fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          className="btn-secondary"
          onClick={() => {
            if (step === 'recording') {
              if (window.confirm('確定返回？目前計分將不會儲存。')) setStep('setup');
            } else {
              navigate('home');
            }
          }}
        >
          <ArrowLeft size={16} /> 返回
        </button>
        <h2>{step === 'setup' ? '新增會議資料' : `進行中會議：${meetingTitle}`}</h2>
      </div>

      {step === 'setup' && (
        <form onSubmit={handleStartMeeting} className="form-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label>會議名稱 *</label>
              <input
                type="text"
                placeholder="例如：Q1 產品規劃會議"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>會議日期 *</label>
              <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>填表紀錄人 *</label>
              <select value={recorderName} onChange={(e) => setRecorderName(e.target.value)} required>
                <option value="" disabled>
                  請選擇填表人
                </option>
                {data.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.department || '其他'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={18} /> 勾選與會人員 ({selectedUserIds.length} / {data.users.length} 人)
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={handleSelectAllToggle}>
                  <CheckSquare size={14} /> {selectedUserIds.length === data.users.length ? '取消全選' : '全選'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {departments.map((dept) => (
                <button
                  type="button"
                  key={dept}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => handleDeptSelect(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 10,
                maxHeight: 320,
                overflowY: 'auto',
                padding: 12,
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 12,
                border: '1px solid var(--glass-border)'
              }}
            >
              {data.users.map((u) => (
                <label
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: selectedUserIds.includes(u.id) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid ' + (selectedUserIds.includes(u.id) ? 'rgba(99, 102, 241, 0.4)' : 'transparent'),
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => handleUserCheckboxChange(u.id)}
                  />
                  <span>
                    <strong>{u.name}</strong> <small style={{ opacity: 0.6 }}>({u.department})</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem', marginTop: 12 }}>
            <Plus size={18} /> 開始紀錄會議積分
          </button>
        </form>
      )}

      {step === 'recording' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              紀錄人：<strong>{recorderName}</strong> ｜ 日期：{meetingDate}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={handleUndo} disabled={historyStack.length === 0}>
                <RotateCcw size={16} /> 復原上一次加分 ({historyStack.length})
              </button>

              <button className="btn-primary" onClick={handleFinishMeeting} disabled={submitting}>
                <Save size={16} /> {submitting ? '儲存中...' : '完成並儲存會議'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>與會同仁</th>
                  <th>部門</th>
                  <th>率先發問 (+30)</th>
                  <th>補充發問 (+10)</th>
                  <th>回答/回應 (+3)</th>
                  <th>本次得分</th>
                  <th>計分操作</th>
                </tr>
              </thead>
              <tbody>
                {selectedUserIds.map((uid) => {
                  const u = data.users.find((usr) => usr.id === uid) || { name: '未知', department: '其他' };
                  const rec = records[uid] || { askFirstCount: 0, askCount: 0, replyCount: 0 };
                  const currentScore =
                    rec.askFirstCount * POINT_VALUES.ASK_FIRST +
                    rec.askCount * POINT_VALUES.ASK +
                    rec.replyCount * POINT_VALUES.REPLY;

                  return (
                    <tr key={uid}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.department}</td>
                      <td><span style={{ color: '#fbbf24', fontWeight: 600 }}>{rec.askFirstCount}</span> 次</td>
                      <td><span style={{ color: '#60a5fa', fontWeight: 600 }}>{rec.askCount}</span> 次</td>
                      <td><span style={{ color: '#34d399', fontWeight: 600 }}>{rec.replyCount}</span> 次</td>
                      <td><strong style={{ fontSize: '1.1rem', color: '#a855f7' }}>{currentScore}</strong> 分</td>
                      <td>
                        <div className="score-btn-group">
                          <button className="btn-score ask-first" onClick={() => addPoint(uid, 'askFirst')}>
                            +30 搶答
                          </button>
                          <button className="btn-score ask" onClick={() => addPoint(uid, 'ask')}>
                            +10 發問
                          </button>
                          <button className="btn-score reply" onClick={() => addPoint(uid, 'reply')}>
                            +3 回答
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
