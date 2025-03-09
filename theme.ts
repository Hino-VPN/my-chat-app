export const lightTheme = {
  background: '#FFFFFF',         // 背景色
  text: '#2E2E2E',               // 主要文本色
  title: '#24222F',              // 標題色
  subtitle: '#6B6B6B',           // 副標題色
  status: '#A39FC0',             // 狀態色
  sectionBackground: '#F8F8F8',  // 區塊背景色
  inputBackground: '#F6F6F6',    // 輸入框背景
  inputText: '#333333',          // 輸入框文本
  placeholder: '#AAAAAA',        // 佔位符
  buttonBackground: '#7E6BF0',   // 按鈕背景（主紫色）
  buttonText: '#FFFFFF',         // 按鈕文字
  highlight: '#6C59EB',          // 高亮色（深紫色）
  
  // 聊天特定顏色
  primary: '#7E6BF0',            // 主色調 - 紫色
  secondary: '#9C8CF4',          // 次要色調 - 淺紫色
  cardBackground: '#FFFFFF',     // 卡片背景色
  secondaryText: '#8E8E93',      // 次要文字顏色
  highlightBackground: '#F0EDFC', // 選中項目背景色 - 極淺紫色
  divider: '#E5E5EA',            // 分隔線顏色
  chatBubbleSent: '#E9E5FF',     // 發送氣泡背景 - 淺紫色
  chatBubbleReceived: '#F6F6F6', // 接收氣泡背景
  errorText: '#FF3B30',          // 錯誤文字
};

export const darkTheme = {
  background: '#121212',          // 暗色背景
  text: '#E1E1E1',                // 暗色文本
  title: '#FFFFFF',               // 暗色標題
  subtitle: '#B4B4B4',            // 暗色副標題
  status: '#9E93D9',              // 暗色狀態
  sectionBackground: '#1E1E1E',   // 暗色區塊背景
  inputBackground: '#2C2C2E',     // 暗色輸入框背景
  inputText: '#EBEBEB',           // 暗色輸入框文本
  placeholder: '#8E8E93',         // 暗色佔位符
  buttonBackground: '#634BF6',    // 暗色按鈕背景
  buttonText: '#FFFFFF',          // 暗色按鈕文字
  highlight: '#7C6FF2',           // 暗色高亮
  
  // 聊天特定顏色
  primary: '#7C6FF2',            // 暗色主色調 - 紫色
  secondary: '#A595FF',          // 暗色次要色調 - 淺紫色
  cardBackground: '#1C1C1E',     // 暗色卡片背景
  secondaryText: '#8E8E93',      // 暗色次要文字
  highlightBackground: '#2B2640', // 暗色選中項目背景色 - 深紫色
  divider: '#38383A',            // 暗色分隔線
  chatBubbleSent: '#3D3559',     // 暗色發送氣泡 - 深紫色
  chatBubbleReceived: '#2C2C2E', // 暗色接收氣泡
  errorText: '#FF453A',          // 暗色錯誤文字
};

export type Theme = typeof lightTheme;

const themes = { light: lightTheme, dark: darkTheme };

export default themes; 