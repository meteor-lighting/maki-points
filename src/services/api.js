/**
 * MAKI 會議積分系統 - API Client Service (帶 10分鐘 快取)
 */

const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbz1ai6A1bdhDEadJWbpd8yaCuwGnPnFOqYI5ywgUU3R7nHTzAabWaF6gQYpLqijvvBi-g/exec";
const CACHE_KEY = "maki_points_data_cache_v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)

export function getGasApiUrl() {
  return (import.meta.env.VITE_GAS_API_URL || DEFAULT_URL).trim();
}

export function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const age = Date.now() - Number(parsed.timestamp || 0);
    if (age < CACHE_TTL_MS && parsed.data) {
      return parsed.data;
    }
  } catch (e) {
    console.warn("getCachedData error:", e);
  }
  return null;
}

export function setCachedData(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data
      })
    );
  } catch (e) {
    console.warn("setCachedData error:", e);
  }
}

export function clearCachedData() {
  localStorage.removeItem(CACHE_KEY);
}

export async function fetchAllData(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      console.log("[API Cache] 使用 10 分鐘內快取資料");
      return { ...cached, _fromCache: true };
    }
  }

  const apiUrl = getGasApiUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `${apiUrl}?action=getalldata&_t=${Date.now()}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP 錯誤狀態: ${response.status}`);
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes('找不到網頁') || text.includes('Google Accounts')) {
        throw new Error('GAS 部署網址無效或權限限制。請確認 Apps Script 部署設定：「誰可以存取 (Who has access)」需設為「所有人 (Anyone)」。');
      }
      throw new Error('API 回應解析失敗 (非 JSON 格式)。');
    }

    // Save to cache
    setCachedData(result);
    return { ...result, _fromCache: false };
  } catch (error) {
    clearTimeout(timeout);
    console.error("[API Error] fetchAllData failed:", error);

    // Fallback to cache if network fetch failed
    const fallbackCache = getCachedData();
    if (fallbackCache) {
      console.warn("[API Cache] 連線失敗，離線退回最後快取資料");
      return { ...fallbackCache, _fromCache: true, _isOfflineFallback: true };
    }

    if (error.name === 'AbortError') {
      throw new Error("連線逾時 (12秒)，請檢查網路狀態。");
    }
    throw error;
  }
}

async function callGAS(payload) {
  const apiUrl = getGasApiUrl();
  try {
    const url = `${apiUrl}?_t=${Date.now()}`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`GAS 伺服器回應錯誤 (${response.status})`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('GAS 操作回應解析失敗');
    }
  } catch (error) {
    console.error("[API Error] callGAS failed:", error);
    throw error;
  }
}

export async function saveMeetingAndRecords(meeting, records) {
  clearCachedData();
  return await callGAS({ action: 'savemeetingandrecords', meeting, records });
}

export async function deleteMeeting(meetingId) {
  clearCachedData();
  return await callGAS({ action: 'deletemeeting', meetingId });
}

export async function editMeetingData(meeting) {
  clearCachedData();
  return await callGAS({ action: 'editmeeting', meeting });
}

export async function updateMeetingRecordsData(meetingId, records) {
  clearCachedData();
  return await callGAS({ action: 'updatemeetingrecords', meetingId, records });
}

export async function saveRedemptionData(redemption) {
  clearCachedData();
  return await callGAS({ action: 'saveredemption', redemption });
}

export async function deleteRedemptionData(redemptionId) {
  clearCachedData();
  return await callGAS({ action: 'deleteredemption', redemptionId });
}

export async function editRedemptionData(redemption) {
  clearCachedData();
  return await callGAS({ action: 'editredemption', redemption });
}
