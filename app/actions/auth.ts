"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

/**
 * Encodes error messages so they can safely go into the URL.
 * Example:
 * "Email is required" -> "Email%20is%20required"
 */
function encodeMessage(message: string): string {
  return encodeURIComponent(message);
}

/**
 * Signs up a new user using form data from the register form.
 *
 * Expected fields:
 * - email
 * - password
 * - full_name
 * - role
 *
 * After signup:
 * - instructor -> instructor dashboard
 * - participant -> participant dashboard
 */
export async function signUp(formData: FormData): Promise<void> {
  // Read and clean values from the form
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();

  // Default role is participant if none is provided
  const role = String(formData.get("role") || "participant");

  // Basic validation
  if (!email || !password || !fullName) {
    redirect(`/register?error=${encodeMessage("All fields are required.")}`);
  }

  // Create the server-side Supabase client
  const supabase = await createSupabaseServer();

  // Create the auth user in Supabase
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

  // If signup fails, send user back to register page with error
  if (error) {
    redirect(`/register?error=${encodeMessage(error.message)}`);
  }

  /**
   * Note:
   * If email confirmation is enabled in Supabase,
   * the user may need to verify their email first.
   *
   * For MVP / email confirmation off,
   * the user can continue directly.
   */

  // Send user to the correct dashboard based on role
  if (role === "instructor") {
    redirect("/instructor/dashboard");
  }

  redirect("/participant/dashboard");
}

/**
 * Signs in an existing user using email and password.
 *
 * Expected fields:
 * - email
 * - password
 *
 * After login:
 * - loads the user's profile
 * - checks the role
 * - redirects to the correct dashboard
 */
export async function signIn(formData: FormData): Promise<void> {
  // Read and clean values from the form
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  // Basic validation
  if (!email || !password) {
    redirect(
      `/login?error=${encodeMessage("Email and password are required.")}`
    );
  }

  // Create the server-side Supabase client
  const supabase = await createSupabaseServer();

  // Sign in with Supabase auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If login fails, send user back to login page with error
  if (error) {
    redirect(`/login?error=${encodeMessage(error.message)}`);
  }

  // Get the logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // If user cannot be loaded, redirect with error
  if (userError || !user) {
    redirect(
      `/login?error=${encodeMessage("Could not get logged in user.")}`
    );
  }

  // Load the user's profile so we can check their role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // If profile cannot be found, redirect with error
  if (profileError || !profile) {
    redirect(
      `/login?error=${encodeMessage("Could not load user profile.")}`
    );
  }

  // Redirect based on role
  if (profile.role === "instructor") {
    redirect("/instructor/dashboard");
  }

  redirect("/participant/dashboard");
}

/**
 * Logs out the current user and sends them back to the login page.
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();

  await supabase.auth.signOut();

  redirect("/login");
}