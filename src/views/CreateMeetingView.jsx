import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Save, Plus, RotateCcw, CheckSquare, Users, Trash2 } from 'lucide-react';
import { POINT_VALUES } from '../constants/prizeData';

export const CreateMeetingView = () => {
  const { data, navigate, saveMeetingAndRecords, loadData, showToast, t } = useApp();

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

  // Check if anyone has been awarded +30 points in current session
  const hasAnyAskFirst = Object.values(records).some((r) => r.askFirstCount > 0);

  const handleClearAllScores = () => {
    if (!window.confirm('確定要清空目前會議的所有計分？此操作將會重置所有人之得分。')) return;

    const initRecords = {};
    selectedUserIds.forEach((uid) => {
      initRecords[uid] = { askFirstCount: 0, askCount: 0, replyCount: 0 };
    });
    setRecords(initRecords);
    setHistoryStack([]);
    showToast('🧹 已清空目前會議的所有計分');
  };

  const clearUserScore = (userId) => {
    setRecords((prev) => ({
      ...prev,
      [userId]: { askFirstCount: 0, askCount: 0, replyCount: 0 }
    }));
  };

  // Group users by department
  const deptGroupedUsers = React.useMemo(() => {
    const groups = {};
    (data.users || []).forEach((u) => {
      const dept = u.department || '其他';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(u);
    });
    return groups;
  }, [data.users]);

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
    if (!recorderName) return alert('請選擇填表紀錄人！');
    if (selectedUserIds.length === 0) return alert('請至少選擇一位與會人員！');

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
    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(records))]);

    setRecords((prev) => {
      const userRec = prev[userId] || { askFirstCount: 0, askCount: 0, replyCount: 0 };
      const updatedUserRec = { ...userRec };

      if (type === 'askFirst') updatedUserRec.askFirstCount += 1;
      else if (type === 'ask') updatedUserRec.askCount += 1;
      else if (type === 'reply') updatedUserRec.replyCount += 1;

      return { ...prev, [userId]: updatedUserRec };
    });
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const lastState = historyStack[historyStack.length - 1];
    setRecords(lastState);
    setHistoryStack((prev) => prev.slice(0, -1));
  };

  const handleFinishMeeting = async () => {
    if (!window.confirm('確認要完成會議並儲存所有積分？')) return;

    setSubmitting(true);
    try {
      const meetingId = `M${Date.now()}`;
      const meetingPayload = {
        id: meetingId,
        meetingId,
        date: meetingDate,
        title: meetingTitle,
        recorder: recorderName,
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
          id: meetingId,
          meetingId,
          userId: uid,
          userName: u.name || '',
          askFirstCount: rec.askFirstCount,
          firstAskCount: rec.askFirstCount,
          askCount: rec.askCount,
          replyCount: rec.replyCount,
          answerCount: rec.replyCount,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
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
          <ArrowLeft size={16} /> {t('back')}
        </button>
        <h2>{step === 'setup' ? t('newMeetingTitle') : `${t('inProgressTitle')}：${meetingTitle}`}</h2>
      </div>

      {step === 'setup' && (
        <form onSubmit={handleStartMeeting} className="form-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label>{t('meetingTitleLabel')}</label>
              <input
                type="text"
                placeholder={t('meetingTitlePlaceholder')}
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('meetingDateLabel')}</label>
              <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>{t('recorderLabel')}</label>
              <select value={recorderName} onChange={(e) => setRecorderName(e.target.value)} required>
                <option value="" disabled>
                  {t('selectRecorderPlaceholder')}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem' }}>
                <Users size={20} className="text-glow" /> {t('selectParticipants')} ({selectedUserIds.length} / {data.users.length} {t('peopleCount')})
              </label>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSelectAllToggle}
              >
                <CheckSquare size={16} /> {selectedUserIds.length === data.users.length ? t('deselectAll') : t('selectAll')}
              </button>
            </div>

            {/* Department Group Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
              {Object.entries(deptGroupedUsers).map(([deptName, usersInDept]) => {
                const deptUserIds = usersInDept.map((u) => u.id);
                const selectedInDept = deptUserIds.filter((id) => selectedUserIds.includes(id));
                const isAllDeptSelected = selectedInDept.length === deptUserIds.length;

                return (
                  <div
                    key={deptName}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 14,
                      padding: 16
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🏢 {deptName} <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({selectedInDept.length} / {deptUserIds.length} {t('peopleCount')})</span>
                      </span>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleDeptSelect(deptName)}
                      >
                        {isAllDeptSelected ? `${t('deselectAllDept')} ${deptName}` : `${t('selectAllDept')} ${deptName}`}
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 10
                      }}
                    >
                      {usersInDept.map((u) => (
                        <label
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: selectedUserIds.includes(u.id) ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid ' + (selectedUserIds.includes(u.id) ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'),
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => handleUserCheckboxChange(u.id)}
                          />
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {u.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem', marginTop: 12 }}>
            <Plus size={18} /> {t('startRecording')}
          </button>
        </form>
      )}

      {step === 'recording' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {t('recorder')}：<strong>{recorderName}</strong> ｜ {t('date')}：{meetingDate}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleClearAllScores}>
                <Trash2 size={16} /> {t('clearAll')}
              </button>

              <button className="btn-secondary" onClick={handleUndo} disabled={historyStack.length === 0}>
                <RotateCcw size={16} /> {t('undo')} ({historyStack.length})
              </button>

              <button className="btn-primary" onClick={handleFinishMeeting} disabled={submitting}>
                <Save size={16} /> {submitting ? t('saving') : t('finishAndSave')}
              </button>
            </div>
          </div>

          {/* 1. Desktop Table View */}
          <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('userName')}</th>
                  <th>{t('department')}</th>
                  <th>{t('firstAskStat')}</th>
                  <th>{t('askStat')}</th>
                  <th>{t('replyStat')}</th>
                  <th>{t('totalScore')}</th>
                  <th>{t('scoreOperations')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedUserIds.map((uid) => {
                  const u = data.users.find((usr) => usr.id === uid) || { name: 'Unknown', department: 'Other' };
                  const rec = records[uid] || { askFirstCount: 0, askCount: 0, replyCount: 0 };
                  const currentScore =
                    rec.askFirstCount * POINT_VALUES.ASK_FIRST +
                    rec.askCount * POINT_VALUES.ASK +
                    rec.replyCount * POINT_VALUES.REPLY;

                  return (
                    <tr key={uid}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.department}</td>
                      <td><span style={{ color: '#fbbf24', fontWeight: 600 }}>{rec.askFirstCount}</span> {t('times')}</td>
                      <td><span style={{ color: '#60a5fa', fontWeight: 600 }}>{rec.askCount}</span> {t('times')}</td>
                      <td><span style={{ color: '#34d399', fontWeight: 600 }}>{rec.replyCount}</span> {t('times')}</td>
                      <td><strong style={{ fontSize: '1.1rem', color: '#a855f7' }}>{currentScore}</strong> {t('points')}</td>
                      <td>
                        <div className="score-btn-group" style={{ alignItems: 'center' }}>
                          {!hasAnyAskFirst && (
                            <button className="btn-score ask-first" onClick={() => addPoint(uid, 'askFirst')}>
                              {t('askFirstBtn')}
                            </button>
                          )}
                          {hasAnyAskFirst && rec.askFirstCount > 0 && (
                            <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', border: '1px solid #f59e0b', fontSize: '0.78rem', fontWeight: 700 }}>
                              {t('firstAskAwarded')}
                            </span>
                          )}
                          <button className="btn-score ask" onClick={() => addPoint(uid, 'ask')}>
                            {t('askBtn')}
                          </button>
                          <button className="btn-score reply" onClick={() => addPoint(uid, 'reply')}>
                            {t('replyBtn')}
                          </button>
                          {(rec.askFirstCount > 0 || rec.askCount > 0 || rec.replyCount > 0) && (
                            <button
                              className="btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}
                              onClick={() => clearUserScore(uid)}
                            >
                              <RotateCcw size={12} /> {t('resetBtn')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Card View for easier points button access */}
          <div className="mobile-cards-view">
            {selectedUserIds.map((uid) => {
              const u = data.users.find((usr) => usr.id === uid) || { name: 'Unknown', department: 'Other' };
              const rec = records[uid] || { askFirstCount: 0, askCount: 0, replyCount: 0 };
              const currentScore =
                rec.askFirstCount * POINT_VALUES.ASK_FIRST +
                rec.askCount * POINT_VALUES.ASK +
                rec.replyCount * POINT_VALUES.REPLY;

              return (
                <div
                  key={uid}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginRight: 8 }}>{u.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: 12 }}>
                        {u.department}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a855f7' }}>
                      {currentScore} <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-secondary)' }}>{t('points')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 8 }}>
                    <span>🏆 {t('firstAskStat')}: <strong style={{ color: '#fbbf24' }}>{rec.askFirstCount}</strong></span>
                    <span>❓ {t('askStat')}: <strong style={{ color: '#60a5fa' }}>{rec.askCount}</strong></span>
                    <span>💬 {t('replyStat')}: <strong style={{ color: '#34d399' }}>{rec.replyCount}</strong></span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: 6, marginTop: 4 }}>
                    {!hasAnyAskFirst && (
                      <button className="btn-score ask-first" style={{ width: '100%', padding: '10px 4px', fontSize: '0.85rem' }} onClick={() => addPoint(uid, 'askFirst')}>
                        {t('askFirstBtn')}
                      </button>
                    )}
                    {hasAnyAskFirst && rec.askFirstCount > 0 && (
                      <span style={{ padding: '8px 4px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', border: '1px solid #f59e0b', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t('firstAskAwarded')}
                      </span>
                    )}
                    <button className="btn-score ask" style={{ width: '100%', padding: '10px 4px', fontSize: '0.85rem' }} onClick={() => addPoint(uid, 'ask')}>
                      {t('askBtn')}
                    </button>
                    <button className="btn-score reply" style={{ width: '100%', padding: '10px 4px', fontSize: '0.85rem' }} onClick={() => addPoint(uid, 'reply')}>
                      {t('replyBtn')}
                    </button>
                    {(rec.askFirstCount > 0 || rec.askCount > 0 || rec.replyCount > 0) && (
                      <button
                        className="btn-danger"
                        style={{ padding: '8px 4px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={() => clearUserScore(uid)}
                      >
                        <RotateCcw size={12} /> {t('resetBtn')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
