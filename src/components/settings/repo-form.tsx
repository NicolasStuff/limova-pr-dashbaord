"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface RepoFormProps {
  onSubmit: (owner: string, name: string) => Promise<void>;
  isLoading?: boolean;
}

export function RepoForm({ onSubmit, isLoading }: RepoFormProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parts = input.trim().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Format: owner/repository");
      return;
    }

    try {
      await onSubmit(parts[0], parts[1]);
      setInput("");
    } catch {
      setError("Failed to add repository");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-2xs font-mono text-text-muted uppercase tracking-wider mb-1.5">
          Add Repository
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            placeholder="owner/repository"
            className={cn(
              "h-9 flex-1 rounded-md bg-bg-elevated border border-border px-3",
              "text-sm text-text-primary placeholder:text-text-muted font-mono",
              "transition-colors duration-150",
              "focus:outline-none focus:border-status-info/50 focus:ring-1 focus:ring-status-info/30",
              error && "border-status-error/50 focus:border-status-error/50 focus:ring-status-error/30"
            )}
          />
          <Button type="submit" variant="primary" size="md" disabled={isLoading || !input.trim()}>
            {isLoading ? "Adding..." : "Add"}
          </Button>
        </div>
        {error && (
          <p className="mt-1 text-xs text-status-error font-mono">{error}</p>
        )}
      </div>
    </form>
  );
}
