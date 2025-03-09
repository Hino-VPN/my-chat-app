import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/firebase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * 上傳圖片到 Firebase Storage
 * @param uri 本地圖片 URI
 * @param path 存儲路徑
 * @returns 上傳後的圖片 URL
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    // 將圖片轉為 Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // 創建存儲引用
    const storageRef = ref(storage, path);
    
    // 設置元數據，包含 CORS 相關頭
    const metadata = {
      contentType: blob.type || 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
      customMetadata: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Content-Disposition, Content-Length, Accept, Authorization'
      }
    };
    
    // 根據平台選擇上傳方法
    if (Platform.OS === 'web') {
      // Web 環境使用帶進度的上傳方式，以便更好處理 CORS
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // 監控上傳進度
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            // 處理錯誤
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            // 上傳成功，獲取下載 URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (urlError) {
              console.error('Error getting download URL:', urlError);
              reject(urlError);
            }
          }
        );
      });
    } else {
      // 移動端環境
      // 使用重試機制提高穩定性
      await uploadWithRetry(storageRef, blob, metadata);
      
      // 獲取下載 URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * 從 URI 生成唯一文件名
 */
export const generateUniqueFileName = (uri: string): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = uri.split('.').pop() || 'jpg';
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * 帶重試機制的上傳
 * @param storageRef 存儲引用
 * @param blob 文件 Blob
 * @param metadata 元數據
 * @param maxRetries 最大重試次數
 */
const uploadWithRetry = async (storageRef: any, blob: any, metadata: any, maxRetries = 3) => {
  let attemptCount = 0;
  
  while (attemptCount < maxRetries) {
    try {
      return await uploadBytes(storageRef, blob, metadata);
    } catch (error) {
      attemptCount++;
      console.log(`Upload attempt ${attemptCount} failed. Error:`, error);
      
      if (attemptCount >= maxRetries) throw error;
      
      // 等待一段時間再重試，指數退避策略
      const waitTime = 1000 * Math.pow(2, attemptCount - 1);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}; 