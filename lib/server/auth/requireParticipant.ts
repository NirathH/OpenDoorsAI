import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

/**
 * Minimal participant user shape returned to the app.
 */
type ParticipantUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

/**
 * Result returned when a participant is successfully authenticated.
 */
export type RequireParticipantResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  user: ParticipantUser;
  participantId: string;
  participantName: string;
};

/**
 * Ensures the current user is logged in and has the participant role.
 * If not, redirects to /login.
 */
export async function requireParticipant(): Promise<RequireParticipantResult> {
  // Create the server-side Supabase client
  const supabase = await createSupabaseServer();

  // Get the currently logged-in auth user
  const { data: authData, error: authError } = await supabase.auth.getUser();

  // If auth fails or there is no user, redirect
  if (authError || !authData.user) {
    redirect("/login");
  }

  const user = authData.user;

  // Look up the user's profile and confirm the role is participant
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  // If no valid participant profile exists, redirect
  if (profileError || !profile || profile.role !== "participant") {
    redirect("/login");
  }

  // Prefer profile full_name, then fallback to auth metadata
  const participantName =
    profile.full_name?.trim() || user.user_metadata?.full_name?.trim() || "User";

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
    participantId: user.id,
    participantName,
  };
}