import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

type GeneratedPromptPayload = {
  scenario: string;
  systemPrompt: string;
  quickTips: string[];
};

export async function POST(req: NextRequest) {
  let assignmentTitle: string | null = null;

  try {
    const { assignmentId, participantId } = await req.json();

    let goal = "Practice answering interview questions clearly and concisely.";
    let instructions = "Conduct a general practice interview.";
    let participantContext = "";

    // Fetch Assignment Details
    if (assignmentId) {
      const { data: assignment } = await supabase
        .from("session_assignments")
        .select("goal, instructions, title")
        .eq("id", assignmentId)
        .maybeSingle();

      if (assignment) {
        assignmentTitle = assignment.title ?? null;
        if (assignment.goal) goal = assignment.goal;
        if (assignment.instructions) instructions = assignment.instructions;
      }
    }

    // Fetch Participant Details (Optional but helpful for custom persona)
    if (participantId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("job_goal, participant_condition")
        .eq("user_id", participantId)
        .maybeSingle();

      if (profile) {
        if (profile.job_goal) {
          participantContext += `\nParticipant's target job role: ${profile.job_goal}.`;
        }
        if (profile.participant_condition) {
          participantContext += `\nParticipant background/needs: ${profile.participant_condition}.`;
        }
      }
    }

    const openAiPrompt = `
You are an expert prompt engineer and interviewer and a coach. 

An instructor wants to run a practice mock-interview roleplay session for a neurodiverse participant.
Your job is to generate a tailored scenario, a direct system prompt for the AI interviewer agent, and 3 quick tips for the participant.

Assignment Details:
Goal: ${goal}
Instructions: ${instructions}
${participantContext}

Output MUST be a valid JSON object matching this exact shape:
{
  "scenario": "A brief 2-3 sentence description of the scenario presented to the participant so they know what they are walking into.",
  "system_prompt": "The detailed instructions that act as the system prompt for the AI agent (e.g. 'You are a hiring manager for... Your personality should be... Make sure to ask questions related to...'). Base this entirely on the Assignment Details provided.",
  "quick_tips": [
    "Tip 1...",
    "Tip 2...",
    "Tip 3..."
  ]
}

- Keep the scenario clear and accessible.
- The system_prompt should explicitly instruct the AI on how to behave, what questions to ask first, and how they should push or support the user. It should directly execute the instructor's goal.
- Quick tips should be short, practical 1-sentence pieces of advice (e.g. "Take a breath before answering," "Focus on answering exactly what was asked.").
`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // can be gpt-4o-mini or gpt-4.1-mini
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert AI configuration assistant. You output perfectly valid JSON.",
        },
        {
          role: "user",
          content: openAiPrompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("No response generated from OpenAI");
    }

    const parsed = JSON.parse(raw);
    
    const payload: GeneratedPromptPayload = {
      scenario: parsed.scenario || "Welcome to your practice session. Read the goal carefully, then press Start to begin the mock interview.",
      systemPrompt: parsed.system_prompt || "You are a helpful and supportive AI interview coach conducting a mock interview. Be encouraging, ask clear questions one at a time, and listen patiently.",
      quickTips: Array.isArray(parsed.quick_tips) 
        ? parsed.quick_tips.filter((t: unknown) => typeof t === "string").slice(0, 3)
        : [
            "Take your time before answering.",
            "Speak clearly into the microphone.",
            "It is okay to pause and think."
          ]
    };

    return NextResponse.json({ success: true, payload });
  } catch (error) {
    console.error("Error generating prompt:", error);
    
    // Provide a safe fallback on error
    const fallbackPayload: GeneratedPromptPayload = {
      scenario: "Welcome to your general practice session. The AI will ask you some introductory questions.",
      systemPrompt: "You are a helpful AI interview coach conducting a general practice interview. Keep your questions simple and supportive.",
      quickTips: [
        "Take a deep breath and start when ready.",
        "Answer naturally.",
        "End with a clear, confident statement."
      ]
    };
    
    return NextResponse.json(
      { success: false, error: "Failed to generate prompt", payload: fallbackPayload, title: assignmentTitle },
      { status: 500 }
    );
  }
}
