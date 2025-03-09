// import React, { useState } from 'react';
// import { Modal, View, Text, Button, StyleSheet } from 'react-native';

// let setAlert: (message: string, title?: string) => void;

// export const ShowAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [visible, setVisible] = useState(false);
//   const [message, setMessage] = useState('');
//   const [title, setTitle] = useState('');

//   setAlert = (msg: string, t?: string) => {
//     setMessage(msg);
//     setTitle(t || '提示');
//     setVisible(true);
//   };

//   const handleClose = () => {
//     setVisible(false);
//   };

//   return (
//     <>
//       {children}
//       <Modal
//         transparent={true}
//         visible={visible}
//         animationType="slide"
//         onRequestClose={handleClose}
//       >
//         <View style={styles.modalBackground}>
//           <View style={styles.alertContainer}>
//             <Text style={styles.alertTitle}>{title}</Text>
//             <Text style={styles.alertMessage}>{message}</Text>
//             <Button title="確定" onPress={handleClose} />
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// export const showAlert = (message: string, title?: string) => {
//   if (setAlert) {
//     setAlert(message, title);
//   }
// };

// const styles = StyleSheet.create({
//   modalBackground: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   alertContainer: {
//     width: '80%',
//     padding: 20,
//     backgroundColor: 'white',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   alertTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   alertMessage: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
// });
