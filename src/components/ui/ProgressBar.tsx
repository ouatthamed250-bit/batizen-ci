import { clamp } from "@/lib/helpers";

type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const progress = clamp(value, 0, 100);

  return (
    <div>
      {label ? (
        <div className="mb-2.5 flex items-center justify-between text-sm font-semibold text-[#111827]">
          <span>{label}</span>
          <span className="tabular-nums text-[#0B5FFF]">{progress}%</span>
        </div>
      ) : null}
      <div
        className="h-2 overflow-hidden rounded-full bg-[#E7EBF5]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0B5FFF,#0D2B6B)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, animation: "progressFill 0.8s ease-out" }}
        />
      </div>
    </div>
  );
}
