import { Timestamp } from 'firebase/firestore';
import { Base } from './Base';

export type ChatMode = 'private' | 'group';

export interface Chat extends Base {
  id: string;                         // 唯一聊天室 ID
  chatMode: ChatMode;                 // 聊天類型：單聊或群聊
  participants: {
    userId: string;
    username: string;
    avatar: string;
  }[];                                // denormalized 快照資料，方便顯示用戶資訊
  lastMessage: string;                // 最近一則訊息內容
  lastMessageTime: Timestamp;         // 最近訊息時間
  unreadCount: number;                // 未讀訊息數量
  
  name: string;                       // 聊天室名稱（對群組來說使用）
  avatar: string;                     // 聊天室頭像 URL（對群組來說使用）
  description: string;                // 聊天室描述（對群組來說使用）
  
  adminIds: string[];                 // 聊天室管理員 userId 陣列
  createdBy: string;                  // 聊天室創建者的 userId
}
