import { Timestamp, FieldValue } from "firebase/firestore";
import { Base } from "./Base";

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface Message extends Base {
  id: string;                        // 唯一訊息 ID
  chatId: string;                    // 所屬聊天室 ID
  senderId: string;                  // 發送者的 userId
  type: MessageType;                 // 訊息類型
  content: string;                   // 訊息內容（文字或檔案 URL）
  timestamp: Timestamp;              // 發送時間
  readBy?: string[];                 // 已讀的 userId 陣列
  replyTo?: string;                  // 選填：回覆的訊息 ID
  deleted?: boolean;                 // 軟刪除標記
}
