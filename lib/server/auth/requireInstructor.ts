import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

/**
 * Minimal user shape we return to the app.
 */
type InstructorUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

/**
 * Result returned when an instructor is successfully authenticated.
 */
export type RequireInstructorResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  user: InstructorUser;
  instructorId: string;
  instructorName: string;
};

/**
 * Ensures the current user is logged in and has the instructor role.
 * If not, the user is redirected to /login.
 */
export async function requireInstructor(): Promise<RequireInstructorResult> {
  // Create the server-side Supabase client
  const supabase = await createSupabaseServer();

  // Get the currently authenticated user
  const { data: authData, error: authError } = await supabase.auth.getUser();

  // If no valid logged-in user exists, redirect to login
  if (authError || !authData.user) {
    redirect("/login");
  }

  const user = authData.user;

  // Look up the user's profile and confirm they are an instructor
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  // If the profile doesn't exist or the role is not instructor, redirect
  if (profileError || !profile || profile.role !== "instructor") {
    redirect("/login");
  }

  // Prefer the name from the profile, then fallback to auth metadata
  const instructorName =
    profile.full_name?.trim() || user.user_metadata?.full_name?.trim() || "";

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
    instructorId: user.id,
    instructorName,
  };
}