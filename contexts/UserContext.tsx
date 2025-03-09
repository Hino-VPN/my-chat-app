import React, { createContext, useState, useContext } from 'react';
import { Profile } from '@/models/Profile';

interface UserContextType {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  resetUser: () => void; // 添加重置方法
}

// 創建上下文
const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  resetUser: () => {}
});

// 提供 Provider 組件
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  
  // 重置用戶狀態的方法
  const resetUser = () => {
    setUser(null);
  };
  
  return (
    <UserContext.Provider value={{ user, setUser, resetUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 使用 hook
export const useUser = () => useContext(UserContext); 