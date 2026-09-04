/**
 * Tests for the lightweight path-based router.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveRoute } from "../src/router";

describe("resolveRoute", () => {
  beforeEach(() => {
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  it("/app/write resolves to write-desk", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/app/write" },
      writable: true,
    });
    expect(resolveRoute()).toBe("write-desk");
  });

  it("/ resolves to operator-console (home)", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/" },
      writable: true,
    });
    expect(resolveRoute()).toBe("operator-console");
  });

  it("/app resolves to operator-console (home)", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/app" },
      writable: true,
    });
    expect(resolveRoute()).toBe("operator-console");
  });

  it("/labs resolves to labs", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/labs" },
      writable: true,
    });
    expect(resolveRoute()).toBe("labs");
  });

  it("/engineering and subordinate instruments resolve outside the operator shell", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/engineering/scenario-replay" },
      writable: true,
    });
    expect(resolveRoute()).toBe("engineering");
  });

  it("unknown paths resolve to operator-console (home)", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/some/other/path" },
      writable: true,
    });
    expect(resolveRoute()).toBe("operator-console");
  });
});
