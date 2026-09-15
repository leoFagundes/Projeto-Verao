"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "text-slate-950 shadow-lg shadow-black/20 hover:brightness-110",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface-2)] text-white hover:border-[var(--accent)]",
  ghost: "text-slate-300 hover:text-white hover:bg-white/5",
  danger:
    "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        style={
          variant === "primary"
            ? {
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-2))",
                ...style,
              }
            : style
        }
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
