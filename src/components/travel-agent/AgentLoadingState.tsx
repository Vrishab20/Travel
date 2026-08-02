"use client";

type AgentLoadingStateProps = {
  label?: string;
};

export function AgentLoadingState({
  label = "Atlas is planning…",
}: AgentLoadingStateProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#121a22] px-3 py-1.5 text-sm text-[#b7c0c8]"
      role="status"
      aria-live="polite"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9a66b]" />
      {label}
    </div>
  );
}
