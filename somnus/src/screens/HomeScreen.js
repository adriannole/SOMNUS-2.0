import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import BottomNavBar from '../components/BottomNavBar';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import sleepTracker from '../services/sleepTracker';
import {
  MoonIcon,
  EyeIcon,
  PhoneIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  MenuIcon,
  SunIcon,
  MoonIconDark,
} from '../components/Icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme, isDark);
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [sleepData, setSleepData] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trackingMode, setTrackingMode] = useState('auto'); // 'auto' o 'manual'

  const scoreAnim = useRef(new Animated.Value(0)).current;

  // Recargar datos cada vez que la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] 🔄 Screen focused, reloading data...');
      loadSleepData();
      checkTrackingStatus();
      return () => {};
    }, [])
  );

  useEffect(() => {
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
      showAlert(
        'Tracking iniciado',
        'El seguimiento de sueño está activo. Deja tu celular cerca y descansa.',
        [{ text: 'Ok' }],
        'success'
      );
    } catch (error) {
      console.error('[HomeScreen]  Error starting tracking:', error);
      showAlert(
        'Error',
        'No se pudo iniciar el tracking: ' + error.message,
        [{ text: 'OK' }],
        'danger'
      );
    }
  };

  const handleStopTracking = async () => {
    try {
      console.log('[HomeScreen]  User pressed STOP TRACKING');
      const result = await sleepTracker.stopTracking();
      await sleepTracker.saveSleepSession(result);
      setIsTracking(false);
      
      console.log('[HomeScreen]  Tracking stopped. Results:', result);
      
      showAlert(
        '¡Sesión completada!',
        `Tu Night Score: ${result.score}\nHoras dormidas: ${result.hoursSlept}h\nCalidad: ${result.quality}`,
        [
          {
            text: 'Ver detalles',
            onPress: () => loadSleepData(),
          },
        ],
        'success'
      );
      
      loadSleepData();
    } catch (error) {
      console.error('[HomeScreen]  Error stopping tracking:', error);
      showAlert(
        'Error',
        'No se pudo detener el tracking: ' + error.message,
        [{ text: 'OK' }],
        'danger'
      );
    }
  };

  const handleClearAllData = async () => {
    showAlert(
      'Limpiar Todos los Datos',
      '¿Estás seguro de que quieres eliminar todas las sesiones de sueño guardadas?\n\nEsta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[HomeScreen] 🗑️ Clearing all data...');
              await sleepTracker.clearAllData();
              
              showAlert(
                'Datos Eliminados',
                'Todos los datos han sido eliminados correctamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => loadSleepData(),
                  },
                ],
                'success'
              );
            } catch (error) {
              console.error('[HomeScreen] ❌ Error clearing data:', error);
              showAlert(
                'Error',
                'No se pudieron eliminar los datos',
                [{ text: 'OK' }],
                'danger'
              );
            }
          },
        },
      ],
      'warning'
    );
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
    const hoursSlept = sleepData.hoursSlept || 0;
    const timeAwake = sleepData.timeAwake || 0;
    const pickups = sleepData.nighttimePickups || 0;
    
    // Si no hay datos (score = 0), no mostrar segmentos
    if (score === 0 || hoursSlept === 0) {
      return (
        <View style={styles.scoreCircleContainer}>
          {/* Fondo del círculo */}
          <View style={[styles.scoreCircle, { borderColor: theme.SECONDARY_COLOR }]} />

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
    }
    
    // Convertir pickups a horas (cada pickup = 1 minuto)
    const pickupHours = pickups / 60;
    
    // Calcular total de tiempo de la noche
    const totalHours = hoursSlept + timeAwake + pickupHours;
    
    // Calcular porcentajes exactos del total
    const sleepPercent = (hoursSlept / totalHours) * 100;
    const awakePercent = (timeAwake / totalHours) * 100;
    const pickupPercent = (pickupHours / totalHours) * 100;
    
    // Configuración del círculo SVG
    const size = 240;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const sleepDegrees = (sleepPercent / 100) * 360;
    const awakeDegrees = (awakePercent / 100) * 360;
    const pickupDegrees = (pickupPercent / 100) * 360;

    // Helper para dibujar un arco usando strokeDasharray
    const renderArc = (color, percent, startAngle) => {
      if (percent <= 0) return null;
      const arcLength = (percent / 100) * circumference;
      return (
        <Circle
          key={`${color}-${percent}-${startAngle}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          fill="transparent"
          rotation={startAngle}
          originX={size / 2}
          originY={size / 2}
        />
      );
    };

    return (
      <View style={styles.scoreCircleContainer}>
        <Svg width={size} height={size} style={styles.scoreSvg}>
          {/* Fondo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.SECONDARY_COLOR}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>

        <Svg width={size} height={size} style={styles.scoreSvg}>
          {renderArc('#4ade80', sleepPercent, -90)}
          {renderArc('#fbbf24', awakePercent, -90 + sleepDegrees)}
          {renderArc('#f87171', Math.max(pickupPercent, pickups > 0 ? 0.5 : 0), -90 + sleepDegrees + awakeDegrees)}
        </Svg>

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Resumen</Text>
            <Text style={styles.subtitle}>Tu sueño de hoy</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.recommendationsPill}
              onPress={() => router.push('/recommendations')}
            >
              <MenuIcon size={14} color={theme.TEXT_COLOR} />
              <Text style={styles.recommendationsText}>Recomendaciones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              {isDark ? (
                <SunIcon size={16} color={theme.TEXT_COLOR} />
              ) : (
                <MoonIconDark size={16} color={theme.TEXT_COLOR} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreTitle}>Night Score</Text>
          {renderCircularScore()}
          <Text style={styles.scoreHint}>Basado en horas dormidas, despertares y pickups.</Text>
        </View>

        {/* Métricas */}
        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricDot, { backgroundColor: '#4ade80' }]} />
              <Text style={styles.metricLabel}>Horas dormidas</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#4ade80' }]}>
              {sleepData.hoursSlept}h
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricDot, { backgroundColor: '#fbbf24' }]} />
              <Text style={styles.metricLabel}>Tiempo despierto</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#fbbf24' }]}>
              {sleepData.timeAwake}h
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricDot, { backgroundColor: '#f87171' }]} />
              <Text style={styles.metricLabel}>Pickups</Text>
            </View>
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

        {/* Semana */}
        <View style={styles.weekSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos 7 días</Text>
            <Text style={styles.sectionSubtitle}>Horas dormidas y calidad</Text>
          </View>
          {renderWeekChart()}
        </View>

        {/* Espaciado para la barra de navegación */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Barra de navegación inferior */}
      <BottomNavBar activeTab="home" isDark={isDark} />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
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
      paddingBottom: 10,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.TEXT_COLOR,
      letterSpacing: -0.5,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '500',
      color: theme.TEXT_COLOR + '99',
    },
    recommendationsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    recommendationsText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.SECONDARY_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },

    // Score circular
    scoreSection: {
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    scoreTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      marginBottom: 10,
    },
    scoreHint: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.TEXT_COLOR + '99',
      marginTop: 8,
    },
    scoreCircleContainer: {
      width: 240,
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    scoreSvg: {
      position: 'absolute',
      top: 0,
      left: 0,
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
      borderWidth: 24, // Más grueso
      borderColor: 'transparent',
      borderTopWidth: 24,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
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
    metricsList: {
      marginTop: 10,
      marginHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: theme.BORDER_COLOR,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.BORDER_COLOR,
    },
    metricLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    metricDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    metricLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    metricValue: {
      fontSize: 16,
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
    trackingText: {
      textAlign: 'center',
      color: theme.ACCENT_COLOR,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 20,
    },

    // Gráfica semanal
    weekSection: {
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 20,
    },
    sectionHeader: {
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
    },
    sectionSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: theme.TEXT_COLOR + '99',
    },
    weekChartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 160,
      paddingVertical: 16,
      paddingHorizontal: 10,
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
