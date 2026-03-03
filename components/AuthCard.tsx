export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        <div className="mb-6">
          <div className="text-2xl font-extrabold tracking-tight">{title}</div>
          {subtitle && <div className="mt-1 text-sm text-zinc-300">{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}