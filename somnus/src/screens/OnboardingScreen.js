import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';

// Medida base para componentes responsivos (barra decorativa, etc.)
const { width } = Dimensions.get('window');

/**
 * Slides del onboarding.
 * Cada slide define el contenido (título, descripción, acento) y la imagen.
 * Mantener esta estructura facilita agregar/quitar pantallas sin tocar la lógica.
 */
const slides = [
  {
    title: 'Duerme mejor con IA',
    subtitle:
      'Somnus analiza tus hábitos y ciclos de sueño para darte recomendaciones personalizadas respaldadas por IA.',
    accent: 'Personalización inteligente',
    image: require('../assets/ob1.webp'),
  },
  {
    title: 'Relájate y desconecta',
    subtitle:
      'Disfruta de música relajante, cuentos guiados y ruido blanco para conciliar el sueño más rápido y profundo.',
    accent: 'Sonidos y cuentos a tu medida',
    image: require('../assets/ob2.webp'),
  },
];

/**
 * OnboardingScreen
 * ----------------
 * Pantalla de introducción (onboarding) con slides animadas.
 * - Permite avanzar entre slides (Siguiente / Empezar)
 * - Permite omitir onboarding (Saltar)
 * - Usa animaciones para entrada de contenido y elementos decorativos
 */
export default function OnboardingScreen() {
  const router = useRouter();        // navegación
  const { theme } = useTheme();      // colores del tema
  const [index, setIndex] = useState(0); // slide actual

  /**
   * Valores animados persistentes.
   * useRef evita recrearlos en cada render y permite resetearlos al cambiar de slide.
   */
  const fadeAnim = useRef(new Animated.Value(0)).current;      // opacidad
  const slideAnim = useRef(new Animated.Value(0)).current;     // movimiento
  const scaleAnim = useRef(new Animated.Value(0.85)).current;  // zoom
  const highlightAnim = useRef(new Animated.Value(0)).current; // barra decorativa

  useEffect(() => {
    /**
     * Animación de entrada por cada cambio de slide.
     * Animated.parallel coordina varias transiciones al mismo tiempo.
     */
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 35,
        useNativeDriver: true,
      }),
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim, scaleAnim]);

  /**
   * Avanza al siguiente slide.
   * Si ya está en el último, redirige a login.
   * Antes de cambiar de slide, reinicia valores animados para que la transición sea consistente.
   */
  const handleNext = () => {
    if (index === slides.length - 1) {
      router.push('/login');
      return;
    }
    fadeAnim.setValue(0);
    slideAnim.setValue(80);
    scaleAnim.setValue(0.85);
    setIndex((prev) => prev + 1);
  };

  /**
   * Omitir onboarding.
   * Mantenerlo como función separada facilita tracking o lógica adicional futura.
   */
  const handleSkip = () => router.push('/login');

  // Slide actual a renderizar
  const slide = slides[index];

  return (
    <>
      {/* Fondo animado (se mantiene detrás de toda la pantalla) */}
      <AnimatedBackground isDark={true} theme={theme} />
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.container}>

          {/* Acción para omitir onboarding */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: theme.ACCENT_COLOR }]}>Saltar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentWrapper}>
            {/* Contenido principal animado (cambia por slide) */}
            <Animated.View
              key={index}
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 80],
                      outputRange: [0, -50],
                    }),
                  },
                  {
                    scale: scaleAnim,
                  },
                ],
              }}
            >
              {/* Ilustración */}
              <View style={styles.illustrationContainer}>
                <View style={[styles.illustrationCircle, { backgroundColor: theme.ACCENT_COLOR + '33' }]} />
                <View style={styles.illustrationCard}>
                  <Image
                    source={slide.image}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Badge (mensaje corto de valor) */}
              <Text style={[styles.badge, { color: theme.ACCENT_COLOR, borderColor: theme.ACCENT_COLOR }]}>
                {slide.accent}
              </Text>

              {/* Título y descripción */}
              <Text style={[styles.title, { color: theme.TEXT_COLOR }]}>{slide.title}</Text>

              {/* Barra decorativa animada */}
              <Animated.View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.ACCENT_COLOR,
                  marginTop: 6,
                  marginBottom: 16,
                  alignSelf: 'flex-start',
                  width: width * 0.55,
                  transform: [
                    {
                      scaleX: highlightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1],
                      }),
                    },
                  ],
                  opacity: highlightAnim,
                }}
              />

              <Text style={[styles.subtitle, { color: theme.TEXT_COLOR + 'B0' }]}>{slide.subtitle}</Text>
            </Animated.View>

            {/* Indicadores (dots) de progreso del onboarding */}
            <View style={styles.dotsRow}>
              {slides.map((_, i) => {
                const active = i === index;
                return (
                  <View
                    key={i}
                    style={{
                      width: active ? 28 : 10,
                      height: 10,
                      borderRadius: 5,
                      marginHorizontal: 5,
                      backgroundColor: active ? theme.ACCENT_COLOR : theme.ACCENT_COLOR + '55',
                      transform: [{ scale: active ? 1.05 : 1 }],
                    }}
                  />
                );
              })}
            </View>

            {/* Acción principal */}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.ACCENT_COLOR }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextText}>{index === slides.length - 1 ? 'Empezar' : 'Siguiente'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

// Estilos (estructura del onboarding)
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerRow: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  illustrationContainer: {
    height: 280,
    marginBottom: 28,
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  illustrationCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: -40,
    right: -30,
  },
  illustrationCard: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  illustrationText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 38,
    width: '100%',
    maxWidth: '95%',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: '96%',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
