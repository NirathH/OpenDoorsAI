export default function StatMiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4">
      <div className="text-xs text-gray-500 font-semibold mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}