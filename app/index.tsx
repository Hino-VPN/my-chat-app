// app/index.tsx
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function Index() {
  const { isAuthenticated, currentUser } = useAuth();

  return <Redirect href="/chat/1" />;
  // 如果已經驗證，重定向到主頁
  // 如果未驗證，重定向到歡迎頁面
  if (isAuthenticated && currentUser) {
    return <Redirect href="/chatList" />;
  }

  return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
