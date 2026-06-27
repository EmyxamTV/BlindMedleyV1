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
    size === "sm" ? "btn-sm" : "btn",
    variant === "primary" && "btn-primary",
    variant === "secondary" && "btn-secondary",
    variant === "ghost" && "btn-ghost",
    variant === "danger" && "btn-danger",
    variant === "warn" && "btn-warn",
    variant === "success" && "btn-success",
    size === "lg" && "btn-lg",
    size === "xl" && "btn-xl",
    full && "btn-full",
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
