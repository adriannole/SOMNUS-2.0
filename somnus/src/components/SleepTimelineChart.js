import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Line, Circle, Polyline, Rect, G, TSpan } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function SleepTimelineChart({
  startTime,
  endTime,
  pickups,
  hoursSlept,
}) {
  const { theme } = useTheme();
  const CHART_WIDTH = width - 60;
  const CHART_HEIGHT = 200;
  const PADDING = 30;

  // Calcular puntos de la línea
  const calculatePoints = useMemo(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Horas totales del rango
    const totalMs = end - start;
    const totalHours = totalMs / (1000 * 60 * 60);

    // Generar puntos de sueño
    const points = [];

    // Punto inicial (durmiendo)
    points.push({
      time: start,
      label: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      value: 1, // 1 = durmiendo, 0 = despierto
      type: 'start',
    });

    // Generar pickups (despertares)
    if (pickups > 0) {
      const pickupInterval = totalHours / (pickups + 1);

      for (let i = 1; i <= pickups; i++) {
        const pickupTime = new Date(start.getTime() + (pickupInterval * i * 60 * 60 * 1000));
        
        // Pickup (despierto)
        points.push({
          time: pickupTime,
          label: pickupTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          value: 0,
          type: 'pickup',
        });

        // Volver a dormir
        const backToSleep = new Date(pickupTime.getTime() + (15 * 60 * 1000)); // 15 min despierto
        points.push({
          time: backToSleep,
          label: backToSleep.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          value: 1,
          type: 'resume',
        });
      }
    }

    // Punto final (despierto/fin)
    points.push({
      time: end,
      label: end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      value: 0,
      type: 'end',
    });

    return { points, start, end, totalHours };
  }, [startTime, endTime, pickups]);

  const { points, start, end, totalHours } = calculatePoints;

  // Convertir puntos a coordenadas SVG
  const getXCoordinate = (pointTime) => {
    const ms = pointTime - start;
    const hours = ms / (1000 * 60 * 60);
    return PADDING + (hours / totalHours) * CHART_WIDTH;
  };

  const getYCoordinate = (value) => {
    // value: 0 = despierto (arriba), 1 = durmiendo (abajo)
    return PADDING + (1 - value) * (CHART_HEIGHT - PADDING * 2);
  };

  // Crear polyline data
  const polylinePoints = points
    .map((p) => `${getXCoordinate(p.time)},${getYCoordinate(p.value)}`)
    .join(' ');

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    chartContainer: {
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    svgContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: PADDING,
      marginBottom: 8,
      marginTop: 8,
    },
    label: {
      fontSize: 11,
      color: theme.TEXT_COLOR + '99',
    },
    axisLabel: {
      fontSize: 10,
      color: theme.TEXT_COLOR + '99',
      marginTop: 4,
      marginBottom: 4,
    },
    timeLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: PADDING,
      marginTop: 8,
      marginBottom: 8,
    },
    timeLabel: {
      fontSize: 11,
      color: theme.TEXT_COLOR + '99',
      textAlign: 'center',
    },
    legend: {
      marginTop: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendLabel: {
      fontSize: 12,
      color: theme.TEXT_SECONDARY,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    statItem: {
      flexDirection: 'row',
      gap: 8,
    },
    statLabel: {
      fontSize: 12,
      color: theme.TEXT_SECONDARY,
    },
    statValue: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.TEXT_PRIMARY,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {/* Axis labels */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ width: PADDING }}>
            <Text style={[styles.axisLabel, { textAlign: 'right' }]}>Durmiendo</Text>
            <Text style={[styles.axisLabel, { textAlign: 'right' }]}>Despierto</Text>
          </View>
        </View>

        <View style={styles.svgContainer}>
          <Svg
            width={CHART_WIDTH + PADDING * 2}
            height={CHART_HEIGHT}
            viewBox={`0 0 ${CHART_WIDTH + PADDING * 2} ${CHART_HEIGHT}`}
          >
            {/* Background */}
            <Rect
              x={PADDING}
              y={PADDING}
              width={CHART_WIDTH}
              height={CHART_HEIGHT - PADDING * 2}
              fill="rgba(255, 255, 255, 0.03)"
              rx={4}
            />

            {/* Líneas de referencia (horas) */}
            {Array.from({ length: Math.ceil(totalHours) + 1 }).map((_, idx) => {
              const x = PADDING + (idx / totalHours) * CHART_WIDTH;
              return (
                <Line
                  key={`grid-${idx}`}
                  x1={x}
                  y1={PADDING}
                  x2={x}
                  y2={CHART_HEIGHT - PADDING}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Línea central (divisor sueño/despierto) */}
            <Line
              x1={PADDING}
              y1={PADDING + (CHART_HEIGHT - PADDING * 2) / 2}
              x2={CHART_WIDTH + PADDING}
              y2={PADDING + (CHART_HEIGHT - PADDING * 2) / 2}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
              strokeDasharray="4,4"
            />

            {/* Línea principal del sueño */}
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke="#4CAF50"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Puntos en la línea */}
            {points.map((point, idx) => {
              const x = getXCoordinate(point.time);
              const y = getYCoordinate(point.value);
              let color = '#4CAF50'; // default

              if (point.type === 'pickup') {
                color = '#FF6B6B'; // rojo para pickups
              } else if (point.type === 'end') {
                color = '#FFB74D'; // amarillo para fin
              }

              return (
                <Circle
                  key={`point-${idx}`}
                  cx={x}
                  cy={y}
                  r={5}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            })}
          </Svg>
        </View>

        {/* Time labels */}
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>{start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.timeLabel}>Tiempo</Text>
          <Text style={styles.timeLabel}>{end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        {/* Leyenda */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendLabel}>Durmiendo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendLabel}>Pickup</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFB74D' }]} />
            <Text style={styles.legendLabel}>Fin</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duración Total:</Text>
            <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pickups:</Text>
            <Text style={styles.statValue}>{pickups}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
