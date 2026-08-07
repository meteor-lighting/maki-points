/**
 * MAKI 會議積分系統 - API Client Service
 */

const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbyBHEjAM2z4RBjphmg--4vRwAsDfniVXhYazvZp0nTizOCwa_4wAoCrvGfNkO3B1ufDg/exec";

export function getGasApiUrl() {
  const customUrl = localStorage.getItem('gas_api_url');
  if (customUrl && customUrl.trim().startsWith('http')) {
    return customUrl.trim();
  }
  return import.meta.env.VITE_GAS_API_URL || DEFAULT_URL;
}

export function setCustomApiUrl(url) {
  if (url && url.trim().startsWith('http')) {
    localStorage.setItem('gas_api_url', url.trim());
  } else {
    localStorage.removeItem('gas_api_url');
  }
}

export async function fetchAllData() {
  const apiUrl = getGasApiUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const url = `${apiUrl}?action=getalldata&_t=${Date.now()}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    console.error("[API Error] fetchAllData failed:", error);
    if (error.name === 'AbortError') {
      throw new Error("連線逾時 (12秒)，請檢查 Google Apps Script 網址與網路狀態。");
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
      throw new Error(`GAS Server Error (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("[API Error] callGAS failed:", error);
    throw error;
  }
}

export async function saveMeetingAndRecords(meeting, records) {
  return await callGAS({ action: 'savemeetingandrecords', meeting, records });
}

export async function deleteMeeting(meetingId) {
  return await callGAS({ action: 'deletemeeting', meetingId });
}

export async function editMeetingData(meeting) {
  return await callGAS({ action: 'editmeeting', meeting });
}

export async function updateMeetingRecordsData(meetingId, records) {
  return await callGAS({ action: 'updatemeetingrecords', meetingId, records });
}

export async function saveRedemptionData(redemption) {
  return await callGAS({ action: 'saveredemption', redemption });
}

export async function deleteRedemptionData(redemptionId) {
  return await callGAS({ action: 'deleteredemption', redemptionId });
}

export async function editRedemptionData(redemption) {
  return await callGAS({ action: 'editredemption', redemption });
}
