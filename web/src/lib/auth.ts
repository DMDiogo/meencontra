import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export type UserRole = "cliente" | "dono" | "admin";

export type Profile = {
  id: string;
  nome: string;
  telefone: string | null;
  role: UserRole;
};

export async function getCurrentProfile(): Promise<{ user: User; profile: Profile } | null> {
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, telefone, role")
    .eq("id", authData.user.id)
    .single();
  if (error) throw error;

  return {
    user: authData.user,
    profile: data as Profile,
  };
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  try {
    const current = await getCurrentProfile();
    if (!current) throw new Error("Não foi possível carregar o perfil desta conta.");
    return current.profile;
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

export async function signUp(input: {
  email: string;
  password: string;
  nome: string;
  role: "cliente" | "dono";
}): Promise<{ profile: Profile | null; needsConfirmation: boolean }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        nome: input.nome,
        role: input.role,
      },
    },
  });
  if (error) throw error;
  if (!data.session) return { profile: null, needsConfirmation: true };

  const current = await getCurrentProfile();
  if (!current) throw new Error("A conta foi criada, mas o perfil não foi encontrado.");
  return { profile: current.profile, needsConfirmation: false };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}
