import { createElement, type HTMLAttributes, type LabelHTMLAttributes } from "react";
import { cn } from "~/lib/cn";

export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("form-group", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return createElement("label", { className, ...props });
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("field-error", className)} {...props} />;
}
