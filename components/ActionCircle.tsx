import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "lg" | "md";
  href?: string;
  onClick?: () => void;
}

export default function ActionCircle({
  icon: Icon,
  label,
  variant = "primary",
  size = "md",
  href,
  onClick,
}: Props) {
  const baseClasses =
    "flex flex-col items-center justify-center rounded-full text-white transition-transform hover:scale-105 shadow-md cursor-pointer";

  const sizeClasses =
    size === "lg"
      ? "h-48 w-48 gap-4 shadow-[#0f766e]/30 shadow-xl"
      : "h-32 w-32 gap-3 shadow-[#0d9488]/20 shadow-lg";

  const colorClasses = {
    primary: "bg-brand-primary border-8 border-brand-primary/20",
    secondary: "bg-brand-secondary border-4 border-brand-secondary/20",
    tertiary: "bg-[#2dd4bf] border-4 border-[#2dd4bf]/20",
  }[variant];

  const iconSize = size === "lg" ? 48 : 32;

  const content = (
    <>
      <Icon size={iconSize} strokeWidth={2.5} />
      <span
        className={
          size === "lg" ? "font-bold text-xl" : "font-semibold text-base"
        }
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${colorClasses}`}
    >
      {content}
    </button>
  );
}