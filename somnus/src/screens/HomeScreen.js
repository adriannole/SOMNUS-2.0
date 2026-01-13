import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import sleepTracker from '../services/sleepTracker';
import {
  MoonIcon,
  EyeIcon,
  PhoneIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  HomeIconNav,
  ChartIcon,
  SettingsIcon,
  MenuIcon,
  SunIcon,
  MoonIconDark,
} from '../components/Icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createStyles(theme, isDark);

  const [sleepData, setSleepData] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trackingMode, setTrackingMode] = useState('auto'); // 'auto' o 'manual'

  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSleepData();
    checkTrackingStatus();
    
    // Iniciar monitoreo de inactividad SOLO si está en modo auto
    if (trackingMode === 'auto') {
      console.log('[HomeScreen]  Initializing auto-tracking monitor...');
      sleepTracker.startInactivityMonitoring();
    } else {
      // Si cambió a manual, detener auto-tracking
      sleepTracker.stopInactivityMonitoring();
    }
    
    // Limpiar cuando desmonte
    return () => {
      sleepTracker.stopInactivityMonitoring();
    };
  }, [trackingMode]);

  useEffect(() => {
    if (sleepData) {
      Animated.timing(scoreAnim, {
        toValue: sleepData.score,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [sleepData]);

  const loadSleepData = async () => {
    setLoading(true);
    try {
      console.log('[HomeScreen]  Loading sleep data...');
      const latest = await sleepTracker.getLatestSession();
      const weekData = await sleepTracker.getWeekData();

      console.log('[HomeScreen]  Latest session:', latest);
      console.log('[HomeScreen]  Week data:', weekData);

      if (latest) {
        setSleepData({
          score: latest.score || 0,
          hoursSlept: latest.hoursSlept || 0,
          timeAwake: latest.timeAwake || 0,
          nighttimePickups: latest.nighttimePickups || 0,
          weekData: weekData.length > 0 ? weekData : generateDefaultWeekData(),
        });
      } else {
        console.log('[HomeScreen]  No previous sessions found, showing empty data');
        // Datos de demo si no hay sesiones
        setSleepData({
          score: 0,
          hoursSlept: 0,
          timeAwake: 0,
          nighttimePickups: 0,
          weekData: generateDefaultWeekData(),
        });
      }
    } catch (error) {
      console.error('[HomeScreen]  Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTrackingStatus = async () => {
    const tracking = await sleepTracker.isCurrentlyTracking();
    setIsTracking(tracking);
  };

  const generateDefaultWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => ({ day, score: 0, hours: 0 }));
  };

  const handleStartTracking = async () => {
    try {
      console.log('[HomeScreen]  User pressed START TRACKING (manual mode)');
      await sleepTracker.startTracking();
      setIsTracking(true);
      console.log('[HomeScreen]  Tracking started successfully');
      Alert.alert(
        'Tracking iniciado',
        'El seguimiento de sueño está activo. Deja tu celular cerca y descansa.',
        [{ text: 'Ok' }]
      );
    } catch (error) {
      console.error('[HomeScreen]  Error starting tracking:', error);
      Alert.alert('Error', 'No se pudo iniciar el tracking: ' + error.message);
    }
  };

  const handleStopTracking = async () => {
    try {
      console.log('[HomeScreen]  User pressed STOP TRACKING');
      const result = await sleepTracker.stopTracking();
      await sleepTracker.saveSleepSession(result);
      setIsTracking(false);
      
      console.log('[HomeScreen]  Tracking stopped. Results:', result);
      
      Alert.alert(
        '¡Sesión completada!',
        `Tu Night Score: ${result.score}\nHoras dormidas: ${result.hoursSlept}h\nCalidad: ${result.quality}`,
        [
          {
            text: 'Ver detalles',
            onPress: () => loadSleepData(),
          },
        ]
      );
      
      loadSleepData();
    } catch (error) {
      console.error('[HomeScreen]  Error stopping tracking:', error);
      Alert.alert('Error', 'No se pudo detener el tracking: ' + error.message);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80'; // Verde - buen sueño
    if (score >= 60) return '#fbbf24'; // Amarillo - despertares
    return '#f87171'; // Rojo - mal sueño
  };

  const getScoreSegments = (score) => {
    const segments = [];
    if (score >= 80) {
      segments.push({ color: '#4ade80', percentage: (score - 80) / 20 });
      segments.push({ color: '#fbbf24', percentage: 0.6 });
      segments.push({ color: '#f87171', percentage: 0.4 });
    } else if (score >= 60) {
      segments.push({ color: '#4ade80', percentage: 0 });
      segments.push({ color: '#fbbf24', percentage: (score - 60) / 20 });
      segments.push({ color: '#f87171', percentage: 0.6 });
    } else {
      segments.push({ color: '#4ade80', percentage: 0 });
      segments.push({ color: '#fbbf24', percentage: 0 });
      segments.push({ color: '#f87171', percentage: score / 60 });
    }
    return segments;
  };

  const renderCircularScore = () => {
    const score = sleepData.score;
    const radius = 100;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;
    const greenEnd = 80; // 0-80 es verde
    const yellowEnd = 60; // 60-80 es amarillo
    const redStart = 0; // 0-60 es rojo

    return (
      <View style={styles.scoreCircleContainer}>
        {/* Fondo del círculo */}
        <View style={[styles.scoreCircle, { borderColor: theme.SECONDARY_COLOR }]} />
        
        {/* Segmento Verde (80-100) */}
        {score >= 80 && (
          <View style={[styles.scoreSegment, { 
            borderTopColor: '#4ade80',
            transform: [{ rotate: '144deg' }] 
          }]} />
        )}
        
        {/* Segmento Amarillo (60-80) */}
        {score >= 60 && (
          <View style={[styles.scoreSegment, { 
            borderTopColor: '#fbbf24',
            transform: [{ rotate: '72deg' }] 
          }]} />
        )}
        
        {/* Segmento Rojo (0-60) */}
        {score > 0 && (
          <View style={[styles.scoreSegment, { 
            borderTopColor: '#f87171',
            transform: [{ rotate: '0deg' }] 
          }]} />
        )}

        {/* Centro con el número */}
        <View style={styles.scoreInner}>
          <Animated.Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>
            {scoreAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0', '100'],
              extrapolate: 'clamp',
            })}
          </Animated.Text>
          <Text style={styles.scoreLabel}>Night Score</Text>
        </View>
      </View>
    );
  };

  const renderWeekChart = () => {
    if (!sleepData || !sleepData.weekData) return null;
    
    const maxHours = 10;
    return (
      <View style={styles.weekChartContainer}>
        {sleepData.weekData.map((day, index) => {
          const heightPercentage = (day.hours / maxHours) * 100;
          const barColor = getScoreColor(day.score);
          
          return (
            <View key={index} style={styles.dayColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPercentage}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day.day}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.ACCENT_COLOR} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </>
    );
  }

  if (!sleepData) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No hay datos disponibles</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        {/* Header con título y botón de recomendaciones */}
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
          <View style={styles.headerRightSection}>
            <TouchableOpacity style={styles.recommendationsButton}>
              <MenuIcon size={16} color={theme.TEXT_COLOR} />
              <Text style={styles.recommendationsText}>Recommendations</Text>
            </TouchableOpacity>
            
            {/* Toggle Modo Oscuro/Claro */}
            <TouchableOpacity 
              style={styles.themeToggle}
              onPress={toggleTheme}
            >
              {isDark ? (
                <SunIcon size={18} color={theme.TEXT_COLOR} />
              ) : (
                <MoonIconDark size={18} color={theme.TEXT_COLOR} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Score circular */}
        <View style={styles.scoreSection}>
          {renderCircularScore()}
        </View>

        {/* Métricas de sueño */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <View style={styles.metricIcon}>
              <MoonIcon size={20} color={theme.TEXT_COLOR} />
            </View>
            <Text style={styles.metricLabel}>Hours of sleep</Text>
            <Text style={[styles.metricValue, { color: '#4ade80' }]}>
              {sleepData.hoursSlept}h
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricIcon}>
              <EyeIcon size={20} color={theme.TEXT_COLOR} />
            </View>
            <Text style={styles.metricLabel}>Time awake</Text>
            <Text style={[styles.metricValue, { color: '#fbbf24' }]}>
              {sleepData.timeAwake}h
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricIcon}>
              <PhoneIcon size={20} color={theme.TEXT_COLOR} />
            </View>
            <Text style={styles.metricLabel}>Nighttime pickups</Text>
            <Text style={[styles.metricValue, { color: '#f87171' }]}>
              {sleepData.nighttimePickups}
            </Text>
          </View>
        </View>

        {/* Selector de Modo de Tracking (Auto vs Manual) */}
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, trackingMode === 'auto' && styles.modeButtonActive]}
            onPress={() => setTrackingMode('auto')}
          >
            <Text style={[styles.modeButtonText, trackingMode === 'auto' && styles.modeButtonTextActive]}>
              Automático
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, trackingMode === 'manual' && styles.modeButtonActive]}
            onPress={() => setTrackingMode('manual')}
          >
            <Text style={[styles.modeButtonText, trackingMode === 'manual' && styles.modeButtonTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Control según el modo */}
        {trackingMode === 'auto' ? (
          // Modo Auto-Tracking - Solo indicador
          isTracking ? (
            <View style={styles.autoTrackingIndicator}>
              <View style={styles.pulsingDot} />
              <Text style={styles.autoTrackingText}>Tracking Activo</Text>
            </View>
          ) : (
            <View style={styles.autoTrackingIndicator}>
              <View style={[styles.pulsingDot, { backgroundColor: '#9ca3af' }]} />
              <Text style={styles.autoTrackingText}>Esperando inicio automático...</Text>
            </View>
          )
        ) : (
          // Modo Manual - Botón Play/Stop profesional
          <TouchableOpacity 
            style={[styles.playButton, isTracking && styles.playButtonActive]} 
            onPress={isTracking ? handleStopTracking : handleStartTracking}
          >
            <Text style={styles.playButtonText}>
              {isTracking ? 'DETENER' : 'INICIAR'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Indicador / Control según el modo */}
        <View style={styles.weekSection}>
          {renderWeekChart()}
        </View>

        {/* Espaciado para la barra de navegación */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Barra de navegación inferior */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton}>
          <ChartIcon size={24} color={theme.TEXT_COLOR + '99'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <HomeIconNav size={26} color={isDark ? '#0b1220' : '#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton}>
          <SettingsIcon size={24} color={theme.TEXT_COLOR + '99'} />
        </TouchableOpacity>
      </View>
    </>
  );
}

function createStyles(theme, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
    },
    headerRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.TEXT_COLOR,
    },
    recommendationsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    recommendationsText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.SECONDARY_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },

    // Score circular
    scoreSection: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    scoreCircleContainer: {
      width: 240,
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    scoreCircle: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      borderWidth: 16,
      borderColor: theme.SECONDARY_COLOR,
    },
    scoreSegment: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      borderWidth: 16,
      borderColor: 'transparent',
      borderTopWidth: 16,
    },
    scoreInner: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: isDark ? '#1a1f26' : '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    scoreNumber: {
      fontSize: 64,
      fontWeight: '900',
      letterSpacing: -2,
    },
    scoreLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.TEXT_COLOR + '99',
      marginTop: 4,
    },

    // Métricas
    metricsContainer: {
      paddingHorizontal: 20,
      gap: 14,
      marginBottom: 24,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.SECONDARY_COLOR,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    metricIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2a3142' : '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    metricLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    metricValue: {
      fontSize: 17,
      fontWeight: '700',
    },

    // Botones
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      paddingVertical: 14,
      paddingHorizontal: 18,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
      marginBottom: 16,
    },
    editButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    playButton: {
      alignSelf: 'center',
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.ACCENT_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: theme.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    playButtonActive: {
      backgroundColor: '#f87171',
      shadowColor: '#f87171',
    },
    trackingText: {
      textAlign: 'center',
      color: theme.ACCENT_COLOR,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 20,
    },

    // Gráfica semanal
    weekSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    weekChartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 160,
      paddingVertical: 16,
      paddingHorizontal: 8,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    dayColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
    },
    barContainer: {
      width: '70%',
      height: '80%',
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    bar: {
      width: '100%',
      borderRadius: 8,
      minHeight: 8,
    },
    dayLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.TEXT_COLOR + '99',
      marginTop: 6,
    },

    // Barra de navegación
    navBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 12,
      paddingBottom: 20,
      backgroundColor: isDark ? '#1a1f26f0' : '#fffffff0',
      borderTopWidth: 1,
      borderTopColor: theme.BORDER_COLOR,
    },
    navButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    navButtonActive: {
      backgroundColor: theme.ACCENT_COLOR,
      shadowColor: theme.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },

    // Loading & Error
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    loadingText: {
      marginTop: 12,
      color: theme.TEXT_COLOR,
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: '#f87171',
      fontSize: 16,
      fontWeight: '600',
    },

    // Mode Selector (Auto vs Manual)
    modeSelector: {
      marginVertical: 12,
      marginHorizontal: 16,
      flexDirection: 'row',
      gap: 10,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: isDark ? '#1a1f26' : '#f3f4f6',
      borderWidth: 1.5,
      borderColor: theme.BORDER_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: theme.ACCENT_COLOR,
      borderColor: theme.ACCENT_COLOR,
    },
    modeButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      letterSpacing: 0.5,
    },
    modeButtonTextActive: {
      color: isDark ? '#0b1220' : '#fff',
    },

    // Play Button (Manual Mode)
    playButton: {
      marginVertical: 16,
      marginHorizontal: 16,
      height: 56,
      borderRadius: 12,
      backgroundColor: theme.ACCENT_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    playButtonActive: {
      backgroundColor: '#ef4444',
    },
    playButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#0b1220' : '#fff',
      letterSpacing: 1,
    },

    // Auto-Tracking Indicator
    autoTrackingIndicator: {
      marginVertical: 16,
      marginHorizontal: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1a1f26' : '#f3f4f6',
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.ACCENT_COLOR + '40',
    },
    pulsingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.ACCENT_COLOR,
      marginRight: 12,
      shadowColor: theme.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
      elevation: 4,
    },
    autoTrackingText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
  });
}
