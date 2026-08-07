/**
 * 日期與時間格式化工具 (Date & Time Formatter)
 */
export function formatDateDisplay(val) {
  if (!val) return 'N/A';
  const str = String(val).trim();

  try {
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      if (str.includes('T') || str.includes(':')) {
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } else {
        return `${year}-${month}-${day}`;
      }
    }
  } catch (e) {
    console.warn("formatDateDisplay error:", e);
  }

  return str;
}
