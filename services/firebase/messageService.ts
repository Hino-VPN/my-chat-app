import { collection, query, where, getDocs, onSnapshot, orderBy, limit, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, MessageType } from '@/models/Message';

const COLLECTION_MESSAGES = 'messages';
const STORAGE_KEY_MESSAGES_PREFIX = '@app:messages:';

// 獲取特定聊天室的訊息
export const getChatMessages = async (chatId: string, limitCount = 50) => {
  try {
    console.log(`獲取聊天室 ${chatId} 的訊息，限制數量: ${limitCount}`);
    
    // 使用正確的子集合路徑
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const messages: any[] = [];
    
    console.log(`聊天室 ${chatId} 查詢結果文檔數: ${querySnapshot.size}`);
    
    querySnapshot.forEach((doc) => {
      const messageData = doc.data();
      messages.push({
        id: doc.id,
        ...messageData
      });
    });
    
    return messages.reverse();
  } catch (error) {
    console.error(`Error getting chat messages for ${chatId}:`, error);
    throw error;
  }
};

// 設置訊息即時監聽
export const subscribeToChatMessages = (chatId: string, onUpdate: (messages: any[]) => void) => {
  try {
    console.log(`開始訂閱聊天室訊息: ${chatId}, 時間戳: ${new Date().toISOString()}`);
    
    // 修正集合路徑 - 使用正確的子集合路徑
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    console.log(`訂閱查詢已創建: ${chatId}`);
    
    // 返回訂閱
    return onSnapshot(q, (querySnapshot) => {
      console.log(`收到聊天室 ${chatId} 的快照更新，文檔數: ${querySnapshot.size}`);
      
      const messages: any[] = [];
      querySnapshot.forEach((doc) => {
        const messageData = doc.data();
        messages.push({
          id: doc.id,
          ...messageData
        });
      });
      
      // 即使沒有消息也觸發回調，傳遞空數組
      console.log(`處理聊天室 ${chatId} 的消息更新，消息數量: ${messages.length}`);
      
      // 按時間排序訊息（從舊到新）
      const sortedMessages = messages.reverse();
      
      // 觸發回調
      onUpdate(sortedMessages);
    }, (error) => {
      console.error(`聊天室 ${chatId} 訂閱錯誤:`, error);
      // 發生錯誤時，傳遞空數組，避免應用崩潰
      onUpdate([]);
    });
  } catch (error) {
    console.error(`Error subscribing to chat messages for ${chatId}:`, error);
    // 在 catch 區塊中返回一個空的取消訂閱函數
    return () => console.log(`取消訂閱聊天室 ${chatId} 的空訂閱`);
  }
};

// 將訊息保存到本地存儲
export const cacheMessages = async (chatId: string, messages: any[]) => {
  try {
    await AsyncStorage.setItem(
      `${STORAGE_KEY_MESSAGES_PREFIX}${chatId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error('Error caching messages:', error);
  }
};

// 發送新訊息
export const sendMessage = async (messageData: {
  chatId: string;
  senderId: string;
  type: string;
  content: string;
}) => {
  try {
    const { chatId, senderId, type, content } = messageData;
    
    // 創建訊息文檔 - 使用正確的子集合路徑
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const timestamp = Timestamp.now();
    
    const newMessage: Omit<Message, 'id'> = {
      chatId,
      senderId,
      type: type as MessageType,
      content,
      readBy: [senderId], // 發送者已讀
      timestamp: timestamp,
      createdAt: timestamp,
      lastUpdatedAt: timestamp,
      status: 1,
      deleted: false
    };

    console.log('Sending message:', newMessage);
    
    // 添加到 Firestore
    const docRef = await addDoc(messagesRef, newMessage);
    
    // 更新聊天室的最後訊息
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: content,
      lastMessageTime: timestamp,
      lastUpdatedAt: timestamp
    });
    
    return {
      id: docRef.id,
      ...newMessage
    };
  } catch (error) {
    console.error('[sendMessage] Error sending message:', error);
    throw error;
  }
};