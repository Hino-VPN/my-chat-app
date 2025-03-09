import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { getCurrentUser } from '@/services/firebase/userService';
import { StatusBar } from 'expo-status-bar';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Profile } from '@/models/Profile';
import { getProfile } from '@/services/firebase/profileService';
import { logoutUser } from '@/services/firebase/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import { useAlert } from '@/hooks/useAlert';

export default function SettingsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  const { resetAuth } = useAuth();
  const { resetChat } = useChat();
  const { resetUser } = useUser();
  const { showAlert } = useAlert();
  
  // 載入用戶資料
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        const profile = await getProfile(currentUser.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
    setLoading(false);
  };

  // 切換語言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh-HK' : 'en';
    i18n.changeLanguage(newLang);
    // 儲存語言偏好
    AsyncStorage.setItem('@app_language', newLang);
  };
  
  // 登出
  const handleLogout = async () => {
    showAlert(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        {
          text: t('settings.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await logoutUser();
              await resetAuth();
              await resetUser();
              await resetChat();
              showAlert(t('settings.logoutSuccessTitle'), t('settings.logoutSuccessMessage'));
              router.replace('/welcome');
            } catch (error) {
              console.error('Logout error:', error);
              showAlert(t('errors.error'), t('settings.logoutError'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };
  
  // 導航到個人資料編輯頁面
  const navigateToProfileEdit = () => {
    router.push('/profileEdit');
  };

  if (loading) {
    return <LoadingOverlay visible={loading} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 頁面標題 */}
        <Text style={[styles.pageTitle, { color: theme.title }]}>
          {t('settings.title')}
        </Text>
        
        {/* 個人資料卡片 */}
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}
          onPress={navigateToProfileEdit}
        >
          <View style={styles.profileHeader}>
            {userProfile?.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.defaultAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {userProfile?.username || t('settings.unknownUser')}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.secondaryText }]}>
                {userProfile?.email || ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.secondaryText} />
          </View>
        </TouchableOpacity>
        
        {/* 設定項目分組 */}
        <View style={styles.settingsGroup}>
          <Text style={[styles.settingsGroupTitle, { color: theme.secondaryText }]}>
            {t('settings.appearance')}
          </Text>
          
          {/* 深色模式設定 */}
          <View style={[styles.settingsItem, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.settingsItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2B2640' : '#F0EDFC' }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={theme.primary} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.text }]}>
                {t('settings.darkMode')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#7E6BF0' }}
              thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>
        
        <View style={styles.settingsGroup}>
          <Text style={[styles.settingsGroupTitle, { color: theme.secondaryText }]}>
            {t('settings.language')}
          </Text>
          
          {/* 語言設定 */}
          <TouchableOpacity 
            style={[styles.settingsItem, { backgroundColor: theme.cardBackground }]}
            onPress={toggleLanguage}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2B2640' : '#F0EDFC' }]}>
                <Ionicons name="language" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.settingsItemText, { color: theme.text }]}>
                {i18n.language === 'en' ? 'English' : '繁體中文'}
              </Text>
            </View>
            <Text style={[styles.settingsItemRightText, { color: theme.primary }]}>
              {i18n.language === 'en' ? '切換至中文' : 'Switch to English'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingsGroup}>
          <Text style={[styles.settingsGroupTitle, { color: theme.secondaryText }]}>
            {t('settings.account')}
          </Text>
          
          {/* 登出選項 */}
          <TouchableOpacity 
            style={[styles.settingsItem, { backgroundColor: theme.cardBackground }]}
            onPress={handleLogout}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFEFEF' }]}>
                <MaterialIcons name="logout" size={20} color="#FF3B30" />
              </View>
              <Text style={[styles.settingsItemText, { color: '#FF3B30' }]}>
                {t('settings.logout')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
        
        {/* App 版本資訊 */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: theme.secondaryText }]}>
            MyChatApp v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  defaultAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  settingsGroupTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemText: {
    fontSize: 16,
  },
  settingsItemRightText: {
    fontSize: 14,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 14,
  },
}); 