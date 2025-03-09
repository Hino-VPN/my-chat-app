import { collection, doc, query, where, getDocs, onSnapshot, orderBy, Timestamp, addDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Chat, ChatMode } from '@/models/Chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileByUserId } from './profileService';

const COLLECTION_CHATS = 'chats';
const COLLECTION_MESSAGES = 'messages';
const STORAGE_KEY_CHATS = '@app:chats';

// 在 chatService.ts 中添加錯誤處理
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    console.log('Fetching chats for user:', userId); // 添加日誌
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const chats: Chat[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('Found chat:', doc.id); // 添加日誌
      chats.push({
        id: doc.id,
        ...doc.data()
      } as Chat);
    });
    
    return chats;
  } catch (error: any) {
    console.error('Error getting user chats:', error);
    // 添加更詳細的錯誤信息
    if (error.code === 'permission-denied') {
      console.error('Permission denied. User ID:', userId);
      console.error('Full error:', error);
    }
    throw error;
  }
};

// 設置聊天室即時監聽
export const subscribeToUserChats = (userId: string, onUpdate: (chats: Chat[]) => void) => {
  console.log('Subscribing to user chats for user:', userId, 'timestamp:', new Date().toISOString()); // 添加時間戳
  
  // 修正查詢條件，只使用字符串形式的 userId
  const q = query(
    collection(db, COLLECTION_CHATS),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  console.log('Query created, about to call onSnapshot');
  
  return onSnapshot(q, (querySnapshot) => {
    console.log('onSnapshot triggered, docs count:', querySnapshot.size);
    const chats: Chat[] = [];
    querySnapshot.forEach((doc) => {
      console.log('Processing chat document:', doc.id);
      const chatData = doc.data();
      const chat: Chat = {
        id: doc.id,
        participants: chatData.participants || [],
        lastMessage: chatData.lastMessage || '',
        lastMessageTime: chatData.lastMessageTime,
        unreadCount: chatData.unreadCount || 0,
        
        // 映射聊天類型
        chatMode: chatData.chatMode || (chatData.isGroupChat ? 'group' : 'private'),
        
        // 聊天室信息
        name: chatData.name || '',  
        avatar: chatData.avatar || '',
        description: chatData.description || '',
        
        // 管理信息
        adminIds: chatData.adminIds || [],
        createdBy: chatData.createdBy || '',
        
        // 時間信息
        createdAt: chatData.createdAt,
        lastUpdatedAt: chatData.updatedAt,
      };
      chats.push(chat);
    });
    
    // 更新本地儲存
    console.log('Saving chats to AsyncStorage, count:', chats.length);
    AsyncStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats))
      .catch(err => console.error('Error saving chats to storage:', err));
    
    // 觸發回調
    console.log('Calling onUpdate callback with chats');
    onUpdate(chats);
  }, (error) => {
    // 添加錯誤處理回調
    console.error('Error in onSnapshot:', error);
  });
};

// 創建新聊天室
export const createChat = async (
  currentUserId: string,
  participants: string[],
  chatName: string,
  isGroup: boolean
): Promise<string> => {
  try {
    const chatMode: ChatMode = isGroup ? 'group' : 'private';
    
    // 準備參與者資料
    const participantsData = [];
    
    // 添加當前用戶
    const currentUserProfile = await getProfileByUserId(currentUserId);
    participantsData.push({
      userId: currentUserId,
      avatar: currentUserProfile?.avatar || '',
      username: currentUserProfile?.username || ''
    });
    
    // 如果是單人對話，獲取對方的資料
    if (!isGroup && participants.length === 1) {
      const otherUserProfile = await getProfileByUserId(participants[0]);
      participantsData.push({
        userId: participants[0],
        avatar: otherUserProfile?.avatar || '',
        username: otherUserProfile?.username || ''
      });
    } else {
      // 如果是群組，獲取所有參與者的資料
      for (const userId of participants) {
        const userProfile = await getProfileByUserId(userId);
        participantsData.push({
          userId,
          avatar: userProfile?.avatar || '',
          username: userProfile?.username || ''
        });
      }
    }
    
    const chatRef = await addDoc(collection(db, COLLECTION_CHATS), {
      chatMode,
      participants: participantsData,
      name: chatName,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      unreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatar: '',
      description: '',
      adminIds: [currentUserId],
      createdBy: currentUserId,
      isGroupChat: isGroup
    });
    
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// 檢查是否存在相同的單聊
export const findExistingPrivateChat = async (
  currentUserId: string,
  otherUserId: string
): Promise<string | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_CHATS),
      where('chatMode', '==', 'private')
    );
    
    const querySnapshot = await getDocs(q);
    let existingChatId: string | null = null;
    
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      const participants = chatData.participants || [];
      
      // 檢查是否包含當前用戶和目標用戶
      const hasCurrentUser = participants.some((p: any) => p.userId === currentUserId);
      const hasOtherUser = participants.some((p: any) => p.userId === otherUserId);
      
      if (hasCurrentUser && hasOtherUser && participants.length === 2) {
        existingChatId = doc.id;
      }
    });
    
    return existingChatId;
  } catch (error) {
    console.error('Error finding existing chat:', error);
    return null;
  }
};

// 更新用戶在所有相關聊天室中的資料
export const updateUserProfileInChats = async (userId: string, newProfile: { avatar?: string, username?: string }): Promise<void> => {
  try {
    // 獲取用戶參與的所有聊天室
    const chats = await getUserChats(userId);
    
    // 更新每個聊天室中的用戶資料
    for (const chat of chats) {
      if (chat.participants) {
        // 查找用戶在 participants 陣列中的索引
        const participantIndex = chat.participants.findIndex(
          (p: {userId: string, username: string, avatar: string}) => p.userId === userId
        );
        
        if (participantIndex !== -1) {
          // 更新用戶資料
          const updatedParticipants = [...chat.participants];
          
          if (newProfile.avatar !== undefined) {
            updatedParticipants[participantIndex].avatar = newProfile.avatar;
          }
          
          if (newProfile.username !== undefined) {
            updatedParticipants[participantIndex].username = newProfile.username;
          }
          
          // 更新聊天室文檔
          const chatRef = doc(db, COLLECTION_CHATS, chat.id);
          await updateDoc(chatRef, { 
            participants: updatedParticipants,
            updatedAt: serverTimestamp() 
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating user profile in chats:', error);
    throw error;
  }
};

// 根據 ID 獲取特定聊天室資訊
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatRef = doc(db, COLLECTION_CHATS, chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      return {
        id: chatDoc.id,
        ...chatDoc.data()
      } as Chat;
    } else {
      console.log(`Chat with ID ${chatId} not found`);
      return null;
    }
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    throw error;
  }
};