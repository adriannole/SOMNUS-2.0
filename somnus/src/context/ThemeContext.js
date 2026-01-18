/**
 * ==================================================
 * THEME CONTEXT
 * --------------------------------------------------
 * Maneja el tema global de la aplicación:
 * - modo claro
 * - modo oscuro
 *
 * Se usa en toda la app con useTheme()
 * ==================================================
 */

import React, { createContext, useState } from 'react';
import { THEME_LIGHT, THEME_DARK } from '../constants/theme';

// Contexto global del tema
export const ThemeContext = createContext();

// Provider del tema
export function ThemeProvider({ children }) {

  // Estado que define si el tema es oscuro o claro
  const [isDark, setIsDark] = useState(true);

  // Cambia entre light ↔ dark
  const toggleTheme = () => setIsDark(!isDark);

  // Selección del tema según el estado
  const theme = isDark ? THEME_DARK : THEME_LIGHT;

  return (
    // Se comparte el tema a toda la app
    <ThemeContext.Provider
      value={{
        theme,       // colores actuales
        isDark,      // true = oscuro
        toggleTheme, // función para cambiar tema
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
