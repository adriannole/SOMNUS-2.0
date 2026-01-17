/**
 * Ruta de onboarding musical.
 *
 * Este archivo permite mostrar la pantalla de configuración
 * de música al iniciar la aplicación.
 * La lógica y diseño están en /src/screens/MusicOnboardingScreen.
 */

import React from 'react';
import MusicOnboardingScreen from '../src/screens/MusicOnboardingScreen';

// Componente puente para expo-router
export default function MusicOnboardingPage() {
  return <MusicOnboardingScreen />;
}
