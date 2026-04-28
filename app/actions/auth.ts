"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

function encodeMessage(message: string): string {
  return encodeURIComponent(message);
}

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "participant");

  if (!email || !password || !fullName) {
    redirect(`/register?error=${encodeMessage("All fields are required.")}`);
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
    redirect(`/register?error=${encodeMessage(error.message)}`);
  }

  if (role === "instructor") {
    redirect("/instructor/dashboard");
  }

  redirect("/participant/dashboard");
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeMessage("Email and password are required.")}`
    );
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeMessage(error.message)}`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?error=${encodeMessage("Could not get logged in user.")}`
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    redirect(
      `/login?error=${encodeMessage("Could not load user profile.")}`
    );
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

export async function updatePassword(formData: FormData): Promise<void> {
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(
      `/participant/profile?error=${encodeMessage(
        "All password fields are required."
      )}`
    );
  }

  if (newPassword !== confirmPassword) {
    redirect(
      `/participant/profile?error=${encodeMessage(
        "New passwords do not match."
      )}`
    );
  }

  if (newPassword.length < 6) {
    redirect(
      `/participant/profile?error=${encodeMessage(
        "New password must be at least 6 characters."
      )}`
    );
  }

  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    redirect(
      `/participant/profile?error=${encodeMessage(
        "Could not load current user."
      )}`
    );
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    redirect(
      `/participant/profile?error=${encodeMessage(
        "Current password is incorrect."
      )}`
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(
      `/participant/profile?error=${encodeMessage(updateError.message)}`
    );
  }

  redirect(
    `/participant/profile?success=${encodeMessage(
      "Password updated successfully."
    )}`
  );
}
export async function updateInstructorPassword(
  formData: FormData
): Promise<void> {
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const redirectPath = "/instructor/profile";

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(
      `${redirectPath}?error=${encodeMessage(
        "All password fields are required."
      )}`
    );
  }

  if (newPassword !== confirmPassword) {
    redirect(
      `${redirectPath}?error=${encodeMessage("New passwords do not match.")}`
    );
  }

  if (newPassword.length < 6) {
    redirect(
      `${redirectPath}?error=${encodeMessage(
        "New password must be at least 6 characters."
      )}`
    );
  }

  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    redirect(
      `${redirectPath}?error=${encodeMessage("Could not load current user.")}`
    );
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    redirect(
      `${redirectPath}?error=${encodeMessage("Current password is incorrect.")}`
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(`${redirectPath}?error=${encodeMessage(updateError.message)}`);
  }

  redirect(
    `${redirectPath}?success=${encodeMessage(
      "Password updated successfully."
    )}`
  );
}