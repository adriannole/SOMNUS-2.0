import React, { useState, useEffect, useMemo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Recargar datos cuando la pantalla gana foco (detecta cuando se borran datos)
  useFocusEffect(
    React.useCallback(() => {
      loadSleepData();
    }, [])
  );

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
      } else {
        setSleepData([]);
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

  // Filtrar datos por mes seleccionado
  const filteredData = useMemo(() => {
    return sleepData.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getMonth() === selectedMonth && 
             sessionDate.getFullYear() === selectedYear;
    });
  }, [sleepData, selectedMonth, selectedYear]);

  const getMonthName = (monthIndex) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // No permitir ir al futuro
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return;
    }
    
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  };

  // Calcular estadísticas del mes seleccionado
  const avgScore = filteredData.length > 0
    ? Math.round(filteredData.reduce((sum, s) => sum + s.score, 0) / filteredData.length)
    : 0;

  const avgHours = filteredData.length > 0
    ? (filteredData.reduce((sum, s) => sum + s.hoursSlept, 0) / filteredData.length).toFixed(1)
    : 0;

  const excellentDays = filteredData.filter(s => s.score >= 80).length;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Verde
    if (score >= 60) return '#FFB74D'; // Amarillo/Naranja
    return '#FF6B6B'; // Rojo
  };

  // Calcular horas de pickups para mostrar en texto
  const pickupTimes = useMemo(() => {
    if (!selectedDay || !selectedDay.startTime || !selectedDay.endTime || !selectedDay.nighttimePickups) {
      return [];
    }
    const start = new Date(selectedDay.startTime);
    const end = new Date(selectedDay.endTime);
    const totalHours = (end - start) / (1000 * 60 * 60);
    if (totalHours <= 0 || selectedDay.nighttimePickups <= 0) return [];
    const interval = totalHours / (selectedDay.nighttimePickups + 1);
    const results = [];
    for (let i = 1; i <= selectedDay.nighttimePickups; i++) {
      const t = new Date(start.getTime() + interval * i * 60 * 60 * 1000);
      results.push(t.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }
    return results;
  }, [selectedDay]);

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
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 20,
      gap: 12,
    },
    monthButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.SECONDARY_COLOR,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    monthButtonDisabled: {
      opacity: 0.3,
    },
    monthText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
      flex: 1,
      textAlign: 'center',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.TEXT_COLOR + '99',
      textAlign: 'center',
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Estadísticas</Text>
        
        {/* Selector de mes */}
        <View style={styles.monthSelector}>
          <TouchableOpacity 
            style={styles.monthButton}
            onPress={handlePreviousMonth}
          >
            <Text style={{ color: theme.TEXT_COLOR, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
          
          <TouchableOpacity 
            style={[styles.monthButton, isCurrentMonth() && styles.monthButtonDisabled]}
            onPress={handleNextMonth}
            disabled={isCurrentMonth()}
          >
            <Text style={{ color: theme.TEXT_COLOR, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Heatmap */}
        {filteredData.length > 0 ? (
          <View style={styles.heatmapSection}>
            <Text style={styles.sectionTitle}>Night Score</Text>
            <SleepHeatmap 
              data={filteredData} 
              onDayPress={handleDayPress}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay datos de sueño para {getMonthName(selectedMonth)} {selectedYear}
            </Text>
          </View>
        )}

        {/* Stats Summary */}
        {filteredData.length > 0 && (
          <>
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
          </>
        )}

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

                  {/* Pickup times list */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginBottom: 8 }]}>Pickups</Text>
                    {pickupTimes.length === 0 ? (
                      <Text style={styles.detailStatLabel}>Sin pickups registrados.</Text>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {pickupTimes.map((t, idx) => (
                          <View
                            key={`pickup-${idx}`}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: theme.SECONDARY_COLOR,
                              borderWidth: 1,
                              borderColor: theme.BORDER_COLOR,
                            }}
                          >
                            <Text style={{ color: theme.TEXT_COLOR }}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

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
