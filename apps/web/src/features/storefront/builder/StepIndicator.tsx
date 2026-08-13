"use client";

import { Check } from "lucide-react";

export interface BuilderStep {
  id: string;
  label: string;
}

export interface StepIndicatorProps {
  steps: BuilderStep[];
  currentIndex: number;
  furthestVisitedIndex: number;
  onStepClick: (index: number) => void;
}

// Spec §3: a real guided stepper, not a flat tab bar - only steps already
// visited are clickable (jumping ahead is allowed by Next, not by skipping
// via the indicator), so the business always sees a clear sense of
// progress instead of a wall of settings.
export function StepIndicator({ steps, currentIndex, furthestVisitedIndex, onStepClick }: StepIndicatorProps) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        const isReachable = index <= furthestVisitedIndex;

        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => onStepClick(index)}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: isCurrent ? "hsl(var(--primary))" : "hsl(var(--border))",
                backgroundColor: isCurrent ? "hsl(var(--primary))" : isDone ? "hsl(var(--accent))" : "transparent",
                color: isCurrent ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
              }}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                  style={{ backgroundColor: isCurrent ? "hsl(var(--primary-foreground) / 0.25)" : "hsl(var(--muted))" }}
                >
                  {index + 1}
                </span>
              )}
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
