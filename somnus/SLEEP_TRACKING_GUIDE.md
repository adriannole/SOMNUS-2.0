# 🌙 Sistema de Tracking de Sueño - Documentación Técnica

## 📱 Sensores Recomendados para Somnus

### 1. **Acelerómetro** (RECOMENDADO ✅)
**Librería:** `expo-sensors` (ya incluido en Expo)

**Por qué es ideal:**
- Detecta movimiento del dispositivo durante la noche
- Identifica cuándo el usuario agarra el celular
- Mide la frecuencia de movimientos (inquietud durante el sueño)
- **Bajo consumo de batería**

**Instalación:**
```bash
npx expo install expo-sensors
```

**Ejemplo de uso:**
```javascript
import { Accelerometer } from 'expo-sensors';

// Configurar subscription
Accelerometer.setUpdateInterval(1000); // Cada 1 segundo

const subscription = Accelerometer.addListener(accelerometerData => {
  const { x, y, z } = accelerometerData;
  
  // Calcular magnitud del movimiento
  const magnitude = Math.sqrt(x*x + y*y + z*z);
  
  if (magnitude > 1.5) {
    // Usuario movió el celular - registrar pickup
    console.log('Phone pickup detected!');
  }
});
```

---

### 2. **Micrófono/Audio** (Opcional)
**Librería:** `expo-av`

**Funcionalidad:**
- Detectar ronquidos
- Medir niveles de ruido ambiente
- Identificar despertares por sonido

**Consideraciones:**
- Mayor consumo de batería
- Privacidad del usuario (solicitar permiso explícito)

---

### 3. **Sensor de Luminosidad** (Complementario)
**Librería:** `expo-light-sensor` (Android only)

**Funcionalidad:**
- Detectar si la pantalla se enciende durante la noche
- Medir exposición a luz

---

## 🎯 Estrategia de Implementación Recomendada

### **Fase 1: Acelerómetro Básico** (Implementar primero)

