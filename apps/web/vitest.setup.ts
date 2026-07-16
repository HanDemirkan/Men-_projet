import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

process.env["NEXT_PUBLIC_API_URL"] = "http://localhost:4000/api/v1";

afterEach(() => {
  cleanup();
});
