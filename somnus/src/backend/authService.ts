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

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  // Obtener el perfil completo de la base de datos
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Si no hay perfil, devolver solo la info del auth
    return {
      id: user.id,
      email: user.email,
      first_name: '',
      last_name: '',
      age: 0,
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    age: profile.age,
  };
}

export async function updateUserEmail(newEmail: string): Promise<AuthResponse> {
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Actualizar también en la tabla profiles
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', user.id);
  }

  return { success: true };
}

export async function updateUserProfile(updates: Partial<ProfilePayload>): Promise<AuthResponse> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'No hay usuario autenticado' };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function deleteUserAccount(): Promise<AuthResponse> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // 1. Eliminar el perfil de la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('[authService] Error deleting profile:', profileError);
    }

    // 2. Eliminar el usuario de auth (esto requiere privilegios admin en Supabase)
    // Como alternativa, podemos solo hacer signOut y marcar el perfil como eliminado
    // O usar una función RPC en Supabase
    
    // Por ahora, hacer signOut
    await supabase.auth.signOut();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar cuenta' };
  }
}
