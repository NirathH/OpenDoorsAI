"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

function enc(msg: string) {
  return encodeURIComponent(msg);
}

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/register?error=${enc("Email and password are required.")}`);
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/register?error=${enc(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/login?error=${enc("Email and password are required.")}`);
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${enc(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}