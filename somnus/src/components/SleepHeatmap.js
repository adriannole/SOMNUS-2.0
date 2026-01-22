import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

// Obtener ancho de pantalla para calcular tamaño de celdas
const { width } = Dimensions.get('window');

/**
 * SleepHeatmap
 * ------------
 * Componente que muestra un calendario tipo "heatmap" de los últimos 30 días,
 * representando la calidad del sueño mediante colores.
 *
 * Props:
 * - data: arreglo de sesiones de sueño (incluye fecha y score)
 * - onDayPress: callback que se ejecuta al seleccionar un día con datos
 */
export default function SleepHeatmap({ data, onDayPress }) {
  const { theme } = useTheme();

  // Tamaño de cada celda (7 días por fila)
  const CELL_SIZE = (width - 48) / 7;

  /**
   * Mapa de sesiones indexado por fecha (YYYY-MM-DD).
   * Se usa useMemo para evitar recalcular el mapa en cada render.
   */
  const scoreMap = useMemo(() => {
    const map = {};
    data.forEach(session => {
      const sessionDate = new Date(session.date);

      // Construcción de clave usando fecha local (evita errores UTC)
      const year = sessionDate.getFullYear();
      const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const day = String(sessionDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      map[dateKey] = session;
    });
    return map;
  }, [data]);

  /**
   * Genera una lista continua de los últimos 30 días,
   * incluyendo días sin datos de sueño.
   */
  const generateCalendarDays = () => {
    const today = new Date();

    // Usar mediodía para evitar problemas con zonas horarias
    today.setHours(12, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const days = [];
    const current = new Date(thirtyDaysAgo);

    while (current <= today) {
      // Generar clave de fecha local
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const sessionData = scoreMap[dateKey];

      days.push({
        date: new Date(current),
        dateKey,
        score: sessionData?.score || null,
        data: sessionData || null,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Lista de días generados
  const days = generateCalendarDays();

  /**
   * División de los días en semanas (filas de 7 días)
   */
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  /**
   * Retorna el color de la celda según el score del día
   */
  const getScoreColor = (score) => {
    if (score === null) return theme.SECONDARY_COLOR;
    if (score >= 80) return '#4CAF50'; // Verde (bueno)
    if (score >= 60) return '#FFB74D'; // Amarillo/Naranja (medio)
    return '#FF6B6B'; // Rojo (bajo)
  };

  /**
   * Color del texto dependiendo del estado del día
   */
  const getTextColor = (score) => {
    if (score === null) return theme.TEXT_COLOR + '99';
    return '#FFFFFF';
  };

  /**
   * Estilos del componente
   */
  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
    },
    weekContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 4,
    },
    dayCell: {
      width: CELL_SIZE,
      aspectRatio: 1,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dayText: {
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 2,
    },
    scoreText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    legend: {
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendColor: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
    legendLabel: {
      fontSize: 12,
      color: theme.TEXT_COLOR + '99',
    },
    emptyCell: {
      width: CELL_SIZE,
      aspectRatio: 1,
    },
  });

  // Etiquetas de los días de la semana
  const dayOfWeekLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <View style={styles.container}>
      {/* Encabezado con días de la semana */}
      <View style={styles.weekContainer}>
        {dayOfWeekLabels.map((label, idx) => (
          <View
            key={`label-${idx}`}
            style={[
              styles.emptyCell,
              { justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Text style={[styles.dayText, { color: theme.TEXT_COLOR }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid del calendario (30 días) */}
      {weeks.map((week, weekIdx) => (
        <View key={`week-${weekIdx}`} style={styles.weekContainer}>
          {week.map((day) => (
            <TouchableOpacity
              key={`day-${day.dateKey}`}
              onPress={() => day.data && onDayPress(day.data)}
              disabled={!day.data}
              style={[
                styles.dayCell,
                {
                  backgroundColor: getScoreColor(day.score),
                  opacity: day.data ? 1 : 0.3,
                },
              ]}
            >
              <Text style={[styles.dayText, { color: getTextColor(day.score) }]}>
                {day.date.getDate()}
              </Text>

              {day.score !== null && (
                <Text
                  style={[
                    styles.scoreText,
                    { color: getTextColor(day.score) },
                  ]}
                >
                  {day.score}
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Completar espacios si la semana no tiene 7 días */}
          {week.length < 7 &&
            Array.from({ length: 7 - week.length }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.emptyCell} />
            ))}
        </View>
      ))}

      {/* Leyenda de colores */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendLabel}>80+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFB74D' }]} />
          <Text style={styles.legendLabel}>60-79</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendLabel}>0-59</Text>
        </View>
      </View>
    </View>
  );
}
