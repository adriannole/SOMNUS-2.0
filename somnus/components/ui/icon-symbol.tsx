/**
 * IconSymbol (fallback)
 * --------------------------------------------------
 * Componente de respaldo para Android y Web.
 *
 * - En iOS se utilizan SF Symbols (expo-symbols).
 * - En Android y Web se utilizan Material Icons.
 *
 * Este archivo permite usar **los mismos nombres de íconos**
 * (basados en SF Symbols) en todas las plataformas,
 * haciendo el mapeo manual cuando no están disponibles.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * Tipo que relaciona:
 * - nombre de SF Symbol → nombre de Material Icon
 */
type IconMapping = Record<
  SymbolViewProps['name'],
  ComponentProps<typeof MaterialIcons>['name']
>;

/**
 * Nombres válidos de íconos soportados por el sistema
 */
type IconSymbolName = keyof typeof MAPPING;

/**
 * Mapeo entre SF Symbols y Material Icons.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

/**
 * IconSymbol
 * --------------------------------------------------
 * Componente multiplataforma para íconos.
 *
 * Usa:
 * - Material Icons en Android / Web
 * - SF Symbols en iOS (archivo alterno)
 *
 * Así se mantiene una apariencia coherente
 * sin duplicar componentes por plataforma.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  // Nombre del ícono basado en SF Symbols
  name: IconSymbolName;

  // Tamaño del ícono
  size?: number;

  // Color del ícono
  color: string | OpaqueColorValue;

  // Estilos adicionales
  style?: StyleProp<TextStyle>;

  // weight se mantiene por compatibilidad con iOS
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
