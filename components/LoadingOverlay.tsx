// components/LoadingOverlay.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  // 可選：自訂 ActivityIndicator 顏色
  color?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, color = '#000' }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景，阻止點擊
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // 確保覆蓋在最上層
  },
});

export default LoadingOverlay;
