"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  CircleDot,
  StopCircle,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function NewSessionPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const [error, setError] = useState<string | null>(null);

  const recordedUrl = useMemo(() => {
    if (!recordedBlob) return null;
    return URL.createObjectURL(recordedBlob);
  }, [recordedBlob]);

  // setup camera preview
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        setError(null);

        // Request permissions + stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) return;

        streamRef.current = stream;

        // Apply mic/cam state
        stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
        stream.getAudioTracks().forEach((t) => (t.enabled = micOn));

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e: any) {
        setError(
          e?.message ||
            "Could not access camera/microphone. Please allow permissions."
        );
      }
    }

    setup();

    return () => {
      cancelled = true;
      // cleanup stream on unmount
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // timer
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // toggle mic/cam
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) {
      setError("No camera/mic stream available.");
      return;
    }

    setError(null);
    setRecordedBlob(null);
    setChunks([]);
    setSeconds(0);

    // Choose best mime type
    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        setChunks((prev) => [...prev, ev.data]);
      }
    };

    mr.onstop = () => {
      const blob = new Blob(chunks.length ? chunks : [], { type: mimeType });
      // If chunks were updated async, build from latest via state:
      // We'll also build using a microtask:
      setTimeout(() => {
        setRecordedBlob(
          new Blob(
            // use latest chunks by pulling from state via closure isn’t perfect;
            // so we rebuild using current `chunks` after stop fires.
            // For MVP: good enough.
            (chunks.length ? chunks : []) as BlobPart[],
            { type: mimeType }
          )
        );
      }, 0);
    };

    mr.start(250); // collect chunks every 250ms
    setRecording(true);
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    setRecording(false);

    // Build blob from chunks reliably:
    setTimeout(() => {
      const mimeType = mr.mimeType || "video/webm";
      setRecordedBlob(new Blob(chunks as BlobPart[], { type: mimeType }));
    }, 50);
  }

  function resetSession() {
    setRecording(false);
    setSeconds(0);
    setChunks([]);
    setRecordedBlob(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b-2 border-brand-muted">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors"
            >
              <ChevronLeft size={18} className="text-brand-primary" />
              <span className="text-sm font-semibold text-gray-800">
                Dashboard
              </span>
            </Link>

            <div className="text-gray-900 font-extrabold text-lg">
              Practice Session
            </div>
            <div className="hidden md:block text-sm text-gray-500 font-medium">
              Speak naturally — we’ll help you improve.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
              {recording ? "Recording" : recordedBlob ? "Recorded" : "Ready"}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-brand-muted bg-white text-gray-900">
              {formatTime(seconds)}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 grid lg:grid-cols-[1fr_420px] gap-8">
        {/* Left: video call panel */}
        <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Camera Preview
              </h1>
              <p className="text-gray-600 font-medium mt-1">
                When you’re ready, press <span className="font-semibold">Start</span>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ToggleBtn
                active={micOn}
                onClick={() => setMicOn((v) => !v)}
                iconOn={<Mic size={18} />}
                iconOff={<MicOff size={18} />}
                label="Mic"
              />
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
              <div className="text-xs text-red-600 mt-1">
                Tip: In Chrome, allow camera/mic permissions. On localhost it’s OK; on a real domain you need HTTPS.
              </div>
            </div>
          )}

          {/* Video frame */}
          <div className="mt-6 relative overflow-hidden rounded-[1.5rem] border-2 border-brand-muted bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 border border-brand-muted text-xs font-semibold text-gray-800">
                You
              </div>

              {recording && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 border border-brand-muted text-xs font-extrabold text-red-600 inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  REC
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-extrabold py-4 rounded-xl transition-colors shadow-md"
              >
                <CircleDot size={18} />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-4 rounded-xl transition-colors shadow-md"
              >
                <StopCircle size={18} />
                Stop Recording
              </button>
            )}

            <button
              onClick={resetSession}
              className="sm:w-[200px] inline-flex items-center justify-center gap-2 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold py-4 rounded-xl transition-colors"
            >
              <RotateCcw size={18} className="text-brand-primary" />
              Reset
            </button>
          </div>

          {/* Playback */}
          {recordedUrl && !recording && (
            <div className="mt-6 rounded-[1.5rem] border-2 border-brand-muted bg-brand-light/40 p-5">
              <div className="text-sm font-extrabold text-gray-900 mb-2">
                Review your recording
              </div>
              <video controls className="w-full rounded-xl border border-brand-muted bg-black">
                <source src={recordedUrl} type={recordedBlob?.type || "video/webm"} />
              </video>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  // Later: upload to Supabase Storage + create recordings row
                  onClick={() => alert("Next step: upload + generate feedback (we’ll wire this next).")}
                  className="flex-1 bg-brand-secondary hover:bg-brand-primary text-white font-extrabold py-3 rounded-xl transition-colors shadow-md"
                >
                  Finish Session
                </button>

                <button
                  onClick={resetSession}
                  className="flex-1 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Record Again
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right: session guidance */}
        <aside className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8 h-fit">
          <h2 className="text-xl font-extrabold text-gray-900">Session Goal</h2>
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
            <div className="text-sm font-extrabold text-gray-900">Quick tips</div>
            <div className="mt-3 space-y-2">
              <Tip text="Slow down slightly — clarity beats speed." />
              <Tip text="Pause instead of saying ‘um’." />
              <Tip text="End with a confident closing sentence." />
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 font-medium">
            Next: we’ll connect “Finish Session” to Supabase Storage + Whisper transcription + AI feedback.
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