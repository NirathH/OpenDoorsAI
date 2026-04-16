import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getParticipantProfile(
  supabase: SupabaseClient,
  participantId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "user_id, full_name, role, created_at, instructor_id, job_goal, coach_notes, participant_condition"
    )
    .eq("user_id", participantId)
    .eq("role", "participant")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    notFound();
  }

  let instructorName = "Not assigned yet";

  if (profile.instructor_id) {
    const { data: instructorProfile, error: instructorError } =
      await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", profile.instructor_id)
        .maybeSingle();

    if (instructorError) {
      throw new Error(instructorError.message);
    }

    if (instructorProfile?.full_name) {
      instructorName = instructorProfile.full_name;
    }
  }

  return {
    profile,
    instructorName,
  };
}