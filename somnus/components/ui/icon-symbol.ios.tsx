/**
 * IconSymbol component
 * --------------------------------------------------
 * Componente reutilizable para mostrar íconos del sistema
 * usando expo-symbols (SF Symbols).
 *
 * Permite:
 * - Definir tamaño, color y peso del ícono
 * - Mantener consistencia visual en toda la aplicación
 * - Evitar repetir configuración en cada pantalla
 */

import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  // Nombre del ícono (SF Symbol)
  name: SymbolViewProps['name'];

  // Tamaño del ícono (ancho y alto)
  size?: number;

  // Color del ícono
  color: string;

  // Estilos adicionales opcionales
  style?: StyleProp<ViewStyle>;

  // Grosor del ícono (regular, medium, bold, etc.)
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      // Peso del ícono
      weight={weight}

      // Color del ícono
      tintColor={color}

      // Ajuste de tamaño
      resizeMode="scaleAspectFit"

      // Nombre del símbolo
      name={name}

      // Tamaño final del ícono
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
