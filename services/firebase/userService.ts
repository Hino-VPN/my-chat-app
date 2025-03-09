// services/firebase/userService.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '@/firebase';

/**
 * 登入用戶，返回轉換後的 User
 */
export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

/**
 * 註冊新用戶，並更新顯示名稱；返回轉換後的 User
 */
export const registerUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    return firebaseUser;
  } catch (error) {
    throw error;
  }
};

// // 登出功能
// export const logoutUser = async () => {
//   await signOut(auth);
// };

// 獲取當前用戶
export const getCurrentUser = () => {
  return auth.currentUser;
};

// 更新用戶個人資料
export const updateUserProfile = async (userId: string, profileData: {
  username?: string;
  avatar?: string;
  caption?: string;
  phoneNumber?: string;
}) => {
  try {
    // 實現更新個人資料邏輯
    // ...
    return true;
  } catch (error) {
    throw error;
  }
};

// 導出 Firebase 原本的 updateProfile
export { firebaseUpdateProfile };

