import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen bg-brand-light p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-8 border-2 border-brand-muted shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-4 text-gray-600">
          Logged in as{" "}
          <span className="font-semibold text-gray-900">
            {data.user.email}
          </span>
        </p>
      </div>
    </div>
  );
}