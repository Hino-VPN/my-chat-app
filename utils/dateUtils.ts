import { Timestamp } from 'firebase/firestore';
import i18n from '@/i18n'; // 使用項目的 i18n 配置

/**
 * 將時間戳格式化為相對時間字符串
 * @param date Timestamp 或 Date 對象
 * @returns 格式化後的相對時間字符串
 */
export function formatRelativeTime(date: any): string {
  if (!date) {
    console.error('formatRelativeTime error: date is null or undefined');
    return '';
  }

  let dateObj: Date;

  // 1. 如果是 Firebase Timestamp，轉換成 Date
  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } 
  // 2. 如果是 JSON 解析後的 { seconds, nanoseconds } 格式
  else if (typeof date === 'object' && date.seconds !== undefined && date.nanoseconds !== undefined) {
    dateObj = new Date(date.seconds * 1000 + Math.floor(date.nanoseconds / 1e6));
  }
  // 3. 如果是字串 (ISO 8601 格式)，轉換成 Date
  else if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  // 4. 如果已經是 Date，直接使用
  else if (date instanceof Date) {
    dateObj = date;
  }
  // 5. 其他無效情況，回傳錯誤
  else {
    console.error('formatRelativeTime error: Unrecognized date format', date);
    return '';
  }

  // 確保 dateObj 是有效的 Date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    console.error('formatRelativeTime error: Invalid Date', dateObj);
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear();

  if (diffSec < 60) {
    return i18n.t('chat.justNow');
  } else if (diffMin < 60) {
    return i18n.t('chat.minutesAgo', { count: diffMin });
  } else if (isToday) {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return i18n.t('chat.yesterday');
  } else if (diffDay < 7) {
    const days = [
      i18n.t('chat.sunday'),
      i18n.t('chat.monday'),
      i18n.t('chat.tuesday'),
      i18n.t('chat.wednesday'),
      i18n.t('chat.thursday'),
      i18n.t('chat.friday'),
      i18n.t('chat.saturday')
    ];
    return days[dateObj.getDay()];
  } else {
    try {
      return dateObj.toLocaleDateString(navigator.language || 'zh-HK');
    } catch (error) {
      return dateObj.toLocaleDateString();
    }
  }
}


/**
 * 格式化消息發送時間
 * @param timestamp 時間戳
 * @returns 格式化後的時間字符串
 */
export function formatMessageTime(timestamp?: Timestamp): string {
  if (!timestamp) return '';
  return formatRelativeTime(timestamp);
}

/**
 * 格式化時間為 HH:MM 格式
 * @param date Timestamp 或 Date 對象
 * @returns 格式化後的時間字符串 (HH:MM)
 */
export function formatTime(date: any): string {
  if (!date) {
    console.error('formatTime error: date is null or undefined');
    return '';
  }

  let dateObj: Date;

  // 1. 如果是 Firebase Timestamp，轉換成 Date
  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } 
  // 2. 如果是 JSON 解析後的 { seconds, nanoseconds } 格式
  else if (typeof date === 'object' && date.seconds !== undefined && date.nanoseconds !== undefined) {
    dateObj = new Date(date.seconds * 1000 + Math.floor(date.nanoseconds / 1e6));
  }
  // 3. 如果是字串 (ISO 8601 格式)，轉換成 Date
  else if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  // 4. 如果已經是 Date，直接使用
  else if (date instanceof Date) {
    dateObj = date;
  }
  // 5. 其他無效情況，回傳錯誤
  else {
    console.error('formatTime error: Unrecognized date format', date);
    return '';
  }

  // 確保 dateObj 是有效的 Date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    console.error('formatTime error: Invalid Date', dateObj);
    return '';
  }

  // 格式化為 HH:MM
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

export default {
  formatRelativeTime,
  formatMessageTime,
  formatTime
}; 