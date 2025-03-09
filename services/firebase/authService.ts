import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanupSubscriptions } from './syncService';

/**
 * 完整的登出功能
 * 清除所有 context 和本地存儲
 */
export const logoutUser = async (): Promise<void> => {
  try {
    console.log('開始登出流程');
    
    // 0. 首先取消所有 Firebase 訂閱
    console.log('取消所有訂閱');
    cleanupSubscriptions();
    
    // 1. 清除所有 AsyncStorage 數據
    console.log('清除本地存儲');
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith('@app:'));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }

    // 2. 執行 Firebase 登出
    console.log('執行 Firebase 登出');
    await signOut(auth);

    // 3. 確保清除完成
    console.log('登出完成');
    return Promise.resolve();
  } catch (error) {
    console.error('Logout error:', error);
    return Promise.reject(error);
  }
};