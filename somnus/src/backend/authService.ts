// Authentication and profile service using Supabase
// This file centralizes all auth-related logic (sign up, sign in, profile CRUD)

import { supabase } from './supabaseClient';

export type ProfilePayload = {
  id: string; // UUID coming from Supabase Auth user
  first_name: string;
  last_name: string;
  age: number;
  email: string;
};

/**
 * Standard response for authentication-related functions
 * - success: true  -> operation completed successfully
 * - success: false -> operation failed, includes error message
 */
type AuthResponse = { success: true } | { success: false; error: string };

/**
 * Parameters required to register a user and create their profile
 */
type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
};

/**
 * Parameters required to sign in an existing user
 */
type SignInParams = {
  email: string;
  password: string;
};

/**
 * Registers a new user using Supabase Auth and creates a profile in the "profiles" table
 *
 * What it does:
 * 1. Creates a new user in Supabase Auth using email/password
 * 2. If successful, inserts a corresponding profile row in the "profiles" table
 *
 * Input:
 * - params: SignUpParams (email, password, firstName, lastName, age)
 *
 * Output:
 * - Promise<AuthResponse>
 *   - { success: true } if user and profile are created
 *   - { success: false, error } if any step fails
 */
export async function signUpWithProfile(params: SignUpParams): Promise<AuthResponse> {
  const { email, password, firstName, lastName, age } = params;

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  // If authentication fails or no user is returned, stop here
  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Unknown auth error' };
  }

  // Build profile payload using the auth user ID
  const profile: ProfilePayload = {
    id: authData.user.id,
    first_name: firstName,
    last_name: lastName,
    age,
    email,
  };

  // Insert profile into "profiles" table
  const { error: profileError } = await supabase.from('profiles').insert(profile);

  // If profile insertion fails, return error
  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true };
}

/**
 * Signs in a user using email and password
 *
 * What it does:
 * - Authenticates the user via Supabase Auth
 *
 * Input:
 * - params: SignInParams (email, password)
 *
 * Output:
 * - Promise<AuthResponse>
 *   - { success: true } if login succeeds
 *   - { success: false, error } if credentials are invalid or request fails
 */
export async function signIn(params: SignInParams): Promise<AuthResponse> {
  const { email, password } = params;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Signs out the currently authenticated user
 *
 * What it does:
 * - Ends the current Supabase Auth session
 *
 * Input:
 * - None
 *
 * Output:
 * - Promise<void>
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Retrieves the currently authenticated user and their profile
 *
 * What it does:
 * 1. Gets the authenticated user from Supabase Auth
 * 2. Fetches the corresponding profile from the "profiles" table
 *
 * Input:
 * - None
 *
 * Output:
 * - User object with profile data if available
 * - null if there is no authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user is authenticated, return null
  if (authError || !user) {
    return null;
  }

  // Fetch full profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile does not exist, return basic auth info with defaults
  if (profileError || !profile) {
    return {
      id: user.id,
      email: user.email,
      first_name: '',
      last_name: '',
      age: 0,
    };
  }

  // Return merged profile data
  return {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    age: profile.age,
  };
}

/**
 * Updates the authenticated user's email in both Auth and profiles table
 *
 * What it does:
 * 1. Updates the email in Supabase Auth
 * 2. Mirrors the email change in the "profiles" table
 *
 * Input:
 * - newEmail: string
 *
 * Output:
 * - Promise<AuthResponse>
 */
export async function updateUserEmail(newEmail: string): Promise<AuthResponse> {
  // Update email in Supabase Auth
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Get the current authenticated user
  const { 
    data: { user } 
  } = await supabase.auth.getUser();

  // Update email in profiles table if user exists
  if (user) {
    await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', user.id);
  }

  return { success: true };
}

/**
 * Updates one or more profile fields for the authenticated user
 *
 * What it does:
 * - Applies partial updates to the user's profile in the "profiles" table
 *
 * Input:
 * - updates: Partial<ProfilePayload>
 *   (only the fields you want to change)
 *
 * Output:
 * - Promise<AuthResponse>
 */
export async function updateUserProfile(updates: Partial<ProfilePayload>): Promise<AuthResponse> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no authenticated user exists, abort
  if (authError || !user) {
    return { success: false, error: 'No hay usuario autenticado' };
  }

  // Update profile data
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Deletes the user's account (partial implementation)
 *
 * What it does:
 * 1. Deletes the user's profile from the "profiles" table
 * 2. Signs the user out
 *
 * Important:
 * - Deleting the Auth user itself requires Supabase admin privileges
 * - This function currently only deletes the profile and logs the user out
 *
 * Input:
 * - None
 *
 * Output:
 * - Promise<AuthResponse>
 */
export async function deleteUserAccount(): Promise<AuthResponse> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // 1. Delete profile from "profiles" table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // Log error but do not block sign out
    if (profileError) {
      console.error('[authService] Error deleting profile:', profileError);
    }

    // 2. Sign out the user
    // Full Auth deletion would require admin privileges or an RPC function
    await supabase.auth.signOut();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar cuenta' };
  }
}
