import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import themes, { Theme } from '@/constants/theme';

interface ThemeContextProps {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: themes.light,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // 從儲存中載入主題設定
  useEffect(() => {
    loadThemePreference();
  }, []);

  // 儲存使用者的主題偏好
  const saveThemePreference = async (isDarkMode: boolean) => {
    try {
      await AsyncStorage.setItem('@theme_preference', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Error saving theme preference', e);
    }
  };

  // 載入使用者的主題偏好
  const loadThemePreference = async () => {
    try {
      const value = await AsyncStorage.getItem('@theme_preference');
      if (value !== null) {
        setIsDark(value === 'dark');
      } else {
        // 如果沒有儲存的偏好，使用系統主題
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (e) {
      console.error('Error loading theme preference', e);
    }
  };

  // 切換主題
  const toggleTheme = () => {
    setIsDark(!isDark);
    saveThemePreference(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: isDark ? themes.dark : themes.light, 
      isDark, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
