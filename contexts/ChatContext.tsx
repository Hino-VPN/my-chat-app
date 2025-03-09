import React, { createContext, useState, useContext } from 'react';
import { Chat } from '@/models/Chat';
import { Message } from '@/models/Message';

interface ChatContextType {
  activeChat: Chat | null;
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  setActiveChat: (chat: Chat | null) => void;
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType>({
  activeChat: null,
  chats: [],
  messages: {},
  setActiveChat: () => {},
  setChats: () => {},
  setMessages: () => {},
  resetChat: () => {}
});

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessagesState] = useState<{ [chatId: string]: Message[] }>({});

  const setMessages = (chatId: string, chatMessages: Message[]) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: chatMessages
    }));
  };

  const resetChat = () => {
    setActiveChat(null);
    setChats([]);
    setMessagesState({});
  };

  return (
    <ChatContext.Provider value={{
      activeChat,
      chats,
      messages,
      setActiveChat,
      setChats,
      setMessages,
      resetChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext); 