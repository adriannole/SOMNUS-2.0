/**
 * RecommendationsScreen
 * ----------------------------------------------------------
 * Pantalla que genera recomendaciones de sueño en base a:
 * 1) Última sesión registrada en sleepTracker
 * 2) Recomendaciones base (DEFAULT_RECOMMENDATIONS) o cache en Redis
 * 3) Recomendaciones personalizadas opcionales con Gemini (IA)
 *
 * Flujo general:
 * - Carga última sesión -> construye vector usuario -> puntúa recomendaciones -> muestra top
 * - Si hay API key de Gemini, genera 3 recomendaciones cortas extra (AI)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../src/hooks/useTheme';
import { AnimatedBackground } from '../src/components/AnimatedBackground';
import { getCurrentUser } from '../src/backend/authService';
import sleepTracker from '../src/services/sleepTracker';

/**
 * Variables de entorno (Expo):
 * - GEMINI_API_KEY: habilita recomendaciones con IA
 * - REDIS_REST_URL / TOKEN: habilita cache para vectores de recomendaciones
 */
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const REDIS_REST_URL = process.env.EXPO_PUBLIC_REDIS_REST_URL;
const REDIS_REST_TOKEN = process.env.EXPO_PUBLIC_REDIS_REST_TOKEN;

/**
 * Recomendaciones por defecto (fallback):
 * - Cada recomendación trae un "vector" para calcular similitud con el usuario
 */
const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'regular-schedule',
    title: 'Rutina constante',
    description: 'Dormi y despiértate a la misma hora cada día para estabilizar tu ritmo circadiano.',
    icon: '🗓️',
    vector: [0.9, 0.7, -0.4, -0.2],
  },
  {
    id: 'reduce-awake',
    title: 'Reduce despertares',
    description: 'Evita pantallas 90 minutos antes de dormir y mantén la habitación fresca y oscura.',
    icon: '🌙',
    vector: [0.6, 0.4, -0.8, -0.3],
  },
  {
    id: 'minimize-pickups',
    title: 'Menos pickups nocturnos',
    description: 'Silencia notificaciones de noche y coloca el teléfono fuera de la habitación.',
    icon: '📵',
    vector: [0.4, 0.2, -0.2, -0.9],
  },
  {
    id: 'optimize-sleep',
    title: 'Mejora calidad del sueño',
    description: 'Practica respiración 4-7-8 y evita cafeína después de las 2 PM.',
    icon: '🧘',
    vector: [0.8, 0.6, -0.3, -0.4],
  },
  {
    id: 'wind-down',
    title: 'Rutina de relajación',
    description: 'Dedica 15 minutos antes de dormir a lectura, meditación o baño tibio.',
    icon: '📖',
    vector: [0.7, 0.5, -0.5, -0.2],
  },
  {
    id: 'sleep-cycles',
    title: 'Respeta ciclos de sueño',
    description: 'Duerme múltiplos de 90 minutos para despertar en fase de sueño ligero.',
    icon: '💤',
    vector: [0.85, 0.75, -0.35, -0.15],
  },
  {
    id: 'exercise',
    title: 'Ejercicio regular',
    description: 'Realiza actividad física en la mañana o tarde para mejorar el sueño profundo.',
    icon: '🏃‍♂️',
    vector: [0.8, 0.7, -0.4, -0.2],
  },
  {
    id: 'caffeine-cutoff',
    title: 'Corte de cafeína',
    description: 'Evita cafeína después de las 14:00 para mejorar la conciliación del sueño.',
    icon: '☕',
    vector: [0.7, 0.4, -0.4, -0.2],
  },
  {
    id: 'sleep-environment',
    title: 'Ambiente ideal',
    description: 'Mantén el cuarto fresco, oscuro y silencioso para dormir más profundo.',
    icon: '🌡️',
    vector: [0.75, 0.55, -0.5, -0.2],
  },
  {
    id: 'morning-light',
    title: 'Luz matutina',
    description: 'Recibe 10-15 min de luz solar al despertar para regular el ritmo.',
    icon: '🌤️',
    vector: [0.7, 0.6, -0.3, -0.1],
  },
];

/**
 * Normaliza un vector para que tenga magnitud 1.
 * Esto ayuda a que el producto punto mida "similitud" de forma más estable.
 */
const normalizeVector = (vec: number[]) => {
  const magnitude = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vec.map((value) => value / magnitude);
};

/**
 * Producto punto entre dos vectores.
 * Se usa como puntuación (similitud) entre vector usuario y vector recomendación.
 */
const dotProduct = (a: number[], b: number[]) =>
  a.reduce((sum, value, idx) => sum + value * (b[idx] ?? 0), 0);

