/**
 * ThemedView component
 * --------------------------------------------------
 * Contenedor que adapta automáticamente su color de fondo
 * al tema claro u oscuro de la aplicación.
 *
 * Permite:
 * - Usar el color de fondo definido por el tema
 * - Sobrescribir colores con lightColor / darkColor
 * - Mantener consistencia visual en todas las pantallas
 */

import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Props del ThemedView:
 * - Extiende las props normales de View
 * - Permite definir colores distintos para light y dark mode
 */
export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  /**
   * Obtiene el color de fondo correcto según el tema actual.
   * Si no se especifica un color, usa el fondo definido por el tema.
   */
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return (
    <View
      // Aplica fondo dinámico y estilos adicionales
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  );
}

