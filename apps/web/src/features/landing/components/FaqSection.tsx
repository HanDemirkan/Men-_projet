"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { MOTION_DURATION } from "@/config/motion";
import { FAQ_ITEMS } from "@/fixtures/faq.fixture";

// Simple, page-specific accordion (not part of the shared UI kit - the
// requested component list doesn't include one, and this is only ever used
// here).
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="container py-20">
      <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Sıkça Sorulan Sorular
        </h2>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col divide-y divide-border rounded-lg border border-border">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-expanded={isOpen}
              >
                {item.question}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                />
              </button>
              <div
                className="grid overflow-hidden transition-[grid-template-rows]"
                style={{
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transitionDuration: `${MOTION_DURATION.base * 1000}ms`,
                }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm text-muted-foreground">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
