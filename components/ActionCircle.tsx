"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "lg" | "md";
  href?: string;
  onClick?: () => void;
  animateTransition?: boolean;
}

export default function ActionCircle({
  icon: Icon,
  label,
  variant = "primary",
  size = "md",
  href,
  onClick,
  animateTransition = false,
}: Props) {
  const router = useRouter();
  const [isExpanding, setIsExpanding] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const baseClasses =
    "relative flex flex-col items-center justify-center rounded-full text-white transition-all duration-300 shadow-md cursor-pointer z-10";

  const hoverClasses = isExpanding ? "" : "hover:scale-105";

  const sizeClasses =
    size === "lg"
      ? "h-48 w-48 gap-4 shadow-[#0f766e]/30 shadow-xl"
      : "h-32 w-32 gap-3 shadow-[#0d9488]/20 shadow-lg";

  const colorClasses = {
    primary: "bg-brand-primary border-8 border-brand-primary/20",
    secondary: "bg-brand-secondary border-4 border-brand-secondary/20",
    tertiary: "bg-[#2dd4bf] border-4 border-[#2dd4bf]/20",
  }[variant];

  const bgOnlyClasses = {
    primary: "bg-brand-primary",
    secondary: "bg-brand-secondary",
    tertiary: "bg-[#2dd4bf]",
  }[variant];

  const iconSize = size === "lg" ? 48 : 32;

  const handleClick = (e: React.MouseEvent) => {
    if (animateTransition && href) {
      e.preventDefault();

      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }

      setIsExpanding(true);

      // Pre-fetch route to make transition faster
      router.prefetch(href);

      setTimeout(() => {
        router.push(href);
      }, 550);
    } else if (onClick) {
      onClick();
    }
  };

  const content = (
    <div className={`flex flex-col items-center transition-opacity duration-200 ${isExpanding ? 'opacity-0' : 'opacity-100'}`}>
      <Icon size={iconSize} strokeWidth={2.5} />
      <span
        className={
          size === "lg" ? "font-bold text-lg" : "font-semibold text-sm"
        }
      >
        {label}
      </span>
    </div>
  );

  return (
    <>
      {href && !animateTransition ? (
        <Link href={href} className={`${baseClasses} ${hoverClasses} ${sizeClasses} ${colorClasses}`}>
          {content}
        </Link>
      ) : href && animateTransition ? (
        <a
          ref={buttonRef as React.RefObject<HTMLAnchorElement>}
          href={href}
          onClick={handleClick}
          className={`${baseClasses} ${hoverClasses} ${sizeClasses} ${colorClasses} ${isExpanding ? 'scale-90 opacity-0 transition-all duration-300' : ''}`}
        >
          {content}
        </a>
      ) : (
        <button
          ref={buttonRef as React.RefObject<HTMLButtonElement>}
          onClick={handleClick}
          className={`${baseClasses} ${hoverClasses} ${sizeClasses} ${colorClasses} ${isExpanding ? 'scale-90 opacity-0 transition-all duration-300' : ''}`}
        >
          {content}
        </button>
      )}

      {/* Full screen expanding overlay */}
      {isExpanding && (
        <div
          className={`fixed w-10 h-10 rounded-full ${bgOnlyClasses} pointer-events-none z-[9999]`}
          style={{
            left: center.x - 20, // 20 is half of w-10 
            top: center.y - 20,
            animation: 'expandCircle 0.6s cubic-bezier(0.645, 0.045, 0.355, 1) forwards'
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes expandCircle {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(100); opacity: 1; }
            }
          `}} />
        </div>
      )}
    </>
  );
}