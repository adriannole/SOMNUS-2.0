import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration for the app
 *
 * This file is responsible for:
 * - Reading Supabase credentials from environment variables
 * - Creating and exporting a single Supabase client instance
 *
 * Important:
 * - In Expo, only variables prefixed with EXPO_PUBLIC_ are available at runtime
 * - These values should be defined in app.config.js or app.config.ts
 */

// Supabase project URL (public)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Supabase anonymous public API key
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Warn developers if environment variables are missing.
 * The app will still run, but Supabase requests will fail.
 *
 * This is intentionally a warning (not a throw) to avoid
 * crashing the app during development or previews.
 */
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

/**
 * Shared Supabase client instance
 *
 * What it does:
 * - Initializes the Supabase client using the project URL and anon key
 * - Is reused across the entire application (auth, database, storage)
 *
 * Input:
 * - SUPABASE_URL: string
 * - SUPABASE_ANON_KEY: string
 *
 * Output:
 * - Supabase client instance
 *
 * Important:
 * - Empty strings are used as fallback to prevent runtime crashes,
 *   but requests will fail if env vars are not properly set.
 */
export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
