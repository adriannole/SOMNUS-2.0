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
import { Link, useRouter } from 'expo-router';

// Tema (colores + modo oscuro/claro)
import { useTheme } from '../hooks/useTheme';

// Fondo animado de la app
import { AnimatedBackground } from '../components/AnimatedBackground';

// Alert personalizado (modal bonito)
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

// Estilos del login (dependen del tema)
import { createLoginStyles } from './styles/LoginScreen.styles';

// Funciones backend (Supabase)
import { signIn } from '../backend/authService';
import { getMusicOnboardingStatus } from '../backend/musicService';

export default function LoginScreen() {
  // Tema actual y función para cambiar claro/oscuro
  const { theme, isDark, toggleTheme } = useTheme();

  // Genera estilos según el theme actual
  const styles = createLoginStyles(theme);

  // Animación del switch de tema (0 = claro, 1 = oscuro)
  const switchAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  // Navegación (expo-router)
  const router = useRouter();

  // Control del alert (mostrar/ocultar + config)
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Para resaltar el input activo (focus)
  const [focusedInput, setFocusedInput] = useState(null);

  // Efecto visual al presionar el botón
  const [buttonPressed, setButtonPressed] = useState(false);

  // Evita doble clic y muestra "conectando..."
  const [loading, setLoading] = useState(false);

  // Inicia sesión con Supabase y luego decide a qué pantalla ir
  const handleLogin = async () => {
    if (loading) return; // evita que se ejecute dos veces
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);
    setLoading(true);

    // Login con correo y contraseña
    const result = await signIn({
      email: email.trim(),
      password,
    });

    // Si falla, muestra alerta de error
    if (!result.success) {
      showAlert(
        'Error de inicio',
        result.error,
        [{ text: 'OK', onPress: () => {} }],
        'danger'
      );
      setLoading(false);
      return;
    }

    // Revisa si el usuario ya terminó el onboarding de música
    const onboardingDone = await getMusicOnboardingStatus().catch(() => false);

    // Alerta de éxito y redirección según onboarding
    showAlert(
      '¡Bienvenido!',
      'Inicio de sesión correcto',
      [{
        text: 'Continuar',
        onPress: () => {
          // Si ya hizo onboarding, va a tabs (home)
          if (onboardingDone) {
            router.replace('/(tabs)');
          } else {
            // Si no, lo manda a music-onboarding
            router.replace('/music-onboarding');
          }
        }
      }],
      'success'
    );

    setLoading(false);
  };

  // Cambia el tema con animación tipo “switch”
  const handleToggleTheme = () => {
    Animated.spring(switchAnim, {
      toValue: isDark ? 0 : 1, // cambia el valor animado
      friction: 7,
      tension: 40,
      useNativeDriver: false, // porque animamos colores/posición
    }).start();

    toggleTheme(); // cambia theme global (context)
  };

  return (
    <>
      {/* Fondo animado detrás de todo */}
      <AnimatedBackground isDark={isDark} theme={theme} />

      {/* Evita que el teclado tape los inputs (sobre todo en iOS) */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >

        {/* Switch de tema (claro/oscuro) */}
        <TouchableOpacity 
          style={styles.themeToggleContainer} 
          onPress={handleToggleTheme}
          activeOpacity={0.9}
        >
          <Animated.View style={[
            styles.toggleBackground,
            {
              // Color del switch cambia según switchAnim
              backgroundColor: switchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#E9ECEF', '#2D3748']
              })
            }
          ]}>
            <Animated.View style={[
              styles.toggleCircle,
              {
                // Mueve el círculo del switch izquierda ↔ derecha
                transform: [{
                  translateX: switchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, 39]
                  })
                }]
              }
            ]}>
              {/* Ícono de luna o sol según el tema */}
              <Text style={styles.toggleIcon}>{isDark ? '☾' : '☀'}</Text>
            </Animated.View>

            {/* Texto "Claro / Oscuro" con resaltado */}
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

        {/* Contenido scrolleable para pantallas pequeñas */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            {/* Header: logo + nombre + slogan */}
            <View style={styles.header}>
              <Image source={require('../assets/logo.png')} style={styles.logo} />
              <Text style={styles.titulo}>SOMNUS</Text>
              <Text style={styles.subtitle}>Descansa mejor, vive mejor</Text>
            </View>

            {/* Tarjeta del formulario */}
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

              {/* Botón login: cambia texto si está cargando */}
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

              {/* Link a registro */}
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

      {/* Alert custom para errores/éxito */}
      <CustomAlert
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </>
  );
}
