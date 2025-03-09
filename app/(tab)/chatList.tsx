import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Chat } from '@/models/Chat';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getUserChats, subscribeToUserChats } from '@/services/firebase/chatService';
import { cleanupSubscriptions, syncUserData } from '@/services/firebase/syncService';
import { getCurrentUser } from '@/services/firebase/userService';
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from '@/utils/dateUtils';

const STORAGE_KEY_CHATS = '@app:chats';

const ChatListPage = () => {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  // 初始化時加載聊天列表
  useEffect(() => {
    loadChats();
    
    // 清理訂閱
    return () => {
      cleanupSubscriptions();
    };
  }, []);

  // 加載聊天列表
  const loadChats = async () => {
    console.log('loadChats called, timestamp:', new Date().toISOString());
    setLoading(true);
    try {
      // 先嘗試從本地緩存加載
      const cachedChats = await AsyncStorage.getItem(STORAGE_KEY_CHATS);
      if (cachedChats) {
        const parsedChats = JSON.parse(cachedChats);
        console.log("從緩存加載的聊天數量:", parsedChats.length);
        setChats(parsedChats);
      } else {
        console.log("沒有找到緩存的聊天數據");
      }
      
      // 獲取當前用戶ID
      const currentUser = getCurrentUser();
      if (currentUser) {
        console.log("當前用戶ID:", currentUser.uid);
        
        // 同步用戶數據（這會更新本地緩存並設置監聽器）
        await syncUserData(currentUser.uid);
        
        // 清理之前可能存在的訂閱，避免重複訂閱
        cleanupSubscriptions();
        
        // 訂閱聊天更新
        console.log("準備訂閱用戶聊天更新");
        const unsubscribe = subscribeToUserChats(currentUser.uid, (updatedChats) => {
          console.log("收到聊天更新，數量:", updatedChats.length);
          setChats(updatedChats);
          setLoading(false);
          setRefreshing(false);
        });
        
        // 將 unsubscribe 函數保存起來，以便在組件卸載時調用
        // 這裡可以添加到 syncService 中的一個訂閱管理函數
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  // 處理點擊聊天項
  const handleChatPress = (chat: Chat) => {
    console.log('handleChatPress called, timestamp:', new Date().toISOString());
    console.log('handleChatPress called, chat:', chat);
    router.push({
      pathname: "/chat/[chatId]",
      params: { chatId: chat.id }
    });
  };

  // 處理創建新聊天
  const handleCreateChat = () => {
    router.push('/createChat');
  };

  // 渲染聊天項
  const renderChatItem = ({ item }: { item: Chat }) => {
    const isGroup = item.chatMode === 'group';
    
    // 獲取頭像信息
    const getAvatarInfo = () => {
      if (isGroup) {
        // 群聊使用群組頭像
        return { 
          initial: item.name?.charAt(0).toUpperCase() || 'G', 
          avatarUrl: item.avatar || null 
        };
      } else {
        // 私聊使用對方的頭像
        const currentUser = getCurrentUser();
        if (!currentUser) return { initial: '?', avatarUrl: null };
        
        const otherParticipant = item.participants.find(p => p.userId !== currentUser.uid);
        return { 
          initial: otherParticipant?.username?.charAt(0).toUpperCase() || '?', 
          avatarUrl: otherParticipant?.avatar || null 
        };
      }
    };
    
    const { initial, avatarUrl } = getAvatarInfo();
    
    // 獲取聊天名稱
    const getChatName = () => {
      if (isGroup) {
        return item.name;
      } else {
        const currentUser = getCurrentUser();
        if (!currentUser) return item.name;
        
        const otherParticipant = item.participants.find(p => p.userId !== currentUser.uid);
        return otherParticipant?.username || item.name;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.background }]}
        onPress={() => handleChatPress(item)}
      >
        {/* 頭像 */}
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {initial}
              </Text>
            </View>
          )}
        </View>

        {/* 聊天信息 */}
        <View style={styles.chatInfo}>
          <View style={styles.headerRow}>
            <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
              {getChatName()}
            </Text>
            <Text style={[styles.timeText, { color: theme.secondaryText }]}>
              {formatRelativeTime(item.lastMessageTime)}
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, { color: theme.secondaryText }]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染空狀態
  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          {t('chat.noConversations')}
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateChat}
        >
          <Text style={styles.emptyButtonText}>{t('chat.startNewChat')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('chat.title')}</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateChat}
        >
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {loading && chats.length === 0 ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatListPage;