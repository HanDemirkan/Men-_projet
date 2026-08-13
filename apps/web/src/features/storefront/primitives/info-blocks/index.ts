import { AboutBlock, isAboutBlockEnabled } from "./AboutBlock";
import { ContactBlock, isContactBlockEnabled } from "./ContactBlock";
import { SocialBlock, isSocialBlockEnabled } from "./SocialBlock";
import type { InfoBlockProps } from "./types";
import { WorkingHoursBlock, isWorkingHoursBlockEnabled } from "./WorkingHoursBlock";

import type { StorefrontComponentPlugin } from "@/features/storefront/registry/plugin-types";

export type { InfoBlockProps } from "./types";

export interface InfoBlockPlugin extends StorefrontComponentPlugin<InfoBlockProps> {
  isEnabled: (props: InfoBlockProps) => boolean;
}

// Ordered registry - rendered top-to-bottom by InfoBlockList. Adding a
// future block (Kampanyalar/Blog/Etkinlik/Galeri/Rezervasyon/Yorumlar - see
// Sprint 7 architecture rule §8) means appending one entry here; neither
// StorefrontRenderer nor the builder change.
export const INFO_BLOCK_REGISTRY: InfoBlockPlugin[] = [
  { code: "about", label: "Hakkında", version: 1, capabilities: ["text"], isEnabled: isAboutBlockEnabled, Component: AboutBlock },
  { code: "workingHours", label: "Çalışma Saatleri", version: 1, capabilities: ["schedule"], isEnabled: isWorkingHoursBlockEnabled, Component: WorkingHoursBlock },
  { code: "contact", label: "İletişim", version: 1, capabilities: ["whatsapp", "phone", "maps"], isEnabled: isContactBlockEnabled, Component: ContactBlock },
  { code: "social", label: "Sosyal Medya", version: 1, capabilities: ["instagram", "facebook", "website"], isEnabled: isSocialBlockEnabled, Component: SocialBlock },
];
