/**
 * Ruta de onboarding inicial.
 *
 * Este archivo permite que expo-router muestre
 * la pantalla de onboarding como una página.
 * La lógica y el diseño real se encuentran en:
 * /src/screens/OnboardingScreen
 */

import React from 'react';
import OnboardingScreen from '../src/screens/OnboardingScreen';

// Componente puente entre la ruta y la pantalla real
export default function Page() {
  return <OnboardingScreen />;
}
