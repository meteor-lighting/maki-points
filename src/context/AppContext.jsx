import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchAllData,
  saveMeetingAndRecords,
  deleteMeeting,
  saveRedemptionData,
  deleteRedemptionData,
  getGasApiUrl
} from '../services/api';
import { translations } from '../constants/translations';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState({ users: [], meetings: [], records: [], redemptions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('is_admin') === 'true');
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'create' | 'recording' | 'stats' | 'exchange'

  // i18n Language state ('zh' | 'en')
  const [lang, setLang] = useState(() => localStorage.getItem('maki_lang') || 'zh');

  useEffect(() => {
    localStorage.setItem('maki_lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'zh' ? 'en' : 'zh'));
  };

  const t = useCallback(
    (key) => {
      if (!translations[lang]) return key;
      return translations[lang][key] || translations['zh'][key] || key;
    },
    [lang]
  );

  // Modals & Active State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [personalStatsUser, setPersonalStatsUser] = useState(null); // User object or null
  const [toastMessage, setToastMessage] = useState(null);

  // Active Recording Session state
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [activeRecords, setActiveRecords] = useState({});

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

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setConnectionStatus('connecting');
    try {
      const res = await fetchAllData(forceRefresh);
      processApiResult(res);
      setConnectionStatus('online');
      setError(null);
      return res;
    } catch (err) {
      console.error("[AppContext] loadData failed:", err);
      setConnectionStatus('offline');
      setError(err.message || '無法連線至 Google Apps Script 後端');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [processApiResult]);

  useEffect(() => {
    // Clear legacy manual overrides from localStorage to prevent old broken URL caching
    localStorage.removeItem('gas_api_url');
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
      alert('密碼錯誤！');
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.setItem('is_admin', 'false');
    showToast('👋 已登出管理員身分');
    if (currentView === 'exchange') {
      setCurrentView('home');
    }
  };

  const navigate = (viewName) => {
    if (viewName === 'exchange' && !isAdmin) {
      alert('⚠️ 限管理者使用！請點擊右上方「管理員登入」。');
      return;
    }
    setCurrentView(viewName);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        data,
        loading,
        error,
        connectionStatus,
        isAdmin,
        currentView,
        showAdminModal,
        personalStatsUser,
        toastMessage,
        activeMeeting,
        activeRecords,
        getGasApiUrl,
        setShowAdminModal,
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

