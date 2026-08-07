import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Trophy, BarChart2, Calendar, Trash2, RefreshCw } from 'lucide-react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const StatisticsView = () => {
  const { data, navigate, isAdmin, deleteMeeting, loadData, showToast } = useApp();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

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
      userStatsMap[uid].earnedPoints += Number(r.score || 0);
      userStatsMap[uid].askFirstCount += Number(r.askFirstCount || 0);
      userStatsMap[uid].askCount += Number(r.askCount || 0);
      userStatsMap[uid].replyCount += Number(r.replyCount || 0);
    }
  });

  (data.redemptions || []).forEach((rd) => {
    const uid = String(rd.userId || rd.ID || '');
    if (userStatsMap[uid]) {
      userStatsMap[uid].redeemedPoints += Number(rd.points || rd.cost || 0);
    }
  });

  let rankings = Object.values(userStatsMap);
  if (selectedDeptFilter !== 'ALL') {
    rankings = rankings.filter((u) => u.department.toUpperCase() === selectedDeptFilter.toUpperCase());
  }

  // Sort descending by earnedPoints
  rankings.sort((a, b) => b.earnedPoints - a.earnedPoints);

  // Chart data setup
  const topRankings = rankings.slice(0, 10);
  const chartData = {
    labels: topRankings.map((u) => `${u.name} (${u.department})`),
    datasets: [
      {
        label: '累積積分',
        data: topRankings.map((u) => u.earnedPoints),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: '剩餘可用積分',
        data: topRankings.map((u) => u.earnedPoints - u.redeemedPoints),
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-secondary" onClick={() => navigate('home')}>
            <ArrowLeft size={16} /> 返回
          </button>
          <h2>📊 歷史紀錄與積分排行榜</h2>
        </div>

        <button className="btn-secondary" onClick={loadData}>
          <RefreshCw size={16} /> 重新整理資料
        </button>
      </div>

      {/* Leaderboard Chart */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
            <Trophy size={20} className="text-glow" /> 團隊積分排行榜 TOP 10
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>部門篩選：</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? '全部部門' : d}
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
          <BarChart2 size={18} /> 個人全記錄細節
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>名次</th>
                <th>同仁姓名</th>
                <th>部門</th>
                <th>累積總分</th>
                <th>已兌換</th>
                <th>剩餘可用</th>
                <th>搶答次數</th>
                <th>發問次數</th>
                <th>回答次數</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((u, idx) => (
                <tr key={u.id}>
                  <td>
                    {idx === 0 && '🥇 1'}
                    {idx === 1 && '🥈 2'}
                    {idx === 2 && '🥉 3'}
                    {idx > 2 && idx + 1}
                  </td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.department}</td>
                  <td><strong style={{ color: '#818cf8' }}>{u.earnedPoints}</strong> 分</td>
                  <td><span style={{ color: '#fbbf24' }}>{u.redeemedPoints}</span> 分</td>
                  <td><strong style={{ color: '#34d399' }}>{u.earnedPoints - u.redeemedPoints}</strong> 分</td>
                  <td>{u.askFirstCount}</td>
                  <td>{u.askCount}</td>
                  <td>{u.replyCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meetings History Table */}
      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} /> 會議歷史列表 ({data.meetings?.length || 0} 場)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>會議日期</th>
                <th>會議名稱</th>
                <th>填表紀錄人</th>
                {isAdmin && <th>管理員操作</th>}
              </tr>
            </thead>
            <tbody>
              {(data.meetings || []).map((m) => (
                <tr key={m.meetingId || m.id}>
                  <td>{m.date || m.timestamp}</td>
                  <td><strong>{m.title || m.name}</strong></td>
                  <td>{m.recorderName || m.recorder || 'N/A'}</td>
                  {isAdmin && (
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => handleDeleteMeeting(m.meetingId || m.id)}
                        disabled={deletingId === (m.meetingId || m.id)}
                      >
                        <Trash2 size={14} /> {deletingId === (m.meetingId || m.id) ? '刪除中' : '刪除'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
