import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

export async function getParticipantProfile(
  supabase: SupabaseClient,
  participantId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "user_id, full_name, role, created_at, instructor_id, job_goal, coach_notes"
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
    const { data: instructorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", profile.instructor_id)
      .maybeSingle();

    if (instructorProfile?.full_name) {
      instructorName = instructorProfile.full_name;
    }
  }

  return {
    profile,
    instructorName,
  };
}