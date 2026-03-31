import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

type InstructorUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

export type RequireInstructorResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  user: InstructorUser;
  instructorId: string;
  instructorName: string;
};

export async function requireInstructor(): Promise<RequireInstructorResult> {
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

  if (profileError || !profile || profile.role !== "instructor") {
    redirect("/login");
  }

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