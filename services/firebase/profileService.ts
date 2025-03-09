// services/firebase/profileService.ts
import { collection, query, where, getDocs, doc, setDoc, updateDoc, addDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Profile } from '../../models/Profile';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { User as FirebaseUser } from 'firebase/auth'
import { loginUser, registerUser } from './userService';

export const COLLECTION_PROFILES = 'profiles';

/**
 * 根據 userId 查詢 Profile，若不存在則返回 null
 * @param userId 用戶 ID
 */
export const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
  const q = query(collection(db, COLLECTION_PROFILES), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  const profile: Profile = {
    id: snapshot.docs[0].id,
    userId: docData.userId,
    email: docData.email,
    phoneNumber: docData.phoneNumber,
    username: docData.username,
    avatar: docData.avatar,
    caption: docData.caption,
    friends: docData.friends,
    blockedUsers: docData.blockedUsers,
    createdAt: docData.createdAt,
    lastUpdatedAt: docData.lastUpdatedAt,
    status: docData.status,
    isVerified: false, // 若有需要，可根據其他來源更新此欄位
    lastLogin: docData.lastLogin,
    role: docData.role,
    lastSeen: docData.lastSeen,
  };
  return profile;
};

/**
 * 根據 email 查詢 Profile，若不存在則返回 null
 * @param email 用戶電子郵件
 */
export const getProfileByEmail = async (email: string) => {
  const profilesRef = collection(db, 'profiles');
  const q = query(profilesRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
};


/**
 * 將 FirebaseUser 轉換為應用內 Profile 格式
 * 建立新 Profile
 * @param email
 * @param password
 * @param profile
 * @param existingUserId
 */
export const createAppUserProfile = async (email: string, password: string, profile: Partial<Profile>, existingUserId?: string): Promise<Profile> => {
  const now = Timestamp.now();
  
  // 如果提供了 existingUserId，就使用它；否則註冊新用戶
  let userId: string;
  if (existingUserId) {
    userId = existingUserId;
  } else {
    // 新用戶註冊流程
    const newUser = await registerUser(email, password);
    userId = newUser.uid;
  }

  const newUserProfile: Profile = {
    id: userId,
    
    email: email,
    phoneNumber: profile.phoneNumber || "",
    username: profile.username!,
    avatar: profile.avatar || "",
    caption: profile.caption!,
    friends: [],
    blockedUsers: [],
    
    userId: userId,
    isVerified: false, // 如果有 existingUserId，需要從其他地方獲取
    lastLogin: now,
    role: 'user',
    lastSeen: now,
    createdAt: now,
    lastUpdatedAt: now,
    status: 1,
  }

  await setDoc(doc(db, COLLECTION_PROFILES, userId), newUserProfile)

  return newUserProfile
};


/**
 * 更新現有 Profile
 * @param profile Profile 資料（必須包含 id）
 */
export const updateProfile = async (userId: string, profileData: {
  username?: string;
  avatar?: string;
  caption?: string;
  phoneNumber?: string;
}) => {
  try {
    // 實現更新個人資料邏輯...
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, profileData);
    return true;
  } catch (error) {
    throw error;
  }
};

// 創建個人檔案
export const createProfile = async (userId: string, profileData: Partial<Profile>) => {
  try {
    await setDoc(doc(db, 'profiles', userId), {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    throw error;
  }
}

// 獲取個人檔案
export const getProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Profile;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

// 刪除個人檔案
export const deleteProfile = async (userId: string) => {
  try {
    await deleteDoc(doc(db, 'profiles', userId));
  } catch (error) {
    throw error;
  }
}

