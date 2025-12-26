import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Create a chainable mock that returns itself for all methods except terminal ones
function createChainableMock(terminalValue: any) {
  const mock: any = {};
  const chainMethods = ['select', 'selectDistinct', 'from', 'where', 'orderBy', 'limit', 'offset'];
  
  chainMethods.forEach(method => {
    mock[method] = vi.fn().mockReturnValue(mock);
  });
  
  // Make the mock thenable (Promise-like) to resolve with terminal value
  mock.then = (resolve: any) => resolve(terminalValue);
  
  return mock;
}

describe("accidents router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("getStats", () => {
    it("returns zeros when database is not available", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      const result = await caller.accidents.getStats();

      expect(result.totalEvents).toBe(0);
      expect(result.eventsWithProbableCause).toBe(0);
      expect(result.eventsWithFindings).toBe(0);
      expect(result.fatalAccidents).toBe(0);
      expect(result.seriousAccidents).toBe(0);
      expect(result.minorAccidents).toBe(0);
      expect(result.noInjuryAccidents).toBe(0);
    });
  });

  describe("getFilterOptions", () => {
    it("returns empty arrays when database is not available", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      const result = await caller.accidents.getFilterOptions();

      expect(result.states).toEqual([]);
      expect(result.makes).toEqual([]);
    });
  });

  describe("search", () => {
    it("returns empty results when database is not available", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      const result = await caller.accidents.search({
        limit: 10,
        offset: 0,
      });

      expect(result.accidents).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("validates input parameters", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      // Test with valid parameters - should not throw
      await expect(caller.accidents.search({
        search: "cessna",
        severity: ["FATL", "SERS"],
        state: "CA",
        aircraftMake: "Cessna",
        hasProblableCause: true,
        limit: 24,
        offset: 0,
      })).resolves.toEqual({ accidents: [], total: 0 });
    });

    it("enforces limit constraints", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      // Test with limit exceeding max (100)
      await expect(caller.accidents.search({
        limit: 200,
        offset: 0,
      })).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("returns null when database is not available", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      const result = await caller.accidents.getById({ id: 1 });

      expect(result).toBeNull();
    });

    it("requires a valid id parameter", async () => {
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const { appRouter: router } = await import("./routers");
      const ctx = createPublicContext();
      const caller = router.createCaller(ctx);

      // Test with invalid id (string instead of number)
      await expect(caller.accidents.getById({ id: "invalid" as any })).rejects.toThrow();
    });
  });
});
