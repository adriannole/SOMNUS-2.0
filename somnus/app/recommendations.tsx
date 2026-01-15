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
    description: 'Intenta dormir y despertar a la misma hora para estabilizar el ritmo circadiano.',
    vector: [0.9, 0.7, -0.4, -0.2],
  },
  {
    id: 'reduce-awake',
    title: 'Reduce despertares',
    description: 'Evita pantallas 60 min antes de dormir y mantén la habitación oscura y fresca.',
    vector: [0.6, 0.4, -0.8, -0.3],
  },
  {
    id: 'minimize-pickups',
    title: 'Menos pickups nocturnos',
    description: 'Silencia notificaciones y coloca el teléfono lejos de la cama.',
    vector: [0.4, 0.2, -0.2, -0.9],
  },
  {
    id: 'optimize-sleep',
    title: 'Mejora la calidad del sueño',
    description: 'Practica respiración 4-7-8 y evita cafeína por la tarde.',
    vector: [0.8, 0.6, -0.3, -0.4],
  },
  {
    id: 'wind-down',
    title: 'Rutina de relajación',
    description: 'Dedica 15 minutos a lectura ligera o estiramientos suaves.',
    vector: [0.7, 0.5, -0.5, -0.2],
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
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('[Recommendations] Redis fetch failed', error);
    return null;
  }
};

const generateGeminiAdvice = async (sleepData: any, recommendations: any[]) => {
  if (!GEMINI_API_KEY) return null;

  const prompt = `Eres un especialista en sueño. Con base en estos datos del usuario:
- Puntaje: ${sleepData?.score ?? 0}
- Horas dormidas: ${sleepData?.hoursSlept ?? 0}
- Tiempo despierto: ${sleepData?.timeAwake ?? 0}
- Pickups nocturnos: ${sleepData?.nighttimePickups ?? 0}

Y estas recomendaciones priorizadas:
${recommendations
  .map((rec, idx) => `${idx + 1}. ${rec.title}: ${rec.description}`)
  .join('\n')}

Genera 3 recomendaciones claras, personalizadas y accionables en español.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 220 },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    console.warn('[Recommendations] Gemini error', res.status, errText);
    return null;
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
};

export default function RecommendationsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [sleepData, setSleepData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      const redisVectors = await fetchRedisRecommendations();
      const source = redisVectors ?? DEFAULT_RECOMMENDATIONS;

      const scored = source
        .map((rec: any) => {
          const score = dotProduct(userVector, normalizeVector(rec.vector || []));
          return { ...rec, score };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 4);

      setRecommendations(scored);

      const advice = await generateGeminiAdvice(latest, scored);
      setAiAdvice(advice);
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
          <Text style={styles.title}>Recommendations</Text>
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

        {aiAdvice ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>Recomendaciones IA</Text>
            <Text style={styles.aiText}>{aiAdvice}</Text>
          </View>
        ) : (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>Recomendaciones IA</Text>
            <Text style={styles.aiText}>
              Agrega tu API Key de Gemini en EXPO_PUBLIC_GEMINI_API_KEY para habilitar las
              recomendaciones personalizadas.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Sugerencias destacadas</Text>
        <View style={styles.recommendationsList}>
          {recommendations.map((rec) => (
            <View key={rec.id} style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
            </View>
          ))}
        </View>

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
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
      marginBottom: 16,
    },
    summaryTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      color: theme.TEXT_COLOR + 'cc',
      fontSize: 14,
      fontWeight: '600',
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '700',
    },
    aiCard: {
      marginHorizontal: 20,
      backgroundColor: isDark ? '#1f2937' : '#eef2ff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
      marginBottom: 16,
    },
    aiTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },
    aiText: {
      color: theme.TEXT_COLOR,
      fontSize: 14,
      lineHeight: 20,
    },
    sectionTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 16,
      fontWeight: '700',
      marginHorizontal: 20,
      marginBottom: 12,
    },
    recommendationsList: {
      marginHorizontal: 20,
      gap: 12,
    },
    recommendationCard: {
      backgroundColor: theme.SECONDARY_COLOR,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    recommendationTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6,
    },
    recommendationDescription: {
      color: theme.TEXT_COLOR + 'cc',
      fontSize: 14,
      lineHeight: 20,
    },
  });
