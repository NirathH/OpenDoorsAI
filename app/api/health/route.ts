import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Forces this route to run on Node.js (not edge runtime).
 * Needed because Supabase Admin client requires Node environment.
 */
export const runtime = "nodejs";

/**
 * GET /api/...
 *
 * Purpose:
 * - Simple health check for Supabase connection
 * - Verifies we can query the "sessions" table
 */
export async function GET() {
  // Try to fetch 1 session record (just to test DB access)
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .limit(1);

  // If query fails → return error response
  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  // If successful → return sample data
  return NextResponse.json({
    ok: true,
    sample: data ?? [],
  });
}