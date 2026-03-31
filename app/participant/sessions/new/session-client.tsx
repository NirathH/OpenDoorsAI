"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Video,
  VideoOff,
  CircleDot,
  StopCircle,
  RotateCcw,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

type EmotionScore = {
  name: string;
  score: number;
};

type VoiceMessage = {
  type?: string;
  message?: {
    content?: string;
  };
  models?: {
    prosody?: {
      scores?: Record<string, number>;
    };
  };
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function getTopEmotions(
  prosody: Record<string, number> | undefined,
  limit = 2
): EmotionScore[] {
  if (!prosody) return [];

  return Object.entries(prosody)
    .map(([name, score]) => ({ name, score: Number(score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildCompactTranscript(messages: VoiceMessage[]) {
  if (!messages || messages.length === 0) return "";

  const conversation = messages.filter(
    (msg) =>
      msg?.type === "assistant_message" || msg?.type === "user_message"
  );

  const lines: string[] = [];
  let lastQuestion = "";

  for (const msg of conversation) {
    if (msg?.type === "assistant_message") {
      lastQuestion = msg?.message?.content?.trim() || "";
      continue;
    }

    if (msg?.type === "user_message") {
      const answer = msg?.message?.content?.trim() || "(inaudible)";
      const prosody = msg?.models?.prosody?.scores;

      const topEmotions = getTopEmotions(prosody, 2);
      const emotionText =
        topEmotions.length > 0
          ? topEmotions
              .map((em) => `${em.name} ${Math.round(em.score * 100)}`)
              .join(", ")
          : "none";

      lines.push(
        `Q: ${lastQuestion || "No question detected"}\nA: ${answer}\nE: ${emotionText}`
      );
    }
  }

  return lines.join("\n\n");
}

function getCompletionMessage(durationSeconds: number) {
  if (durationSeconds < 60) {
    return {
      title: "Nice job finishing your session!",
      subtitle:
        "You showed up and completed your practice. Every session helps you grow.",
    };
  }

  if (durationSeconds < 180) {
    return {
      title: "Great work — you completed your practice session!",
      subtitle:
        "You took a strong step forward. Keep practicing and your confidence will keep growing.",
    };
  }

  return {
    title: "Excellent work — session completed!",
    subtitle:
      "You stayed engaged, finished your practice, and gave yourself another chance to improve. That matters.",
  };
}

export default function SessionClient() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/hume/token");
        const data: { accessToken?: string } = await res.json();

        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch hume token", err);
      }
    }

    fetchToken();
  }, []);

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="text-gray-500 font-medium">Loading session...</div>
      </div>
    );
  }

  return (
    <VoiceProvider clearMessagesOnDisconnect={false}>
      <SessionContent accessToken={accessToken} />
    </VoiceProvider>
  );
}

