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
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { createLoginStyles } from './styles/LoginScreen.styles';
import { signUpWithProfile } from '../backend/authService';

export default function RegisterScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createLoginStyles(theme);
  const router = useRouter();
  const switchAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  const [age, setAge] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);
    const parsedAge = Number(age);

    if (!parsedAge || parsedAge < 1) {
      Alert.alert('Edad requerida', 'Ingresa una edad valida.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseña', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const result = await signUpWithProfile({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: parsedAge,
    });

    if (!result.success) {
      Alert.alert('Error al registrar', result.error);
      setLoading(false);
      return;
    }

    Alert.alert('Cuenta creada', 'Tu cuenta ha sido creada con exito.');
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
            <Text style={styles.subtitle}>Crea tu cuenta y descansa mejor</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>EDAD</Text>
            <TextInput
              style={[styles.input, focusedInput === 'age' && styles.inputFocused]}
              placeholder="Tu edad"
              placeholderTextColor={theme.TEXT_COLOR + '50'}
              value={age}
              onChangeText={setAge}
              onFocus={() => setFocusedInput('age')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="number-pad"
              maxLength={3}
              editable
            />

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
              disabled={loading}
            >
              <Text style={styles.textoBoton}>
                {loading ? 'CREANDO...' : 'REGISTRARSE'}
              </Text>
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
