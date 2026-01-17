/**
 * HelloWave component
 * --------------------------------------------------
 * Muestra un texto animado con un pequeño efecto de saludo.
 * Utiliza react-native-reanimated para aplicar una animación
 * de rotación tipo "wave".
 */

import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        // Tamaño del texto
        fontSize: 28,
        lineHeight: 32,

        // Ajuste vertical fino
        marginTop: -6,

        /**
         * Animación tipo saludo:
         * rota ligeramente el texto al 50% del ciclo
         */
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },

        // Número de repeticiones de la animación
        animationIterationCount: 4,

        // Duración total de cada animación
        animationDuration: '300ms',
      }}
    >
      {/* El contenido (emoji o texto) se pasa como children */}
    </Animated.Text>
  );
}
