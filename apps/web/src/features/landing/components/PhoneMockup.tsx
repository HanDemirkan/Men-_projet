import { QrCode } from "lucide-react";

// CSS-only phone device frame around an abstract, placeholder QR-menu
// illustration - no real product screenshot exists yet.
export function PhoneMockup() {
  return (
    <div className="w-full max-w-[220px] rounded-[2rem] border-8 border-foreground/95 bg-foreground/95 p-1.5 shadow-md">
      <div className="flex flex-col gap-3 overflow-hidden rounded-[1.4rem] bg-background p-4">
        <div className="mx-auto h-1.5 w-16 rounded-full bg-muted" />
        <div className="flex items-center justify-center rounded-xl bg-primary/10 p-4">
          <QrCode className="h-12 w-12 text-primary" aria-hidden="true" />
        </div>
        <div className="h-3 w-2/3 rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 rounded-lg border border-border p-2">
            <div className="h-8 w-8 shrink-0 rounded-md bg-muted" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
