import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "../lib/cn";

import { Button } from "./Button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Builds a compact page list with ellipses, e.g. [1, "...", 4, 5, 6, "...", 20].
function buildPageList(page: number, pageCount: number): Array<number | "ellipsis"> {
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((candidate) => candidate >= 1 && candidate <= pageCount).sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((current, index) => {
    if (index > 0) {
      const previous = sorted[index - 1];
      if (previous !== undefined && current - previous > 1) {
        result.push("ellipsis");
      }
    }
    result.push(current);
  });

  return result;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const pages = buildPageList(page, pageCount);

  return (
    <nav aria-label="Sayfalama" className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>

      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          <Button
            key={entry}
            variant={entry === page ? "primary" : "outline"}
            size="icon"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onPageChange(entry)}
          >
            {entry}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Sonraki sayfa"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
