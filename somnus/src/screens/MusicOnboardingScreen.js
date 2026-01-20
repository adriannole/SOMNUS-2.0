import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { fetchAlbumBatch, submitPreference, markMusicOnboardingDone } from '../backend/musicService';

const SWIPE_THRESHOLD = 80;
const { width } = Dimensions.get('window');

export default function MusicOnboardingScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [albums, setAlbums] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const position = useRef(new Animated.ValueXY()).current;
  const soundRef = useRef(null);
  const currentAlbumRef = useRef(null);
  const albumsRef = useRef([]);
  const indexRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const styles = createStyles(theme, isDark);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, { dx, vx }) => {
        const isSwipeRight = dx > SWIPE_THRESHOLD || vx > 0.3;
        const isSwipeLeft = dx < -SWIPE_THRESHOLD || vx < -0.3;
        
        
        if (isSwipeRight) {

          forceSwipe('right');
        } else if (isSwipeLeft) {

          forceSwipe('left');
        } else {
          console.log('Reset position');
          resetPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadAlbums();
    // Pulso continuo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
      position.stopAnimation();
      soundRef.current?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = albums[index];
    currentAlbumRef.current = current;
    albumsRef.current = albums;
    indexRef.current = index;
    console.log('[MusicOnboarding] Syncing refs - albums:', albums.length, 'index:', index);
    if (!current) return;
    playAudio(current.audio_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, albums]);

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      const batch = await fetchAlbumBatch(5);
      console.log('[MusicOnboarding] Loaded albums batch, count:', batch.length);
      setAlbums(batch);
      setIndex(0);
      if (batch.length === 0) {
        console.log('[MusicOnboarding] No albums, marking onboarding done');
        await markMusicOnboardingDone();
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.log('[MusicOnboarding] Error loading albums:', e?.message);
      setError(e?.message ?? 'No se pudo cargar la musica');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (uri) => {
    if (!uri) return;
    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
    } catch (e) {
      // Silencioso; si falla el audio, continuamos.
    }
  };

  const forceSwipe = (direction) => {
    console.log('forceSwipe called with direction:', direction);
    const x = direction === 'right' ? width * 1.5 : -width * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  const onSwipeComplete = async (direction) => {
    console.log('onSwipeComplete called with direction:', direction);
    const current = currentAlbumRef.current;
    console.log('Current album from ref:', current);
    position.setValue({ x: 0, y: 0 });
    if (!current) {
      console.log('No current album in ref');
      return;
    }

    try {
      console.log('Submitting preference:', current.id, direction === 'right');
      await submitPreference(current.id, direction === 'right');
      console.log('Preference submitted successfully');
    } catch (e) {
      console.log('Error submitting preference:', e?.message);
      setError(e?.message ?? 'No se pudo guardar la preferencia');
    }

    const currentIdx = indexRef.current;
    const totalAlbums = albumsRef.current.length;
    const nextIndex = currentIdx + 1;
    
    console.log('[onSwipeComplete] currentIdx:', currentIdx, 'nextIndex:', nextIndex, 'totalAlbums:', totalAlbums);
    
    if (nextIndex >= totalAlbums) {
      console.log('[onSwipeComplete] All albums shown, marking onboarding done');
      await markMusicOnboardingDone().catch(() => undefined);
      router.replace('/(tabs)');
    } else {
      console.log('[onSwipeComplete] Moving to next album, setting index to:', nextIndex);
      setIndex(nextIndex);
    }
  };

  const renderCard = () => {
    const current = albums[index];
    if (!current) return null;

    const rotate = position.x.interpolate({
      inputRange: [-width * 1.2, 0, width * 1.2],
      outputRange: ['-12deg', '0deg', '12deg'],
    });

    const likeOpacity = position.x.interpolate({
      inputRange: [0, width / 4],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const nopeOpacity = position.x.interpolate({
      inputRange: [-width / 4, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          },
        ]}
      >
        <Animated.View style={[styles.overlayLike, { opacity: likeOpacity }]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.overlayNope, { opacity: nopeOpacity }]}>
          <Text style={styles.overlayText}>NOPE</Text>
        </Animated.View>

        {current.cover_url ? (
          <Image source={{ uri: current.cover_url }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Text style={styles.coverFallbackText}>Sin portada</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.albumTitle}>{current.title}</Text>
          {current.artist ? <Text style={styles.albumArtist}>{current.artist}</Text> : null}
          {current.tags && current.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {current.tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
         
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.ACCENT_COLOR} size="large" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAlbums}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No hay mas musica para mostrar.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={async () => {
            await markMusicOnboardingDone().catch(() => undefined);
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.primaryButtonText}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const remaining = albums.length - index;

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <View style={styles.screen}>
        <Text style={styles.title}>Afinemos tu descanso</Text>
        <Text style={styles.subtitle}>Elige lo que te gusta para crear tu ambiente ideal</Text>

        <View style={styles.cardContainer}>{renderCard()}</View>

      <Animated.View style={[styles.hintContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.hintText}>⇄ Desliza para elegir ⇄</Text>
        <Text style={styles.hintSubtext}>Derecha: Me gusta | Izquierda: No me gusta</Text>
      </Animated.View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.circleButton, styles.nope]} onPress={() => forceSwipe('left')}>
            <Text style={styles.circleButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>{remaining} restantes</Text>
          <TouchableOpacity style={[styles.circleButton, styles.like]} onPress={() => forceSwipe('right')}>
            <Text style={styles.circleButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function createStyles(theme, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 24,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      color: theme.TEXT_COLOR,
      fontSize: 16,
    },
    errorText: {
      color: '#f87171',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.ACCENT_COLOR,
      borderRadius: 10,
    },
    retryText: {
      color: isDark ? '#0b1220' : '#fff',
      fontWeight: '600',
    },
    title: {
      color: theme.TEXT_COLOR,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: theme.TEXT_COLOR + '99',
      fontSize: 15,
      marginBottom: 20,
    },
    cardContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      height: width * 1.05,
      backgroundColor: isDark ? '#222836' : '#ffffff',
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    overlayNope: {
      position: 'absolute',
      top: 40,
      left: 30,
      zIndex: 10,
      transform: [{ rotate: '-25deg' }],
      borderWidth: 5,
      borderColor: theme.BORDER_COLOR,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    overlayLike: {
      position: 'absolute',
      top: 40,
      right: 30,
      zIndex: 10,
      transform: [{ rotate: '25deg' }],
      borderWidth: 5,
      borderColor: theme.ACCENT_COLOR,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    overlayText: {
      color: theme.TEXT_COLOR,
      fontSize: 48,
      fontWeight: '900',
      letterSpacing: 3,
    },
    cover: {
      width: '100%',
      height: width * 0.7,
    },
    coverFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SECONDARY_COLOR,
    },
    coverFallbackText: {
      color: theme.TEXT_COLOR,
      fontWeight: '600',
    },
    cardBody: {
      padding: 16,
    },
    albumTitle: {
      color: theme.TEXT_COLOR,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 6,
    },
    albumArtist: {
      color: theme.TEXT_COLOR + '99',
      fontSize: 15,
      marginBottom: 12,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    tagChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.SECONDARY_COLOR,
    },
    tagText: {
      color: theme.TEXT_COLOR,
      fontSize: 13,
      fontWeight: '600',
    },
    hint: {
      color: theme.TEXT_COLOR + '99',
      fontSize: 14,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    circleButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    circleButtonText: {
      fontSize: 28,
      color: isDark ? '#0b1220' : '#fff',
      fontWeight: '800',
    },
    nope: {
      backgroundColor: theme.SECONDARY_COLOR,
      borderWidth: 2,
      borderColor: theme.BORDER_COLOR,
    },
    like: {
      backgroundColor: theme.SECONDARY_COLOR,
      borderWidth: 2,
      borderColor: theme.BORDER_COLOR,
    },
    counter: {
      color: theme.TEXT_COLOR,
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButton: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.ACCENT_COLOR,
      borderRadius: 12,
    },
    primaryButtonText: {
      color: isDark ? '#0b1220' : '#fff',
      fontWeight: '700',
    },
    hintContainer: {
      marginVertical: 20,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hintText: {
      color: theme.ACCENT_COLOR,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 6,
    },
    hintSubtext: {
      color: theme.TEXT_COLOR,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
  });
}
