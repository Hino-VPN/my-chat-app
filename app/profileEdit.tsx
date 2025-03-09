import React, { useState, useContext, useEffect } from 'react';
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

export default function ProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, isDark } = useContext(ThemeContext);
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [caption, setCaption] = useState('');
  const [phone, setPhone] = useState('');

  const { showAlert } = useAlert();
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        const profile = await getProfile(currentUser.uid);
        if (profile) {
          setUsername(profile.username || '');
          setAvatar(profile.avatar || '');
          setCaption(profile.caption || '');
          setPhone(profile.phoneNumber || '');
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
        showAlert(t('settings.success'), t('settings.profileUpdated'));
        router.back();
      } catch (error) {
        console.error('Error updating profile:', error);
        showAlert(t('errors.error'), t('settings.profileUpdateError'));
      }
    }
    setLoading(false);
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
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.changeAvatarButton}>
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
              {t('settings.avatarUrl')}
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
              placeholder={t('settings.avatarUrlPlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={avatar}
              onChangeText={setAvatar}
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  changeAvatarButton: {
    marginTop: 12,
  },
  changeAvatarText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    paddingVertical: 12,
  },
}); 