import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { createLoginStyles } from './styles/LoginScreen.styles';

export default function LoginScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createLoginStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [buttonPressed, setButtonPressed] = useState(false);

  const handleLogin = () => {
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);
    console.log('Login:', email, password);
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
          style={styles.themeToggle} 
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
        {isDark ? (
          <View style={styles.iconContainer}>
            <Text style={styles.themeIcon}>☀</Text>
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <Text style={styles.themeIcon}>✦</Text>
          </View>
        )}
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
            >
              <Text style={styles.textoBoton}>INICIAR SESIÓN</Text>
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