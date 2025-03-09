// app/onboarding.tsx
import React, { useState, useContext, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "@/contexts/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import LoadingOverlay from "@/components/LoadingOverlay";
import { LinearGradient } from 'expo-linear-gradient';
import { createAppUserProfile, getProfileByEmail, updateProfile } from "@/services/firebase/profileService";
import { getCurrentUser, loginUser } from "@/services/firebase/userService";
import { syncUserData } from '@/services/firebase/syncService';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, generateUniqueFileName } from '@/services/firebase/storageService';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { getProfile } from '@/services/firebase/profileService';
import { useAlert } from "@/hooks/useAlert";

const { width, height } = Dimensions.get('window');

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, isDark } = useContext(ThemeContext);
  const { currentUser } = useAuth();
  const { setUser } = useUser();

  // 動畫值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0.33)).current;
  
  // 流程分組步驟：1 = Email, 2 = Password, 3 = Profile
  const [groupStep, setGroupStep] = useState<number>(1);
  const [error, setError] = useState<string>("");

  // Group 1: Email
  const [email, setEmail] = useState<string>("");

  // Group 2: Password
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>();

  // Group 3: Profile fields
  const [avatar, setAvatar] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  // 在 useEffect 之前，添加或更新狀態
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileExist, setIsProfileExist] = useState<boolean>(false);

  const { showAlert } = useAlert();

  // 進行動畫
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    // 明確設定每個步驟的進度值
    let progressValue;
    switch(groupStep) {
      case 1:
        progressValue = 0;
        break;
      case 2:
        progressValue = 0.5;
        break;
      case 3:
        progressValue = 1;
        break;
      default:
        progressValue = 0;
    }
    
    Animated.timing(progressAnim, {
      toValue: progressValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [groupStep]);

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // 檢查是否有當前用戶
        if (!currentUser) {
          console.log('No profile exists, staying on onboarding');
          setIsProfileExist(false);
          setGroupStep(1); // 重置到第一步
        } else {
          // 檢查用戶資料
          const userProfile = await getProfile(currentUser.uid);
        
          if (userProfile) {
            console.log('Profile exists, setting user data');
            setUser(userProfile);
            
            // 設置頭像（如果有）
            if (userProfile.avatar) {
              setAvatarImage(userProfile.avatar);
            }
            
            // 設置其他資料
            setUsername(userProfile.username || '');
            setCaption(userProfile.caption || '');
            
            // 標記已有資料
            setIsProfileExist(true);
            
            // 導航到主頁
            console.log('Redirecting to chat list');
            router.replace('/chatList');
          }
        }
        
      } catch (error) {
        console.error('Error checking user profile:', error);
        showAlert(
          t('errors.error'),
          t('errors.profileCheckError')
        );
        setIsProfileExist(false);
        setGroupStep(1);
      } finally {
        setIsLoading(false); // 使用 isLoading
      }
    };

    checkUserProfile();
  }, [currentUser]);

  const handleGroup1Submit = async () => {
    if (!email.trim()) {
      showAlert(t('errors.error'), t('errors.emailRequired'));
      return;
    }
    
    setIsLoading(true);
    try {
      // 檢查電子郵件是否已存在
      const profile = await getProfileByEmail(email);
      console.log('Profile:', profile); // 添加日誌
      if (profile) {
        // 現有用戶
        setIsNewUser(false);
      } else {
        // 新用戶
        setIsNewUser(true);
      }
      // 進入下一步
      setGroupStep(2);
    } catch (error: any) {
      console.error('Error in handleGroup1Submit:', error); // 添加日誌
      showAlert(t('errors.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroup2Submit = async () => {
    if (!password.trim()) {
      showAlert(t('errors.error'), t('errors.passwordRequired'));
      return;
    }
    
    if (isNewUser && password !== confirmPassword) {
      showAlert(t('errors.error'), t('errors.passwordMismatch'));
      return;
    }
    
    try {
      setError('');
      if (!isNewUser) {
        // 登入現有用戶
        const loggedInUser = await loginUser(email, password);
        if(loggedInUser){
          setUserId(loggedInUser.uid)
          // 自動取得 profile 並預填
          const profile = await getProfileByEmail(email);
          if (profile) {
            setAvatar(profile.avatar || '');
            setUsername(profile.username || '');
            setCaption(profile.caption || '');
          }
        }
      }
      // 進入下一步
      setGroupStep(3);
    } catch (error: any) {
      showAlert(t('errors.error'), error.message);
    }
  };

  const pickImage = async () => {
    // 請求權限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert(t('errors.error'), t('settings.permissionDenied'));
      return;
    }
    
    // 啟動圖片選擇器
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarImage(result.assets[0].uri);
    }
  };

  const handleGroup3Submit = async () => {
    if (!username.trim()) {
      showAlert(t('errors.error'), t('errors.usernameRequired'));
      return;
    }
    
    try {
      let avatarUrl = avatar;
      
      // 如果有選擇新圖片，上傳到 Firebase Storage
      if (avatarImage && avatarImage !== avatar) {
        const userId = getCurrentUser()?.uid;
        
        if (userId) {
          const fileName = generateUniqueFileName(avatarImage);
          const storagePath = `avatars/${userId}/${fileName}`;
          
          // 上傳圖片並獲取 URL
          avatarUrl = await uploadImage(avatarImage, storagePath);
        }
      }
      
      // 創建/更新用戶資料
      if (isNewUser) {
        // 使用 createAppUserProfile 創建用戶資料
        const createdProfile = await createAppUserProfile(email, password, {
          username,
          avatar: avatarUrl,
          caption
        }, userId);
        
        // 登入新用戶
        await loginUser(email, password);
        
        // 設置用戶資料到 Context
        if (createdProfile) {
          setUser(createdProfile);
        }
      } else {
        // 現有用戶：只更新需要的字段
        const currentProfile = await getProfile(userId!);
        if (currentProfile) {
          // 更新資料
          await updateProfile(userId!, {
            username,
            avatar: avatarUrl,
            caption
          });
          
          // 獲取更新後的完整資料
          const updatedProfile = await getProfile(userId!);
          if (updatedProfile) {
            setUser(updatedProfile);
          }
        }
      }
      
      // 同步用戶資料
      await syncUserData(userId!);
      
      // 導航到聊天列表
      router.replace('/chatList');
    } catch (error) {
      console.error('Error during profile setup:', error);
      showAlert(t('errors.error'), (error as Error).message);
    }
  };

  const renderProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressDotsContainer}>
          <View style={[
            styles.progressDot, 
            { backgroundColor: groupStep >= 1 ? theme.primary : theme.divider }
          ]} />
          <View style={[styles.progressLine, { backgroundColor: theme.divider }]}>
            <Animated.View style={[
              styles.progressLineActive, 
              { 
                backgroundColor: theme.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['0%', '100%', '100%']
                })
              }
            ]} />
          </View>
          <View style={[
            styles.progressDot, 
            { backgroundColor: groupStep >= 2 ? theme.primary : theme.divider }
          ]} />
          <View style={[styles.progressLine, { backgroundColor: theme.divider }]}>
            <Animated.View style={[
              styles.progressLineActive, 
              { 
                backgroundColor: theme.primary,
                width: progressAnim.interpolate({
                  inputRange: [0.33, 0.66, 1],
                  outputRange: ['0%', '0%', '100%']
                })
              }
            ]} />
          </View>
          <View style={[
            styles.progressDot, 
            { backgroundColor: groupStep >= 3 ? theme.primary : theme.divider }
          ]} />
        </View>
        <View style={styles.stepTextContainer}>
          <Text style={[styles.stepText, { 
            color: groupStep === 1 ? theme.primary : theme.secondaryText
          }]}>{t('onboarding.stepAccount')}</Text>
          <Text style={[styles.stepText, { 
            color: groupStep === 2 ? theme.primary : theme.secondaryText
          }]}>{t('onboarding.stepSecurity')}</Text>
          <Text style={[styles.stepText, { 
            color: groupStep === 3 ? theme.primary : theme.secondaryText
          }]}>{t('onboarding.stepProfile')}</Text>
        </View>
      </View>
    );
  };

  const renderGroup = () => {
    if (groupStep === 1) {
      return (
        <Animated.View 
          style={[
            styles.groupContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="mail-outline" size={22} color={theme.secondaryText} />
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground, 
                color: theme.inputText 
              }]}
              placeholder={t('onboarding.emailPlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={[styles.buttonRow]}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary,  width: '100%' }]}
              onPress={handleGroup1Submit}
            >
              <Text style={styles.buttonText}>{t('onboarding.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
        </Animated.View>
      );
    } else if (groupStep === 2) {
      return (
        <Animated.View 
          style={[
            styles.groupContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.secondaryText} />
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground, 
                color: theme.inputText 
              }]}
              placeholder={t('onboarding.passwordPlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          {isNewUser && (
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={22} color={theme.secondaryText} />
              </View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground, 
                  color: theme.inputText 
                }]}
                placeholder={t('onboarding.confirmPasswordPlaceholder')}
                placeholderTextColor={theme.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.backButton]}
              onPress={() => setGroupStep(1)}
            >
              <Ionicons name="arrow-back" size={24} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleGroup2Submit}
            >
              <Text style={styles.buttonText}>{t('onboarding.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    } else if (groupStep === 3) {
      return (
        <Animated.View 
          style={[
            styles.groupContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={[styles.groupTitle, { color: theme.title }]}>
            {t('onboarding.completeProfile')}
          </Text>
          
          {/* 頭像選擇區域 */}
          <View style={styles.avatarContainer}>
            {avatarImage ? (
              <TouchableOpacity onPress={pickImage}>
                <Image source={{ uri: avatarImage }} style={styles.avatarPreview} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.avatarPlaceholder, { backgroundColor: theme.cardBackground }]}
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={40} color={theme.primaryLight} />
                <Text style={[styles.avatarPlaceholderText, { color: theme.secondaryText }]}>
                  {t('onboarding.addPhoto')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* 用戶名稱輸入框 */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="person-outline" size={22} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.inputText }]}
              placeholder={t('onboarding.usernamePlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={username}
              onChangeText={setUsername}
            />
          </View>
          
          {/* 個人簡介輸入框 */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.inputText }]}
              placeholder={t('onboarding.captionPlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={caption}
              onChangeText={setCaption}
            />
          </View>
          
          {/* 按鈕區域 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => setGroupStep(2)}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleGroup3Submit}
            >
              <Text style={styles.buttonText}>
                {isNewUser ? t('onboarding.register') : t('onboarding.signIn')}
              </Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }
    return null;
  };

  // 更新 loading 狀態的處理
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={isDark ? 
            ['#121212', '#2B2640', '#121212'] : 
            ['#FFFFFF', '#F0EDFC', '#FFFFFF']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LoadingOverlay visible={isLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? 
          ['#121212', '#2B2640', '#121212'] : 
          ['#FFFFFF', '#F0EDFC', '#FFFFFF']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.title }]}>
              {isNewUser ? t('onboarding.createAccount') : t('onboarding.welcomeBack')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtitle }]}>
              {isNewUser ? t('onboarding.createPrompt') : t('onboarding.signInPrompt')}
            </Text>
          </View>
          
          {renderProgress()}
          
          {renderGroup()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressLine: {
    height: 3,
    flex: 1,
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  progressLineActive: {
    height: '100%',
  },
  stepTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  groupContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputIconContainer: {
    paddingHorizontal: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 55,
    paddingHorizontal: 12,
    paddingRight: 20,
    fontSize: 16,
    borderRadius: 12,
  },
  button: {
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '80%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  groupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
