import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

type ParticipantUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

export type RequireParticipantResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  user: ParticipantUser;
  participantId: string;
  participantName: string;
};

export async function requireParticipant(): Promise<RequireParticipantResult> {
  const supabase = await createSupabaseServer();

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const user = authData.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "participant") {
    redirect("/login");
  }

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