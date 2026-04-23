"use client";

type DoorLoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function DoorLoader({
  label = "Opening...",
  fullScreen = false,
}: DoorLoaderProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "min-h-screen bg-brand-light" : "py-10",
      ].join(" ")}
    >
      <div className="relative h-24 w-24">
        {/* Rotating circle behind the door */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
        </div>

        {/* Door frame */}
        <div className="absolute inset-0 rounded-2xl border-4 border-brand-muted bg-white shadow-sm" />

        {/* Door */}
        <div
          className="absolute left-2.5 top-2 h-[calc(100%-16px)] w-[calc(50%-10px)] rounded-l-[0.7rem] rounded-r-[0.3rem] bg-brand-secondary shadow-md origin-left animate-[doorSwing_1.4s_ease-in-out_infinite]"
        >
          {/* Door knob */}
          <div className="absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/90" />
        </div>
      </div>

      <div className="text-sm font-semibold text-gray-600 tracking-wide">
        {label}
      </div>

      <style jsx>{`
        @keyframes doorSwing {
          0%,
          100% {
            transform: perspective(200px) rotateY(0deg);
          }
          50% {
            transform: perspective(200px) rotateY(-65deg);
          }
        }
      `}</style>
    </div>
  );
}