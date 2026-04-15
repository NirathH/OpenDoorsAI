import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

export type AssignmentEditRow = {
  id: string;
  participant_id: string;
  instructor_id: string;
  title: string;
  goal: string | null;
  participant_summary: string | null;
  instructions: string | null;
  max_minutes: number | null;
  status: string;
  due_at: string | null;
  created_at: string;
};

export async function getInstructorAssignmentForEdit(
  supabase: SupabaseClient,
  instructorId: string,
  assignmentId: string
) {
  const { data: assignmentData, error: assignmentError } = await supabase
    .from("session_assignments")
    .select(
      "id, participant_id, instructor_id, title, goal, participant_summary, instructions, max_minutes, status, due_at, created_at"
    )
    .eq("id", assignmentId)
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignmentData) {
    notFound();
  }

  const { data: participantsData, error: participantsError } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "participant")
    .eq("instructor_id", instructorId)
    .order("full_name", { ascending: true });

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  return {
    assignment: assignmentData as AssignmentEditRow,
    participants: participantsData ?? [],
  };
}