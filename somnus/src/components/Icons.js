import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Rect, Ellipse } from 'react-native-svg';

/**
 * Conjunto de íconos SVG reutilizables para la aplicación.
 *
 * Todos los íconos:
 * - Aceptan tamaño configurable (`size`)
 * - Aceptan color configurable (`color`)
 * - Están basados en `react-native-svg`
 *
 * Esto permite consistencia visual y fácil mantenimiento.
 */

export const MoonIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

/**
 * Ícono de ojo
 * Usado comúnmente para acciones de visibilidad (mostrar/ocultar)
 */
export const EyeIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill={color} />
  </Svg>
);

/**
 * Ícono de teléfono
 * Representa acciones relacionadas a contacto o llamadas
 */
export const PhoneIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="5"
      y="2"
      width="14"
      height="20"
      rx="2"
      ry="2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 18h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Ícono de reloj
 * Usado para tiempo, horarios o duración
 */
export const ClockIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * Ícono de reproducción (play)
 */
export const PlayIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 3l14 9-14 9V3z"
      fill={color}
    />
  </Svg>
);

/**
 * Ícono de detener (stop)
 */
export const StopIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
  </Svg>
);

/**
 * Ícono de inicio para navegación
 */
export const HomeIconNav = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5l9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"
      fill={color}
    />
    <Path
      d="M9 22V12h6v10"
      fill={color === '#fff' ? '#1a1f26' : '#fff'}
      opacity="0.3"
    />
  </Svg>
);

/**
 * Ícono de gráfico
 * Representa estadísticas o análisis
 */
export const ChartIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3v18h18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 17V9m-5 8V5m-5 12v-3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Ícono de configuración
 */
export const SettingsIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      fill={color}
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      fill={color}
    />
  </Svg>
);

/**
 * Ícono de menú (hamburguesa)
 */
export const MenuIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12h18M3 6h18M3 18h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * Ícono de sol
 * Usado para representar modo claro
 */
export const SunIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2 L14 8 L10 8 Z" fill={color} />
    <Path d="M18.5 5.5 L15.5 10 L12.5 7 Z" fill={color} />
    <Path d="M22 12 L16 14 L16 10 Z" fill={color} />
    <Path d="M18.5 18.5 L12.5 17 L15.5 14 Z" fill={color} />
    <Path d="M12 22 L10 16 L14 16 Z" fill={color} />
    <Path d="M5.5 18.5 L8.5 14 L11.5 17 Z" fill={color} />
    <Path d="M2 12 L8 10 L8 14 Z" fill={color} />
    <Path d="M5.5 5.5 L11.5 7 L8.5 10 Z" fill={color} />
    <Circle cx="12" cy="12" r="5.5" fill={color} />
  </Svg>
);

/**
 * Ícono de luna para modo oscuro
 */
export const MoonIconDark = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

/**
 * Ícono de música
 */
export const MusicIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18V5l12-2v13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" fill={color} />
    <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth="2" fill={color} />
  </Svg>
);

/**
 * Ícono de pausa
 */
export const PauseIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
    <Rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
  </Svg>
);

/**
 * Ícono de flecha izquierda
 * Usado para navegación o retroceso
 */
export const ChevronLeftIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
