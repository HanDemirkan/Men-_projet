import type { InfoBlockProps } from "./types";

export function isAboutBlockEnabled({ sections, tenant }: InfoBlockProps): boolean {
  return sections.about && Boolean(tenant.about);
}

export function AboutBlock({ tenant }: InfoBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
        Hakkımızda
      </p>
      <p className="font-[family-name:var(--sf-font-body)] text-sm leading-relaxed" style={{ color: "var(--sf-text)" }}>
        {tenant.about}
      </p>
    </div>
  );
}
