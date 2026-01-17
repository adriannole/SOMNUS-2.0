/**
 * Collapsible component
 * --------------------------------------------------
 * Componente desplegable (acordeón).
 *
 * Permite mostrar u ocultar contenido al presionar
 * el encabezado, ideal para:
 * - secciones de ayuda
 * - preguntas frecuentes
 * - configuraciones avanzadas
 */

import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  // Estado que controla si el contenido está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false);

  // Tema actual del sistema (light / dark)
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView>
      {/* Encabezado clickeable */}
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        {/* Ícono de flecha que rota al abrir/cerrar */}
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{
            transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
          }}
        />

        {/* Título de la sección */}
        <ThemedText type="defaultSemiBold">
          {title}
        </ThemedText>
      </TouchableOpacity>

      {/* Contenido visible solo cuando está abierto */}
      {isOpen && (
        <ThemedView style={styles.content}>
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}

/**
 * Estilos del componente
 */
const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
