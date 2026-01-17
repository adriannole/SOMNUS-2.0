/**
 * Ruta de registro (register).
 *
 * Este archivo es un "wrapper" para expo-router:
 * expone la pantalla RegisterScreen como una ruta dentro de /app.
 * La lógica principal está en /src/screens/RegisterScreen.
 */

import React from 'react';
import RegisterScreen from '../src/screens/RegisterScreen';

// Componente puente que renderiza la pantalla de registro
export default function RegisterPage() {
  return <RegisterScreen />;
}
