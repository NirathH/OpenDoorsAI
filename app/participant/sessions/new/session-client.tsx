"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Video,
    VideoOff,
    CircleDot,
    StopCircle,
    RotateCcw,
    ChevronLeft,
} from "lucide-react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

type EmotionScore = {
    name: string;
    score: number;
};

type QAItem = {
    question: string;
    answer: string;
    emotions: EmotionScore[];
};

function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// Keep only the strongest emotions so the UI stays clean
// and the saved transcript stays compact for later LLM analysis.
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

// Build a compact transcript string for DB storage.
// We intentionally keep only:
// - question
// - answer
// - top emotions
//
// Example:
// Q: Tell me about yourself.
// A: I am a senior CS student...
// E: confidence 74, calmness 61
function buildCompactTranscript(messages: any[]) {
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
            const prosody = msg?.models?.prosody?.scores as
                | Record<string, number>
                | undefined;

            const topEmotions = getTopEmotions(prosody, 2);
            const emotionText =
                topEmotions.length > 0
                    ? topEmotions
                          .map(
                              (em) =>
                                  `${em.name} ${Math.round(em.score * 100)}`
                          )
                          .join(", ")
                    : "none";

            lines.push(
                `Q: ${lastQuestion || "No question detected"}\nA: ${answer}\nE: ${emotionText}`
            );
        }
    }

    return lines.join("\n\n");
}

// Build clean question/answer result cards for the user.
// We do not show the full transcript in the UI.
function buildQAItems(messages: any[]): QAItem[] {
    if (!messages || messages.length === 0) return [];

    const conversation = messages.filter(
        (msg) =>
            msg?.type === "assistant_message" || msg?.type === "user_message"
    );

    const items: QAItem[] = [];
    let lastQuestion = "";

    for (const msg of conversation) {
        if (msg?.type === "assistant_message") {
            lastQuestion = msg?.message?.content?.trim() || "";
            continue;
        }

        if (msg?.type === "user_message") {
            const answer = msg?.message?.content?.trim() || "(inaudible)";
            const prosody = msg?.models?.prosody?.scores as
                | Record<string, number>
                | undefined;

            items.push({
                question: lastQuestion || "No question detected",
                answer,
                emotions: getTopEmotions(prosody, 3),
            });
        }
    }

    return items;
}

