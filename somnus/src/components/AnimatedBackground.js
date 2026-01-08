import React, { useEffect, useState } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function AnimatedBackground({ isDark, theme }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generar partículas animadas
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      initialX: Math.random() * width,
      initialY: Math.random() * height,
      duration: 4000 + Math.random() * 4000,
      delay: Math.random() * 1000,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.4,
      animation: new Animated.Value(0),
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
  }, []);

  const getBackgroundColor = () => {
    return isDark ? theme.BACKGROUND_COLOR : theme.BACKGROUND_COLOR;
  };

  const getGradientColors = () => {
    if (isDark) {
      return ['#1A1F26', '#2D3748', '#1F2937'];
    } else {
      return ['#F8F9FA', '#E8EEFB', '#F0F4FF'];
    }
  };

  const getParticleColor = () => {
    return isDark ? '#7C9EFF' : '#6B8AE3';
  };

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
      {/* Gradiente de fondo sutil */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: isDark ? '#1A1F26' : '#F8F9FA',
        }}
      />

      {/* Partículas flotantes */}
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
              inputRange: [0, 0.5, 1],
              outputRange: [particle.opacity * 0.3, particle.opacity, particle.opacity * 0.3],
            }),
            transform: [
              {
                translateY: particle.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -height * 0.5],
                }),
              },
              {
                translateX: particle.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.sin(particle.id) * 100],
                }),
              },
            ],
          }}
        />
      ))}

      {/* Círculos decorativos sutiles */}
      <View
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: isDark ? '#7C9EFF' : '#6B8AE3',
          opacity: isDark ? 0.05 : 0.08,
          top: -100,
          left: -100,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: isDark ? '#7C9EFF' : '#6B8AE3',
          opacity: isDark ? 0.04 : 0.06,
          bottom: -80,
          right: -80,
        }}
      />

      {/* Líneas decorativas animadas */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: 1,
          backgroundColor: isDark ? '#7C9EFF' : '#6B8AE3',
          opacity: isDark ? 0.1 : 0.15,
          top: height * 0.25,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: 1,
          backgroundColor: isDark ? '#7C9EFF' : '#6B8AE3',
          opacity: isDark ? 0.08 : 0.1,
          top: height * 0.75,
        }}
      />
    </View>
  );
}
