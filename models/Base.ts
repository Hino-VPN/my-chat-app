import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Base {
  createdAt: Timestamp | FieldValue;      // 建立時間（必填）
  lastUpdatedAt: Timestamp | FieldValue;  // 最後更新時間（必填）
  status?: 0 | 1;                          // 狀態：0=刪除, 1=啟用 (預設為 1)
}