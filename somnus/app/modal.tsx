/**
 * Pantalla modal.
 *
 * Esta vista se muestra como un modal utilizando expo-router.
 * Sirve como ejemplo de navegación modal y uso de componentes temáticos.
 */

import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    // Contenedor principal con estilos según el tema
    <ThemedView style={styles.container}>
      
      {/* Título del modal */}
      <ThemedText type="title">
        This is a modal
      </ThemedText>

      {/* Enlace que cierra el modal y regresa al inicio */}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">
          Go to home screen
        </ThemedText>
      </Link>
    </ThemedView>
  );
}

/**
 * Estilos del modal
 */
const styles = StyleSheet.create({
  // Contenedor centrado
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  // Estilo del enlace de navegación
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
