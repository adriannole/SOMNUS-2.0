import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SleepTracker {
  constructor() {
    this.isTracking = false;
    this.subscription = null;
    this.movements = [];
    this.pickups = 0;
    this.sessionStart = null;
    this.timeAwake = 0;
    this.lastMovementTime = null;
    this.isCurrentlyMoving = false;
    this.movementStartTime = null;
    this.movementDuration = 0;
    this.lastMagnitude = 9.81;
    this.magnitudeHistory = [];
    this.SENSITIVITY = 0.25;        // Threshold para detectar pickups
    this.CHANGE_THRESHOLD = 0.15;   // Threshold para cambios abruptos
    this.HISTORY_SIZE = 5;
    
    // Auto-tracking por inactividad con validación de sueño real
    this.isAutoTrackingMonitoring = false;
    this.isAutoTracking = false;
    this.idleSubscription = null;
    this.inactivityTimer = null;
    this.confirmationTimer = null;
    this.lastMovementForIdle = new Date();
    this.autoTrackingStartTime = null;
    this.INACTIVITY_THRESHOLD_BEDTIME = 600;  // 10 minutos (21:00 - 08:00) para activar
    this.INACTIVITY_THRESHOLD_NORMAL = 3600;  // 1 hora (resto del día) para activar
    this.SLEEP_CONFIRMATION_TIME = 3600;      // 1 hora sin interrupciones para confirmar sueño real
    this.AUTO_TRACK_CHECK_INTERVAL = 1000;    // Chequear cada 1 segundo
  }

  async startTracking() {
    console.log('[SleepTracker]  Starting tracking...');
    console.log(`[SleepTracker]  Sensitivity: ${this.SENSITIVITY} | Change Threshold: ${this.CHANGE_THRESHOLD}`);
    this.isTracking = true;
    this.sessionStart = new Date();
    this.movements = [];
    this.pickups = 0;
    this.timeAwake = 0;
    this.lastMovementTime = null;
    this.isCurrentlyMoving = false;
    this.movementStartTime = null;
    this.movementDuration = 0;
    this.lastMagnitude = 1.0;  // Resetear a posición horizontal (donde está el celular)
    this.magnitudeHistory = [];  // Vaciar para llenar con valores reales

    // Configurar intervalo de actualización (cada 500ms para máxima sensibilidad)
    Accelerometer.setUpdateInterval(500);

    let firstReading = true;  // Flag para inicializar historial con primer valor real

    this.subscription = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      
      // En la primera lectura, llenar el historial con ese valor (calibración)
      if (firstReading) {
        this.magnitudeHistory = [magnitude, magnitude, magnitude, magnitude, magnitude];
        this.lastMagnitude = magnitude;
        firstReading = false;
        console.log(`[SleepTracker] 🔧 Initialized with magnitude: ${magnitude.toFixed(2)}`);
        return;  // No procesar la primera lectura
      }
      
      // Agregar a historial para suavizado
      this.magnitudeHistory.push(magnitude);
      if (this.magnitudeHistory.length > this.HISTORY_SIZE) {
        this.magnitudeHistory.shift();
      }
      
      // Calcular promedio móvil para evitar ruidoexcesivo
      const avgMagnitude = this.magnitudeHistory.reduce((a, b) => a + b) / this.magnitudeHistory.length;
      
      // Calcular cambio con respecto a la última magnitud
      const magnitudeChange = Math.abs(magnitude - this.lastMagnitude);
      
      // Calcular desviación del promedio móvil (detecta cambios de magnitud respecto al estado actual)
      const magnitudeDeviation = Math.abs(magnitude - avgMagnitude);

      console.log(
        `[Accelerometer] x:${x.toFixed(2)}, y:${y.toFixed(2)}, z:${z.toFixed(2)} | ` +
        `Magnitude: ${magnitude.toFixed(2)} | Avg: ${avgMagnitude.toFixed(2)} | ` +
        `Change: ${magnitudeChange.toFixed(2)} | Deviation: ${magnitudeDeviation.toFixed(2)}`
      );

      const movement = {
        timestamp: new Date(),
        magnitude,
        avgMagnitude,
        magnitudeChange,
        magnitudeDeviation,
      };

      this.movements.push(movement);

      // Detectar movimiento significativo por:
      // 1. Cambio abrupto en magnitud (agarrar el celular)
      // 2. Desviación del promedio móvil (inclinación del celular)
      const isSignificantMovement = 
        magnitudeChange > this.CHANGE_THRESHOLD ||  // Cambio abrupto
        magnitudeDeviation > this.SENSITIVITY;      // Desviación del promedio móvil

      if (isSignificantMovement) {
        // Si está en auto-tracking pero el usuario cogió el celular = INTERRUMPIR
        if (this.isAutoTracking && this.isTracking) {
          const autoTrackingDuration = (new Date() - this.autoTrackingStartTime) / 1000;
          
          if (autoTrackingDuration < this.SLEEP_CONFIRMATION_TIME) {
            console.log(`[SleepTracker]  AUTO-TRACKING INTERRUPTED! User grabbed phone after ${(autoTrackingDuration / 60).toFixed(1)}min - STOPPING`);
            this.stopTracking();
            return; // No procesar como pickup
          }
        }

        // El usuario SE LEVANTÓ / ESTÁ MOVIENDO el celular (si está confirmado durmiendo)
        if (!this.isCurrentlyMoving) {
          // Transición: de quieto a movimiento
          this.isCurrentlyMoving = true;
          this.movementStartTime = new Date();
          console.log(
            ` [SleepTracker] MOVEMENT STARTED! ` +
            `Magnitude: ${magnitude.toFixed(2)} | Change: ${magnitudeChange.toFixed(2)} | Deviation: ${magnitudeDeviation.toFixed(2)}`
          );
        }

        // Actualizar último tiempo de movimiento detectado
        this.lastMovementTime = new Date();

        // Calcular cuánto tiempo lleva en movimiento
        this.movementDuration = (new Date() - this.movementStartTime) / 1000; // en segundos

        // Si lleva más de 1 minuto (60 segundos) en movimiento = time awake
        if (this.movementDuration > 60) {
          console.log(
            ` [SleepTracker] PICKUP UPGRADED TO TIME AWAKE! Duration: ${(this.movementDuration / 60).toFixed(1)}min`
          );
        }
      } else {
        // El usuario BAJÓ el celular / está quieto
        
        // Si está en movimiento ACTUALMENTE y ha pasado > 2 segundos sin detectar movimiento
        if (this.isCurrentlyMoving && this.lastMovementTime) {
          const timeSinceLastMovement = (new Date() - this.lastMovementTime) / 1000; // en segundos
          
          if (timeSinceLastMovement > 2) {
            // Transición: de movimiento a quieto (después de 2 segundos sin movimiento)
            this.isCurrentlyMoving = false;

            // Calcular duración total del movimiento
            const totalMovementDuration = (new Date() - this.movementStartTime) / 1000; // segundos
            const durationMinutes = totalMovementDuration / 60;

            if (totalMovementDuration <= 60) {
              // Menos de 1 minuto = PICKUP
              this.pickups++;
              console.log(
                ` [SleepTracker] PHONE PICKUP #${this.pickups} DETECTED! Duration: ${durationMinutes.toFixed(1)}min | Last magnitude: ${magnitude.toFixed(2)}`
              );
            } else {
              // Más de 1 minuto = TIME AWAKE
              const timeAwakeDuration = totalMovementDuration / (60 * 60); // Convertir a horas
              this.timeAwake += timeAwakeDuration;
              console.log(
                ` [SleepTracker] TIME AWAKE PERIOD ENDED! Duration: ${(totalMovementDuration / 60).toFixed(1)}min | Total awake: ${this.timeAwake.toFixed(3)}h`
              );
            }

            this.movementStartTime = null;
            this.movementDuration = 0;
          }
        }
      }

      this.lastMagnitude = magnitude;
    });

    // Guardar estado de tracking
    await AsyncStorage.setItem('sleep_tracking_active', 'true');
    await AsyncStorage.setItem('sleep_session_start', this.sessionStart.toISOString());
    console.log('[SleepTracker]  Tracking state saved to storage');
  }

  async stopTracking() {
    console.log('[SleepTracker]  Stopping tracking...');
    this.isTracking = false;

    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      console.log('[SleepTracker]  Subscription removed');
    }

    // Validar si fue auto-tracking y si alcanzó el tiempo de confirmación
    if (this.isAutoTracking && this.autoTrackingStartTime) {
      const autoTrackingDuration = (new Date() - this.autoTrackingStartTime) / 1000;
      
      if (autoTrackingDuration < this.SLEEP_CONFIRMATION_TIME) {
        // Falso positivo: usuario cogió celular antes de 1 hora
        console.log(`[SleepTracker]  AUTO-TRACKING DISCARDED! Duration too short: ${(autoTrackingDuration / 60).toFixed(1)}min (need ${this.SLEEP_CONFIRMATION_TIME / 60}min)`);
        console.log('[SleepTracker]  False positive detected - not saving session');
        
        // Limpiar y reiniciar monitoreo
        this.movements = [];
        this.pickups = 0;
        this.timeAwake = 0;
        this.isAutoTracking = false;
        this.autoTrackingStartTime = null;
        
        // Reiniciar monitoring
        await this.startInactivityMonitoring();
        
        return { 
          score: null, 
          discarded: true, 
          reason: 'Auto-tracking duration too short (false positive)' 
        };
      } else {
        // Sueño confirmado: alcanzó 1 hora
        console.log(`[SleepTracker]  SLEEP CONFIRMED! Duration: ${(autoTrackingDuration / 3600).toFixed(2)}h - SAVING SESSION`);
        this.isAutoTracking = false;
        this.autoTrackingStartTime = null;
      }
    }

    const result = this.calculateScore();
    
    // Asegurar que result siempre es un objeto válido
    if (!result) {
      console.log('[SleepTracker]  ❌ No session data available');
      return {
        score: 0,
        hoursSlept: 0,
        timeAwake: 0,
        nighttimePickups: 0,
        movements: 0,
        quality: 'poor',
        startTime: null,
        endTime: new Date(),
      };
    }
    
    console.log('[SleepTracker]  Session Summary:', {
      score: result.score,
      hoursSlept: result.hoursSlept,
      timeAwake: result.timeAwake,
      pickups: result.nighttimePickups,
      totalMovements: result.movements,
      quality: result.quality,
    });

    // Limpiar estado de tracking
    await AsyncStorage.removeItem('sleep_tracking_active');
    await AsyncStorage.removeItem('sleep_session_start');
    console.log('[SleepTracker]  Tracking state cleared from storage');

    return result;
  }

  calculateScore() {
    if (!this.sessionStart) {
      console.log('[SleepTracker]  No session start time found');
      return null;
    }

    const sessionEnd = new Date();
    const sessionDuration = (sessionEnd - this.sessionStart) / (1000 * 60 * 60); // en horas

    console.log(`[SleepTracker]  Calculating score for session: ${sessionDuration.toFixed(2)}h`);

    // Calcular score base de 100
    let score = 100;

    // Penalizar por duración insuficiente - escala equilibrada
    // Ideal: 7-9 horas. Pero permitir scores razonables incluso para duraciones cortas
    if (sessionDuration < 4) {
      // Menos de 4 horas: penalización SUAVE (para pruebas)
      const penalty = (4 - sessionDuration) * 2;
      score -= penalty;
      console.log(`   Duration penalty: -${penalty.toFixed(1)} (only ${sessionDuration.toFixed(2)}h)`);
    } else if (sessionDuration < 7) {
      // 4-7 horas: penalización moderada
      const penalty = (7 - sessionDuration) * 3;
      score -= penalty;
      console.log(`   Duration penalty: -${penalty.toFixed(1)} (${sessionDuration.toFixed(2)}h)`);
    } else if (sessionDuration > 9) {
      // Más de 9 horas: penalización leve
      const penalty = (sessionDuration - 9) * 2;
      score -= penalty;
      console.log(`   Oversleep penalty: -${penalty.toFixed(1)} (${sessionDuration.toFixed(2)}h)`);
    } else {
      // 7-9 horas: sin penalización (ideal)
      console.log(`   Duration: perfect (${sessionDuration.toFixed(2)}h)`);
    }

    // Penalizar por pickups (cada uno resta 6 puntos - equilibrado)
    const pickupPenalty = this.pickups * 6;
    score -= pickupPenalty;
    console.log(`   Pickup penalty: -${pickupPenalty} (${this.pickups} pickups)`);

    // Penalizar por tiempo despierto (suave)
    const awakePenalty = this.timeAwake * 4;
    score -= awakePenalty;
    console.log(`   Awake time penalty: -${awakePenalty.toFixed(1)} (${this.timeAwake.toFixed(2)}h awake)`);

    // Penalizar por movimientos excesivos (muy suave o removida)
    // Comentado: el acelerómetro siempre detecta algo, no penalizar duro por eso
    // if (this.movements.length > 0) {
    //   const avgMovement = this.movements.reduce((sum, m) => sum + m.magnitude, 0) / this.movements.length;
    //   if (avgMovement > 1.5) {
    //     score -= 5;
    //     console.log(`   Movement penalty: -5 (avg: ${avgMovement.toFixed(2)})`);
    //   }
    // }

    // Permitir scores negativos para mostrar exceso de penalizaciones
    const finalScore = Math.min(100, Math.round(score));
    console.log(`   Final score: ${finalScore}`);

    return {
      score: finalScore, // Mostrar score real, incluso si es negativo
      hoursSlept: Math.round(sessionDuration * 10) / 10,
      timeAwake: Math.round(this.timeAwake * 10) / 10,
      nighttimePickups: this.pickups,
      movements: this.movements.length,
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor',
      startTime: this.sessionStart,
      endTime: sessionEnd,
    };
  }

  async saveSleepSession(data) {
    try {
      const sessions = await this.getSleepHistory();
      sessions.push({
        date: new Date().toISOString(),
        ...data,
      });

      await AsyncStorage.setItem('sleep_sessions', JSON.stringify(sessions));
      console.log('[SleepTracker]  Session saved successfully');
    } catch (error) {
      console.error('[SleepTracker]  Error saving session:', error);
    }
  }

  async getSleepHistory() {
    try {
      const data = await AsyncStorage.getItem('sleep_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SleepTracker]  Error getting history:', error);
      return [];
    }
  }

  async getLatestSession() {
    try {
      const history = await this.getSleepHistory();
      return history.length > 0 ? history[history.length - 1] : null;
    } catch (error) {
      console.error('[SleepTracker]  Error getting latest session:', error);
      return null;
    }
  }

  async getWeekData() {
    try {
      const history = await this.getSleepHistory();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weekSessions = history.filter(session => new Date(session.date) >= weekAgo);

      // Crear array de últimos 7 días
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];

        // Buscar sesión para este día
        const session = weekSessions.find(s => {
          const sessionDate = new Date(s.date);
          return sessionDate.toDateString() === date.toDateString();
        });

        result.push({
          day: dayName,
          score: session ? session.score : 0,
          hours: session ? session.hoursSlept : 0,
        });
      }

      return result;
    } catch (error) {
      console.error('[SleepTracker]  Error getting week data:', error);
      return [];
    }
  }

  async isCurrentlyTracking() {
    try {
      const active = await AsyncStorage.getItem('sleep_tracking_active');
      return active === 'true';
    } catch {
      return false;
    }
  }

  async clearAllData() {
    try {
      await AsyncStorage.removeItem('sleep_sessions');
      await AsyncStorage.removeItem('sleep_tracking_active');
      await AsyncStorage.removeItem('sleep_session_start');
      console.log('[SleepTracker]  All data cleared');
    } catch (error) {
      console.error('[SleepTracker]  Error clearing data:', error);
    }
  }

  // ==================== AUTO-TRACKING POR INACTIVIDAD ====================
  // Monitorea inactividad del celular y activa tracking automáticamente
  // Lógica inteligente con confirmación de sueño real (1 hora sin interrupciones)
  
  getInactivityThreshold() {
    const hour = new Date().getHours();
    // Si está entre las 21:00 (21) y 08:00 (8) = hora de dormir
    const isBedtime = hour >= 21 || hour < 8;
    const threshold = isBedtime ? this.INACTIVITY_THRESHOLD_BEDTIME : this.INACTIVITY_THRESHOLD_NORMAL;
    const thresholdLabel = isBedtime ? '10min (BEDTIME)' : '1h (NORMAL)';
    return { threshold, thresholdLabel, isBedtime };
  }

  async startInactivityMonitoring() {
    if (this.isAutoTrackingMonitoring) {
      console.log('[SleepTracker]  Inactivity monitoring already running');
      return;
    }

    const { threshold, thresholdLabel, isBedtime } = this.getInactivityThreshold();
    console.log(`[SleepTracker]  Starting inactivity monitoring... (${thresholdLabel})`);
    this.isAutoTrackingMonitoring = true;
    this.lastMovementForIdle = new Date();

    // Monitorear acelerómetro para detectar movimiento
    Accelerometer.setUpdateInterval(500);
    this.idleSubscription = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      
      // Si hay movimiento significativo, resetear inactividad
      if (Math.abs(magnitude - 1.0) > this.SENSITIVITY) {
        this.lastMovementForIdle = new Date();
      }
    });

    // Timer que chequea inactividad cada segundo
    this.inactivityTimer = setInterval(() => {
      if (!this.isTracking) {
        const { threshold, thresholdLabel } = this.getInactivityThreshold();
        const timeSinceLastMovement = (new Date() - this.lastMovementForIdle) / 1000;
        
        if (timeSinceLastMovement >= threshold) {
          console.log(`[SleepTracker]  AUTO-TRACKING ACTIVATED! Inactivity: ${timeSinceLastMovement.toFixed(0)}s (${thresholdLabel})`);
          console.log(`[SleepTracker]  Waiting ${this.SLEEP_CONFIRMATION_TIME / 60}min for sleep confirmation (without interruptions)...`);
          
          // Marcar como auto-tracking y guardar timestamp
          this.isAutoTracking = true;
          this.autoTrackingStartTime = new Date();
          
          this.stopInactivityMonitoring();
          this.startTracking();
        }
      }
    }, this.AUTO_TRACK_CHECK_INTERVAL);
  }

  stopInactivityMonitoring() {
    console.log('[SleepTracker]  Stopping inactivity monitoring');
    this.isAutoTrackingMonitoring = false;

    if (this.idleSubscription) {
      this.idleSubscription.remove();
      this.idleSubscription = null;
    }

    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}

export default new SleepTracker();
