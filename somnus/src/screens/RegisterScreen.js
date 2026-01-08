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
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { createLoginStyles } from './styles/LoginScreen.styles';

export default function RegisterScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createLoginStyles(theme);
  const router = useRouter();

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

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >

        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Text style={styles.themeIcon}>{isDark ? '☀' : '✦'}</Text>
        </View>
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
              <TouchableOpacity onPress={() => router.replace('/login')}> 
                <Text style={styles.linkButton}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
