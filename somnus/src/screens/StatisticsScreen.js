import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import SleepHeatmap from '../components/SleepHeatmap';
import SleepTimelineChart from '../components/SleepTimelineChart';
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const { theme, isDark } = useTheme();
  const [sleepData, setSleepData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSleepData();
  }, []);

  const loadSleepData = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('sleep_sessions');
      if (data) {
        const sessions = JSON.parse(data);
        setSleepData(sessions);
        console.log('[Stats] Loaded', sessions.length, 'sleep sessions');
      }
    } catch (error) {
      console.error('[Stats] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (dayData) => {
    setSelectedDay(dayData);
    setShowDetailModal(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.BACKGROUND_COLOR,
    },
    content: {
      padding: 16,
      paddingBottom: 120,
    },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.TEXT_COLOR,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 32,
    },
    subtitle: {
      fontSize: 14,
      color: theme.TEXT_COLOR + '99',
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    heatmapSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 24,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.ACCENT_COLOR,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.TEXT_COLOR + '99',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.BACKGROUND_COLOR,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      maxHeight: Dimensions.get('window').height * 0.85,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.BORDER_COLOR,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.TEXT_COLOR,
    },
    closeButton: {
      fontSize: 28,
      color: theme.TEXT_COLOR + '99',
      fontWeight: 'bold',
    },
    detailContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    detailStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    detailStatBox: {
      flex: 1,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    detailStatValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.ACCENT_COLOR,
      marginBottom: 4,
    },
    detailStatLabel: {
      fontSize: 11,
      color: theme.TEXT_COLOR + '99',
    },
    loadingText: {
      fontSize: 16,
      color: theme.TEXT_COLOR + '99',
      textAlign: 'center',
      marginTop: 20,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Estadísticas</Text>
        <Text style={styles.loadingText}>Cargando datos...</Text>
        <BottomNavBar activeTab="explore" isDark={isDark} />
      </View>
    );
  }

  // Calcular estadísticas generales
  const avgScore = sleepData.length > 0
    ? Math.round(sleepData.reduce((sum, s) => sum + s.score, 0) / sleepData.length)
    : 0;

  const avgHours = sleepData.length > 0
    ? (sleepData.reduce((sum, s) => sum + s.hoursSlept, 0) / sleepData.length).toFixed(1)
    : 0;

  const excellentDays = sleepData.filter(s => s.score >= 80).length;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Verde
    if (score >= 60) return '#FFB74D'; // Amarillo/Naranja
    return '#FF6B6B'; // Rojo
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Estadísticas</Text>
        <Text style={styles.subtitle}>Últimos 30 días</Text>

        {/* Heatmap */}
        <View style={styles.heatmapSection}>
          <Text style={styles.sectionTitle}>Night Score</Text>
          <SleepHeatmap 
            data={sleepData} 
            onDayPress={handleDayPress}
          />
        </View>

        {/* Stats Summary */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: getScoreColor(avgScore) }]}>
              {avgScore}
            </Text>
            <Text style={styles.statLabel}>Score Promedio</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgHours}h</Text>
            <Text style={styles.statLabel}>Horas Promedio</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {excellentDays}
            </Text>
            <Text style={styles.statLabel}>Noches Excelentes</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="explore" isDark={isDark} />

      {/* Modal de Detalle */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay ? new Date(selectedDay.date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }) : 'Detalles'}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              {selectedDay && (
                <>
                  {/* Stats del día */}
                  <View style={styles.detailStats}>
                    <View style={styles.detailStatBox}>
                      <Text style={[styles.detailStatValue, { color: getScoreColor(selectedDay.score) }]}>
                        {selectedDay.score}
                      </Text>
                      <Text style={styles.detailStatLabel}>Night Score</Text>
                    </View>

                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatValue}>
                        {selectedDay.hoursSlept}h
                      </Text>
                      <Text style={styles.detailStatLabel}>Duración</Text>
                    </View>

                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatValue}>
                        {selectedDay.nighttimePickups}
                      </Text>
                      <Text style={styles.detailStatLabel}>Pickups</Text>
                    </View>
                  </View>

                  {/* Timeline Chart */}
                  <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>
                    Timeline de Sueño
                  </Text>
                  <SleepTimelineChart 
                    startTime={selectedDay.startTime}
                    endTime={selectedDay.endTime}
                    pickups={selectedDay.nighttimePickups}
                    hoursSlept={selectedDay.hoursSlept}
                  />

                  {/* Additional details */}
                  <View style={[styles.detailStats, { marginTop: 20 }]}>
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatValue}>
                        {selectedDay.timeAwake}h
                      </Text>
                      <Text style={styles.detailStatLabel}>Tiempo Despierto</Text>
                    </View>

                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatValue}>
                        {selectedDay.movements}
                      </Text>
                      <Text style={styles.detailStatLabel}>Movimientos</Text>
                    </View>

                    <View style={styles.detailStatBox}>
                      <Text style={[
                        styles.detailStatValue,
                        {
                          color: selectedDay.quality === 'excellent' ? '#4CAF50' :
                                selectedDay.quality === 'good' ? '#FFC107' : '#FF5252',
                          fontSize: 14,
                        }
                      ]}>
                        {selectedDay.quality}
                      </Text>
                      <Text style={styles.detailStatLabel}>Calidad</Text>
                    </View>
                  </View>

                  <View style={{ height: 30 }} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
