require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, status, created_at, feedback(id, feedback_json)")
    .order("created_at", { ascending: false })
    .limit(3);
    
  if (error) console.error(error);
  console.dir(data, { depth: null });
}
check();
