import { NextResponse } from "next/server";
import { fetchAccessToken } from "hume";

/**
 * GET /api/...
 *
 * Purpose:
 * - Generate a temporary Hume access token
 * - Send it to the frontend so it can use Hume safely
 *
 * Why?
 * - You NEVER expose your secret key to the frontend
 * - Instead, you generate short-lived tokens on the server
 */
export async function GET() {
  // Read Hume credentials from environment variables
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;

  /**
   * Step 1: Validate environment variables
   */
  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: "Hume API keys are not configured" },
      { status: 500 }
    );
  }

  try {
    /**
     * Step 2: Request a temporary access token from Hume
     */
    const accessToken = await fetchAccessToken({
      apiKey,
      secretKey,
    });

    /**
     * Step 3: Validate token response
     */
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to fetch access token" },
        { status: 500 }
      );
    }

    /**
     * Step 4: Return token to client
     */
    return NextResponse.json({
      accessToken,
    });
  } catch (error) {
    console.error("Error fetching Hume token:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}