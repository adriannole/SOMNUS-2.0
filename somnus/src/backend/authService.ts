import { supabase } from './supabaseClient';

export type ProfilePayload = {
  id: string; // uuid from auth user
  first_name: string;
  last_name: string;
  age: number;
  email: string;
};

type AuthResponse = { success: true } | { success: false; error: string };

type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
};

type SignInParams = {
  email: string;
  password: string;
};

export async function signUpWithProfile(params: SignUpParams): Promise<AuthResponse> {
  const { email, password, firstName, lastName, age } = params;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Unknown auth error' };
  }

  const profile: ProfilePayload = {
    id: authData.user.id,
    first_name: firstName,
    last_name: lastName,
    age,
    email,
  };

  const { error: profileError } = await supabase.from('profiles').insert(profile);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true };
}

export async function signIn(params: SignInParams): Promise<AuthResponse> {
  const { email, password } = params;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
