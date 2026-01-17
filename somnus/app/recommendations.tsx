import React, { useEffect, useMemo, useState } from 'react';
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
import sleepTracker from '../src/services/sleepTracker';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const REDIS_REST_URL = process.env.EXPO_PUBLIC_REDIS_REST_URL;
const REDIS_REST_TOKEN = process.env.EXPO_PUBLIC_REDIS_REST_TOKEN;

const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'regular-schedule',
    title: 'Rutina constante',
    description: 'Dormi y despiértate a la misma hora cada día para estabilizar tu ritmo circadiano.',
    vector: [0.9, 0.7, -0.4, -0.2],
  },
  {
    id: 'reduce-awake',
    title: 'Reduce despertares',
    description: 'Evita pantallas 90 minutos antes de dormir y mantén la habitación fresca y oscura.',
    vector: [0.6, 0.4, -0.8, -0.3],
  },
  {
    id: 'minimize-pickups',
    title: 'Menos pickups nocturnos',
    description: 'Silencia notificaciones de noche y coloca el teléfono fuera de la habitación.',
    vector: [0.4, 0.2, -0.2, -0.9],
  },
  {
    id: 'optimize-sleep',
    title: 'Mejora calidad del sueño',
    description: 'Practica respiración 4-7-8 y evita cafeína después de las 2 PM.',
    vector: [0.8, 0.6, -0.3, -0.4],
  },
  {
    id: 'wind-down',
    title: 'Rutina de relajación',
    description: 'Dedica 15 minutos antes de dormir a lectura, meditación o baño tibio.',
    vector: [0.7, 0.5, -0.5, -0.2],
  },
  {
    id: 'sleep-cycles',
    title: 'Respeta ciclos de sueño',
    description: 'Duerme múltiplos de 90 minutos para despertar en fase de sueño ligero.',
    vector: [0.85, 0.75, -0.35, -0.15],
  },
  {
    id: 'exercise',
    title: 'Ejercicio regular',
    description: 'Realiza actividad física en la mañana o tarde para mejorar el sueño profundo.',
    vector: [0.8, 0.7, -0.4, -0.2],
  },
];

const normalizeVector = (vec: number[]) => {
  const magnitude = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vec.map((value) => value / magnitude);
};

const dotProduct = (a: number[], b: number[]) =>
  a.reduce((sum, value, idx) => sum + value * (b[idx] ?? 0), 0);

const buildUserVector = (sleepData: any) => {
  const score = sleepData?.score ?? 0;
  const hoursSlept = sleepData?.hoursSlept ?? 0;
  const timeAwake = sleepData?.timeAwake ?? 0;
  const pickups = sleepData?.nighttimePickups ?? 0;

  // Normalización básica para producto punto
  return normalizeVector([
    score / 100,
    hoursSlept / 8,
    timeAwake / 2,
    pickups / 10,
  ]);
};

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

    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    console.log('[Recommendations]  Datos cargados desde Redis cache');
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('[Recommendations] Redis fetch failed', error);
    return null;
  }
};

const saveRedisRecommendations = async (recommendations: any[]) => {
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
    console.warn('[Recommendations]  Redis no configurado, saltando guardado');
    return false;
  }

  try {
    console.log('[Recommendations]  Guardando recomendaciones en Redis...');
    
    // Guardar con expiración de 24 horas (86400 segundos)
    const res = await fetch(`${REDIS_REST_URL}/set/recommendation_vectors`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: JSON.stringify(recommendations),
        ex: 86400, // Expira en 24 horas
      }),
    });

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

const parseAIRecommendations = (text: string) => {
  if (!text) return [];
  
  const items = text.split(/(?:^|\n)(?:\d+\.|[-•])\s+/).filter(item => item.trim());
  
  return items.map((item, idx) => {
    const lines = item.trim().split('\n');
    const title = lines[0]?.replace(/\*+/g, '').trim() || `Recomendación ${idx + 1}`;
    const description = lines.slice(1).join('\n').replace(/\*+/g, '').trim();
    
    return {
      id: `ai-${idx}`,
      title,
      description: description || title,
      isAI: true,
    };
  });
};

const generateGeminiAdvice = async (sleepData: any, recommendations: any[]) => {
  if (!GEMINI_API_KEY) {
    console.log('[Recommendations] No Gemini API key');
    return null;
  }

  const topRecommendations = recommendations.slice(0, 3);
  const baseScore = sleepData?.score ?? 0;
  const severity = baseScore < 40 ? 'severa' : baseScore < 60 ? 'moderada' : 'leve';

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
    console.log('[Recommendations] Calling Gemini API with top scores:', topRecommendations.map(r => r.score.toFixed(3)));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }] 
          }],
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
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (error) {
    console.error('[Recommendations] Gemini request failed:', error);
    return null;
  }
};

export default function RecommendationsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [sleepData, setSleepData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      const latest = (await sleepTracker.getLatestSession()) ?? {
        score: 0,
        hoursSlept: 0,
        timeAwake: 0,
        nighttimePickups: 0,
      };
      setSleepData(latest);

      const userVector = buildUserVector(latest);
      let redisVectors = await fetchRedisRecommendations();
      
      // Si no hay datos en Redis, usar defaults y guardarlos
      if (!redisVectors) {
        console.log('[Recommendations]  Sin cache, usando DEFAULT_RECOMMENDATIONS');
        redisVectors = DEFAULT_RECOMMENDATIONS;
        
        // Guardar en Redis para próxima vez
        await saveRedisRecommendations(DEFAULT_RECOMMENDATIONS);
      }

      const source = redisVectors;

      const scored = source
        .map((rec: any) => {
          const score = dotProduct(userVector, normalizeVector(rec.vector || []));
          return { ...rec, score };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 4);

      setRecommendations(scored);

      const advice = await generateGeminiAdvice(latest, scored);
      if (advice) {
        const parsed = parseAIRecommendations(advice);
        setAiRecommendations(parsed);
      }
      setLoading(false);
    };

    loadRecommendations();
  }, []);

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
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mejora tu sueño</Text>
          <View style={styles.headerSpacer} />
        </View>

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

        {aiRecommendations.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Aquí tienes recomendaciones segun tus resultados</Text>
            <View style={styles.recommendationsList}>
              {aiRecommendations.map((rec, idx) => (
                <TouchableOpacity 
                  key={rec.id} 
                  style={styles.aiRecommendationCard}
                  onPress={() => toggleExpand(rec.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.aiRecHeader}>
                    <View style={styles.aiRecBadge}>
                      <Text style={styles.aiRecBadgeText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <Text style={styles.expandIcon}>{expandedCards.has(rec.id) ? '−' : '+'}</Text>
                  </View>
                  {expandedCards.has(rec.id) && (
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>
    </>
  );
}

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
