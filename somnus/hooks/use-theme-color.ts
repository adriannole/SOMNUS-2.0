/**
 * Hook para obtener colores según el tema actual
 * (modo claro u oscuro).
 *
 * Más info:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  // Colores personalizados opcionales
  props: { light?: string; dark?: string },

  // Nombre del color definido en constants/theme
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Tema actual del sistema
  const theme = useColorScheme() ?? 'light';

  // Color enviado por props (si existe)
  const colorFromProps = props[theme];

  // Prioriza el color personalizado, si no usa el del tema
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
