// app/welcome.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  SafeAreaView,
  Animated,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/services/firebase/profileService';

const { width, height } = Dimensions.get('window');

export default function WelcomePage() {
  const { isAuthenticated, currentUser } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, isDark } = React.useContext(ThemeContext);
  
  // 動畫值
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  // 切換語言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh-HK' : 'en';
    i18n.changeLanguage(newLang);
  };
  
  // 組件加載時啟動動畫
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const checkProfile = async () => {
        try {
          const profile = await getProfile(currentUser.uid);
          if (profile) {
            router.replace('/chatList');
          } else {
            router.replace('/onboarding');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
        }
      };
      
      // checkProfile();
    }
  }, [isAuthenticated, currentUser]);

  console.log('Current User:', currentUser);
  console.log('Is Authenticated:', isAuthenticated);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* 背景漸層 */}
      <LinearGradient
        colors={isDark ? 
          ['#121212', '#2B2640', '#121212'] : 
          ['#FFFFFF', '#F0EDFC', '#FFFFFF']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Logo 和標題區域 */}
      <Animated.View style={[
        styles.headerContainer, 
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.appName, { color: theme.title }]}>MyChatApp</Text>
        <Text style={[styles.subtitle, { color: theme.subtitle }]}>
          {t('welcome.subtitle')}
        </Text>
      </Animated.View>
      
      {/* 功能亮點區域 */}
      <Animated.View style={[
        styles.featuresContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <View style={styles.featureItem}>
          <Ionicons name="chatbubble-ellipses" size={24} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            {t('welcome.feature1')}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            {t('welcome.feature2')}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="globe" size={24} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            {t('welcome.feature3')}
          </Text>
        </View>
      </Animated.View>
      
      {/* 按鈕區域 */}
      <Animated.View style={[
        styles.buttonContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/onboarding')}
        >
          <Text style={styles.primaryButtonText}>{t('welcome.signUp')}</Text>
        </TouchableOpacity>
        
      </Animated.View>
      
      {/* 底部語言切換 */}
      <TouchableOpacity 
        style={styles.languageToggle}
        onPress={toggleLanguage}
      >
        <Ionicons name="language" size={20} color={theme.secondaryText} />
        <Text style={[styles.languageText, { color: theme.secondaryText }]}>
          {i18n.language === 'en' ? '切換至中文' : 'Switch to English'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 20 : 40,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    width: '100%',
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    width: '80%',
    lineHeight: 22,
  },
  featuresContainer: {
    width: '90%',
    marginVertical: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 16,
  },
  buttonContainer: {
    width: '85%',
    marginBottom: 20,
  },
  primaryButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#7E6BF0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  languageText: {
    marginLeft: 8,
    fontSize: 14,
  }
});
