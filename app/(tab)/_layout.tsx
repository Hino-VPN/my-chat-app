// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { theme} = useContext(ThemeContext);
  const { t } = useTranslation();
  
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: theme.text, 
      tabBarInactiveTintColor: theme.status,
      tabBarInactiveBackgroundColor: theme.sectionBackground,
      tabBarActiveBackgroundColor: theme.sectionBackground,
    }}>
      <Tabs.Screen
        name="chatList"
        options={{
          headerShown: false,
          title: t('chat.title'),
          tabBarIcon: ({ color }) => <FontAwesome name="comments" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
          title: t('settings.title'),
        }}
      />
    </Tabs>
  );
}
