import type { ColumnDefinition } from "@/lib/utils/constants";
import { Badge } from "@/components/ui/badge";

interface ColumnHeaderProps {
  definition: ColumnDefinition;
  count: number;
}

export function ColumnHeader({ definition, count }: ColumnHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: definition.color }}
      />
      <span className="text-xs font-semibold text-text-primary tracking-wide uppercase font-mono">
        {definition.label}
      </span>
      <Badge variant="default" size="sm" className="ml-auto tabular-nums">
        {count}
      </Badge>
    </div>
  );
}
