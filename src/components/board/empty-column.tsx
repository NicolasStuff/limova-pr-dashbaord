interface EmptyColumnProps {
  label: string;
}

export function EmptyColumn({ label }: EmptyColumnProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="h-8 w-8 rounded-full bg-bg-elevated flex items-center justify-center mb-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-muted"
        >
          <circle cx="8" cy="8" r="6" />
          <line x1="8" y1="5" x2="8" y2="8" />
          <line x1="8" y1="10.5" x2="8" y2="11" />
        </svg>
      </div>
      <p className="text-2xs text-text-muted font-mono">
        No PRs in {label}
      </p>
    </div>
  );
}
