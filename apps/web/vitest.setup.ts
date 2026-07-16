import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import "@testing-library/jest-dom/vitest";

process.env["NEXT_PUBLIC_API_URL"] = "http://localhost:4000/api/v1";

// jsdom doesn't implement IntersectionObserver; framer-motion's
// `whileInView` (used across the landing page sections) needs a stub to
// mount without throwing in tests.
class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

// matchMedia isn't implemented in jsdom either; useMediaQuery (and Radix
// components that probe viewport-related media queries) need this stub.
vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    // Deprecated but still probed by some libraries (e.g. framer-motion's
    // prefers-reduced-motion detection).
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
);

afterEach(() => {
  cleanup();
});
