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

const { width } = Dimensions.get('window');

export default function SleepHeatmap({ data, onDayPress }) {
  const { theme } = useTheme();
  const CELL_SIZE = (width - 48) / 7; // 7 días por semana

  // Crear un mapa de fechas a scores
  const scoreMap = useMemo(() => {
    const map = {};
    data.forEach(session => {
      const dateKey = new Date(session.date).toISOString().split('T')[0];
      map[dateKey] = session;
    });
    return map;
  }, [data]);

  // Generar grid de 30 días
  const generateCalendarDays = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    
    const days = [];
    const current = new Date(thirtyDaysAgo);

    while (current <= today) {
      const dateKey = current.toISOString().split('T')[0];
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

  const days = generateCalendarDays();

  // Dividir en semanas
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getScoreColor = (score) => {
    if (score === null) return theme.SECONDARY_COLOR;
    if (score >= 80) return '#4CAF50'; // Verde
    if (score >= 60) return '#FFB74D'; // Amarillo/Naranja
    return '#FF6B6B'; // Rojo
  };

  const getTextColor = (score) => {
    if (score === null) return theme.TEXT_COLOR + '99';
    return '#FFFFFF';
  };

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

  const dayOfWeekLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <View style={styles.container}>
      {/* Header con días de la semana */}
      <View style={styles.weekContainer}>
        {dayOfWeekLabels.map((label, idx) => (
          <View
            key={`label-${idx}`}
            style={[
              styles.emptyCell,
              {
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}
          >
            <Text
              style={[
                styles.dayText,
                { color: theme.TEXT_COLOR }
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendario de 30 días */}
      {weeks.map((week, weekIdx) => (
        <View key={`week-${weekIdx}`} style={styles.weekContainer}>
          {week.map((day, dayIdx) => (
            <TouchableOpacity
              key={`day-${day.dateKey}`}
              onPress={() => day.data && onDayPress(day.data)}
              disabled={!day.data}
              style={[
                styles.dayCell,
                {
                  backgroundColor: getScoreColor(day.score),
                  opacity: day.data ? 1 : 0.3,
                }
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: getTextColor(day.score) }
                ]}
              >
                {day.date.getDate()}
              </Text>
              {day.score !== null && (
                <Text
                  style={[
                    styles.scoreText,
                    { color: getTextColor(day.score) }
                  ]}
                >
                  {day.score}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {/* Llenar espacios vacíos si es necesario */}
          {week.length < 7 && (
            <>
              {Array.from({ length: 7 - week.length }).map((_, idx) => (
                <View
                  key={`empty-${idx}`}
                  style={styles.emptyCell}
                />
              ))}
            </>
          )}
        </View>
      ))}

      {/* Leyenda */}
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
