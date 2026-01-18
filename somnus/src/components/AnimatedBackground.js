import React, { useEffect, useState } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function AnimatedBackground({ isDark, theme }) {
  // Valor animado (0 -> 1) para controlar glow (opacidad, escala, movimiento)
  const [glowAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de glow continuo (muy sutil)
    Animated.loop(
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
    ).start();
  }, [glowAnimation]);

  // Color de fondo general (usa el BACKGROUND_COLOR del theme)
  const getBackgroundColor = () => {
    return isDark ? theme.BACKGROUND_COLOR : theme.BACKGROUND_COLOR;
  };

  // Color de partículas (no se usa aquí, pero queda para futuras mejoras)
  const getParticleColor = () => {
    return isDark ? '#7C9EFF' : '#6B8AE3';
  };

  // Color del glow (círculos)
  const getGlowColor = () => {
    return isDark ? '#7C9EFF' : '#6B8AE3';
  };

  return (
    <View
      style={[
        {
          // Contenedor absoluto para quedar detrás de toda la UI
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          backgroundColor: getBackgroundColor(),
          overflow: 'hidden',
          zIndex: 0,
        },
      ]}
    >
      {/* Fondo base sutil */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: getBackgroundColor(),
        }}
      />

      {/* Círculos de glow animados - Superior */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: getGlowColor(),
          top: -150,
          left: -150,

          // Opacidad animada (súper sutil)
          opacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.05, 0.09],
          }),

          // Movimiento y escala suave para efecto “respiración”
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

      {/* Círculos de glow animados - Inferior */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: getGlowColor(),
          bottom: -120,
          right: -120,

          // Opacidad animada (súper sutil)
          opacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.04, 0.08],
          }),

          // Movimiento y escala suave
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
