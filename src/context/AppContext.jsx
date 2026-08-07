import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchAllData,
  saveMeetingAndRecords,
  deleteMeeting,
  saveRedemptionData,
  deleteRedemptionData,
  getGasApiUrl,
  setCustomApiUrl
} from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState({ users: [], meetings: [], records: [], redemptions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('is_admin') === 'true');
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'create' | 'recording' | 'stats' | 'exchange'

  // Modals & Active State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showConnectionHelp, setShowConnectionHelp] = useState(false);
  const [personalStatsUser, setPersonalStatsUser] = useState(null); // User object or null
  const [toastMessage, setToastMessage] = useState(null);

  // Active Recording Session state
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [activeRecords, setActiveRecords] = useState({}); // userId -> { askFirstCount, askCount, replyCount, score }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const processApiResult = useCallback((result) => {
    if (!result || typeof result !== 'object') return;

    const usersArr = Array.isArray(result.users) ? result.users : [];
    const processedUsers = usersArr
      .map((u) => ({
        id: String(u.id || u.userId || u.ID || ''),
        name: String(u.name || u.userName || u.Name || ''),
        department: String(u.department || u.dept || '其他').trim()
      }))
      .filter((u) => u.id && u.name);

    setData({
      users: processedUsers,
      meetings: Array.isArray(result.meetings) ? result.meetings : [],
      records: Array.isArray(result.records) ? result.records : [],
      redemptions: Array.isArray(result.redemptions) ? result.redemptions : []
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setConnectionStatus('connecting');
    try {
      const res = await fetchAllData();
      processApiResult(res);
      setConnectionStatus('online');
      setError(null);
    } catch (err) {
      console.error("[AppContext] loadData failed:", err);
      setConnectionStatus('offline');
      setError(err.message || '無法連線至 Google Apps Script 後端');
      setShowConnectionHelp(true);
    } finally {
      setLoading(false);
    }
  }, [processApiResult]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loginAdmin = (password) => {
    if (password === '8888') {
      setIsAdmin(true);
      sessionStorage.setItem('is_admin', 'true');
      showToast('✅ 已成功登入管理員身分');
      setShowAdminModal(false);
      return true;
    } else {
      alert('密碼錯誤！(預設 8888)');
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.setItem('is_admin', 'false');
    showToast('👋 已登出管理員身分');
    if (currentView === 'stats' || currentView === 'exchange') {
      setCurrentView('home');
    }
  };

  const navigate = (viewName) => {
    if ((viewName === 'stats' || viewName === 'exchange') && !isAdmin) {
      alert('⚠️ 限管理者使用！請點擊右上方「管理員登入」。');
      return;
    }
    setCurrentView(viewName);
  };

  const updateApiUrl = (newUrl) => {
    setCustomApiUrl(newUrl);
    showToast('網址已更新，系統將重新載入...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        error,
        connectionStatus,
        isAdmin,
        currentView,
        showAdminModal,
        showConnectionHelp,
        personalStatsUser,
        toastMessage,
        activeMeeting,
        activeRecords,
        getGasApiUrl,
        updateApiUrl,
        setShowAdminModal,
        setShowConnectionHelp,
        setPersonalStatsUser,
        loginAdmin,
        logoutAdmin,
        navigate,
        loadData,
        showToast,
        setActiveMeeting,
        setActiveRecords,
        saveMeetingAndRecords,
        deleteMeeting,
        saveRedemptionData,
        deleteRedemptionData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