/**
 * Construye el vector del usuario a partir de su última sesión de sueño.
 * Se normaliza para poder compararlo con los vectores de recomendaciones.
 *
 * Ejes (ejemplo):
 * - score/100        -> calidad de sueño
 * - hours/8          -> horas dormidas (ideal aprox 8)
 * - awake/2          -> tiempo despierto (escala simple)
 * - pickups/10       -> pickups nocturnos (escala simple)
 */
const buildUserVector = (sleepData: any) => {
  const score = sleepData?.score ?? 0;
  const hoursSlept = sleepData?.hoursSlept ?? 0;
  const timeAwake = sleepData?.timeAwake ?? 0;
  const pickups = sleepData?.nighttimePickups ?? 0;

  return normalizeVector([
    score / 100,
    hoursSlept / 8,
    timeAwake / 2,
    pickups / 10,
  ]);
};

const buildTimingRecommendation = (sleepData: any) => {
  const startTime = sleepData?.startTime;
  const endTime = sleepData?.endTime;
  const hoursSlept = sleepData?.hoursSlept ?? 0;
  if (!startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const startHour = start.getHours();
  const endHour = end.getHours();

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const wentToBedLate = startHour >= 23 || startHour <= 4;
  const wokeVeryEarly = endHour >= 4 && endHour <= 6;

  if (hoursSlept >= 8) {
    return {
      id: 'timing-recommendation-positive',
      title: 'Excelente descanso',
      description: `Dormiste ${hoursSlept.toFixed(1)}h. ¡Excelente! Sigue con ese ritmo para mantener un ciclo saludable sigue las demas recomendaciones.`,
      icon: '✅',
      isAI: false,
    };
  }

  if (hoursSlept >= 7) {
    const missing = Math.max(0, 8 - hoursSlept);
    return {
      id: 'timing-recommendation-close',
      title: 'Casi completo',
      description: `Te faltó ${missing.toFixed(1)}h para completar un ciclo de 8h. Intenta dormir un poco más esta noche.`,
      icon: '⏳',
      isAI: false,
    };
  }

  if (wentToBedLate || wokeVeryEarly || hoursSlept < 7) {
    return {
      id: 'timing-recommendation-early',
      title: 'Acuéstate más temprano',
      description: `Te acostaste a las ${formatTime(start)} y te levantaste a las ${formatTime(end)}. Para llegar a 7–8h, intenta acostarte 30–60 min antes.`,
      icon: '🕘',
      isAI: false,
    };
  }

  return null;
};

/**
 * Intenta cargar vectores de recomendaciones desde Redis (cache).
 * Si no está configurado Redis o si falla, devuelve null para usar defaults.
 */
const fetchRedisRecommendations = async () => {
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) return null;

  try {
    const res = await fetch(`${REDIS_REST_URL}/get/recommendation_vectors`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${REDIS_REST_TOKEN}`,
      },
    });

    const data = await res.json();
    if (!data?.result) return null;

    // Redis puede devolver string JSON o un objeto ya parseado
    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;

    // Si el cache viene vacío o inválido, se usa fallback
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('[Recommendations]  Redis cache vacío o inválido, usando defaults');
      return null;
    }

    console.log('[Recommendations]  Datos cargados desde Redis cache');
    return parsed;
  } catch (error) {
    console.warn('[Recommendations] Redis fetch failed', error);
    return null;
  }
};

/**
 * Guarda recomendaciones en Redis para reutilizarlas luego.
 * Tiene expiración de 24h para no guardar datos viejos indefinidamente.
 */
const saveRedisRecommendations = async (recommendations: any[]) => {
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
    console.warn('[Recommendations]  Redis no configurado, saltando guardado');
    return false;
  }

  try {
    console.log('[Recommendations]  Guardando recomendaciones en Redis...');

    const res = await fetch(`${REDIS_REST_URL}/set/recommendation_vectors`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: JSON.stringify(recommendations),
        ex: 86400, // 24 horas
      }),
    });

    // Manejo de errores comunes (ej: token sin permiso SET)
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 403 && /NOPERM/i.test(errText)) {
        console.warn('[Recommendations]  Redis sin permisos de escritura. Usa un token con permisos SET.');
        return false;
      }
      console.error('[Recommendations]  Error guardando en Redis:', res.status, errText);
      return false;
    }

    const result = await res.json();
    console.log('[Recommendations]  Guardado exitoso en Redis:', result);
    return true;
  } catch (error) {
    console.error('[Recommendations]  Redis save failed:', error);
    return false;
  }
};

/**
 * Convierte el texto devuelto por Gemini en un arreglo de recomendaciones.
 * Se espera formato tipo:
 * 1. ...
 * 2. ...
 * 3. ...
 */
const parseAIRecommendations = (text: string, icons: string[] = []) => {
  if (!text) return [];

  // Divide por "1." "2." "3." o bullets (- •)
  const items = text.split(/(?:^|\n)(?:\d+\.|[-•])\s+/).filter(item => item.trim());

  return items.map((item, idx) => {
    const lines = item.trim().split('\n');
    const title = lines[0]?.replace(/\*+/g, '').trim() || `Recomendación ${idx + 1}`;
    const description = lines.slice(1).join('\n').replace(/\*+/g, '').trim();

    return {
      id: `ai-${idx}`,
      title,
      description: description || title,
      icon: icons[idx],
      isAI: true,
    };
  });
};

/**
 * Llama a Gemini para generar recomendaciones cortas personalizadas.
 * - Usa el sleepData del usuario + top recomendaciones calculadas por vector similarity
 * - Si no hay API key, retorna null y la app sigue sin IA
 */
const generateGeminiAdvice = async (sleepData: any, recommendations: any[]) => {
  if (!GEMINI_API_KEY) {
    console.log('[Recommendations] No Gemini API key');
    return null;
  }

  const topRecommendations = recommendations.slice(0, 3);
  const baseScore = sleepData?.score ?? 0;
  const severity = baseScore < 40 ? 'severa' : baseScore < 60 ? 'moderada' : 'leve';

  // Prompt: se pide respuesta directa en 3 líneas (1.,2.,3.)
  const prompt = `Eres un especialista en medicina del sueño. Con base en estos datos del usuario:
- Puntaje de calidad: ${baseScore}/100 (${severity})
- Horas dormidas: ${sleepData?.hoursSlept ?? 0}h
- Tiempo despierto: ${sleepData?.timeAwake ?? 0}h
- Pickups nocturnos: ${sleepData?.nighttimePickups ?? 0}

Las 3 recomendaciones más relevantes según su patrón son:
${topRecommendations
  .map((rec, idx) => `${idx + 1}. ${rec.title}: ${rec.description}`)
  .join('\n')}

Genera 3 recomendaciones CORTAS y MUY ESPECÍFICAS para este usuario (máximo 1-2 líneas cada una). 
Sé conciso y directo. Incluye exactamente qué hacer.

Formato: Escribe cada recomendación en una línea empezando con "1.", "2." o "3." pero no vuelvas a poner aqui tienes estas recomendaciones o estas 3 recomendaciones`;

  try {
    console.log(
      '[Recommendations] Calling Gemini API with top scores:',
      topRecommendations.map(r => r.score.toFixed(3))
    );

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Recommendations] Gemini error', res.status, errText);
      return null;
    }

    const json = await res.json();
    console.log('[Recommendations] Gemini response:', JSON.stringify(json).substring(0, 200));

    // Extrae el texto de respuesta del primer candidato
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (error) {
    console.error('[Recommendations] Gemini request failed:', error);
    return null;
  }
};

export default function RecommendationsScreen() {
  // Tema visual (colores) y booleano isDark
  const { theme, isDark } = useTheme();

  // Router para navegar / volver atrás
  const router = useRouter();

  // Estilos dependientes del tema: se recalculan solo si cambia theme o isDark
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // Estado con la última sesión de sueño del usuario
  const [sleepData, setSleepData] = useState<any>(null);

  // Recomendaciones basadas en vectores (top 4)
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Recomendaciones generadas por IA (Gemini)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

  // Controla qué tarjetas están expandidas en UI
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Controla pantalla de carga
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  /**
   * didLoadRef:
   * Evita ejecutar loadRecommendations 2 veces
   * (útil en dev con React Strict Mode / recargas)
   */
  const didLoadRef = useRef(false);

  /**
   * Expande/contrae una tarjeta por id.
   * Se usa Set para acceso rápido (has/add/delete).
   */
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      // Evita re-ejecuciones
      if (didLoadRef.current) return;
      didLoadRef.current = true;

      setLoading(true);
      const currentUser = await getCurrentUser().catch(() => null);
      const firstName = currentUser?.first_name?.trim() || '';
      setUserName(firstName);

      // 1) Cargar última sesión (si no existe, usar valores por defecto)
      const latest = (await sleepTracker.getLatestSession()) ?? {
        score: 0,
        hoursSlept: 0,
        timeAwake: 0,
        nighttimePickups: 0,
      };
      setSleepData(latest);

      // 2) Construir vector usuario y obtener recomendaciones (Redis o defaults)
      const userVector = buildUserVector(latest);
      let redisVectors = await fetchRedisRecommendations();

      // Si no hay cache, usar defaults y tratar de guardarlos en Redis
      if (!redisVectors) {
        console.log('[Recommendations]  Sin cache, usando DEFAULT_RECOMMENDATIONS');
        redisVectors = DEFAULT_RECOMMENDATIONS;
        await saveRedisRecommendations(DEFAULT_RECOMMENDATIONS);
      }

      const source = redisVectors;

      // 3) Puntuar recomendaciones y quedarnos con top 4
      const scored = source
        .map((rec: any) => {
          const score = dotProduct(userVector, normalizeVector(rec.vector || []));
          return { ...rec, score };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 4);

      setRecommendations(scored);

      // 4) (Opcional) Pedir a Gemini 3 recomendaciones extra personalizadas
      const timingRec = buildTimingRecommendation(latest);
      const topForAI = scored.slice(0, 3);
      const advice = await generateGeminiAdvice(latest, scored);
      if (advice) {
        const parsed = parseAIRecommendations(
          advice,
          topForAI.map((rec: any) => rec.icon).filter(Boolean)
        );
        setAiRecommendations(timingRec ? [timingRec, ...parsed] : parsed);
      } else if (timingRec) {
        setAiRecommendations([timingRec]);
      }

      setLoading(false);
    };

    loadRecommendations();
  }, []);

  /**
   * Pantalla de carga mientras se generan recomendaciones
   */
  if (loading) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.ACCENT_COLOR} />
          <Text style={styles.loadingText}>Generando recomendaciones...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />

      {/* Contenido scrolleable */}
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        {/* Header con botón de regreso */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Mejora tu sueño</Text>

          {/* Spacer para centrar el título */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Resumen con métricas principales */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de sueño</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Horas dormidas</Text>
            <Text style={[styles.summaryValue, { color: '#4ade80' }]}>
              {sleepData?.hoursSlept ?? 0}h
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiempo despierto</Text>
            <Text style={[styles.summaryValue, { color: '#fbbf24' }]}>
              {sleepData?.timeAwake ?? 0}h
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickups nocturnos</Text>
            <Text style={[styles.summaryValue, { color: '#f87171' }]}>
              {sleepData?.nighttimePickups ?? 0}
            </Text>
          </View>
        </View>

        {/* Si existen recomendaciones IA, se muestran en tarjetas expandibles */}
        {aiRecommendations.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {userName ? `${userName}, ` : ''}Aquí tienes recomendaciones segun tus resultados
            </Text>

            <View style={styles.recommendationsList}>
              {aiRecommendations.map((rec, idx) => (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.aiRecommendationCard}
                  onPress={() => toggleExpand(rec.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.aiRecHeader}>
                    {/* Número de recomendación */}
                    <View style={styles.aiRecBadge}>
                      <Text style={styles.aiRecBadgeText}>{idx + 1}</Text>
                    </View>

                    {rec.icon ? (
                      <View style={styles.aiRecIcon}>
                        <Text style={styles.aiRecIconText}>{rec.icon}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.recommendationTitle}>{rec.title}</Text>

                    {/* Ícono + / − para expandir */}
                    <Text style={styles.expandIcon}>
                      {expandedCards.has(rec.id) ? '−' : '+'}
                    </Text>
                  </View>

                  {/* Descripción solo cuando está expandido */}
                  {expandedCards.has(rec.id) && (
                    <Text style={styles.recommendationDescription}>
                      {rec.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {/* Espacio inferior para que no quede pegado al borde */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </>
  );
}

/**
 * createStyles:
 * Genera estilos dinámicos usando el tema de la app.
 * Se llama con useMemo arriba para evitar recalcular en cada render.
 */
const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      color: theme.TEXT_COLOR,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.SECONDARY_COLOR,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: {
      color: theme.TEXT_COLOR,
      fontSize: 18,
      fontWeight: '700',
    },
    headerSpacer: {
      width: 40,
    },
    title: {
      color: theme.TEXT_COLOR,
      fontSize: 22,
      fontWeight: '700',
    },
    summaryCard: {
      marginHorizontal: 20,
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
      marginBottom: 24,
    },
    summaryTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: `${theme.BORDER_COLOR}50`,
    },
    summaryLabel: {
      color: theme.TEXT_COLOR,
      fontSize: 13,
      fontWeight: '500',
      opacity: 0.8,
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '700',
    },
    sectionTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 16,
      fontWeight: '700',
      marginHorizontal: 20,
      marginBottom: 12,
      marginTop: 20,
    },
    recommendationsList: {
      marginHorizontal: 20,
      gap: 10,
      marginBottom: 16,
    },
    recommendationCard: {
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    aiRecommendationCard: {
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    recHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    aiRecHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    aiRecIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.SECONDARY_COLOR,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    aiRecIconText: {
      fontSize: 14,
    },
    aiRecBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.ACCENT_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    aiRecBadgeText: {
      color: isDark ? '#0b1220' : '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    expandIcon: {
      color: theme.ACCENT_COLOR,
      fontSize: 18,
      fontWeight: '600',
      width: 24,
      textAlign: 'right',
    },
    recommendationTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    recommendationDescription: {
      color: theme.TEXT_COLOR,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 10,
      opacity: 0.8,
    },
  });
