import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import BottomNavBar from '../components/BottomNavBar';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { signOut, getCurrentUser, updateUserEmail, deleteUserAccount, updateUserProfile } from '../backend/authService';
import sleepTracker from '../services/sleepTracker';

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme, isDark);
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [accelerometerEnabled, setAccelerometerEnabled] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setNewEmail(currentUser?.email || '');
    } catch (error) {
      console.error('[SettingsScreen] Error loading user:', error);
    }
  };

  const handleGenerateTestData = async () => {
    try {
      console.log('[SettingsScreen]  Generating test data...');
      await sleepTracker.generateTestData();
      
      showAlert(
        'Datos de Prueba Generados',
        'Se han creado 30 días de datos de sueño para probar las gráficas.',
        [{ text: 'OK' }],
        'success'
      );
    } catch (error) {
      console.error('[SettingsScreen] ❌ Error generating test data:', error);
      showAlert(
        'Error',
        'No se pudieron generar los datos de prueba',
        [{ text: 'OK' }],
        'danger'
      );
    }
  };

  const handleDeleteAllData = async () => {
    showAlert(
      'Eliminar Registros de Sueño',
      '¿Estás seguro de que quieres eliminar todas las sesiones de sueño guardadas?\n\n⚠️ Esta acción es PERMANENTE y no se puede deshacer.\n\n• Se borrarán todos tus registros de sueño\n• Se perderán tus estadísticas históricas\n• No podrás recuperar esta información',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[SettingsScreen] 🗑️ Clearing all sleep data...');
              await sleepTracker.clearAllData();
              
              showAlert(
                'Datos Eliminados',
                'Todos los registros de sueño han sido eliminados correctamente.',
                [{ text: 'OK' }],
                'success'
              );
            } catch (error) {
              console.error('[SettingsScreen] ❌ Error clearing data:', error);
              showAlert(
                'Error',
                'No se pudieron eliminar los datos',
                [{ text: 'OK' }],
                'danger'
              );
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleDeleteAccount = async () => {
    showAlert(
      'ELIMINAR CUENTA',
      '¿Estás seguro de que quieres eliminar tu cuenta?\n\n⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE\n\n• Se eliminará toda tu información personal\n• Se borrarán TODOS tus registros de sueño\n• Perderás acceso a tu cuenta para siempre\n• No podrás recuperar ningún dato',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'ELIMINAR CUENTA',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[SettingsScreen] 🗑️ Deleting account...');
              
              // Eliminar todos los datos de sueño
              await sleepTracker.clearAllData();
              
              // Eliminar cuenta de la base de datos
              const result = await deleteUserAccount();
              
              if (!result.success) {
                showAlert(
                  'Error',
                  result.error || 'No se pudo eliminar la cuenta',
                  [{ text: 'OK' }],
                  'danger'
                );
                return;
              }
              
              showAlert(
                'Cuenta Eliminada',
                'Tu cuenta y todos tus datos han sido eliminados permanentemente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/login');
                    },
                  },
                ],
                'success'
              );
            } catch (error) {
              console.error('[SettingsScreen] Error deleting account:', error);
              showAlert(
                'Error',
                'No se pudo eliminar la cuenta',
                [{ text: 'OK' }],
                'danger'
              );
            }
          },
        },
      ],
      'danger'
    );
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      setShowEmailInput(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showAlert(
        'Error',
        'Por favor ingresa un email válido',
        [{ text: 'OK' }],
        'danger'
      );
      return;
    }

    showAlert(
      'Cambiar Email',
      `¿Deseas cambiar tu email a:\n${newEmail}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cambiar',
          onPress: async () => {
            try {
              console.log('[SettingsScreen] 📧 Updating email...');
              
              const result = await updateUserEmail(newEmail);
              
              if (!result.success) {
                showAlert(
                  'Error',
                  result.error || 'No se pudo cambiar el email',
                  [{ text: 'OK' }],
                  'danger'
                );
                return;
              }
              
              showAlert(
                'Email Actualizado',
                'Tu email ha sido cambiado correctamente.\n\nPor favor verifica tu nuevo email para confirmar el cambio.',
                [{ text: 'OK' }],
                'success'
              );
              setShowEmailInput(false);
              loadUserData();
            } catch (error) {
              console.error('[SettingsScreen] Error changing email:', error);
              showAlert(
                'Error',
                'No se pudo cambiar el email',
                [{ text: 'OK' }],
                'danger'
              );
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleLogout = async () => {
    showAlert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('[SettingsScreen] Error logging out:', error);
              showAlert(
                'Error',
                'No se pudo cerrar sesión',
                [{ text: 'OK' }],
                'danger'
              );
            }
          },
        },
      ],
      'warning'
    );
  };

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileContainer}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Text style={styles.editAvatarText}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user?.first_name || user?.email?.split('@')[0] || 'Usuario'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          {/* Change Email */}
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Email</Text>
            {showEmailInput ? (
              <View style={styles.emailInputContainer}>
                <TextInput
                  style={styles.emailInput}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="nuevo@email.com"
                  placeholderTextColor={theme.TEXT_COLOR + '66'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleChangeEmail}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowEmailInput(true)}>
                <Text style={styles.settingValue}>{user?.email || 'No email'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Delete Account */}
          <TouchableOpacity
            style={[styles.settingCard, styles.dangerCard]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>Eliminar Cuenta</Text>
            <Text style={styles.settingDescription}>
              Eliminar permanentemente tu cuenta y todos tus datos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>

          {/* Generate Test Data (Temporal) */}
          <TouchableOpacity
            style={[styles.settingCard, styles.devCard]}
            onPress={handleGenerateTestData}
          >
            <Text style={styles.settingLabel}>Generar Datos de Prueba</Text>
            <Text style={styles.settingDescription}>
              (Temporal) Crear 30 días de datos ficticios
            </Text>
          </TouchableOpacity>

          {/* Delete All Sleep Data */}
          <TouchableOpacity
            style={[styles.settingCard, styles.dangerCard]}
            onPress={handleDeleteAllData}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Eliminar Registros de Sueño
            </Text>
            <Text style={styles.settingDescription}>
              Borrar todos los registros de sueño guardados
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>

          {/* Notifications */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificaciones</Text>
                <Text style={styles.settingDescription}>
                  Recibir recordatorios de sueño
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.SECONDARY_COLOR, true: theme.ACCENT_COLOR + '66' }}
                thumbColor={notificationsEnabled ? theme.ACCENT_COLOR : theme.TEXT_COLOR + '99'}
              />
            </View>
          </View>

          {/* Background Mode */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Segundo Plano</Text>
                <Text style={styles.settingDescription}>
                  Permitir tracking en segundo plano
                </Text>
              </View>
              <Switch
                value={backgroundEnabled}
                onValueChange={setBackgroundEnabled}
                trackColor={{ false: theme.SECONDARY_COLOR, true: theme.ACCENT_COLOR + '66' }}
                thumbColor={backgroundEnabled ? theme.ACCENT_COLOR : theme.TEXT_COLOR + '99'}
              />
            </View>
          </View>

          {/* Accelerometer */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Acelerómetro</Text>
                <Text style={styles.settingDescription}>
                  Detectar movimientos durante el sueño
                </Text>
              </View>
              <Switch
                value={accelerometerEnabled}
                onValueChange={setAccelerometerEnabled}
                trackColor={{ false: theme.SECONDARY_COLOR, true: theme.ACCENT_COLOR + '66' }}
                thumbColor={accelerometerEnabled ? theme.ACCENT_COLOR : theme.TEXT_COLOR + '99'}
              />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Spacing for nav bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="settings" isDark={isDark} />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </>
  );
}

function createStyles(theme, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.TEXT_COLOR,
    },

    // Profile Section
    section: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      marginBottom: 12,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1f26' : '#fff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    avatarContainer: {
      alignItems: 'center',
      marginRight: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.ACCENT_COLOR + '20',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.ACCENT_COLOR,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.ACCENT_COLOR,
    },
    editAvatarButton: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 8,
    },
    editAvatarText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.TEXT_COLOR + '99',
    },

    // Settings Cards
    settingCard: {
      backgroundColor: isDark ? '#1a1f26' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingInfo: {
      flex: 1,
      marginRight: 12,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
      marginBottom: 4,
    },
    settingValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.ACCENT_COLOR,
    },
    settingDescription: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.TEXT_COLOR + '99',
      lineHeight: 18,
    },

    // Email Input
    emailInputContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    emailInput: {
      flex: 1,
      backgroundColor: isDark ? '#0f1419' : '#f3f4f6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.TEXT_COLOR,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    saveButton: {
      backgroundColor: theme.ACCENT_COLOR,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      justifyContent: 'center',
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#0b1220' : '#fff',
    },

    // Danger Card
    dangerCard: {
      borderColor: '#dc2626',
      backgroundColor: isDark ? '#7f1d1d20' : '#fee2e240',
    },
    dangerText: {
      color: '#dc2626',
    },

    // Dev Card (temporary)
    devCard: {
      borderColor: theme.ACCENT_COLOR + '66',
      backgroundColor: theme.ACCENT_COLOR + '10',
    },

    // Logout Button
    logoutButton: {
      marginHorizontal: 20,
      marginTop: 32,
      marginBottom: 24,
      paddingVertical: 16,
      backgroundColor: theme.ACCENT_COLOR,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#0b1220' : '#fff',
      letterSpacing: 0.5,
    },
  });
}
