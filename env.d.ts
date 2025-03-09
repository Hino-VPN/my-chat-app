// // 為環境變數添加類型聲明
// declare module '@env' {
//     export const EXPO_PUBLIC_FIREBASE_API_KEY: string;
//     export const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
//     export const EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
//     export const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
//     export const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
//     export const EXPO_PUBLIC_FIREBASE_APP_ID: string;
//     export const EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
//   }
  
//   // 全局 process.env 的擴展定義
//   declare global {
//     namespace NodeJS {
//       interface ProcessEnv {
//         EXPO_PUBLIC_FIREBASE_API_KEY: string;
//         EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
//         EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
//         EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
//         EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
//         EXPO_PUBLIC_FIREBASE_APP_ID: string;
//         EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
//       }
//     }
//   }

// 為環境變數添加類型聲明
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_FIREBASE_API_KEY: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      EXPO_PUBLIC_FIREBASE_APP_ID: string;
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
    }
  }
}

export {};