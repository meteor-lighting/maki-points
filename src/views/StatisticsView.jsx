import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Trophy, BarChart2, Calendar, Trash2, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatDateDisplay } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const StatisticsView = () => {
  const { data, navigate, isAdmin, deleteMeeting, loadData, showToast, t } = useApp();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  // Toggle list & nested meeting expansion states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [expandedMeetingId, setExpandedMeetingId] = useState(null);

  const handleToggleHistory = () => {
    setIsHistoryOpen((prev) => !prev);
  };

  // Compute stats per user
  const userStatsMap = {};

  (data.users || []).forEach((u) => {
    userStatsMap[u.id] = {
      id: u.id,
      name: u.name,
      department: u.department || '其他',
      earnedPoints: 0,
      askFirstCount: 0,
      askCount: 0,
      replyCount: 0,
      redeemedPoints: 0
    };
  });

  (data.records || []).forEach((r) => {
    const uid = String(r.userId || r.ID || '');
    if (userStatsMap[uid]) {
      const askFirst = Number(r.askFirstCount || r.firstAskCount || r.askFirst || r['快問次數'] || r['搶答次數'] || 0);
      const ask = Number(r.askCount || r.ask || r['發問次數'] || 0);
      const reply = Number(r.replyCount || r.answerCount || r.reply || r.answer || r['回答次數'] || 0);
      const score = Number(r.score || r.points || r['個人積分'] || (askFirst * 30 + ask * 10 + reply * 3));

      userStatsMap[uid].earnedPoints += score;
      userStatsMap[uid].askFirstCount += askFirst;
      userStatsMap[uid].askCount += ask;
      userStatsMap[uid].replyCount += reply;
    }
  });

  (data.redemptions || []).forEach((rd) => {
    const uid = String(rd.userId || rd.ID || '');
    if (userStatsMap[uid]) {
      userStatsMap[uid].redeemedPoints += Number(rd.points || rd.cost || 0);
    }
  });

  const allUsersList = Object.values(userStatsMap);

  let chartLabels = [];
  let chartDataset1 = [];
  let chartDataset2 = [];
  let chartTitle = '';

  let tableRankings = [];

  if (selectedDeptFilter === 'ALL') {
    // 1. Group by department for Bar Chart when ALL is selected
    const deptMap = {};
    allUsersList.forEach((u) => {
      const dept = u.department || '其他';
      if (!deptMap[dept]) {
        deptMap[dept] = { dept, totalEarned: 0, totalRedeemed: 0, count: 0 };
      }
      deptMap[dept].totalEarned += u.earnedPoints;
      deptMap[dept].totalRedeemed += u.redeemedPoints;
      deptMap[dept].count += 1;
    });

    const deptList = Object.values(deptMap).sort((a, b) => b.totalEarned - a.totalEarned);

    chartTitle = t('deptChartTitle');
    chartLabels = deptList.map((d) => `${d.dept} (${d.count} ${t('peopleCount')})`);
    chartDataset1 = deptList.map((d) => d.totalEarned);
    chartDataset2 = deptList.map((d) => d.totalEarned - d.totalRedeemed);

    // Table shows all members sorted high to low
    tableRankings = [...allUsersList].sort((a, b) => b.earnedPoints - a.earnedPoints);
  } else {
    // 2. Specific department selected -> filter and sort department members
    tableRankings = allUsersList
      .filter((u) => u.department.toUpperCase() === selectedDeptFilter.toUpperCase())
      .sort((a, b) => b.earnedPoints - a.earnedPoints);

    chartTitle = `👤 ${selectedDeptFilter} ${t('userChartTitle')}`;
    chartLabels = tableRankings.map((u) => u.name);
    chartDataset1 = tableRankings.map((u) => u.earnedPoints);
    chartDataset2 = tableRankings.map((u) => u.earnedPoints - u.redeemedPoints);
  }

  // Chart data setup
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: selectedDeptFilter === 'ALL' ? t('deptTotalEarned') : t('userTotalEarned'),
        data: chartDataset1,
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: selectedDeptFilter === 'ALL' ? t('deptTotalBalance') : t('userTotalBalance'),
        data: chartDataset2,
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#f8fafc' }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' }
      }
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('確定要刪除此筆會議紀錄？此操作無法復原。')) return;
    setDeletingId(meetingId);
    try {
      await deleteMeeting(meetingId);
      showToast('🗑️ 會議紀錄已成功刪除');
      await loadData();
    } catch (err) {
      alert('刪除失敗：' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const departments = ['ALL', ...Array.from(new Set((data.users || []).map((u) => u.department || '其他')))];

  return (
    <section className="view-section glass-panel fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => navigate('home')}>
            <ArrowLeft size={16} /> {t('back')}
          </button>
          <h2>📊 {t('statsPageTitle')}</h2>
        </div>

        <button className="btn-secondary" onClick={() => loadData(true)}>
          <RefreshCw size={16} /> {t('refreshData')}
        </button>
      </div>

      {/* Leaderboard Chart */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
            <Trophy size={20} className="text-glow" /> {chartTitle}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('deptFilter')}</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? t('allDepts') : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: 300, position: 'relative' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Rankings Table */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={18} /> {selectedDeptFilter === 'ALL' ? t('allUsersRankTitle') : `👥 ${selectedDeptFilter} ${t('deptUsersRankTitle')}`}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('rank')}</th>
                <th>{t('userName')}</th>
                <th>{t('department')}</th>
                <th>{t('totalScore')}</th>
                <th>{t('redeemed')}</th>
                <th>{t('available')}</th>
                <th>{t('askFirstCount')}</th>
                <th>{t('askCount')}</th>
                <th>{t('replyCount')}</th>
              </tr>
            </thead>
            <tbody>
              {tableRankings.map((u, idx) => (
                <tr key={u.id}>
                  <td>
                    {idx === 0 && '🥇 1'}
                    {idx === 1 && '🥈 2'}
                    {idx === 2 && '🥉 3'}
                    {idx > 2 && idx + 1}
                  </td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.department}</td>
                  <td><strong style={{ color: '#818cf8' }}>{u.earnedPoints}</strong> {t('points')}</td>
                  <td><span style={{ color: '#fbbf24' }}>{u.redeemedPoints}</span> {t('points')}</td>
                  <td><strong style={{ color: '#34d399' }}>{u.earnedPoints - u.redeemedPoints}</strong> {t('points')}</td>
                  <td>{u.askFirstCount}</td>
                  <td>{u.askCount}</td>
                  <td>{u.replyCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meetings History Expandable Toggle List */}
      <div style={{ marginTop: 24, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 16, border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <div
          onClick={handleToggleHistory}
          style={{
            padding: '18px 24px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            background: 'rgba(30, 41, 59, 0.7)',
            userSelect: 'none'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <Calendar size={20} className="text-glow" /> {t('meetingHistory')} ({data.meetings?.length || 0})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem' }}>{isHistoryOpen ? t('toggleCollapse') : t('toggleExpand')}</span>
            {isHistoryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {isHistoryOpen && (
          <div style={{ padding: 20, animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('meetingName')}</th>
                    <th>{t('meetingRecorder')}</th>
                    <th>{t('participantDetails')}</th>
                    {isAdmin && <th>{t('adminOps')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {[...(data.meetings || [])]
                    .sort((a, b) => {
                      const timeA = new Date(a.date || a.timestamp || 0).getTime();
                      const timeB = new Date(b.date || b.timestamp || 0).getTime();
                      return timeB - timeA;
                    })
                    .map((m) => {
                      const mId = m.meetingId || m.id;
                      const isExpanded = expandedMeetingId === mId;
                      const meetingRecords = (data.records || []).filter(r => String(r.meetingId || r.mId || '') === String(mId));

                      return (
                        <React.Fragment key={mId}>
                          <tr>
                            <td>{formatDateDisplay(m.date || m.timestamp)}</td>
                            <td><strong>{m.title || m.name}</strong></td>
                            <td>{m.recorderName || m.recorder || 'N/A'}</td>
                            <td>
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                onClick={() => setExpandedMeetingId(isExpanded ? null : mId)}
                              >
                                {isExpanded ? t('hideDetails') : `${t('viewDetails')} (${meetingRecords.length} ${t('peopleCount')})`}
                              </button>
                            </td>
                            {isAdmin && (
                              <td>
                                <button
                                  className="btn-danger"
                                  style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  onClick={() => handleDeleteMeeting(mId)}
                                  disabled={deletingId === mId}
                                >
                                  <Trash2 size={14} /> {deletingId === mId ? t('deleting') : t('delete')}
                                </button>
                              </td>
                            )}
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={isAdmin ? 5 : 4} style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 16 }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, color: '#a5b4fc' }}>
                                  📋 「{m.title || m.name}」{t('attendeeScoreDetails')}：
                                </div>
                                {meetingRecords.length > 0 ? (
                                  <table className="custom-table" style={{ fontSize: '0.82rem', background: 'rgba(0,0,0,0.3)' }}>
                                    <thead>
                                      <tr>
                                        <th>{t('userName')}</th>
                                        <th>{t('firstAskStat')}</th>
                                        <th>{t('askStat')}</th>
                                        <th>{t('replyStat')}</th>
                                        <th>{t('totalScore')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {meetingRecords.map((r, rIdx) => {
                                        const askFirst = Number(r.askFirstCount || r.firstAskCount || r.askFirst || r['快問次數'] || r['搶答次數'] || 0);
                                        const ask = Number(r.askCount || r.ask || r['發問次數'] || 0);
                                        const reply = Number(r.replyCount || r.answerCount || r.reply || r.answer || r['回答次數'] || 0);
                                        const score = Number(r.score || r.points || r['個人積分'] || (askFirst * 30 + ask * 10 + reply * 3));
                                        const u = data.users.find(usr => String(usr.id) === String(r.userId)) || { name: r.userName || r.name || r.userId };

                                        return (
                                          <tr key={rIdx}>
                                            <td><strong>{u.name}</strong></td>
                                            <td><span style={{ color: '#fbbf24', fontWeight: 600 }}>{askFirst}</span> {t('times')}</td>
                                            <td><span style={{ color: '#60a5fa', fontWeight: 600 }}>{ask}</span> {t('times')}</td>
                                            <td><span style={{ color: '#34d399', fontWeight: 600 }}>{reply}</span> {t('times')}</td>
                                            <td><strong style={{ color: '#a855f7' }}>{score}</strong> {t('points')}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No records</div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

