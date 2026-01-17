/**
 * HapticTab component
 * --------------------------------------------------
 * Botón personalizado para las pestañas inferiores (Bottom Tabs).
 *
 * Agrega una vibración suave (haptic feedback) cuando el usuario
 * presiona una pestaña en dispositivos iOS.
 */

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Solo se aplica vibración en iOS
        if (process.env.EXPO_OS === 'ios') {
          // Vibración ligera al presionar una pestaña
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Ejecuta el evento original si existe
        props.onPressIn?.(ev);
      }}
    />
  );
}
