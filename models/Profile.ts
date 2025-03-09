import { Timestamp, FieldValue } from "firebase/firestore";
import { Base } from "./Base";

export interface Profile extends Base {
  id: string | null;
  
  email: string | null;             // 用戶電子郵件
  phoneNumber: string | null;       // 電話號碼，沒有的話設為空字串
  username: string | null;          // 顯示名稱
  avatar: string | null;            // 頭像 URL，預設可為空字串
  caption: string | null;           // 用戶狀態或簽名，預設空字串
  friends: string[];         // 好友列表（userId 陣列），預設為空陣列
  blockedUsers: string[];    // 封鎖的用戶列表（userId 陣列），預設為空陣列

  userId: string;            // 用戶 ID
  isVerified: boolean;       // 是否已驗證
  lastLogin: Timestamp | FieldValue; // 上次登入時間
  role: 'user' | 'admin';    // 用戶角色
  lastSeen: Timestamp | FieldValue;  // 最近上線時間
}
