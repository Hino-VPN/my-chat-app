// export const LightPurpleTheme = {
//   dark: false,
//   colors: {
//     // 🔹 基本背景與字體顏色
//     background: '#f4f4f4', // Light Mode 背景
//     text: '#0a0a0a', // 一般字體顏色
//     title: '#000000', // 標題顏色
//     subtitle: '#959595', // 選項/小標題字體顏色
//     status: '#959595', // 備注/狀態顏色
    
//     // 🔹 區域塊與輸入框顏色
//     sectionBackground: '#FFFFFF', // 區域塊背景顏色
//     inputBackground: '#ececeb', // 輸入框背景
//     inputText: '#0a0a0a', // 輸入文字顏色
//     placeholder: '#828286', // placeholder 文字顏色

//     // 🔹 按鈕與 Icon 配色
//     buttonBackground: '#e6cfe6', // 按鈕背景
//     buttonText: '#714288', // 按鈕字體或 Icon 顏色
//     highlight: '#987389', // Highlight / 標示文字
//   },
// };

// export const DarkPurpleTheme = {
//   dark: true,
//   colors: {
//     // 🔹 基本背景與字體顏色
//     background: '#111111', // Dark Mode 背景
//     text: '#f9f9f9', // 一般字體顏色
//     title: '#ffffff', // 標題顏色
//     subtitle: '#959595', // 選項/小標題字體顏色
//     status: '#959595', // 備注/狀態顏色
    
//     // 🔹 區域塊與輸入框顏色
//     sectionBackground: '#171717', // 區域塊背景顏色
//     inputBackground: '#222222', // 輸入框背景
//     inputText: '#f9f9f9', // 輸入文字顏色
//     placeholder: '#959595', // placeholder 文字顏色

//     // 🔹 按鈕與 Icon 配色
//     buttonBackground: '#714288', // 按鈕背景
//     buttonText: '#e6cfe6', // 按鈕字體或 Icon 顏色
//     highlight: '#987389', // Highlight / 標示文字
//   },
// };


export const lightTheme = {
  background: '#FFFFFF',          // 背景色
  text: '#2E2E2E',                // 主要文本色
  title: '#24222F',               // 標題色
  subtitle: '#6B6B6B',            // 副標題色
  status: '#A39FC0',              // 狀態色
  sectionBackground: '#F8F8F8',    // 區塊背景色
  inputBackground: '#F6F6F6',       // 輸入框背景
  inputText: '#333333',           // 輸入框文本
  placeholder: '#AAAAAA',          // 佔位符
  
  // 聊天特定色彩
  primary: '#7E6BF0',             // 主色調 - 紫色
  secondary: '#9C8CF4',           // 次要色調 - 淺紫色
  cardBackground: '#FFFFFF',       // 卡片背景色
  secondaryText: '#8E8E93',        // 次要文字顏色
  highlightBackground: '#F0EDFC',  // 選中項目背景色
  divider: '#E5E5EA',              // 分隔線顏色
  chatBubbleSent: '#E9E5FF',        // 發送氣泡背景
  chatBubbleReceived: '#F6F6F6',     // 接收氣泡背景
  errorText: '#FF3B30',             // 錯誤文字

  // 🔹 按鈕與 Icon 配色
  buttonBackground: '#e6cfe6', // 按鈕背景
  buttonText: '#714288', // 按鈕字體或 Icon 顏色
  highlight: '#987389', // Highlight / 標示文字

  primaryLight: '#E8DEF8', // 添加這一行 - 使用較淺的紫色
};

export const darkTheme = {
  background: '#121212',          // 暗色背景
  text: '#E1E1E1',                // 暗色文本
  title: '#FFFFFF',               // 暗色標題
  subtitle: '#B4B4B4',            // 暗色副標題
  status: '#9E93D9',              // 暗色狀態
  sectionBackground: '#1E1E1E',     // 暗色區塊背景
  inputBackground: '#2C2C2E',       // 暗色輸入框背景
  inputText: '#EBEBEB',             // 暗色輸入框文本
  placeholder: '#8E8E93',            // 暗色佔位符
  
  // 聊天特定色彩
  primary: '#7C6FF2',             // 暗色主色調 - 紫色
  secondary: '#A595FF',           // 暗色次要色調 - 淺紫色
  cardBackground: '#1C1C1E',         // 暗色卡片背景
  secondaryText: '#8E8E93',          // 暗色次要文字
  highlightBackground: '#2B2640',     // 暗色選中項目背景
  divider: '#38383A',                // 暗色分隔線
  chatBubbleSent: '#3D3559',           // 暗色發送氣泡
  chatBubbleReceived: '#2C2C2E',         // 暗色接收氣泡
  errorText: '#FF453A',                 // 暗色錯誤文字

  // 🔹 按鈕與 Icon 配色
  buttonBackground: '#714288', // 按鈕背景
  buttonText: '#e6cfe6', // 按鈕字體或 Icon 顏色
  highlight: '#987389', // Highlight / 標示文字

  primaryLight: '#4F378B', // 添加這一行 - 使用較深的紫色
};

export type Theme = typeof lightTheme;

const themes = { light: lightTheme, dark: darkTheme };

export default themes; 