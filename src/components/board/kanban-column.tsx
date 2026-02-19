"use client";

import { useState } from "react";
import type { PullRequestCard } from "@/types/pr";
import type { ColumnDefinition } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { ColumnHeader } from "./column-header";
import { EmptyColumn } from "./empty-column";
import { PrCard } from "./pr-card";
import { PrCardDetail } from "./pr-card-detail";

interface KanbanColumnProps {
  definition: ColumnDefinition;
  cards: PullRequestCard[];
}

const columnGlowMap: Record<string, string> = {
  draft: "column-glow-draft",
  ready_for_review: "column-glow-ready",
  review_in_progress: "column-glow-in-progress",
  changes_requested: "column-glow-changes",
  approved: "column-glow-approved",
  merged: "column-glow-merged",
};

export function KanbanColumn({ definition, cards }: KanbanColumnProps) {
  const [selectedPr, setSelectedPr] = useState<PullRequestCard | null>(null);

  return (
    <>
      <div
        className={cn(
          "flex h-full w-72 min-w-72 flex-col rounded-lg",
          "border border-border-subtle bg-bg-primary/50",
          columnGlowMap[definition.key]
        )}
      >
        <ColumnHeader definition={definition} count={cards.length} />

        <div className="flex-1 overflow-y-auto p-2">
          {cards.length === 0 ? (
            <EmptyColumn label={definition.label} />
          ) : (
            <div className="flex flex-col gap-2">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  className={cn("animate-stagger-in", `stagger-${Math.min(i + 1, 6)}`)}
                >
                  <PrCard pr={card} onClick={() => setSelectedPr(card)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPr && (
        <PrCardDetail pr={selectedPr} onClose={() => setSelectedPr(null)} />
      )}
    </>
  );
}