function SessionContent({ accessToken }: { accessToken: string }) {
  const { connect, disconnect, status, messages } = useVoice();
  const searchParams = useSearchParams();

  const participantId = searchParams.get("participantId");
  const assignmentId = searchParams.get("assignmentId");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camOn, setCamOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const typedMessages = messages as VoiceMessage[];

  const isRecording = status.value === "connected";
  const completionContent = getCompletionMessage(seconds);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        setError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (cancelled) return;

        streamRef.current = stream;
        stream.getVideoTracks().forEach((t) => {
          t.enabled = camOn;
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : "Could not access camera. Please allow permissions.";

        setError(message);
      }
    }

    setup();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [camOn]);

  useEffect(() => {
    if (!isRecording) return;

    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach((t) => {
      t.enabled = camOn;
    });
  }, [camOn]);

  async function startRecording() {
    try {
      setError(null);

      const createRes = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        assignmentId: assignmentId ?? null,
        title: "Practice Session",
        humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID ?? null,
      }),
      });

      const createData: { sessionId?: string; error?: string } =
        await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create session");
      }

      if (!createData.sessionId) {
        throw new Error("Session was created but no sessionId was returned.");
      }

      setSessionId(createData.sessionId);
      setIsFinished(false);
      setSeconds(0);

      await connect({
        auth: { type: "accessToken", value: accessToken },
        configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID || undefined,
      });
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to start session";
      setError(message);
    }
  }

  async function stopRecording() {
    if (!sessionId) {
      setError("No sessionId found. Could not complete session.");
      return;
    }

    try {
      setIsSavingSession(true);
      setError(null);

      const frozenMessages = [...typedMessages];
      const compactTranscript = buildCompactTranscript(frozenMessages);

      await disconnect();
      setIsFinished(true);

      const completeRes = await fetch("/api/sessions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          compactTranscript,
          durationSeconds: seconds,
          transcriptStatus: "completed",
        }),
      });

      const completeData: { error?: string } = await completeRes.json();

      if (!completeRes.ok) {
        throw new Error(completeData.error || "Failed to complete session");
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to save session";
      setError(message);
    } finally {
      setIsSavingSession(false);
    }
  }

  async function resetSession() {
    await disconnect();
    setIsFinished(false);
    setSeconds(0);
    setError(null);
    setSessionId(null);
    setIsSavingSession(false);
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[760px] bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-brand-muted bg-white shadow-sm mb-6">
              <Image
                src="/logo-submark.png"
                alt="OpenDoorsAI"
                fill
                className="object-contain p-2"
                priority
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-semibold mb-5">
              <CheckCircle2 size={16} />
              Session Completed
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              {completionContent.title}
            </h1>

            <p className="mt-4 max-w-[560px] text-gray-600 font-medium leading-relaxed">
              {completionContent.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {sessionId && (
                <Link
                  href={`/participant/sessions/${sessionId}`}
                  className="inline-flex items-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md"
                >
                  See My Summary
                </Link>
              )}

              <button
                onClick={resetSession}
                className="inline-flex items-center gap-2 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <RotateCcw size={18} className="text-brand-primary" />
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pb-20">
      <div className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b-2 border-brand-muted">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/participant/sessions"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors"
            >
              <ChevronLeft size={18} className="text-brand-primary" />
              <span className="text-sm font-semibold text-gray-800">
                Sessions
              </span>
            </Link>

            <div className="text-gray-900 font-extrabold text-lg">
              Practice Session
            </div>
            <div className="hidden md:block text-sm text-gray-500 font-medium">
              Conversation with AI Reviewer
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
              {isSavingSession
                ? "Saving"
                : isRecording
                ? "Recording"
                : status.value}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-brand-muted bg-white text-gray-900">
              {formatTime(seconds)}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 grid lg:grid-cols-[1fr_420px] gap-8">
        <section className="flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Camera Preview
                </h1>
                <p className="text-gray-600 font-medium mt-1">
                  When you’re ready, press{" "}
                  <span className="font-semibold">Start</span> to connect with
                  the AI.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ToggleBtn
                  active={camOn}
                  onClick={() => setCamOn((v) => !v)}
                  iconOn={<Video size={18} />}
                  iconOff={<VideoOff size={18} />}
                  label="Cam"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="mt-6 relative overflow-hidden rounded-[1.5rem] border-2 border-brand-muted bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 border border-brand-muted text-xs font-semibold text-gray-800">
                  You
                </div>

                {isRecording && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 border border-brand-muted text-xs font-extrabold text-red-600 inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full animate-pulse bg-red-500" />
                    LIVE
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={status.value === "connecting" || isSavingSession}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary disabled:opacity-50 text-white font-extrabold py-4 rounded-xl transition-colors shadow-md"
                >
                  <CircleDot size={18} />
                  {status.value === "connecting"
                    ? "Connecting..."
                    : "Start Conversation"}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  disabled={isSavingSession}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-xl transition-colors shadow-md"
                >
                  <StopCircle size={18} />
                  {isSavingSession ? "Saving Session..." : "Finish Session"}
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8 h-fit">
          <h2 className="text-xl font-extrabold text-gray-900">
            Session Goal
          </h2>
          <p className="text-gray-600 font-medium mt-2">
            Practice answering clearly and confidently.
          </p>

          <div className="mt-5 rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              Prompt
            </div>
            <div className="text-gray-900 font-extrabold">
              “Tell me about yourself.”
            </div>
            <div className="mt-3 text-sm text-gray-700 font-medium leading-relaxed">
              Try a 3-part structure:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Who you are</li>
                <li>What you do / what you’re good at</li>
                <li>Why you’re a fit / what you want next</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-extrabold text-gray-900">
              Quick tips
            </div>
            <div className="mt-3 space-y-2">
              <Tip text="Slow down slightly — clarity beats speed." />
              <Tip text="Pause instead of saying ‘um’." />
              <Tip text="End with a confident closing sentence." />
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-extrabold text-gray-900">
              How to use AI
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 font-medium list-disc ml-5">
              <li>Click Start Connection to connect to the EVI</li>
              <li>Wait for it to ask the question</li>
              <li>Answer clearly into your microphone</li>
              <li>When you are done, let it respond</li>
              <li>Click Finish Session when you are done</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  iconOn,
  iconOff,
  label,
}: {
  active: boolean;
  onClick: () => void;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-colors " +
        (active
          ? "bg-brand-light border-brand-muted text-gray-900"
          : "bg-white border-brand-muted text-gray-500")
      }
      title={label}
    >
      <span className={active ? "text-brand-primary" : "text-gray-400"}>
        {active ? iconOn : iconOff}
      </span>
      <span className="hidden md:block text-sm font-semibold">{label}</span>
    </button>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-white p-4 text-sm text-gray-700 font-medium">
      {text}
    </div>
  );
}