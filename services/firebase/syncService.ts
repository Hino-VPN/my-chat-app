import { getUserChats, subscribeToUserChats } from './chatService';
import { subscribeToChatMessages } from './messageService';
import { subscribeToProfileUpdates } from './profileService';
import { useUser } from '@/contexts/UserContext';

// 用於存儲訂閱，以便可以在需要時取消
let chatSubscription: (() => void) | null = null;
let profileSubscription: (() => void) | null = null;
const messageSubscriptions: Record<string, () => void> = {};

// 同步用戶的聊天和訊息數據
export const syncUserData = async (userId: string, setUser?: (profile: any) => void) => {
  try {
    console.log('syncUserData called for user:', userId, 'timestamp:', new Date().toISOString());
    
    // 訂閱用戶個人資料更新
    if (profileSubscription) {
      console.log('已存在個人資料訂閱，不再重複訂閱');
    } else {
      console.log('創建新的個人資料訂閱');
      profileSubscription = subscribeToProfileUpdates(userId, (profile) => {
        console.log('個人資料已更新:', profile.username);
        // 如果提供了 setUser 函數，則更新用戶狀態
        if (setUser) {
          setUser(profile);
        }
      });
    }
    
    // 取得用戶所有聊天室
    const chats = await getUserChats(userId);
    console.log('Retrieved chats count:', chats.length);
    
    // 訂閱聊天室更新 - 只有在沒有現有訂閱時才創建新訂閱
    if (chatSubscription) {
      console.log('已存在聊天訂閱，不再重複訂閱');
      // 不要在這裡創建新的訂閱，避免重複訂閱
    } else {
      console.log('創建新的聊天訂閱');
      chatSubscription = subscribeToUserChats(userId, (updatedChats) => {
        console.log('Chats updated:', updatedChats.length);
        
        // 當聊天室更新時，檢查是否有新的聊天室需要訂閱
        updatedChats.forEach(chat => {
          if (!messageSubscriptions[chat.id]) {
            subscribeToChat(chat.id);
          }
        });
      });
    }
    
    // 為每個聊天室訂閱訊息
    chats.forEach(chat => {
      subscribeToChat(chat.id);
    });
    
    return true;
  } catch (error) {
    console.error('Error syncing user data:', error);
    return false;
  }
};

// 訂閱特定聊天室的訊息
const subscribeToChat = (chatId: string) => {
  // 如果已經有訂閱，先取消
  if (messageSubscriptions[chatId]) {
    console.log(`取消現有的聊天室 ${chatId} 訂閱`);
    messageSubscriptions[chatId]();
    delete messageSubscriptions[chatId];
  }
  
  try {
    // 建立新的訂閱
    console.log(`為聊天室 ${chatId} 創建新訂閱`);
    const unsubscribe = subscribeToChatMessages(chatId, (messages) => {
      console.log(`聊天室 ${chatId} 收到 ${messages.length} 條訊息更新`);
    });
    
    // 確保返回的是一個有效的函數
    if (typeof unsubscribe === 'function') {
      messageSubscriptions[chatId] = unsubscribe;
      console.log(`成功訂閱聊天室 ${chatId}`);
    } else {
      console.error(`聊天室 ${chatId} 訂閱返回無效的取消訂閱函數`);
      // 設置一個空的取消訂閱函數
      messageSubscriptions[chatId] = () => console.log(`取消聊天室 ${chatId} 的無效訂閱`);
    }
  } catch (error) {
    console.error(`為聊天室 ${chatId} 創建訂閱時出錯:`, error);
    // 設置一個空的取消訂閱函數
    messageSubscriptions[chatId] = () => console.log(`取消聊天室 ${chatId} 的錯誤訂閱`);
  }
};

// 清理所有訂閱
export const cleanupSubscriptions = () => {
  if (chatSubscription) {
    chatSubscription();
    chatSubscription = null;
  }
  
  if (profileSubscription) {
    profileSubscription();
    profileSubscription = null;
  }
  
  Object.values(messageSubscriptions).forEach(unsubscribe => {
    unsubscribe();
  });
  
  // 清空訊息訂閱字典
  Object.keys(messageSubscriptions).forEach(key => {
    delete messageSubscriptions[key];
  });
};