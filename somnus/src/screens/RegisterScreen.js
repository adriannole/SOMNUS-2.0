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
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { createLoginStyles } from './styles/LoginScreen.styles';

export default function RegisterScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createLoginStyles(theme);
  const router = useRouter();
  const switchAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [buttonPressed, setButtonPressed] = useState(false);

  const handleRegister = () => {
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);
    console.log('Register:', { firstName, lastName, email, password, confirmPassword });
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
            <Text style={styles.subtitle}>Crea tu cuenta y descansa mejor</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              style={[styles.input, focusedInput === 'firstName' && styles.inputFocused]}
              placeholder="Tu nombre"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocusedInput('firstName')}
              onBlur={() => setFocusedInput(null)}
              editable
            />

            <Text style={styles.label}>APELLIDO</Text>
            <TextInput
              style={[styles.input, focusedInput === 'lastName' && styles.inputFocused]}
              placeholder="Tu apellido"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocusedInput('lastName')}
              onBlur={() => setFocusedInput(null)}
              editable
            />

            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable
            />

            <Text style={styles.label}>CONTRASEÑA</Text>
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
              placeholder="••••••••"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              editable
            />

            <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput
              style={[styles.input, focusedInput === 'confirm' && styles.inputFocused]}
              placeholder="Repite tu contraseña"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedInput('confirm')}
              onBlur={() => setFocusedInput(null)}
              editable
            />

            <TouchableOpacity
              style={[styles.boton, buttonPressed && styles.botonPressed]}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBoton}>REGISTRARSE</Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>¿Ya tienes cuenta?</Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkButton}>Inicia sesión</Text>
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
