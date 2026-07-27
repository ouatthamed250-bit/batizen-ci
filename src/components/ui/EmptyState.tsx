"use client";

interface EmptyStateProps {
  text: string;
}

export function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-gray-400">
      <p>{text}</p>
    </div>
  );
}