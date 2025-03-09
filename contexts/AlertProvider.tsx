// contexts/AlertProvider.tsx
import React, { useState, createContext, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type AlertAction = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

interface AlertContextProps {
  showAlert: (title: string, message: string, actions?: AlertAction[]) => void;
}

export const AlertContext = createContext<AlertContextProps>({
  showAlert: () => {},
});

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [actions, setActions] = useState<AlertAction[]>([]);

  const showAlert = (title: string, message: string, actions?: AlertAction[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    // 如果未傳入動作，預設顯示一個 OK 按鈕
    setActions(actions && actions.length > 0 ? actions : [{ text: 'OK', style: 'default' }]);
    setVisible(true);
  };

  const handleActionPress = (action: AlertAction) => {
    setVisible(false);
    if (action.onPress) {
      action.onPress();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.alertContainer}>
            <Text style={styles.title}>{alertTitle}</Text>
            <Text style={styles.message}>{alertMessage}</Text>
            <View style={styles.buttonContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.button}
                  onPress={() => handleActionPress(action)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      action.style === 'destructive' && { color: 'red' },
                    ]}
                  >
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
