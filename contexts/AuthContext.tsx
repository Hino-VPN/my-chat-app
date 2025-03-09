// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/firebase';
import { User } from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  resetAuth: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  setCurrentUser: () => {},
  resetAuth: () => {}
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // 監聽 Firebase 身份驗證狀態
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
    });

    // 清理訂閱
    return () => unsubscribe();
  }, []);

  const resetAuth = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      setCurrentUser,
      resetAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
