/**
 * Ruta de inicio de sesión (login).
 *
 * Este archivo actúa como enlace entre expo-router
 * y la pantalla real ubicada en /src/screens/LoginScreen.
 */

import React from 'react';
import LoginScreen from '../src/screens/LoginScreen';

// Componente puente para mostrar la pantalla de login
export default function LoginPage() {
  return <LoginScreen />;
}

