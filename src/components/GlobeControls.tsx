"use client";

type GlobeControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  disabled?: boolean;
};

export function GlobeControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  disabled = false,
}: GlobeControlsProps) {
  return (
    <div
      className="pointer-events-auto absolute right-4 top-24 z-30 flex flex-col gap-2 md:right-6 md:top-28"
      role="toolbar"
      aria-label="Globe controls"
    >
      <ControlButton label="Zoom in" onClick={onZoomIn} disabled={disabled}>
        <PlusIcon />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={onZoomOut} disabled={disabled}>
        <MinusIcon />
      </ControlButton>
      <ControlButton label="Reset globe view" onClick={onResetView} disabled={disabled}>
        <ResetIcon />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#101820]/88 text-[#f3efe6] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#c9a66b]/55 hover:bg-[#16202a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a66b] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8a4.5 4.5 0 1 1 .9 2.7M3.5 8V5.2M3.5 8H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
