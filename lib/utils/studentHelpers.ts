export type DerivedStudentStatus =
  | "Active"
  | "Needs Attention"
  | "Inactive"
  | "New";

export function formatDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatShortDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getStatusClasses(status: DerivedStudentStatus) {
  if (status === "Active") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "Needs Attention") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (status === "Inactive") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function differenceInDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function calculateStreak(sessionDates: string[]) {
  if (sessionDates.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(
      sessionDates.map((d) => {
        const date = new Date(d);
        return startOfDay(date).toISOString();
      })
    )
  )
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDays.length === 0) return 0;

  let streak = 1;

  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = uniqueDays[i];
    const next = uniqueDays[i + 1];
    const diff = differenceInDays(current, next);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function deriveStatus(
  lastSessionAt: string | null,
  createdAt: string | null
): DerivedStudentStatus {
  const now = new Date();

  if (!lastSessionAt) {
    if (!createdAt) return "New";
    const createdDiff = differenceInDays(now, new Date(createdAt));
    return createdDiff <= 5 ? "New" : "Inactive";
  }

  const daysSinceLast = differenceInDays(now, new Date(lastSessionAt));

  if (daysSinceLast <= 5) return "Active";
  if (daysSinceLast <= 14) return "Needs Attention";
  return "Inactive";
}

/*
New — never had a session + account created within 5 days (or no dates at all)
Active — had a session within the last 5 days
Needs Attention — last session was 7–14 days ago
Inactive — last session was 15+ days ago (or never had a session and account is older than 7 days)
*/