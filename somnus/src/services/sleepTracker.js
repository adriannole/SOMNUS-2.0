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
  }

  async startTracking() {
    console.log('[SleepTracker] Starting tracking...');
    this.isTracking = true;
    this.sessionStart = new Date();
    this.movements = [];
    this.pickups = 0;
    this.timeAwake = 0;
    this.lastMovementTime = null;

    // Configurar intervalo de actualización (cada 2 segundos para ahorrar batería)
    Accelerometer.setUpdateInterval(2000);

    this.subscription = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      const movement = {
        timestamp: new Date(),
        magnitude,
        isPickup: magnitude > 1.8, // Umbral para detectar "agarrar celular"
        isAwake: magnitude > 1.3,  // Umbral para detectar movimiento consciente
      };

      this.movements.push(movement);

      // Detectar pickups (agarrar el celular)
      if (movement.isPickup) {
        this.pickups++;
        console.log(`[SleepTracker] Phone pickup #${this.pickups} detected`);
      }

      // Calcular tiempo despierto
      if (movement.isAwake) {
        if (this.lastMovementTime) {
          const timeDiff = (movement.timestamp - this.lastMovementTime) / (1000 * 60 * 60); // en horas
          if (timeDiff < 0.5) { // Si hay movimiento en menos de 30 min, sumar tiempo despierto
            this.timeAwake += timeDiff;
          }
        }
        this.lastMovementTime = movement.timestamp;
      }
    });

    // Guardar estado de tracking
    await AsyncStorage.setItem('sleep_tracking_active', 'true');
    await AsyncStorage.setItem('sleep_session_start', this.sessionStart.toISOString());
  }

  async stopTracking() {
    console.log('[SleepTracker] Stopping tracking...');
    this.isTracking = false;

    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    const result = this.calculateScore();
    console.log('[SleepTracker] Session result:', result);

    // Limpiar estado de tracking
    await AsyncStorage.removeItem('sleep_tracking_active');
    await AsyncStorage.removeItem('sleep_session_start');

    return result;
  }

  calculateScore() {
    if (!this.sessionStart) {
      return null;
    }

    const sessionEnd = new Date();
    const sessionDuration = (sessionEnd - this.sessionStart) / (1000 * 60 * 60); // en horas

    // Calcular score base de 100
    let score = 100;

    // Penalizar por duración insuficiente (ideal: 7-9 horas)
    if (sessionDuration < 7) {
      score -= (7 - sessionDuration) * 8; // -8 puntos por cada hora menos
    } else if (sessionDuration > 9) {
      score -= (sessionDuration - 9) * 3; // -3 puntos por cada hora extra
    }

    // Penalizar por pickups (cada uno resta 8 puntos)
    score -= this.pickups * 8;

    // Penalizar por tiempo despierto
    score -= this.timeAwake * 20; // -20 puntos por hora despierto

    // Penalizar por movimientos excesivos
    if (this.movements.length > 0) {
      const avgMovement = this.movements.reduce((sum, m) => sum + m.magnitude, 0) / this.movements.length;
      if (avgMovement > 1.2) {
        score -= 10;
      }
    }

    // Clamp score entre 0 y 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
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
      console.log('[SleepTracker] Session saved successfully');
    } catch (error) {
      console.error('[SleepTracker] Error saving session:', error);
    }
  }

  async getSleepHistory() {
    try {
      const data = await AsyncStorage.getItem('sleep_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SleepTracker] Error getting history:', error);
      return [];
    }
  }

  async getLatestSession() {
    try {
      const history = await this.getSleepHistory();
      return history.length > 0 ? history[history.length - 1] : null;
    } catch (error) {
      console.error('[SleepTracker] Error getting latest session:', error);
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
      console.error('[SleepTracker] Error getting week data:', error);
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
      console.log('[SleepTracker] All data cleared');
    } catch (error) {
      console.error('[SleepTracker] Error clearing data:', error);
    }
  }
}

export default new SleepTracker();
