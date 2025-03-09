import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { getCurrentUser } from '@/services/firebase/userService';
import { updateProfile, getProfile } from '@/services/firebase/profileService';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAlert } from '@/hooks/useAlert';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, isDark } = useContext(ThemeContext);
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [originalAvatar, setOriginalAvatar] = useState('');
  const [caption, setCaption] = useState('');
  const [originalCaption, setOriginalCaption] = useState('');
  const [phone, setPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { showAlert } = useAlert();
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  // 檢查是否有變更
  useEffect(() => {
    const profileChanged = 
      username !== originalUsername || 
      avatar !== originalAvatar ||
      caption !== originalCaption || 
      phone !== originalPhone;
    
    setHasChanges(profileChanged);
  }, [username, avatar, caption, phone, originalUsername, originalAvatar, originalCaption, originalPhone]);
  
  const loadUserProfile = async () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        const profile = await getProfile(currentUser.uid);
        if (profile) {
          setUsername(profile.username || '');
          setOriginalUsername(profile.username || '');
          setAvatar(profile.avatar || '');
          setOriginalAvatar(profile.avatar || '');
          setCaption(profile.caption || '');
          setOriginalCaption(profile.caption || '');
          setPhone(profile.phoneNumber || '');
          setOriginalPhone(profile.phoneNumber || '');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        showAlert(t('errors.error'), t('settings.profileLoadError'));
      }
    }
    setLoading(false);
  };
  
  const handleSave = async () => {
    if (!username.trim()) {
      showAlert(t('errors.error'), t('errors.usernameRequired'));
      return;
    }
    
    setLoading(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        await updateProfile(currentUser.uid, {
          username,
          avatar,
          caption,
          phoneNumber: phone,
        });
        
        // 更新原始值
        setOriginalUsername(username);
        setOriginalAvatar(avatar);
        setOriginalCaption(caption);
        setOriginalPhone(phone);
        setHasChanges(false);
        
        showAlert(t('settings.success'), t('settings.profileUpdated'));
      } catch (error) {
        console.error('Error updating profile:', error);
        showAlert(t('errors.error'), t('settings.profileUpdateError'));
      }
    }
    setLoading(false);
  };
  
  const handleUpdateAvatar = async () => {
    try {
      // 請求權限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showAlert(t('errors.error'), t('settings.cameraPermissionError'));
        return;
      }
      
      // 打開圖片選擇器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // 這裡應該上傳圖片到雲存儲，然後獲取URL
        // 為了簡化，我們暫時直接使用本地URI
        const imageUri = result.assets[0].uri;
        setAvatar(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert(t('errors.error'), t('settings.imagePickerError'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 標題欄 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.title }]}>
              {t('settings.editProfile')}
            </Text>
            {hasChanges && (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* 頭像區域 */}
          <View style={styles.avatarSection}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.defaultAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {username ? username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={handleUpdateAvatar}>
              <Text style={[styles.changeAvatarText, { color: theme.primary }]}>
                {t('settings.changeAvatar')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 表單區域 */}
          <View style={styles.formSection}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>
              {t('settings.username')}
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.inputBackground,
                  color: theme.inputText,
                  borderColor: theme.divider
                }
              ]}
              placeholder={t('settings.usernamePlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={username}
              onChangeText={setUsername}
            />
            
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>
              {t('settings.caption')}
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.inputBackground,
                  color: theme.inputText,
                  borderColor: theme.divider,
                  height: 80
                }
              ]}
              placeholder={t('settings.captionPlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={caption}
              onChangeText={setCaption}
              multiline
              textAlignVertical="top"
            />
            
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>
              {t('settings.phone')}
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.inputBackground,
                  color: theme.inputText,
                  borderColor: theme.divider
                }
              ]}
              placeholder={t('settings.phonePlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {loading && <LoadingOverlay visible={loading} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  changeAvatarButton: {
    marginTop: 8,
  },
  changeAvatarText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
});