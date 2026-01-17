import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Hook personalizado para obtener el tema del sistema.
 * Evita errores de hidratación en web.
 */
export function useColorScheme() {
  // Indica si la app ya terminó de cargar en el cliente
  const [hasHydrated, setHasHydrated] = useState(false);

  // Se ejecuta una sola vez cuando la app inicia
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Tema real del sistema: 'light' | 'dark'
  const colorScheme = useRNColorScheme();

  // Si ya cargó completamente, usar el tema real
  if (hasHydrated) {
    return colorScheme;
  }

  // Antes de hidratar, usar light por defecto
  return 'light';
}
