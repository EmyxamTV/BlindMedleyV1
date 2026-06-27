import type { ButtonHTMLAttributes } from "react";
import { cn } from "~/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warn" | "success";
type Size = "sm" | "md" | "lg" | "xl";

export function buttonClassName({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-[0.45rem] whitespace-nowrap rounded-[10px] font-semibold leading-none no-underline transition-all duration-[180ms] disabled:cursor-not-allowed disabled:opacity-45",
    size === "sm" && "px-[0.8rem] py-[0.35rem] text-[0.78rem]",
    size === "md" && "px-[1.2rem] py-[0.55rem] text-[0.875rem]",
    size === "lg" && "px-7 py-3 text-[0.95rem]",
    size === "xl" && "rounded-2xl px-9 py-[0.9rem] text-[1.05rem]",
    variant === "primary" &&
      "border-0 bg-linear-135 from-[#7c3aed] to-[#ec4899] text-white shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:not-disabled:-translate-y-px hover:not-disabled:opacity-[0.88] hover:not-disabled:shadow-[0_0_32px_rgba(124,58,237,0.5)]",
    variant === "secondary" &&
      "border-white/10 bg-[#1e1e30] text-[#f0f0f8] hover:not-disabled:border-white/20 hover:not-disabled:bg-[#161625]",
    variant === "ghost" &&
      "border-white/[0.07] bg-transparent text-[#8b8ba8] hover:not-disabled:border-white/10 hover:not-disabled:bg-white/[0.04] hover:not-disabled:text-[#f0f0f8]",
    variant === "danger" &&
      "border-red-500/30 bg-transparent text-red-500 hover:not-disabled:border-red-500/50 hover:not-disabled:bg-red-500/[0.08]",
    variant === "warn" &&
      "border-amber-500/30 bg-transparent text-amber-500 hover:not-disabled:border-amber-500/50 hover:not-disabled:bg-amber-500/10",
    variant === "success" &&
      "border-emerald-400/30 bg-transparent text-emerald-400 hover:not-disabled:border-emerald-400/50 hover:not-disabled:bg-emerald-400/10",
    full && "w-full",
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}) {
  return <button className={buttonClassName({ variant, size, full, className })} {...props} />;
}
