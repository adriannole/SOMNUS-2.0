/**
 * ThemedText component
 * --------------------------------------------------
 * Componente de texto que se adapta automáticamente
 * al tema claro u oscuro de la aplicación.
 *
 * Permite:
 * - Definir colores personalizados (light / dark)
 * - Usar estilos predefinidos por tipo (title, subtitle, link, etc.)
 * - Mantener consistencia visual en toda la app
 */

import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Props extendidas del componente Text:
 * - lightColor / darkColor: colores opcionales según tema
 * - type: define el estilo visual del texto
 */
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  /**
   * Obtiene el color correcto según el tema actual.
   * Si no se envía color personalizado, usa el color por defecto del tema.
   */
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        // Color dinámico según tema
        { color },

        // Estilos según el tipo de texto
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,

        // Estilos adicionales enviados por props
        style,
      ]}
      {...rest}
    />
  );
}

/**
 * Estilos base reutilizables para los diferentes tipos de texto
 */
const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
