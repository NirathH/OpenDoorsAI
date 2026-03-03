import { NextResponse } from "next/server";
import { fetchAccessToken } from "hume";

export async function GET() {
    const apiKey = process.env.HUME_API_KEY;
    const secretKey = process.env.HUME_SECRET_KEY;

    if (!apiKey || !secretKey) {
        return NextResponse.json(
            { error: "Hume API keys are not configured" },
            { status: 500 }
        );
    }

    try {
        const accessToken = await fetchAccessToken({
            apiKey: apiKey,
            secretKey: secretKey,
        });

        if (!accessToken) {
            return NextResponse.json(
                { error: "Failed to fetch access token" },
                { status: 500 }
            );
        }

        return NextResponse.json({ accessToken });
    } catch (error) {
        console.error("Error fetching Hume token:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
