import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { createLoginStyles } from './styles/LoginScreen.styles';
import { signIn } from '../backend/authService';

export default function LoginScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createLoginStyles(theme);
  const switchAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);
    setLoading(true);

    const result = await signIn({
      email: email.trim(),
      password,
    });

    if (!result.success) {
      Alert.alert('Error de inicio', result.error);
      setLoading(false);
      return;
    }

    Alert.alert('Bienvenido', 'Inicio de sesión correcto');
    router.replace('/(tabs)');
    setLoading(false);
  };

  const handleToggleTheme = () => {
    Animated.spring(switchAnim, {
      toValue: isDark ? 0 : 1,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();
    toggleTheme();
  };

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >

        <TouchableOpacity 
          style={styles.themeToggleContainer} 
          onPress={handleToggleTheme}
          activeOpacity={0.9}
        >
          <Animated.View style={[
            styles.toggleBackground,
            {
              backgroundColor: switchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#E9ECEF', '#2D3748']
              })
            }
          ]}>
            <Animated.View style={[
              styles.toggleCircle,
              {
                transform: [{
                  translateX: switchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, 39]
                  })
                }]
              }
            ]}>
              <Text style={styles.toggleIcon}>{isDark ? '☾' : '☀'}</Text>
            </Animated.View>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleText, !isDark && styles.toggleTextActive]}>
                Claro
              </Text>
              <Text style={[styles.toggleText, isDark && styles.toggleTextActive]}>
                Oscuro
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.titulo}>SOMNUS</Text>
            <Text style={styles.subtitle}>Descansa mejor, vive mejor</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'email' && styles.inputFocused,
              ]}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              editable
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>CONTRASEÑA</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'password' && styles.inputFocused,
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              editable
            />

            <TouchableOpacity
              style={[styles.boton, buttonPressed && styles.botonPressed]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.textoBoton}>
                {loading ? 'CONECTANDO...' : 'INICIAR SESIÓN'}
              </Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>¿No tienes cuenta?</Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkButton}>Regístrate</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}