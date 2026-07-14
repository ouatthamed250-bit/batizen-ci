"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/helpers";

type PremiumInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
};

export function PremiumInput({ label, icon: Icon, error, className, type = "text", ...props }: PremiumInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--text)]">{label}</span>
      <span
        className={cn(
          "flex h-[60px] items-center gap-3 rounded-[22px] border bg-[var(--surface)] px-3 transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(11,95,255,0.08)] dark:bg-[#0D1B3E] dark:focus-within:bg-[#1A3B8E]",
          error ? "border-[var(--error)]" : "border-transparent",
          className,
        )}
      >
        {Icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[var(--muted)] shadow-sm dark:bg-[#1A3B8E] dark:text-[#8B9BB3]">
            <Icon aria-hidden size={20} />
          </span>
        ) : null}
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          type={inputType}
          aria-label={label}
          aria-invalid={!!error}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--muted)] transition hover:text-[var(--primary)] dark:hover:text-[var(--orange)]"
          >
            {showPassword ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
          </button>
        ) : null}
      </span>
      {error ? <span role="alert" className="mt-2 block text-sm font-medium text-[var(--error)]">{error}</span> : null}
    </label>
  );
}
