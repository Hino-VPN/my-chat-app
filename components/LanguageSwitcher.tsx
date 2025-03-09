// components/LanguageSwitcher.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import i18n from '@/i18n';

const LanguageSwitcher = () => {
  const changeLanguage = async (lng: string) => {
    console.log('切換語言到:', lng);
    try {
      await i18n.changeLanguage(lng);
      console.log('語言切換成功，當前語言:', i18n.language);
    } catch (error) {
      console.error('語言切換錯誤:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => changeLanguage('en')} style={styles.button}>
        <Text style={styles.buttonText}>English</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => changeLanguage('zh-HK')} style={styles.button}>
        <Text style={styles.buttonText}>中文</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#ccc', // 加入背景色方便看到按鈕範圍
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
  },
});

export default LanguageSwitcher;
