/**
 * ParallaxScrollView
 * --------------------------------------------------
 * ScrollView con efecto "parallax" en el header:
 * - Al hacer scroll, el header se desplaza y escala suavemente
 * - El contenido aparece debajo del header
 *
 * Props:
 * - headerImage: elemento React que se muestra dentro del header (imagen/ícono)
 * - headerBackgroundColor: color del header para modo dark/light
 * - children: contenido principal de la pantalla
 */

import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

// Altura fija del header para calcular las interpolaciones del parallax
const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  // Componente que se renderiza dentro del header (por ejemplo una imagen)
  headerImage: ReactElement;

  // Colores de fondo del header según el tema del sistema
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  // Color de fondo general basado en el tema actual
  const backgroundColor = useThemeColor({}, 'background');

  // Detecta el esquema de color del sistema (si falla, usa light)
  const colorScheme = useColorScheme() ?? 'light';

  /**
   * scrollRef:
   * Referencia animada del ScrollView para poder leer su desplazamiento (scrollOffset)
   */
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  /**
   * scrollOffset:
   * Valor animado que contiene el desplazamiento vertical actual del scroll
   */
  const scrollOffset = useScrollOffset(scrollRef);

  /**
   * headerAnimatedStyle:
   * Estilo animado del header (parallax):
   * - translateY: mueve el header dependiendo del scroll (sensación de profundidad)
   * - scale: agranda el header al hacer pull-down (scroll negativo)
   */
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          // Desplazamiento vertical suave del header
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          // Efecto zoom cuando el usuario "jala" hacia abajo
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      // Fondo general del scroll
      style={{ backgroundColor, flex: 1 }}
      // Frecuencia de eventos de scroll (16ms ≈ 60fps)
      scrollEventThrottle={16}
    >
      {/* Header con imagen y animación parallax */}
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}
      >
        {headerImage}
      </Animated.View>

      {/* Contenido principal debajo del header */}
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  // Nota: container no se usa actualmente, pero puede servir si luego lo necesitas
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
