import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function CustomAlert({ 
  visible, 
  onClose, 
  title, 
  message, 
  buttons = [],
  type = 'default' // 'default', 'info', 'warning', 'danger'
}) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark, type);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Title */}
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}

          {/* Message */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    buttons.length === 1 && styles.buttonFull,
                  ]}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme, isDark, type) {
  const getAccentColorForType = () => {
    switch (type) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return theme.ACCENT_COLOR;
      case 'info':
      case 'default':
      default:
        return theme.ACCENT_COLOR;
    }
  };

  const accentColor = getAccentColorForType();
  const borderAccentColor = type === 'danger' ? '#dc2626' : accentColor;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    alertContainer: {
      width: width - 60,
      maxWidth: 400,
      backgroundColor: isDark ? theme.BACKGROUND_COLOR : '#fff',
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: type === 'danger' ? borderAccentColor + '40' : theme.BORDER_COLOR,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: type === 'danger' ? '#dc2626' : theme.TEXT_COLOR,
      textAlign: 'center',
      marginBottom: 12,
      lineHeight: 24,
    },
    message: {
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? theme.TEXT_COLOR + 'cc' : theme.TEXT_COLOR + '99',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: accentColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonFull: {
      flex: 1,
    },
    buttonCancel: {
      backgroundColor: isDark ? theme.SECONDARY_COLOR : theme.SECONDARY_COLOR,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    buttonDestructive: {
      backgroundColor: '#ef4444',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? theme.BACKGROUND_COLOR : '#fff',
      letterSpacing: 0.2,
    },
    buttonTextCancel: {
      color: theme.TEXT_COLOR,
    },
    buttonTextDestructive: {
      color: '#fff',
    },
  });
}
