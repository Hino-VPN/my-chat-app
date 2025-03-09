import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, where, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Profile } from '@/models/Profile';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getCurrentUser } from '@/services/firebase/userService';
import { Chat, ChatMode } from '@/models/Chat';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/hooks/useAlert';
import { t } from 'i18next';

export default function CreateChatPage() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [step, setStep] = useState<'select' | 'setup'>('select');

  const { showAlert } = useAlert();
  
  // 當前用戶
  const currentUser = getCurrentUser();
  
  // 加載用戶列表
  useEffect(() => {
    loadProfiles();
  }, []);
  
  // 加載所有可聊天的用戶
  const loadProfiles = async () => {
    if (!currentUser) {
      router.replace('/onboarding');
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'profiles'),
        where('id', '!=', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const loadedProfiles: Profile[] = [];
      
      querySnapshot.forEach((doc) => {
        const profileData = doc.data() as Profile;
        loadedProfiles.push(profileData);
      });
      
      setProfiles(loadedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 處理選擇用戶
  const handleSelectProfile = (profile: Profile) => {
    if (selectedProfiles.some(p => p.id === profile.id)) {
      // 如果已選擇，則移除
      setSelectedProfiles(prev => prev.filter(p => p.id !== profile.id));
    } else {
      // 如果未選擇，則添加
      setSelectedProfiles(prev => [...prev, profile]);
      
      // 如果只選擇了一個用戶且不是群聊模式，直接創建聊天
      if (selectedProfiles.length === 0 && !isGroup) {
        createChat([profile]);
      }
    }
  };
  
  // 處理下一步
  const handleNext = () => {
    if (selectedProfiles.length > 1 || isGroup) {
      setStep('setup');
    } else if (selectedProfiles.length === 1) {
      createChat(selectedProfiles);
    } else {
      // 沒有選擇用戶，提示選擇
      alert('請選擇至少一個聯絡人');
    }
  };
  
  // 創建聊天
  const createChat = async (selectedUsers: Profile[]) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 檢查是否已存在相同成員的聊天室
      if (selectedUsers.length === 1 && !isGroup) {
        const existingChat = await checkExistingChat(selectedUsers[0].id!);
        if (existingChat) {
          // 如果已存在聊天室，直接跳轉
          router.replace(`/chat/${existingChat}`);
          return;
        }
      }
      
      // 確定聊天類型
      const chatMode: ChatMode = (selectedUsers.length > 1 || isGroup) ? 'group' : 'private';
      
      // 設定群組名稱
      let chatName = '';
      if (chatMode === 'group') {
        if (groupName.trim()) {
          chatName = groupName.trim();
        } else {
          // 以用戶名列表作為預設群組名稱
          chatName = selectedUsers.map(u => u.username).join(', ');
        }
      } else {
        // 單聊使用對方名稱
        chatName = selectedUsers[0].username!;
      }
      
      // 所有參與者ID（包括當前用戶）
      const participants = [currentUser.uid, ...selectedUsers.map(u => u.id)];
      
      // 創建聊天室
      const chatRef = await addDoc(collection(db, 'chats'), {
        chatMode,
        participants,
        name: chatName,
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        avatar: selectedUsers.length === 1 ? selectedUsers[0].avatar : '',
        description: '',
        adminIds: [currentUser.uid],
        createdBy: currentUser.uid,
        isGroupChat: chatMode === 'group'
      });
      
      // 跳轉到新聊天室
      router.replace(`/chat/${chatRef.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      showAlert(t('error.error'),t('errors.createChatError'));
    } finally {
      setLoading(false);
    }
  };
  
  // 檢查是否已存在相同成員的單聊
  const checkExistingChat = async (otherUserId: string): Promise<string | null> => {
    if (!currentUser) return null;
    
    try {
      // 查詢同時包含當前用戶和選定用戶的私聊
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUser.uid),
        where('chatMode', '==', 'private')
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatId: string | null = null;
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(otherUserId) && chatData.participants.length === 2) {
          existingChatId = doc.id;
        }
      });
      
      return existingChatId;
    } catch (error) {
      console.error('Error checking existing chat:', error);
      return null;
    }
  };
  
  // 過濾用戶列表
  const filteredProfiles = searchText.trim()
    ? profiles.filter(profile => 
        profile.username?.toLowerCase().includes(searchText.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchText.toLowerCase())
      )
    : profiles;
  
  // 渲染步驟
  if (step === 'select') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>新對話</Text>
          <TouchableOpacity 
            style={[styles.nextButton, { opacity: selectedProfiles.length > 0 ? 1 : 0.5 }]}
            onPress={handleNext}
            disabled={selectedProfiles.length === 0}
          >
            <Text style={[styles.nextButtonText, { color: theme.primary }]}>下一步</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: theme.inputBackground,
              color: theme.inputText 
            }]}
            placeholder={t('chat.searchContacts')}
            placeholderTextColor={theme.secondaryText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.option}
            onPress={() => setIsGroup(!isGroup)}
          >
            <View style={[styles.checkbox, isGroup && { backgroundColor: theme.primary }]}>
              {isGroup && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>
              {t('chat.createGroup')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {selectedProfiles.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={[styles.selectedTitle, { color: theme.secondaryText }]}>
              {t('chat.contactsSelected', { count: selectedProfiles.length })}
            </Text>
            <FlatList
              data={selectedProfiles}
              keyExtractor={(item) => item.id!}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.selectedItem}>
                  <View style={styles.selectedAvatar}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{item.username?.charAt(0).toUpperCase()}</Text>
                    )}
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleSelectProfile(item)}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.selectedName, { color: theme.text }]} numberOfLines={1}>
                    {item.username}
                  </Text>
                </View>
              )}
            />
          </View>
        )}
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredProfiles}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.profileItem, { 
                  backgroundColor: selectedProfiles.some(p => p.id === item.id) 
                    ? theme.highlightBackground 
                    : 'transparent' 
                }]}
                onPress={() => handleSelectProfile(item)}
              >
                <View style={styles.profileAvatar}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.defaultAvatar, { backgroundColor: theme.primary }]}>
                      <Text style={styles.avatarText}>{item.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: theme.text }]}>
                    {item.username}
                  </Text>
                  <Text style={[styles.profileEmail, { color: theme.secondaryText }]}>
                    {item.email}
                  </Text>
                </View>
                {selectedProfiles.some(p => p.id === item.id) && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    );
  } else {
    // 群組設置頁面
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('select')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>群組設置</Text>
          <TouchableOpacity 
            onPress={() => createChat(selectedProfiles)}
          >
            <Text style={[styles.nextButtonText, { color: theme.primary }]}>創建</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.groupSetupContainer}>
          <View style={styles.groupAvatarContainer}>
            <View style={[styles.groupAvatar, { backgroundColor: theme.primary }]}>
              <Ionicons name="people" size={40} color="white" />
            </View>
          </View>
          
          <TextInput
            style={[styles.groupNameInput, { 
              backgroundColor: theme.inputBackground,
              color: theme.text
            }]}
            placeholder="群組名稱"
            placeholderTextColor={theme.secondaryText}
            value={groupName}
            onChangeText={setGroupName}
          />
          
          <Text style={[styles.participantsTitle, { color: theme.secondaryText }]}>
            參與者 ({selectedProfiles.length})
          </Text>
          
          <FlatList
            data={selectedProfiles}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <View style={styles.participantItem}>
                <View style={styles.profileAvatar}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.defaultAvatar, { backgroundColor: theme.primary }]}>
                      <Text style={styles.avatarText}>{item.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.participantName, { color: theme.text }]}>
                  {item.username}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.participantsList}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    padding: 8,
  },
  nextButtonText: {
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  selectedContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  selectedTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  selectedItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  selectedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileEmail: {
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 群組設置樣式
  groupSetupContainer: {
    padding: 16,
  },
  groupAvatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupNameInput: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  participantsTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  participantsList: {
    paddingBottom: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantName: {
    fontSize: 16,
  },
}); 