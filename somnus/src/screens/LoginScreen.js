import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
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
    <View style={styles.container}>
      {/* FONDO ANIMADO */}
      <AnimatedBackground isDark={isDark} theme={theme} />

      {/* BOTÓN TOGGLE TEMA */}
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Text style={styles.themeToggleText}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.contentWrapper}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.titulo}>SOMNUS</Text>
          <Text style={styles.subtitle}>Descansa mejor, vive mejor</Text>
        </View>

        {/* TARJETA DE LOGIN */}
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
            editable={true}
          />

          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'password' && styles.inputFocused,
            ]}
            placeholder="••••••••"
            placeholderTextColor={theme.TEXT_COLOR + '50'}
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
            editable={true}
          />

          {/* BOTÓN LOGIN */}
          <TouchableOpacity
            style={[styles.boton, buttonPressed && styles.botonPressed]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBoton}>INICIAR SESIÓN</Text>
          </TouchableOpacity>

          {/* ENLACES */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>¿No tienes cuenta?</Text>
            <TouchableOpacity>
              <Text style={styles.linkButton}>Regístrate</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
}