import { supabase } from './supabaseClient';

export type Album = {
  id: string;
  title: string;
  artist?: string;
  cover_url?: string;
  audio_url?: string;
  tags?: string[];
  order_priority?: number | null;
  created_at?: string;
  active?: boolean;
};

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('No hay una sesion activa');
  }
  return data.user.id;
}

export async function getMusicOnboardingStatus(): Promise<boolean> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('music_onboarding_done')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.music_onboarding_done ?? false;
}

export async function fetchAlbumBatch(limit = 5): Promise<Album[]> {
  const userId = await getUserId();

  const { data: prefs, error: prefsError } = await supabase
    .from('user_album_preferences')
    .select('album_id')
    .eq('user_id', userId);

  if (prefsError) {
    console.log('[musicService] Error fetching prefs:', prefsError.message);
    throw new Error(prefsError.message);
  }

  const seen = new Set((prefs ?? []).map((p) => p.album_id));
  console.log('[musicService] Already seen albums:', seen.size, Array.from(seen));

  const { data: albums, error: albumsError } = await supabase
    .from('albums')
    .select('*')
    .eq('active', true)
    .order('order_priority', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(30);

  if (albumsError) {
    console.log('[musicService] Error fetching albums:', albumsError.message);
    throw new Error(albumsError.message);
  }

  console.log('[musicService] Total albums from DB:', albums?.length ?? 0);
  const filtered = (albums ?? []).filter((a) => !seen.has(a.id)).slice(0, limit);
  console.log('[musicService] Filtered albums to show:', filtered.length, 'limit:', limit);
  
  return filtered;
}

export async function submitPreference(albumId: string, liked: boolean): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('user_album_preferences').upsert({
    user_id: userId,
    album_id: albumId,
    liked,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markMusicOnboardingDone(): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ music_onboarding_done: true })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getLikedAlbums(): Promise<Album[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('user_album_preferences')
    .select(`
      album_id,
      liked,
      albums (
        id,
        title,
        artist,
        cover_url,
        audio_url,
        tags
      )
    `)
    .eq('user_id', userId)
    .eq('liked', true);

  if (error) {
    console.log('[musicService] Error fetching liked albums:', error.message);
    throw new Error(error.message);
  }

  const albums = (data ?? [])
    .map((item: any) => item.albums)
    .filter((album: any) => album !== null) as Album[];

  console.log('[musicService] Liked albums:', albums.length);
  return albums;
}

export type Song = {
  id: string;
  album_id: string;
  title: string;
  artist?: string;
  duration?: number;
  audio_url?: string;
  cover_url?: string;
  track_number?: number;
  created_at?: string;
};

export async function getSongsByAlbumId(albumId: string): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('album_id', albumId)
    .order('track_number', { ascending: true });

  if (error) {
    console.log('[musicService] Error fetching songs:', error.message);
    throw new Error(error.message);
  }

  console.log('[musicService] Songs fetched for album:', albumId, 'count:', data?.length ?? 0);
  return data ?? [];
}
