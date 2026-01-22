import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import BottomNavBar from '../components/BottomNavBar';
import { getLikedAlbums, getSongsByAlbumId } from '../backend/musicService';
import { PlayIcon } from '../components/Icons';
import { Audio } from 'expo-av';

// Cálculos de layout responsivo para el grid de álbumes
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columnas con margen

/**
 * MusicScreen
 * -----------
 * Pantalla principal de música:
 * - Carga los álbumes guardados por el usuario (liked albums)
 * - Muestra un grid de álbumes con portada y artista
 * - Permite navegar al detalle de un álbum
 * - Permite reproducir (play/stop) una canción del álbum (actualmente la primera)
 *
 * Maneja estados de UI típicos:
 * - loading: indicador de carga
 * - error: vista de error con opción de reintentar
 * - empty: vista cuando no hay álbumes
 */
export default function MusicScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme, isDark);

  // Estado principal de datos y UI
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de reproducción (para reflejar UI de álbum en reproducción)
  const [playingAlbumId, setPlayingAlbumId] = useState(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  // Referencia al objeto de sonido para controlar play/stop/unload sin re-render
  const soundRef = React.useRef(null);

  useEffect(() => {
    // Carga inicial de álbumes guardados
    loadLikedAlbums();
    
    // Cleanup: liberar recursos de audio al desmontar la pantalla
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  /**
   * Carga los álbumes guardados desde el servicio backend.
   * Centraliza manejo de loading/error y logs de diagnóstico.
   */
  const loadLikedAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[MusicScreen]  Loading liked albums...');
      const data = await getLikedAlbums();
      console.log('[MusicScreen]  Loaded', data.length, 'albums');
      setAlbums(data);
    } catch (err) {
      console.error('[MusicScreen]  Error loading albums:', err);
      setError(err.message || 'No se pudieron cargar los álbumes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Controla reproducción del álbum:
   * - Si el mismo álbum ya está reproduciéndose, detiene y libera el audio.
   * - Si es otro álbum, detiene lo anterior y reproduce la primera canción disponible.
   *
   * Nota: Se usa stopPropagation para que el botón Play no dispare navegación al detalle.
   */
  const handlePlayAll = async (album, e) => {
    e.stopPropagation();
    try {
      // Obtener canciones del álbum seleccionado
      const songs = await getSongsByAlbumId(album.id);
      if (songs.length === 0) {
        Alert.alert('No hay canciones', 'Este álbum aún no tiene canciones disponibles');
        return;
      }

      // Toggle: si ya está reproduciendo este álbum, se detiene
      if (playingAlbumId === album.id && isPlayingAll) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingAlbumId(null);
        setIsPlayingAll(false);
      } else {
        // Detener cualquier reproducción anterior antes de iniciar una nueva
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        }

        // Reproducir la primera canción (base para futuros "auto-advance" o playlist)
        const firstSong = songs[0];
        console.log('[MusicScreen] 🎵 Playing:', firstSong.title, 'from', album.title);
        
        const { sound } = await Audio.Sound.createAsync({
          uri: firstSong.audio_url,
        });
        soundRef.current = sound;
        await sound.playAsync();
        setPlayingAlbumId(album.id);
        setIsPlayingAll(true);

        // Hook de estado de reproducción (útil para auto-avance o UI de progreso)
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            console.log('[MusicScreen] Song finished, could implement auto-advance here');
          }
        });
      }
    } catch (err) {
      console.error('[MusicScreen]  Error playing songs:', err);
      Alert.alert('Error', 'No se pudo reproducir la canción');
    }
  };

  /**
   * Navega a la pantalla de detalle del álbum,
   * pasando datos necesarios vía params.
   */
  const handleAlbumPress = (album) => {
    console.log('[MusicScreen]  Navigating to album detail:', album.title);
    router.push({
      pathname: '/album-view',
      params: { 
        albumId: album.id,
        albumTitle: album.title,
        albumCover: album.cover_url,
        albumArtist: album.artist,
      },
    });
  };

  /**
   * Render de tarjeta de álbum:
   * - Portada (o placeholder)
   * - Botón play superpuesto
   * - Info de álbum (título, artista)
   */
  const renderAlbumCard = (album) => (
    <TouchableOpacity
      key={album.id}
      style={styles.albumCard}
      activeOpacity={0.8}
      onPress={() => handleAlbumPress(album)}
    >
      <View style={styles.albumCoverContainer}>
        {album.cover_url ? (
          <Image
            source={{ uri: album.cover_url }}
            style={styles.albumCover}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.albumCoverPlaceholder}>
            <Text style={styles.placeholderText}>♫</Text>
          </View>
        )}
        
        {/* Botón de play superpuesto (acción independiente a la navegación) */}
        <TouchableOpacity 
          style={styles.playOverlay}
          activeOpacity={0.7}
          onPress={(e) => handlePlayAll(album, e)}
        >
          <View style={[styles.playButton, playingAlbumId === album.id && isPlayingAll && styles.playButtonActive]}>
            <PlayIcon size={24} color={isDark ? '#0b1220' : '#fff'} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={2}>
          {album.title}
        </Text>
        {album.artist && (
          <Text style={styles.albumArtist} numberOfLines={1}>
            {album.artist}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Estado: Cargando
  if (loading) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.ACCENT_COLOR} />
          <Text style={styles.loadingText}>Cargando tu música...</Text>
        </View>
      </>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLikedAlbums}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Estado: Sin datos
  if (albums.length === 0) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyText}>No tienes álbumes guardados</Text>
          <Text style={styles.emptySubtext}>
            Completa el onboarding de música para agregar tus álbumes favoritos
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tu Música</Text>
          <Text style={styles.subtitle}>{albums.length} álbumes</Text>
        </View>

        {/* Grid de álbumes */}
        <View style={styles.albumsGrid}>
          {albums.map((album) => renderAlbumCard(album))}
        </View>

        {/* Espaciado para la barra de navegación */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Barra de navegación inferior */}
      <BottomNavBar activeTab="music" isDark={isDark} />
    </>
  );
}

/**
 * createStyles
 * ------------
 * Genera estilos dinámicos según el tema (light/dark).
 * Mantiene consistencia visual y evita hardcode de colores en el JSX.
 */
function createStyles(theme, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.BACKGROUND_COLOR,
    },
    scrollContent: {
      paddingTop: 50,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      backgroundColor: theme.BACKGROUND_COLOR,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#f87171',
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.ACCENT_COLOR,
      borderRadius: 12,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#0b1220' : '#fff',
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.TEXT_COLOR + '99',
      textAlign: 'center',
      lineHeight: 20,
    },

    // Header
    header: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.TEXT_COLOR,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.TEXT_COLOR + '99',
    },

    // Grid de álbumes
    albumsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 16,
    },
    albumCard: {
      width: CARD_WIDTH,
      marginBottom: 24,
    },
    albumCoverContainer: {
      width: CARD_WIDTH,
      height: CARD_WIDTH,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.SECONDARY_COLOR,
      position: 'relative',
    },
    albumCover: {
      width: '100%',
      height: '100%',
    },
    albumCoverPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
    },
    placeholderText: {
      fontSize: 48,
      color: theme.TEXT_COLOR + '33',
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.ACCENT_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    playButtonActive: {
      opacity: 0.8,
    },
    albumInfo: {
      marginTop: 12,
    },
    albumTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      marginBottom: 4,
      lineHeight: 20,
    },
    albumArtist: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.TEXT_COLOR + '99',
    },
  });
}
