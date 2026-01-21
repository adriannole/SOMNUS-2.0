// Music service (Supabase)
// Handles music onboarding, albums, user preferences, and songs

import { supabase } from './supabaseClient';

/**
 * Album entity representation as stored in the database
 */
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

/**
 * Retrieves the authenticated user's ID
 *
 * What it does:
 * - Fetches the current authenticated user from Supabase Auth
 *
 * Input:
 * - None
 *
 * Output:
 * - Promise<string> → authenticated user's UUID
 *
 * Important:
 * - Throws an error if there is no active session
 */
async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('No hay una sesion activa');
  }
  return data.user.id;
}

/**
 * Checks whether the user has completed the music onboarding process
 *
 * What it does:
 * - Reads the `music_onboarding_done` flag from the user's profile
 *
 * Input:
 * - None
 *
 * Output:
 * - Promise<boolean>
 *   - true  → onboarding completed
 *   - false → onboarding not completed
 */
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

  // Default to false if the field is null or missing
  return data?.music_onboarding_done ?? false;
}

/**
 * Fetches a batch of albums that the user has NOT seen yet
 *
 * What it does:
 * 1. Retrieves albums already rated by the user
 * 2. Fetches active albums from the database
 * 3. Filters out already seen albums
 * 4. Returns a limited batch for onboarding or discovery
 *
 * Input:
 * - limit: number (optional, default = 5)
 *
 * Output:
 * - Promise<Album[]> → list of unseen albums
 */
export async function fetchAlbumBatch(limit = 5): Promise<Album[]> {
  const userId = await getUserId();

  // Fetch user's album preferences (albums already evaluated)
  const { data: prefs, error: prefsError } = await supabase
    .from('user_album_preferences')
    .select('album_id')
    .eq('user_id', userId);

  if (prefsError) {
    console.log('[musicService] Error fetching prefs:', prefsError.message);
    throw new Error(prefsError.message);
  }

  // Build a set of album IDs already seen by the user
  const seen = new Set((prefs ?? []).map((p) => p.album_id));
  console.log('[musicService] Already seen albums:', seen.size, Array.from(seen));

  // Fetch active albums ordered by priority and creation date
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

  // Filter out albums already seen and apply limit
  console.log('[musicService] Total albums from DB:', albums?.length ?? 0);
  
  const filtered = (albums ?? []).filter((a) => !seen.has(a.id)).slice(0, limit);
  
  console.log('[musicService] Filtered albums to show:', filtered.length, 'limit:', limit);
  
  return filtered;
}

/**
 * Stores the user's preference (like/dislike) for an album
 *
 * What it does:
 * - Inserts or updates a row in `user_album_preferences`
 *
 * Input:
 * - albumId: string → album UUID
 * - liked: boolean → true if liked, false if disliked
 *
 * Output:
 * - Promise<void>
 */
export async function submitPreference(
  albumId: string, 
  liked: boolean
): Promise<void> {
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

/**
 * Marks the music onboarding as completed for the user
 *
 * What it does:
 * - Updates `music_onboarding_done` to true in the profiles table
 *
 * Input:
 * - None
 *
 * Output:
 * - Promise<void>
 */
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

/**
 * Fetches all albums that the user marked as "liked"
 *
 * What it does:
 * - Queries user preferences
 * - Joins with the albums table
 * - Returns only liked albums
 *
 * Input:
 * - None
 *
 * Output:
 * - Promise<Album[]> → list of liked albums
 */
export async function getLikedAlbums(): Promise<Album[]> {
  const userId = await getUserId();

  // Fetch liked preferences and join album data
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

  // Extract only the album objects from the relational response
  const albums = (data ?? [])
    .map((item: any) => item.albums)
    .filter((album: any) => album !== null) as Album[];

  console.log('[musicService] Liked albums:', albums.length);
  return albums;
}

/**
 * Song entity representation
 */
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

/**
 * Fetches all songs belonging to a specific album
 *
 * What it does:
 * - Retrieves songs by album ID
 * - Orders them by track number
 *
 * Input:
 * - albumId: string → album UUID
 *
 * Output:
 * - Promise<Song[]> → ordered list of songs
 */
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
