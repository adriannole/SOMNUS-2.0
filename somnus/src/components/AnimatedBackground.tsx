import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

// Dimensiones de la ventana (útil para escalado o futuras animaciones)
const { width, height } = Dimensions.get('window');

/**
 * AnimatedBackground
 *
 * Componente que renderiza un fondo animado con efecto glow.
 * El efecto se adapta dinámicamente al tema claro u oscuro.
 */

interface AnimatedBackgroundProps {
  isDark: boolean;
  theme: {
    BACKGROUND_COLOR: string;
    TEXT_COLOR: string;
    ACCENT_COLOR: string;
    SECONDARY_COLOR: string;
    BORDER_COLOR: string;
  };
}

export function AnimatedBackground({ isDark, theme }: AnimatedBackgroundProps) {
  // Valor animado persistente para controlar el efecto de glow
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación cíclica suave para dar sensación de "respiración"
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    // Limpieza de la animación al desmontar el componente
    return () => animation.stop();
  }, [glowAnimation]);

  // Colores derivados del tema
  const backgroundColor = theme.BACKGROUND_COLOR;
  const glowColor = isDark ? '#7C9EFF' : '#6B8AE3';

  return (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        backgroundColor,
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Capa base de fondo */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor,
        }}
      />

      {/* Glow decorativo superior */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: glowColor,
          top: -150,
          left: -150,
          opacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.05, 0.09],
          }),
          transform: [
            {
              scale: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1.05],
              }),
            },
            {
              translateX: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 6],
              }),
            },
            {
              translateY: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-4, 4],
              }),
            },
          ],
        }}
      />

      {/* Glow decorativo inferior */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: glowColor,
          bottom: -120,
          right: -120,
          opacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.04, 0.08],
          }),
          transform: [
            {
              scale: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1.04],
              }),
            },
            {
              translateX: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [5, -5],
              }),
            },
            {
              translateY: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [4, -4],
              }),
            },
          ],
        }}
      />
    </View>
  );
}
