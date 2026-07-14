/**
 * Tests for the lightweight path-based router.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveRoute } from "../src/router";

describe("resolveRoute", () => {
  beforeEach(() => {
    // Reset history state
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  it("/app/write resolves to write-desk", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/app/write" },
      writable: true,
    });
    expect(resolveRoute()).toBe("write-desk");
  });

  it("/app redirects to /app/write and resolves to write-desk", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/app" },
      writable: true,
    });
    expect(resolveRoute()).toBe("write-desk");
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/app/write");
  });

  it("/ redirects to /app/write and resolves to write-desk", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/" },
      writable: true,
    });
    expect(resolveRoute()).toBe("write-desk");
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/app/write");
  });

  it("/labs resolves to labs", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/labs" },
      writable: true,
    });
    expect(resolveRoute()).toBe("labs");
  });

  it("unknown paths resolve to labs (backward compat)", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/some/other/path" },
      writable: true,
    });
    expect(resolveRoute()).toBe("labs");
  });
});
