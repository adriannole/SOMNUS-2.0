/**
 * BottomNavBar
 * --------------------------------------------------
 * Barra de navegación inferior personalizada.
 *
 * - Permite navegar entre las pestañas principales
 * - Resalta la pestaña activa
 * - Cambia estilos según modo claro u oscuro
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { ChartIcon, MusicIcon, SettingsIcon, HomeIconNav } from './Icons';

export default function BottomNavBar({ activeTab = 'home', isDark }) {
  const router = useRouter();
  const { theme } = useTheme();
/**
   * Maneja la navegación según el botón presionado
   */

  const handleNavigation = (tab) => {
    switch (tab) {
      case 'explore':
        router.push('/(tabs)/explore');
        break;
      case 'music':
        router.push('/(tabs)/music');
        break;
      case 'home':
        router.push('/(tabs)');
        break;
      case 'settings':
        router.push('/(tabs)/settings');
        break;
      default:
        break;
    }
  };
  /**
   * Estilos dinámicos según el tema
   */
  const styles = StyleSheet.create({
    navBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 8,
      paddingBottom: 12,
      backgroundColor: isDark ? '#1a1f26f0' : '#fffffff0',
      borderTopWidth: 1,
      borderTopColor: theme.BORDER_COLOR,
      height: 64,
    },
    navButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    navButtonActive: {
      backgroundColor: `${theme.ACCENT_COLOR}20`,
      borderRadius: 20,
    },
  });

  return (
    <View style={styles.navBar}>
      <TouchableOpacity 
        style={[styles.navButton, activeTab === 'explore' && styles.navButtonActive]}
        onPress={() => handleNavigation('explore')}
      >
        <ChartIcon 
          size={24} 
          color={activeTab === 'explore' ? theme.ACCENT_COLOR : theme.TEXT_COLOR + '99'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navButton, activeTab === 'music' && styles.navButtonActive]}
        onPress={() => handleNavigation('music')}
      >
        <MusicIcon 
          size={24} 
          color={activeTab === 'music' ? theme.ACCENT_COLOR : theme.TEXT_COLOR + '99'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navButton, activeTab === 'home' && styles.navButtonActive]}
        onPress={() => handleNavigation('home')}
      >
        <HomeIconNav 
          size={24} 
          color={activeTab === 'home' ? theme.ACCENT_COLOR : (theme.TEXT_COLOR + '99')} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navButton, activeTab === 'settings' && styles.navButtonActive]}
        onPress={() => handleNavigation('settings')}
      >
        <SettingsIcon 
          size={24} 
          color={activeTab === 'settings' ? theme.ACCENT_COLOR : theme.TEXT_COLOR + '99'} 
        />
      </TouchableOpacity>
    </View>
  );
}
