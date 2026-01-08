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

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Duerme mejor con IA',
    subtitle:
      'Somnus analiza tus hábitos y ciclos de sueño para darte recomendaciones personalizadas respaldadas por IA.',
    accent: 'Personalización inteligente',
    image: require('../assets/ob1.png'),
  },
  {
    title: 'Relájate y desconecta',
    subtitle:
      'Disfruta de música relajante, cuentos guiados y ruido blanco para conciliar el sueño más rápido y profundo.',
    accent: 'Sonidos y cuentos a tu medida',
    image: require('../assets/ob2.webp'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
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

  const handleSkip = () => router.push('/login');

  const slide = slides[index];

  return (
    <>
      <AnimatedBackground isDark={true} theme={theme} />
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.container}>

          <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: theme.ACCENT_COLOR }]}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
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
          <Text style={[styles.badge, { color: theme.ACCENT_COLOR, borderColor: theme.ACCENT_COLOR }]}>
            {slide.accent}
          </Text>
          <Text style={[styles.title, { color: theme.TEXT_COLOR }]}>{slide.title}</Text>
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
