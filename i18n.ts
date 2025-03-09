// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './assets/i18n/en.json';
import zhHK from './assets/i18n/zh-HK.json';

// 使用 getLocales() 取出裝置設定的 locale
const locales = Localization.getLocales();
const deviceLocale = locales.length > 0 ? locales[0].languageTag : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-HK': { translation: zhHK },
    },
    // 根據裝置語系做判斷，若是中文則預設 'zh-HK'
    lng: deviceLocale.startsWith('zh') ? 'zh-HK' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