```javascript
// src/services/sleepTracker.js
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SleepTracker {
  constructor() {
    this.isTracking = false;
    this.subscription = null;
    this.movements = [];
    this.pickups = 0;
    this.sessionStart = null;
  }

  startTracking() {
    this.isTracking = true;
    this.sessionStart = new Date();
    this.movements = [];
    this.pickups = 0;

    Accelerometer.setUpdateInterval(2000); // Cada 2 segundos

    this.subscription = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x*x + y*y + z*z);
      
      const movement = {
        timestamp: new Date(),
        magnitude,
        isPickup: magnitude > 1.8, // Umbral de "agarrar celular"
      };

      this.movements.push(movement);

      if (movement.isPickup) {
        this.pickups++;
        console.log(`Phone pickup #${this.pickups} at ${movement.timestamp}`);
      }
    });
  }

  stopTracking() {
    this.isTracking = false;
    if (this.subscription) {
      this.subscription.remove();
    }

    return this.calculateScore();
  }

  calculateScore() {
    const sessionDuration = (new Date() - this.sessionStart) / (1000 * 60 * 60); // horas
    
    // Calcular score basado en:
    // - Duración del sueño
    // - Número de pickups
    // - Movimientos totales

    let score = 100;

    // Penalizar por pickups (cada uno resta 5 puntos)
    score -= this.pickups * 5;

    // Penalizar por duración insuficiente
    if (sessionDuration < 7) {
      score -= (7 - sessionDuration) * 5;
    }

    // Penalizar por movimientos excesivos
    const avgMovement = this.movements.reduce((sum, m) => sum + m.magnitude, 0) / this.movements.length;
    if (avgMovement > 1.2) {
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score)); // Clamp 0-100

    return {
      score,
      hoursSlept: sessionDuration,
      pickups: this.pickups,
      movements: this.movements.length,
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor',
    };
  }

  async saveSleepSession(data) {
    const sessions = await this.getSleepHistory();
    sessions.push({
      date: new Date().toISOString(),
      ...data,
    });

    await AsyncStorage.setItem('sleep_sessions', JSON.stringify(sessions));
  }

  async getSleepHistory() {
    try {
      const data = await AsyncStorage.getItem('sleep_sessions');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async getWeekData() {
    const history = await this.getSleepHistory();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return history
      .filter(session => new Date(session.date) >= weekAgo)
      .map(session => ({
        day: new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' }),
        score: session.score,
        hours: session.hoursSlept,
      }));
  }
}

export default new SleepTracker();
```

---

## 🚀 Integración con HomeScreen

```javascript
// src/screens/HomeScreen.js
import sleepTracker from '../services/sleepTracker';

export default function HomeScreen() {
  const [sleepData, setSleepData] = useState(null);

  useEffect(() => {
    loadSleepData();
  }, []);

  const loadSleepData = async () => {
    const history = await sleepTracker.getSleepHistory();
    const latest = history[history.length - 1];
    const weekData = await sleepTracker.getWeekData();

    setSleepData({
      score: latest?.score || 0,
      hoursSlept: latest?.hoursSlept || 0,
      timeAwake: latest?.timeAwake || 0,
      nighttimePickups: latest?.pickups || 0,
      weekData,
    });
  };

  // ... resto del componente
}
```

---

## 📊 Pantalla de "Sleep Session" (Nueva pantalla recomendada)

Crear una pantalla para **iniciar/detener** el tracking:

```javascript
// src/screens/SleepSessionScreen.js
import sleepTracker from '../services/sleepTracker';

export default function SleepSessionScreen() {
  const [isTracking, setIsTracking] = useState(false);

  const startSleep = () => {
    sleepTracker.startTracking();
    setIsTracking(true);
  };

  const endSleep = async () => {
    const result = sleepTracker.stopTracking();
    await sleepTracker.saveSleepSession(result);
    setIsTracking(false);
    
    // Mostrar resultado
    Alert.alert('Sleep Score', `Tu puntaje: ${result.score}`);
  };

  return (
    <View>
      {!isTracking ? (
        <TouchableOpacity onPress={startSleep}>
          <Text>Iniciar Tracking</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={endSleep}>
          <Text>Detener Tracking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

## 🔋 Optimización de Batería

### **Background Tasks** (para tracking nocturno)
**Librería:** `expo-background-fetch` + `expo-task-manager`

```bash
npx expo install expo-background-fetch expo-task-manager
```

**Configuración:**
```javascript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const SLEEP_TRACKING_TASK = 'sleep-tracking';

TaskManager.defineTask(SLEEP_TRACKING_TASK, async () => {
  // Registrar datos del acelerómetro en background
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Registrar tarea
await BackgroundFetch.registerTaskAsync(SLEEP_TRACKING_TASK, {
  minimumInterval: 60 * 15, // 15 minutos
  stopOnTerminate: false,
  startOnBoot: true,
});
```

---

## 🎨 Mejoras Visuales Sugeridas

1. **Animaciones de transición** entre scores
2. **Gráficas más detalladas**: hipnograma (fases del sueño)
3. **Notificaciones**: "Es hora de dormir" basado en patrones
4. **Insights**: "Has mejorado 15% esta semana"
5. **Comparación social** (opcional): rankings anónimos

---

## 📝 Pasos Siguientes

1. ✅ **Implementar acelerómetro básico**
2. ✅ **Crear SleepTracker service**
3. ✅ **Integrar con HomeScreen**
4. ⏳ **Crear pantalla de inicio/fin de sesión**
5. ⏳ **Implementar background tasks**
6. ⏳ **Agregar permisos y onboarding de sensores**
7. ⏳ **Testing con usuarios reales**

---

## ⚠️ Consideraciones Importantes

- **Privacidad**: Los datos NO deben salir del dispositivo (cumple GDPR)
- **Permisos**: Solicitar permisos de sensores en onboarding
- **Batería**: Monitorear consumo y ajustar intervalos
- **UX**: Educar al usuario sobre colocar el celular en la cama/mesita

---

**¿Quieres que implemente el SleepTracker service ahora?** 🚀
