// CSS-only laptop device frame around an abstract, placeholder dashboard
// illustration - no real product screenshot exists yet.
export function LaptopMockup() {
  return (
    <div className="w-full max-w-lg">
      <div className="rounded-t-xl border border-b-0 border-border bg-foreground/95 p-2 shadow-md">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-background/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-background/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-background/30" />
        </div>
        <div className="flex gap-2 overflow-hidden rounded-lg bg-background p-3">
          <div className="flex w-16 shrink-0 flex-col gap-2">
            <div className="h-6 rounded bg-primary/20" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-3 rounded bg-muted" />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-12 rounded-md bg-muted" />
              ))}
            </div>
            <div className="h-28 rounded-md bg-gradient-to-br from-primary/15 via-muted to-muted" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 rounded-md bg-muted" />
              <div className="h-14 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-3 w-full rounded-b-xl bg-gradient-to-b from-foreground/95 to-foreground/80" />
      <div className="mx-auto h-1.5 w-1/3 rounded-b-md bg-foreground/70" />
    </div>
  );
}
