import React, { useEffect, useState } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function AnimatedBackground({ isDark, theme }) {
  const [particles, setParticles] = useState([]);
  const [glowAnimation] = useState(new Animated.Value(0));
  const [orbitAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Generar partículas con diferentes velocidades y tamaños
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      initialX: Math.random() * width,
      initialY: Math.random() * height,
      duration: 6000 + Math.random() * 8000,
      delay: Math.random() * 2000,
      size: 1 + Math.random() * 5,
      opacity: 0.4 + Math.random() * 0.6,
      animation: new Animated.Value(0),
      intensity: 0.5 + Math.random() * 0.5,
    }));

    setParticles(newParticles);

    // Animar cada partícula
    newParticles.forEach((particle) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(particle.animation, {
            toValue: 1,
            duration: particle.duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Animación de glow continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de órbita
    Animated.loop(
      Animated.timing(orbitAnimation, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, [glowAnimation, orbitAnimation]);

  const getBackgroundColor = () => {
    return isDark ? theme.BACKGROUND_COLOR : theme.BACKGROUND_COLOR;
  };

  const getParticleColor = () => {
    return isDark ? '#7C9EFF' : '#6B8AE3';
  };

  const getGlowColor = () => {
    return isDark ? '#7C9EFF' : '#6B8AE3';
  };

  const orbitRotation = orbitAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        {
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
          backgroundColor: isDark ? '#0F1419' : '#FAFBFD',
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
          opacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.08, 0.15],
          }),
          transform: [
            {
              scale: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
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
          opacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.06, 0.12],
          }),
          transform: [
            {
              scale: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.3],
              }),
            },
          ],
        }}
      />

      {/* Partículas flotantes brillantes */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: getParticleColor(),
            left: particle.initialX,
            top: particle.initialY,
            opacity: particle.animation.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, particle.opacity * particle.intensity, particle.opacity * particle.intensity, 0],
            }),
            shadowColor: getGlowColor(),
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: particle.animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, particle.intensity * 0.6, 0],
            }),
            shadowRadius: particle.size * 3,
            transform: [
              {
                translateY: particle.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -height * 0.8],
                }),
              },
              {
                translateX: particle.animation.interpolate({
                  inputRange: [0, 0.25, 0.75, 1],
                  outputRange: [0, Math.sin(particle.id) * 150, -Math.cos(particle.id) * 150, 0],
                }),
              },
              {
                scale: particle.animation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1, 0.5],
                }),
              },
            ],
          }}
        />
      ))}

      {/* Órbita animada - Línea decorativa */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: 140,
          borderWidth: 1,
          borderColor: getGlowColor(),
          opacity: isDark ? 0.15 : 0.2,
          top: '50%',
          left: '50%',
          marginTop: -140,
          marginLeft: -140,
          transform: [
            {
              rotate: orbitRotation,
            },
          ],
        }}
      />

      {/* Punto brillante en órbita */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: getGlowColor(),
          top: '50%',
          left: '50%',
          marginTop: -4,
          marginLeft: -4,
          opacity: isDark ? 0.6 : 0.8,
          transform: [
            {
              translateX: Animated.multiply(
                orbitAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                140
              ),
            },
            {
              rotate: orbitRotation,
            },
          ],
        }}
      />

      {/* Líneas horizontales animadas */}
      {/* Removidas - no se ven bien */}

      {/* Puntos de luz estratégicos */}
      <View
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: getParticleColor(),
          opacity: isDark ? 0.5 : 0.6,
          top: '25%',
          right: '10%',
          shadowColor: getGlowColor(),
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDark ? 0.5 : 0.4,
          shadowRadius: 8,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: getParticleColor(),
          opacity: isDark ? 0.4 : 0.5,
          top: '70%',
          left: '8%',
          shadowColor: getGlowColor(),
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDark ? 0.4 : 0.3,
          shadowRadius: 6,
        }}
      />
    </View>
  );
}
