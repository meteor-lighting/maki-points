/**
 * 會議積分系統 - Google Apps Script (GAS) 後端 API v3 (終極容錯版)
 */

const SHEET_USERS = 'Users';
const SHEET_MEETINGS = 'Meetings';
const SHEET_RECORDS = 'Records';
const SHEET_REDEMPTIONS = 'Redemptions';

function doGet(e) {
  try {
    // 強化：Action 參數不分大小寫
    let action = (e.parameter.action || "").toLowerCase();
    
    if (action === 'getusers') {
      return createJsonResponse(getUsers());
    } else if (action === 'getmeetings') {
      return createJsonResponse(getMeetings());
    } else if (action === 'getrecords') {
      return createJsonResponse(getRecords());
    } else if (action === 'getalldata') {
      const data = {
        version: '5.19',
        users: getUsers(),
        meetings: getMeetings(),
        records: getRecords(),
        redemptions: getRedemptions(),
        debugHeaders: {}
      };
      // 收集診斷資訊
      [SHEET_USERS, SHEET_MEETINGS, SHEET_RECORDS, SHEET_REDEMPTIONS].forEach(name => {
        const s = SpreadsheetApp.getActiveSpreadsheet().getSheets().find(sh => sh.getName().trim().toLowerCase() === name.toLowerCase());
        if (s) {
          const v = s.getDataRange().getValues();
          data.debugHeaders[name] = v.length > 0 ? v[0] : [];
        }
      });
      return createJsonResponse(data);
    } else if (action === 'debug') {
      // 診斷功能：回傳所有分頁資訊
      return createJsonResponse(getDebugInfo());
    } else if (action === 'ping') {
      return createJsonResponse({ status: 'success', message: 'pong' });
    }
    
    return createJsonResponse({ status: 'success', message: 'API is ready. Use ?action=getAllData' });
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let action = (data.action || "").toLowerCase();

    if (action === 'savemeetingandrecords') {
      return createJsonResponse(saveMeetingAndRecords(data.meeting, data.records));
    } else if (action === 'deletemeeting') {
      return createJsonResponse(deleteMeetingAndRecords(data.meetingId));
    } else if (action === 'updatemeetingrecords') {
      return createJsonResponse(updateMeetingRecords(data.meetingId, data.records));
    } else if (action === 'saveredemption') {
      return createJsonResponse(saveRedemption(data.redemption));
    } else if (action === 'deleteredemption') {
      return createJsonResponse(deleteRedemptionRow(data.redemptionId));
    } else if (action === 'editredemption') {
      return createJsonResponse(editRedemptionRow(data.redemption));
    } else if (action === 'editmeeting') {
      return createJsonResponse(editMeetingRow(data.meeting));
    }
    return createErrorResponse("Unknown action: " + action);
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * 欄位映射輔助：將試算表標頭轉為前端對應鍵名 (例如 "會議名稱" -> "title")
 * V5.10：終極淨化 - 移除所有非字母、數字、中文字元，並擴充關鍵字
 */
function mapHeader(header) {
  if (!header) return '';
  // 1. 只保留 中文字、英文字母、數字，排除所有符號 (含空白、括號、底線等)
  const s = header.toString().replace(/[^\w\u4e00-\u9fa5]/g, '').toLowerCase();
  
  // 1. 優先處理複合型 ID (避免被後半段的 generic 'id' 誤截)
  if (s.includes('meetingid') || s.includes('會議id') || s.includes('會議編號') || s.includes('mid') || s.includes('會議序號')) return 'meetingId';
  if (s.includes('userid') || s.includes('使用者id') || s.includes('帳號') || s.includes('工號') || s.includes('員工編號') || s.includes('卡號')) return 'userId';
  if (s.includes('recorderid') || s.includes('填表人id')) return 'recorderId';

  // 2. 精準匹配主鍵 id (通常是 Users 或是 Meetings 表的第一欄)
  if (s === 'id' || s === 'no' || s === '編號' || s === '流水號') return 'id';

  // 3. 基本人資欄位
  if (s.includes('姓名') || s.includes('名字') || s.includes('同仁') || s.includes('name') || s.includes('人員') || s.includes('參加')) return 'userName';
  if (s.includes('department') || s.includes('部門') || s.includes('單位') || s.includes('dept') || s.includes('組別') || s.includes('處室')) return 'department';
  
  // 4. 會議內容相關
  if (s.includes('名稱') || s.includes('標題') || s.includes('title')) return 'title';
  if (s.includes('主題') || s.includes('事由') || s.includes('topic') || s.includes('大綱')) return 'topic';
  if (s.includes('recorder') || s.includes('填表') || s.includes('記錄') || s.includes('紀錄') || s.includes('記分') || s.includes('錄音') || s.includes('主持人')) return 'recorder';
  
  // 5. 時間與積分
  if (s.includes('date') || s.includes('日期') || s.includes('時間') || s.includes('timestamp') || s.includes('戳記')) return 'date';
  if (s.includes('score') || s.includes('積分') || s.includes('分數') || s.includes('得分') || s.includes('點數') || s.includes('成績') || s.includes('小計')) return 'score';
  if (s.includes('role') || s.includes('角色') || s.includes('職位') || s.includes('身分') || s.includes('權限')) return 'role';
  
  // 6. 擴充欄位 (發問/兌換)
  if (s.includes('askcount') || s.includes('發問') || s.includes('提問')) {
    if (s.includes('第一') || s.includes('搶答')) return 'firstAskCount';
    return 'askCount';
  }
  if (s.includes('answercount') || s.includes('回答') || s.includes('回應') || s.includes('回覆')) return 'answerCount';
  if (s.includes('prize') || s.includes('獎品') || s.includes('獎項') || s.includes('兌換品')) return 'prize';
  if (s.includes('points') || s.includes('扣除') || s.includes('花費')) return 'points';
  
  // 5.19：獨立關鍵字備援
  if (s.includes('快問') || s.includes('搶答') || s.includes('第一個')) return 'firstAskCount';

  return s; 
}

/**
 * 通用讀取：讀取指定分頁並轉換為物件陣列
 * V5.11：智慧辨識「最佳標頭列」- 選取關鍵字命中率最大化的一列
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === sheetName.toLowerCase());
  
  if (!sheet) return [];
  
  const vals = sheet.getDataRange().getValues();
  if (vals.length === 0) return [];
  
  // 智慧搜尋：在 15 列內選取有效映射標頭最多的列
  let bestHeaderIndex = 0;
  let maxMappedCount = -1;
  const scanLimit = Math.min(vals.length, 15);
  
  const STANDARD_KEYS = [
    'id', 'userId', 'userName', 'department', 
    'meetingId', 'title', 'topic', 'recorder', 'recorderId', 'date', 
    'score', 'role', 'timestamp', 
    'askCount', 'answerCount', 'firstAskCount', 'prize', 'points'
  ];
  
  for (let i = 0; i < scanLimit; i++) {
    // 只有對應到我們系統標準鍵名的，才算有「命中」
    const mappedCount = vals[i].map(mapHeader).filter(h => STANDARD_KEYS.includes(h)).length;
    if (mappedCount > maxMappedCount) {
      maxMappedCount = mappedCount;
      bestHeaderIndex = i;
    }
  }
  
  const rawHeaders = vals[bestHeaderIndex];
  const mappedHeaders = rawHeaders.map(mapHeader);
  
  const results = [];
  for (let i = bestHeaderIndex + 1; i < vals.length; i++) {
    const row = vals[i];
    if (row.every(cell => cell.toString().trim() === "")) continue; // 跳過全空行
    const obj = {};
    mappedHeaders.forEach((h, index) => {
      if (h) {
        let val = row[index];
        // 修正：強制將 ID 相關欄位轉為淨化後的字串
        if (['id', 'meetingId', 'userId', 'recorderId'].includes(h)) {
          obj[h] = val !== null && val !== undefined ? val.toString().trim() : '';
        } else if (val instanceof Date) {
          if (h === 'date') {
            // 會議日期：使用試算表時區格式化為 YYYY-MM-DD，避免 UTC 造成減一天的問題
            obj[h] = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
          } else {
            // 建立時間 (timestamp) 等其他時間：保留完整 ISO 字串
            obj[h] = val.toISOString();
          }
        } else {
          obj[h] = val;
        }
      }
    });
    // 補償邏輯：確保 ID 欄位一致性 (對應前端統計)
    if (!obj.id && !obj.meetingId) {
       if (obj.userId) obj.id = obj.userId;
    }
    results.push(obj);
  }
  return results;
}

function getUsers() {
  return getSheetData(SHEET_USERS).filter(u => (u.id || u.userId) && (u.name || u.userName));
}

function getMeetings() {
  return getSheetData(SHEET_MEETINGS);
}

function getRecords() {
  return getSheetData(SHEET_RECORDS);
}

function getRedemptions() {
  return getSheetData(SHEET_REDEMPTIONS);
}

function saveRedemption(redemption) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_REDEMPTIONS.toLowerCase());
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_REDEMPTIONS);
    sheet.appendRow(['id', 'userId', 'userName', 'prize', 'points', 'timestamp']);
  }

  const redId = 'R' + Date.now();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => h.toString().trim().toLowerCase());
  const row = headers.map(header => {
    if (header === 'timestamp') return new Date().toISOString();
    if (header === 'id') return redId;
    const mappedKey = mapHeader(header);
    
    // Fallback logic
    let val = redemption[mappedKey];
    if (val === undefined) {
      const originalKey = Object.keys(redemption).find(k => k.toLowerCase() === header);
      if (originalKey) val = redemption[originalKey];
    }
    return val !== undefined ? val : (redemption[header] || '');
  });
  
  sheet.appendRow(row);
  return { status: 'success', id: redId };
}

function getDebugInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  return {
    spreadsheetId: ss.getId(),
    totalSheets: sheets.length,
    sheetNames: sheets.map(s => s.getName()),
    usersPreview: getSheetData(SHEET_USERS).slice(0, 5),
    redemptionsPreview: getRedemptions().slice(0, 5)
  };
}

function saveMeetingAndRecords(meeting, records) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meetSheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_MEETINGS.toLowerCase());
  const recSheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_RECORDS.toLowerCase());
  
  if (!meetSheet || !recSheet) throw new Error("Missing Sheets");

  // V5.20：自動補足標頭 (預防數據遺失)
  ensureHeaders(SHEET_RECORDS, ['快問', 'firstaskcount']);

  // 確保取得明確有效的 meeting ID 與 recorder 名稱
  const mId = meeting.id || meeting.meetingId || ('M' + Date.now());
  const recName = meeting.recorder || meeting.recorderName || '';

  const meetHeaders = meetSheet.getRange(1, 1, 1, meetSheet.getLastColumn()).getValues()[0].map(h => h.toString().trim().toLowerCase());
  const meetRow = meetHeaders.map(header => {
    if (header === 'timestamp') return new Date().toISOString();
    const mappedKey = mapHeader(header);
    if (mappedKey === 'id' || mappedKey === 'meetingId') return mId;
    if (mappedKey === 'recorder') return recName;

    let val = meeting[mappedKey];
    if (val === undefined) {
      const originalKey = Object.keys(meeting).find(k => k.toLowerCase() === header);
      if (originalKey) val = meeting[originalKey];
    }
    return val !== undefined ? val : (meeting[header] || '');
  });
  meetSheet.appendRow(meetRow);

  const recHeaders = recSheet.getRange(1, 1, 1, recSheet.getLastColumn()).getValues()[0].map(h => h.toString().trim().toLowerCase());
  const recRows = records.map(record => {
    return recHeaders.map(header => {
      const mappedKey = mapHeader(header);
      if (mappedKey === 'meetingId' || mappedKey === 'id') return mId;
      let val = record[mappedKey];
      if (val === undefined) {
        const originalKey = Object.keys(record).find(k => k.toLowerCase() === header);
        if (originalKey) val = record[originalKey];
      }
      return val !== undefined ? val : (record[header] || '');
    });
  });
  
  if (recRows.length > 0) {
    recSheet.getRange(recSheet.getLastRow() + 1, 1, recRows.length, recHeaders.length).setValues(recRows);
  }
  return { status: 'success', meetingId: mId };
}

function updateMeetingRecords(meetingId, updatedRecords) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recSheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_RECORDS.toLowerCase());
  if (!recSheet) throw new Error("Missing Records Sheet");

  const dataRange = recSheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0].map(h => h.toString().trim().toLowerCase());
  const meetIdIdx = headers.indexOf('meetingid');
  const userIdIdx = headers.indexOf('userid');
  
  if (meetIdIdx === -1 || userIdIdx === -1) throw new Error("Missing ID Headers");

  let updateCount = 0;
  for (let i = 1; i < values.length; i++) {
    const rowMeetingId = values[i][meetIdIdx].toString().trim();
    if (rowMeetingId === meetingId.toString().trim()) {
      const uid = values[i][userIdIdx].toString().trim();
      const newRec = updatedRecords.find(ur => ur.userId.toString().trim() === uid);
      if (newRec) {
        // 更新該列的所有對應欄位
        headers.forEach((h, colIdx) => {
          const mappedKey = mapHeader(h);
          if (newRec[mappedKey] !== undefined && h !== 'meetingid' && h !== 'userid' && h !== 'username') {
            values[i][colIdx] = newRec[mappedKey];
          }
        });
        updateCount++;
      }
    }
  }

  if (updateCount > 0) {
    dataRange.setValues(values);
  }
  return { status: 'success', updated: updateCount };
}

function deleteMeetingAndRecords(meetingId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meetSheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_MEETINGS.toLowerCase());
  const recSheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_RECORDS.toLowerCase());

  if (meetSheet) {
    const meetingRows = meetSheet.getDataRange().getValues();
    const meetHeaders = meetingRows[0].map(h => h.toString().trim().toLowerCase());
    const idColIndex = meetHeaders.indexOf('id');
    
    if (idColIndex !== -1) {
      for (let i = meetingRows.length - 1; i >= 1; i--) {
        if (meetingRows[i][idColIndex].toString() === meetingId.toString()) {
          meetSheet.deleteRow(i + 1);
          break; // Assuming meeting IDs are unique in Meetings sheet
        }
      }
    }
  }
  
  if (recSheet) {
    const recordRows = recSheet.getDataRange().getValues();
    const recHeaders = recordRows[0].map(h => h.toString().trim().toLowerCase());
    const meetingIdColIndex = recHeaders.indexOf('meetingid');
    
    if (meetingIdColIndex !== -1) {
      for (let i = recordRows.length - 1; i >= 1; i--) {
        if (recordRows[i][meetingIdColIndex].toString() === meetingId.toString()) {
          recSheet.deleteRow(i + 1);
        }
      }
    }
  }
  return { status: 'success' };
}

function deleteRedemptionRow(redemptionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_REDEMPTIONS.toLowerCase());
  if (!sheet) return { status: 'error', message: '找不到 Redemptions 分頁' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  const idColIndex = headers.indexOf('id');

  if (idColIndex === -1) return { status: 'error', message: 'Redemptions 分頁缺少 ID 欄位' };

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idColIndex].toString() === redemptionId.toString()) { 
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: '找不到該筆兌換 ID' };
}

function editRedemptionRow(redemption) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_REDEMPTIONS.toLowerCase());
  if (!sheet) return { status: 'error', message: '找不到 Redemptions 分頁' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === redemption.id.toString()) {
      const row = headers.map(header => {
        if (header === 'id') return data[i][0];
        if (header === 'timestamp') return data[i][headers.indexOf('timestamp')];
        const mappedKey = mapHeader(header);
        
        let val = redemption[mappedKey];
        if (val === undefined) {
          const originalKey = Object.keys(redemption).find(k => k.toLowerCase() === header);
          if (originalKey) val = redemption[originalKey];
        }
        return val !== undefined ? val : (redemption[header] || data[i][headers.indexOf(header)]);
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: '找不到該筆兌換 ID' };
}

/**
 * 編輯會議基本資訊 (Meetings 工作表)
 */
function editMeetingRow(meeting) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === SHEET_MEETINGS.toLowerCase());
  if (!sheet) return { status: 'error', message: '找不到 Meetings 分頁' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  
  for (let i = 1; i < data.length; i++) {
    const idIdx = headers.indexOf('id');
    if (idIdx !== -1 && data[i][idIdx].toString() === meeting.id.toString()) {
      const row = headers.map(header => {
        if (header === 'id') return data[i][idIdx];
        if (header === 'timestamp') return data[i][headers.indexOf('timestamp')];
        const mappedKey = mapHeader(header);
        
        let val = meeting[mappedKey];
        if (val === undefined) {
          const originalKey = Object.keys(meeting).find(k => k.toLowerCase() === header);
          if (originalKey) val = meeting[originalKey];
        }
        return val !== undefined ? val : (meeting[header] || data[i][headers.indexOf(header)]);
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: '找不到該筆會議 ID' };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}


function createErrorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * V5.19：自動確保試算表標頭存在 (快問功能補足)
 */
function ensureHeaders(sheetName, requiredKeywords) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === sheetName.toLowerCase());
  if (!sheet) return;
  
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(h => h.toString().trim().toLowerCase());
  
  // 檢查是否已存在任何對應的關鍵字
  const hasField = currentHeaders.some(h => requiredKeywords.some(k => h.includes(k)));
  
  if (!hasField) {
    const nextCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, nextCol).setValue("快問次數"); // 使用中文標籤作為預設標頭
  }
}
