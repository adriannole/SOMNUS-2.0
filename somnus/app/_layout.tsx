/**
 * ==========================================================
 * ARCHIVO: app/_layout.tsx (RootLayout)
 * ----------------------------------------------------------
 * Este archivo define el "layout raíz" de la app con expo-router.
 * Aquí se configura:
 * - El tema general (claro/oscuro) 
 * - El ThemeProvider propio de la app (context)
 * - El tema de navegación de React Navigation (NavigationThemeProvider)
 * - El Stack de pantallas (rutas)
 * - El color de fondo global y la StatusBar
 * ==========================================================
 */

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Import obligatorio cuando usas Reanimated (evita errores en runtime)
import 'react-native-reanimated';

import { useMemo } from 'react';
import { View } from 'react-native';

// Hook propio para detectar si el usuario está en modo oscuro o claro
import { useColorScheme } from '@/hooks/use-color-scheme';

// Provider del contexto de tema de la app (si guardas preferencias o estilos globales)
import { ThemeProvider } from '@/src/context/ThemeContext';

// Constantes del tema (colores definidos)
import { THEME_DARK, THEME_LIGHT } from '@/src/constants/theme';

/**
 * Configuración especial de expo-router.
 * anchor: 'index' indica que la pantalla principal inicial es "index".
 */
export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  // Detecta el esquema de color del sistema: 'dark' o 'light'
  const colorScheme = useColorScheme();

  /**
   * navTheme:
   * Tema que se le pasa a React Navigation.
   * - Parte de DarkTheme o DefaultTheme
   * - Pero sobreescribe background y card para que coincidan
   *   con los colores de tu propio tema (THEME_DARK / THEME_LIGHT)
   *
   * useMemo:
   * Evita recalcular el objeto del tema en cada render
   * (solo se recalcula si cambia colorScheme).
   */
  const navTheme = useMemo(() => {
    // Elegimos el tema base que da React Navigation
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    // Elegimos el color de fondo según tu tema interno
    const bg =
      colorScheme === 'dark'
        ? THEME_DARK.BACKGROUND_COLOR
        : THEME_LIGHT.BACKGROUND_COLOR;

    // Retornamos un nuevo tema combinando base + colores personalizados
    return {
      ...base,
      colors: {
        ...base.colors,
        // background: fondo general
        background: bg,
        // card: fondo de headers/cards en navegación (aunque aquí header está oculto)
        card: bg,
      },
    };
  }, [colorScheme]);

  /**
   * backgroundColor:
   * Color de fondo global para envolver toda la app.
   * (Esto asegura que ninguna pantalla quede con fondo blanco por defecto)
   */
  const backgroundColor =
    colorScheme === 'dark'
      ? THEME_DARK.BACKGROUND_COLOR
      : THEME_LIGHT.BACKGROUND_COLOR;

  return (
    /**
     * ThemeProvider (contexto propio):
     * Maneja información global del tema dentro de tu app (si aplica).
     */
    <ThemeProvider>
      {/**
       * NavigationThemeProvider:
       * Aplica el tema a React Navigation (colores de navegación).
       */}
      <NavigationThemeProvider value={navTheme}>
        {/**
         * View contenedor raíz:
         * - flex: 1 para ocupar toda la pantalla
         * - backgroundColor para mantener el color de fondo consistente
         */}
        <View style={{ flex: 1, backgroundColor }}>
          {/**
           * Stack:
           * Define la navegación tipo "pila" (pantallas una encima de otra).
           * screenOptions aplica configuraciones por defecto a todas las pantallas.
           */}
          <Stack
            screenOptions={{
              // Oculta el header superior de navegación
              headerShown: false,

              // Fuerza el fondo para el contenido de pantallas
              contentStyle: { backgroundColor },

              // Animación al navegar entre pantallas
              animation: 'slide_from_right',

              // Permite gestos de navegación (volver con swipe)
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              fullScreenGestureEnabled: true,
            }}
          >
            {/**
             * Registro de pantallas / rutas:
             * name corresponde al archivo/ruta dentro de la carpeta app/
             */}
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="music-onboarding" />
            <Stack.Screen name="(tabs)" />

            {/**
             * Modal:
             * Pantalla presentada como modal (aparece encima).
             */}
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Modal' }}
            />
          </Stack>
        </View>

        {/**
         * StatusBar:
         * Controla el estilo de la barra superior (hora, batería).
         * - style: texto claro u oscuro según el tema
         * - backgroundColor: fondo de la status bar
         * - translucent=false: evita transparencia (más consistente)
         */}
        <StatusBar
          style={colorScheme === 'dark' ? 'light' : 'dark'}
          backgroundColor={backgroundColor}
          translucent={false}
        />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}
