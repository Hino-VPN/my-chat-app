// app/_layout.tsx
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useRouter } from 'expo-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { auth } from '@/firebase';
import { getProfile, subscribeToProfileUpdates } from '@/services/firebase/profileService';
import { getUserChats } from '@/services/firebase/chatService';
import { AlertProvider } from '../contexts/AlertProvider';
import { syncUserData, cleanupSubscriptions } from '@/services/firebase/syncService';

SplashScreen.preventAutoHideAsync();

// 創建一個 AuthStateHandler 組件來處理認證狀態變化
const AuthStateHandler = () => {
  const { resetUser, setUser } = useUser();
  const { resetChat, setChats } = useChat();
  const { resetAuth } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          // 用戶未登入或已登出
          console.log('用戶已登出，清理訂閱');
          cleanupSubscriptions(); // 清理所有訂閱
          resetUser();
          resetChat();
          resetAuth();
          router.replace('/welcome');
        } else {
          // 用戶已登入，檢查是否有個人資料
          console.log('用戶已登入，設置訂閱');
          const userProfile = await getProfile(user.uid);
          if (userProfile) {
            // 有個人資料，設置用戶資料
            setUser(userProfile);
            
            // 加載聊天列表
            const userChats = await getUserChats(user.uid);
            if (userChats) {
              setChats(userChats);
            }
            
            // 設置全局訂閱 - 這將訂閱所有聊天和消息，直到用戶登出
            await syncUserData(user.uid, setUser);
            
            // 導航到聊天列表
            router.replace('/chatList');
          } else {
            // 沒有個人資料，導航到 welcome
            router.replace('/welcome');
          }
        }
      } catch (error) {
        console.error('Auth state handler error:', error);
        // 發生錯誤時重置所有狀態
        cleanupSubscriptions(); // 確保清理訂閱
        resetUser();
        resetChat();
        resetAuth();
        router.replace('/welcome');
      }
    });

    return () => unsubscribe();
  }, []);
  
  return null;
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AlertProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <UserProvider>
                <ChatProvider>
                  <AuthStateHandler />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="welcome" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="(tab)" options={{ headerShown: false }} />
                    <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
                    <Stack.Screen name="profileEdit" options={{ headerShown: false }} />
                  </Stack>
                </ChatProvider>
              </UserProvider>
            </SafeAreaProvider>
          </ThemeProvider>
        </AuthProvider>
      </I18nextProvider>
    </AlertProvider>
  );
}
