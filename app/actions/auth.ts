"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

function enc(msg: string) {
  return encodeURIComponent(msg);
}

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "participant");

  if (!email || !password || !fullName) {
    redirect(`/register?error=${enc("All fields are required.")}`);
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    redirect(`/register?error=${enc(error.message)}`);
  }

  // If email confirmation is ON, user may need to verify first.
  // For MVP with confirmation OFF, this will go straight through.
  if (role === "instructor") {
    redirect("/instructor/dashboard");
  }

  redirect("/participant/dashboard");
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/login?error=${enc("Email and password are required.")}`);
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${enc(error.message)}`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/login?error=${enc("Could not get logged in user.")}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    redirect(`/login?error=${enc("Could not load user profile.")}`);
  }

  if (profile.role === "instructor") {
    redirect("/instructor/dashboard");
  }

  redirect("/participant/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}