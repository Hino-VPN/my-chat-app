// app/chat/[chatId].tsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, Image, Keyboard,
  KeyboardAvoidingView, Platform, Alert, Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Message } from '@/models/Message';
import { Chat } from '@/models/Chat';
import dateUtils from '@/utils/dateUtils';
import { subscribeToChatMessages, sendMessage, cacheMessages } from '@/services/firebase/messageService';
import { getChatById } from '@/services/firebase/chatService';
import { useChat } from '@/contexts/ChatContext';

// 附件類型選項
const attachmentOptions = [
  { icon: 'image', label: 'chat.photo', color: '#4CAF50' },
  { icon: 'videocam', label: 'chat.video', color: '#F44336' },
  { icon: 'document', label: 'chat.document', color: '#2196F3' },
  { icon: 'location', label: 'chat.location', color: '#FF9800' },
  { icon: 'mic', label: 'chat.audio', color: '#9C27B0' },
];

export default function ChatDetailPage() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useContext(ThemeContext);
  const flatListRef = useRef<FlatList>(null);
  const { messages: allMessages, setMessages: setContextMessages } = useChat();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  
  // 附件選單動畫
  const attachmentAnimation = useRef(new Animated.Value(0)).current;
  
  // 處理附件選單顯示/隱藏
  const toggleAttachments = () => {
    setShowAttachments(!showAttachments);
    Animated.timing(attachmentAnimation, {
      toValue: showAttachments ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };
  
  // 獲取聊天室資訊
  useEffect(() => {
    if (!chatId || !currentUser) return;
    
    const fetchChatData = async () => {
      try {
        const chat = await getChatById(chatId);
        if (chat) {
          setChatData(chat);
        } else {
          setError(t('chat.chatNotFound'));
        }
      } catch (err) {
        console.error('獲取聊天室資訊時出錯:', err);
        setError(t('chat.errorLoadingChat'));
      }
    };
    
    fetchChatData();
  }, [chatId, currentUser]);
  
  // 訂閱聊天室訊息
  useEffect(() => {
    if (!chatId || !currentUser) return;
    
    console.log(`為聊天室 ${chatId} 設置訊息訂閱`);
    setLoading(true);
    
    // 訂閱聊天室訊息
    const unsubscribe = subscribeToChatMessages(chatId, (newMessages) => {
      console.log(`收到聊天室 ${chatId} 的訊息更新，數量: ${newMessages.length}`);
      setMessages(newMessages);
      
      // 同時更新 ChatContext 中的訊息
      setContextMessages(chatId, newMessages);
      
      setLoading(false);
    });
    
    // 清理訂閱
    return () => {
      console.log(`清理聊天室 ${chatId} 的訊息訂閱`);
      unsubscribe();
    };
  }, [chatId, currentUser]);
  
  // 當訊息列表更新時，滾動到底部
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // 處理發送訊息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatId || isSending) return;
    console.log(currentUser)
    try {
      setIsSending(true);
      
      // 創建新訊息對象
      const messageData = {
        chatId,
        senderId: currentUser.uid,
        type: 'text',
        content: newMessage.trim()
      };
      
      // 發送訊息
      await sendMessage(messageData);

      // 清空輸入框
      setNewMessage('');

      // 隱藏鍵盤
      Keyboard.dismiss();
      
      // 滾動到底部
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      alert(t('chat.errorSendingMessage'));
    } finally {
      setIsSending(false);
    }
  };
  
  // 渲染訊息
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;
    const showAvatar = !isCurrentUser && (index === 0 || messages[index - 1]?.senderId !== item.senderId);
    console.log('Render message:', item)
    
    // 獲取頭像信息
    const getAvatarInfo = () => {
      if (!chatData) return { initial: '?', avatarUrl: null };
      
      if (chatData.chatMode === 'group') {
        // 群聊使用群組頭像
        return { 
          initial: chatData.name?.charAt(0).toUpperCase() || 'G', 
          avatarUrl: chatData.avatar || null 
        };
      } else {
        // 私聊使用對方的頭像
        const otherParticipant = chatData.participants.find(p => p.userId !== currentUser?.uid);
        return { 
          initial: otherParticipant?.username?.charAt(0).toUpperCase() || '?', 
          avatarUrl: otherParticipant?.avatar || null 
        };
      }
    };
    
    const { initial, avatarUrl } = getAvatarInfo();
    
    return (
      <View style={[
        styles.messageRow,
        { justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }
      ]}>
        {/* 頭像 (只在非當前用戶且需要顯示時) */}
        {!isCurrentUser && showAvatar && (
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatar} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: String(theme.primary) }]}>
                <Text style={styles.avatarText}>
                  {initial}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* 訊息氣泡 */}
        <View style={[
          styles.messageContainer,
          {
            backgroundColor: isCurrentUser ? String(theme.chatBubbleSent) : String(theme.chatBubbleReceived),
            borderBottomLeftRadius: !isCurrentUser ? 4 : 16,
            borderBottomRightRadius: isCurrentUser ? 4 : 16,
            marginLeft: !isCurrentUser && !showAvatar ? 40 : 0,
          }
        ]}>
          {/* 訊息內容 */}
          <Text style={[
            styles.messageContent,
            { color: String(theme.text) }
          ]}>
            {item.content}
          </Text>
          
          {/* 訊息時間 */}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: String(theme.secondaryText) }]}>
              {dateUtils.formatTime(item.lastUpdatedAt)}
            </Text>
            
            {/* 已讀狀態 (僅顯示在當前用戶發送的訊息) */}
            {isCurrentUser && (
              <Ionicons 
                name={item.readBy && item.readBy.length > 0 ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={String(theme.secondaryText)} 
                style={styles.readStatus} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };
  
  // 渲染附件選單
  const renderAttachmentMenu = () => {
    if (!showAttachments) return null;
    
    return (
      <Animated.View 
        style={[
          styles.attachmentMenu,
          { 
            opacity: attachmentAnimation,
            height: attachmentAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 120]
            }),
            backgroundColor: String(theme.cardBackground)
          }
        ]}
      >
        <View style={styles.attachmentOptions}>
          {attachmentOptions.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.attachmentOption}
              onPress={() => {
                toggleAttachments();
                // 這裡可以添加處理不同附件類型的邏輯
              }}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon as any} size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.attachmentLabel, { color: String(theme.text) }]}>
                {t(option.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };
  
  // 渲染聊天室標題
  const renderChatHeader = () => {
    return (
      <View style={[styles.header, { backgroundColor: String(theme.background) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={String(theme.text)} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerInfo} onPress={() => {}}>
            {chatData?.avatar ? (
              <Image source={{ uri: chatData.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerDefaultAvatar, { backgroundColor: String(theme.primary) }]}>
                <Text style={styles.headerAvatarText}>
                  {chatData?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: String(theme.text) }]} numberOfLines={1}>
                {chatData?.name || t('chat.chatDetail')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: String(theme.secondaryText) }]}>
                {t('chat.online')}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="call" size={22} color={String(theme.primary)} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="ellipsis-vertical" size={22} color={String(theme.text)} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // 渲染錯誤訊息
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={[styles.errorContainer, { backgroundColor: String(theme.errorText) + '20' }]}>
        <Ionicons name="alert-circle" size={24} color={String(theme.errorText)} />
        <Text style={[styles.errorText, { color: String(theme.errorText) }]}>{error}</Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: String(theme.background) }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* 聊天室標題 */}
      {renderChatHeader()}
      
      {/* 錯誤訊息 */}
      {renderError()}
      
      {/* 訊息列表 */}
      <View 
        style={styles.messagesContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={String(theme.primary)} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* 附件選單 */}
      {renderAttachmentMenu()}
      
      {/* 訊息輸入區 */}
      <View style={[styles.inputContainer, { backgroundColor: String(theme.cardBackground) }]}>
        <TouchableOpacity 
          style={[styles.attachButton, { backgroundColor: String(theme.highlightBackground) }]}
          onPress={toggleAttachments}
        >
          <Ionicons name="add" size={24} color={String(theme.primary)} />
        </TouchableOpacity>
        
        <View style={[styles.inputWrapper, { backgroundColor: String(theme.inputBackground) }]}>
          <TextInput
            style={[styles.input, { color: String(theme.inputText) }]}
            placeholder={t('chat.typeYourMessage')}
            placeholderTextColor={String(theme.placeholder)}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { backgroundColor: newMessage.trim() ? String(theme.primary) : String(theme.highlightBackground) }
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons 
              name="send" 
              size={18} 
              color={newMessage.trim() ? "#FFFFFF" : String(theme.secondaryText)} 
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerDefaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerAction: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 12,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  readStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  attachmentMenu: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  attachmentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attachmentOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});