export default function SessionClient() {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // Fetch Hume access token once when the page loads.
    useEffect(() => {
        async function fetchToken() {
            try {
                const res = await fetch("/api/hume/token");
                const data = await res.json();

                if (data.accessToken) {
                    setAccessToken(data.accessToken);
                }
            } catch (err) {
                console.error("Failed to fetch hume token", err);
            }
        }

        fetchToken();
    }, []);

    if (!accessToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-light">
                <div className="text-gray-500 font-medium">
                    Loading session...
                </div>
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

    // Read values passed from the participant dashboard.
    // Example:
    // /sessions/new?participantId=abc123
    // /sessions/new?participantId=abc123&assignmentId=xyz789
    const participantId = searchParams.get("participantId");
    const assignmentId = searchParams.get("assignmentId");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [camOn, setCamOn] = useState(true);
    const [seconds, setSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [isFinished, setIsFinished] = useState(false);
    const [isSavingSession, setIsSavingSession] = useState(false);

    // Stores frozen Hume messages after the session ends.
    // We use these to build the question/response feedback cards.
    const [finalMessages, setFinalMessages] = useState<any[]>([]);

    // Stores the DB session id returned by /api/sessions/create.
    const [sessionId, setSessionId] = useState<string | null>(null);

    const isRecording = status.value === "connected";

    // Set up local webcam preview.
    // Hume handles the mic and live conversation separately.
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
                stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e: any) {
                setError(
                    e?.message ||
                        "Could not access camera. Please allow permissions."
                );
            }
        }

        setup();

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, []);

    // Session timer runs only while the Hume connection is active.
    useEffect(() => {
        if (!isRecording) return;

        const id = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [isRecording]);

    // Turn the local camera track on/off when the toggle changes.
    useEffect(() => {
        const stream = streamRef.current;
        if (!stream) return;

        stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
    }, [camOn]);

    async function startRecording() {
        try {
            setError(null);

            if (!participantId) {
                setError(
                    "Missing participantId in URL. Please start the session from the participant dashboard."
                );
                return;
            }

            // Create the session row in the database before connecting to Hume.
            const createRes = await fetch("/api/sessions/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    participantId,
                    assignmentId: assignmentId ?? null,
                    title: "Practice Session",
                    humeConfigId:
                        process.env.NEXT_PUBLIC_HUME_CONFIG_ID ?? null,
                }),
            });

            const createData = await createRes.json();

            if (!createRes.ok) {
                throw new Error(
                    createData.error || "Failed to create session"
                );
            }

            const newSessionId = createData.sessionId as string;
            setSessionId(newSessionId);

            // Reset previous session UI state.
            setIsFinished(false);
            setFinalMessages([]);
            setSeconds(0);

            // Start the live Hume conversation.
            await connect({
                auth: { type: "accessToken", value: accessToken },
                configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID || undefined,
            });
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to start session");
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

            // Freeze the Hume messages first so they do not change while saving.
            const frozenMessages = [...messages];
            setFinalMessages(frozenMessages);

            // Build the compact transcript we want to save to the database.
            const compactTranscript = buildCompactTranscript(frozenMessages);

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

            const completeData = await completeRes.json();

            if (!completeRes.ok) {
                throw new Error(
                    completeData.error || "Failed to complete session"
                );
            }

            await disconnect();
            setIsFinished(true);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to save session");
        } finally {
            setIsSavingSession(false);
        }
    }

    async function resetSession() {
        await disconnect();
        setIsFinished(false);
        setFinalMessages([]);
        setSeconds(0);
        setError(null);
        setSessionId(null);
        setIsSavingSession(false);
    }

    // Build the clean UI result cards from the final Hume messages.
    const qaItems = buildQAItems(finalMessages);

    return (
        <div className="min-h-screen bg-brand-light pb-20">
            {/* Top bar */}
            <div className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b-2 border-brand-muted">
                <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/participant/dashboard"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors"
                        >
                            <ChevronLeft
                                size={18}
                                className="text-brand-primary"
                            />
                            <span className="text-sm font-semibold text-gray-800">
                                Dashboard
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
                                : isFinished
                                ? "Finished"
                                : status.value}
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-brand-muted bg-white text-gray-900">
                            {formatTime(seconds)}
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto p-6 md:p-8 grid lg:grid-cols-[1fr_420px] gap-8">
                {/* Left: main session area */}
                <section className="flex flex-col gap-6">
                    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900">
                                    Camera Preview
                                </h1>
                                <p className="text-gray-600 font-medium mt-1">
                                    When you’re ready, press{" "}
                                    <span className="font-semibold">Start</span>{" "}
                                    to connect with the AI.
                                </p>
                            </div>

                            {/* Toggle only affects local webcam preview */}
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

                        {/* Show any camera/session errors */}
                        {error && (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {/* Local video preview */}
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

                        {/* Main controls */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            {!isRecording && !isFinished ? (
                                <button
                                    onClick={startRecording}
                                    disabled={
                                        status.value === "connecting" ||
                                        isSavingSession
                                    }
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary disabled:opacity-50 text-white font-extrabold py-4 rounded-xl transition-colors shadow-md"
                                >
                                    <CircleDot size={18} />
                                    {status.value === "connecting"
                                        ? "Connecting..."
                                        : "Start Conversation"}
                                </button>
                            ) : isRecording ? (
                                <button
                                    onClick={stopRecording}
                                    disabled={isSavingSession}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-xl transition-colors shadow-md"
                                >
                                    <StopCircle size={18} />
                                    {isSavingSession
                                        ? "Saving Session..."
                                        : "Finish Session"}
                                </button>
                            ) : null}

                            {isFinished && (
                                <button
                                    onClick={resetSession}
                                    className="sm:w-[200px] inline-flex items-center justify-center gap-2 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold py-4 rounded-xl transition-colors"
                                >
                                    <RotateCcw
                                        size={18}
                                        className="text-brand-primary"
                                    />
                                    Restart
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results section:
                       Show question/response cards only.
                       The compact transcript is saved to DB, not displayed here. */}
                    {isFinished && (
                        <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                                Session Results
                            </h2>

                            <div className="space-y-6">
                                {qaItems.length === 0 ? (
                                    <p className="text-gray-500 font-medium">
                                        No conversation recorded.
                                    </p>
                                ) : (
                                    qaItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-2xl border-2 border-brand-muted bg-brand-light p-5"
                                        >
                                            <div className="text-xs font-semibold text-gray-500 mb-1">
                                                Question:
                                            </div>
                                            <div className="text-gray-900 font-semibold mb-4">
                                                {item.question}
                                            </div>

                                            <div className="text-xs font-semibold text-gray-500 mb-1">
                                                Your response:
                                            </div>
                                            <div className="text-gray-900 font-medium mb-4">
                                                "{item.answer}"
                                            </div>

                                            {item.emotions.length > 0 && (
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 mb-2">
                                                        Expression Analysis:
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.emotions.map(
                                                            (em) => (
                                                                <div
                                                                    key={
                                                                        em.name
                                                                    }
                                                                    className="px-3 py-1 bg-white border border-brand-muted rounded-full text-xs font-semibold flex items-center gap-2"
                                                                >
                                                                    <span className="text-gray-700 capitalize">
                                                                        {
                                                                            em.name
                                                                        }
                                                                    </span>
                                                                    <span className="text-brand-primary">
                                                                        {(
                                                                            em.score *
                                                                            100
                                                                        ).toFixed(
                                                                            0
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Right sidebar */}
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
                            <li>When you're done, let it respond</li>
                            <li>
                                Click Finish Session to save and see your
                                analysis
                            </li>
                        </ul>
                    </div>

                    {/* Helpful debug/status info while building */}
                    <div className="mt-6 rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-4">
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                            Participant ID
                        </div>
                        <div className="text-sm font-mono text-gray-800 break-all">
                            {participantId || "Missing from URL"}
                        </div>
                    </div>

                    {assignmentId && (
                        <div className="mt-4 rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-4">
                            <div className="text-xs font-semibold text-gray-500 mb-1">
                                Assignment ID
                            </div>
                            <div className="text-sm font-mono text-gray-800 break-all">
                                {assignmentId}
                            </div>
                        </div>
                    )}

                    {sessionId && (
                        <div className="mt-4 rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-4">
                            <div className="text-xs font-semibold text-gray-500 mb-1">
                                Active Session ID
                            </div>
                            <div className="text-sm font-mono text-gray-800 break-all">
                                {sessionId}
                            </div>
                        </div>
                    )}
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
            <span className="hidden md:block text-sm font-semibold">
                {label}
            </span>
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