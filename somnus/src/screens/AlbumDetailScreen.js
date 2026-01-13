import React, { useEffect, useState, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useTheme } from '../hooks/useTheme';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { getSongsByAlbumId } from '../backend/musicService';
import { 
  PlayIcon, 
  ChevronLeftIcon, 
  HomeIconNav, 
  ChartIcon, 
  SettingsIcon, 
  MusicIcon 
} from '../components/Icons';

const { width } = Dimensions.get('window');

export default function AlbumDetailScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const styles = createStyles(theme, isDark);

  const albumId = params?.albumId;
  const albumTitle = params?.albumTitle || 'Álbum';
  const albumCover = params?.albumCover;
  const albumArtist = params?.albumArtist;

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef(null);

  useEffect(() => {
    loadSongs();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [albumId]);

  const loadSongs = async () => {
    if (!albumId) {
      setError('No se especificó un álbum');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[AlbumDetail] 🎵 Loading songs for album:', albumId);
      const data = await getSongsByAlbumId(albumId);
      console.log('[AlbumDetail] ✅ Loaded', data.length, 'songs');
      setSongs(data);
    } catch (err) {
      console.error('[AlbumDetail] ❌ Error loading songs:', err);
      setError(err.message || 'No se pudieron cargar las canciones');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song, index) => {
    try {
      // If clicking the same song that's playing, toggle playback
      if (currentSongIndex === index && isPlaying) {
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
        return;
      }

      // Stop any previous playback
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      // Create and play new sound
      console.log('[AlbumDetail] 🎵 Playing:', song.title);
      const { sound } = await Audio.Sound.createAsync({
        uri: song.audio_url,
      });

      soundRef.current = sound;
      setCurrentSongIndex(index);
      setIsPlaying(true);

      await sound.playAsync();

      // Handle song finish
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log('[AlbumDetail] ⏹️ Song finished');
          // Auto-advance to next song
          if (index < songs.length - 1) {
            handlePlaySong(songs[index + 1], index + 1);
          } else {
            setIsPlaying(false);
            setCurrentSongIndex(null);
          }
        }
      });
    } catch (err) {
      console.error('[AlbumDetail] ❌ Error playing song:', err);
      Alert.alert('Error', 'No se pudo reproducir la canción');
    }
  };

  const handlePlayAll = async () => {
    if (songs.length === 0) {
      Alert.alert('No hay canciones', 'Este álbum no tiene canciones disponibles');
      return;
    }
    await handlePlaySong(songs[0], 0);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.ACCENT_COLOR} />
          <Text style={styles.loadingText}>Cargando canciones...</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AnimatedBackground isDark={isDark} theme={theme} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSongs}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground isDark={isDark} theme={theme} />
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        {/* Header con botón de atrás */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeftIcon size={24} color={theme.TEXT_COLOR} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detalles
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Album Cover Grande */}
        <View style={styles.coverSection}>
          {albumCover ? (
            <Image
              source={{ uri: albumCover }}
              style={styles.albumCoverLarge}
            />
          ) : (
            <View style={styles.albumCoverPlaceholder}>
              <Text style={styles.placeholderText}>♫</Text>
            </View>
          )}
        </View>

        {/* Album Info */}
        <View style={styles.infoSection}>
          <Text style={styles.albumTitle}>{albumTitle}</Text>
          {albumArtist && (
            <Text style={styles.albumArtist}>{albumArtist}</Text>
          )}
          <Text style={styles.songCount}>
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </Text>
        </View>

        {/* Play All Button */}
        <TouchableOpacity
          style={styles.playAllButton}
          onPress={handlePlayAll}
        >
          <PlayIcon size={20} color={isDark ? '#0b1220' : '#fff'} />
          <Text style={styles.playAllText}>
            {isPlaying ? 'ESCUCHANDO' : 'REPRODUCIR TODO'}
          </Text>
        </TouchableOpacity>

        {/* Lista de canciones */}
        <View style={styles.songsContainer}>
          <Text style={styles.songsTitle}>Canciones</Text>

          {songs.map((song, index) => (
            <TouchableOpacity
              key={song.id}
              style={[
                styles.songRow,
                currentSongIndex === index && styles.songRowActive,
              ]}
              onPress={() => handlePlaySong(song, index)}
            >
              <View style={styles.songNumber}>
                {currentSongIndex === index && isPlaying ? (
                  <View style={styles.playingIndicator}>
                    <Text style={styles.playingDot}>●</Text>
                  </View>
                ) : (
                  <Text style={styles.trackNumber}>{index + 1}</Text>
                )}
              </View>

              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                {song.artist && (
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artist}
                  </Text>
                )}
              </View>

              <Text style={styles.songDuration}>
                {formatDuration(song.duration)}
              </Text>

              <TouchableOpacity
                style={styles.songPlayButton}
                onPress={() => handlePlaySong(song, index)}
              >
                {currentSongIndex === index && isPlaying ? (
                  <Text style={styles.playingText}>⏸</Text>
                ) : (
                  <Text style={styles.playText}>▶</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Espaciado para barra de navegación */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Barra de navegación inferior */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/explore')}
        >
          <ChartIcon size={24} color={theme.TEXT_COLOR + '99'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonActive]}
        >
          <MusicIcon size={24} color={isDark ? '#0b1220' : '#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/')}
        >
          <HomeIconNav size={24} color={theme.TEXT_COLOR + '99'} />
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
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
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

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.SECONDARY_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 12,
    },

    // Cover
    coverSection: {
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 30,
    },
    albumCoverLarge: {
      width: width - 80,
      height: width - 80,
      borderRadius: 20,
      backgroundColor: theme.SECONDARY_COLOR,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    albumCoverPlaceholder: {
      width: width - 80,
      height: width - 80,
      borderRadius: 20,
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 80,
      color: theme.TEXT_COLOR + '33',
    },

    // Info
    infoSection: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    albumTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.TEXT_COLOR,
      textAlign: 'center',
      marginBottom: 8,
    },
    albumArtist: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.TEXT_COLOR + '99',
      marginBottom: 8,
    },
    songCount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.ACCENT_COLOR,
    },

    // Play All Button
    playAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginBottom: 32,
      paddingVertical: 14,
      paddingHorizontal: 24,
      backgroundColor: theme.ACCENT_COLOR,
      borderRadius: 12,
      gap: 10,
      shadowColor: theme.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    playAllText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#0b1220' : '#fff',
      letterSpacing: 0.5,
    },

    // Songs Container
    songsContainer: {
      paddingHorizontal: 20,
    },
    songsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.TEXT_COLOR,
      marginBottom: 16,
    },

    // Song Row
    songRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderWidth: 1,
      borderColor: theme.BORDER_COLOR,
    },
    songRowActive: {
      backgroundColor: theme.ACCENT_COLOR + '20',
      borderColor: theme.ACCENT_COLOR,
    },

    // Song Number
    songNumber: {
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    trackNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.TEXT_COLOR + '66',
    },
    playingIndicator: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    playingDot: {
      fontSize: 18,
      color: theme.ACCENT_COLOR,
      fontWeight: 'bold',
    },

    // Song Info
    songInfo: {
      flex: 1,
      marginLeft: 8,
    },
    songTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.TEXT_COLOR,
      marginBottom: 4,
    },
    songArtist: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.TEXT_COLOR + '99',
    },

    // Duration
    songDuration: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.TEXT_COLOR + '66',
      minWidth: 40,
      textAlign: 'right',
      marginRight: 12,
    },

    // Play Button
    songPlayButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.ACCENT_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playText: {
      fontSize: 12,
      color: isDark ? '#0b1220' : '#fff',
    },
    playingText: {
      fontSize: 16,
      color: isDark ? '#0b1220' : '#fff',
    },

    // Bottom navigation bar
    navBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 8,
      paddingBottom: 12,
      backgroundColor: isDark ? '#1a1f26f0' : '#fffffff0',
      borderTopWidth: 1,
      borderTopColor: theme.BORDER_COLOR,
      height: 64,
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
  });
}
