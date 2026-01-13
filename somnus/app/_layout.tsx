import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { THEME_DARK, THEME_LIGHT } from '@/src/constants/theme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const navTheme = useMemo(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    const bg = colorScheme === 'dark' ? THEME_DARK.BACKGROUND_COLOR : THEME_LIGHT.BACKGROUND_COLOR;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: bg,
        card: bg,
      },
    };
  }, [colorScheme]);

  const backgroundColor = colorScheme === 'dark' ? THEME_DARK.BACKGROUND_COLOR : THEME_LIGHT.BACKGROUND_COLOR;

  return (
    <ThemeProvider>
      <NavigationThemeProvider value={navTheme}>
        <View style={{ flex: 1, backgroundColor }}>
          <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor },
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            fullScreenGestureEnabled: true,
          }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="music-onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </View>
        <StatusBar 
          style={colorScheme === 'dark' ? 'light' : 'dark'} 
          backgroundColor={backgroundColor}
          translucent={false}
        />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}
