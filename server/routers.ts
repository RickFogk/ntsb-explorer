import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { accidents } from "../drizzle/schema";
import { eq, like, and, or, sql, count, isNotNull } from "drizzle-orm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  accidents: router({
    getStats: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) {
        return {
          totalEvents: 0,
          eventsWithProbableCause: 0,
          eventsWithFindings: 0,
          fatalAccidents: 0,
          seriousAccidents: 0,
          minorAccidents: 0,
          noInjuryAccidents: 0,
        };
      }

      const [totalResult] = await db.select({ count: count() }).from(accidents);
      const [probableCauseResult] = await db.select({ count: count() }).from(accidents).where(isNotNull(accidents.probableCause));
      const [findingsResult] = await db.select({ count: count() }).from(accidents).where(isNotNull(accidents.findings));
      const [fatalResult] = await db.select({ count: count() }).from(accidents).where(eq(accidents.highestSeverity, 'FATL'));
      const [seriousResult] = await db.select({ count: count() }).from(accidents).where(eq(accidents.highestSeverity, 'SERS'));
      const [minorResult] = await db.select({ count: count() }).from(accidents).where(eq(accidents.highestSeverity, 'MINR'));
      const [noneResult] = await db.select({ count: count() }).from(accidents).where(eq(accidents.highestSeverity, 'NONE'));

      return {
        totalEvents: totalResult?.count || 0,
        eventsWithProbableCause: probableCauseResult?.count || 0,
        eventsWithFindings: findingsResult?.count || 0,
        fatalAccidents: fatalResult?.count || 0,
        seriousAccidents: seriousResult?.count || 0,
        minorAccidents: minorResult?.count || 0,
        noInjuryAccidents: noneResult?.count || 0,
      };
    }),

    getFilterOptions: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) {
        return { states: [], makes: [] };
      }

      const statesResult = await db.selectDistinct({ state: accidents.state })
        .from(accidents)
        .where(isNotNull(accidents.state))
        .orderBy(accidents.state);
      
      const makesResult = await db.selectDistinct({ make: accidents.aircraftMake })
        .from(accidents)
        .where(isNotNull(accidents.aircraftMake))
        .orderBy(accidents.aircraftMake);

      return {
        states: statesResult.map(r => r.state).filter(Boolean) as string[],
        makes: makesResult.map(r => r.make).filter(Boolean) as string[],
      };
    }),

    search: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        severity: z.array(z.string()).optional(),
        state: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        aircraftMake: z.string().optional(),
        hasProblableCause: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(24),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return { accidents: [], total: 0 };
        }

        const conditions: any[] = [];

        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              like(accidents.ntsbNumber, searchTerm),
              like(accidents.eventId, searchTerm),
              like(accidents.probableCause, searchTerm),
              like(accidents.city, searchTerm),
              like(accidents.aircraftMake, searchTerm),
              like(accidents.aircraftModel, searchTerm)
            )
          );
        }

        if (input.severity && input.severity.length > 0) {
          conditions.push(
            or(...input.severity.map(s => eq(accidents.highestSeverity, s)))
          );
        }

        if (input.state) {
          conditions.push(eq(accidents.state, input.state));
        }

        if (input.aircraftMake) {
          conditions.push(eq(accidents.aircraftMake, input.aircraftMake));
        }

        if (input.hasProblableCause) {
          conditions.push(isNotNull(accidents.probableCause));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [countResult] = await db.select({ count: count() })
          .from(accidents)
          .where(whereClause);

        const results = await db.select()
          .from(accidents)
          .where(whereClause)
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(sql`${accidents.id} DESC`);

        return {
          accidents: results,
          total: countResult?.count || 0,
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const [result] = await db.select()
          .from(accidents)
          .where(eq(accidents.id, input.id))
          .limit(1);

        return result || null;
      }),

    getCategoryStats: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) {
        return {
          totalFindings: 0,
          totalCauses: 0,
          totalFactors: 0,
          categories: [],
          findings: []
        };
      }

      // Get all findings from the database
      const results = await db.select({ findings: accidents.findings })
        .from(accidents)
        .where(isNotNull(accidents.findings));

      // Process findings into categories
      const categoryMap = new Map<string, {
        total: number;
        causes: number;
        factors: number;
        subcategories: Map<string, number>;
      }>();

      const findingMap = new Map<string, {
        fullPath: string;
        category: string;
        subcategory: string;
        detail: string;
        isCause: boolean;
        count: number;
      }>();

      let totalFindings = 0;
      let totalCauses = 0;
      let totalFactors = 0;

      for (const row of results) {
        if (!row.findings) continue;
        
        const findingsList = row.findings.split(' | ');
        for (const finding of findingsList) {
          const isCause = finding.endsWith(' - C');
          const isFactor = finding.endsWith(' - F');
          const cleanFinding = finding.replace(/ - [CF]$/, '');
          const parts = cleanFinding.split('-').map(p => p.trim());
          
          if (parts.length === 0) continue;
          
          const category = parts[0];
          const subcategory = parts[1] || '';
          const detail = parts.slice(2).join(' - ');
          
          totalFindings++;
          if (isCause) totalCauses++;
          if (isFactor) totalFactors++;

          // Update category stats
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              total: 0,
              causes: 0,
              factors: 0,
              subcategories: new Map()
            });
          }
          const catStats = categoryMap.get(category)!;
          catStats.total++;
          if (isCause) catStats.causes++;
          if (isFactor) catStats.factors++;
          if (subcategory) {
            catStats.subcategories.set(
              subcategory, 
              (catStats.subcategories.get(subcategory) || 0) + 1
            );
          }

          // Update finding stats
          const key = `${cleanFinding}|${isCause}`;
          if (!findingMap.has(key)) {
            findingMap.set(key, {
              fullPath: cleanFinding,
              category,
              subcategory,
              detail,
              isCause,
              count: 0
            });
          }
          findingMap.get(key)!.count++;
        }
      }

      // Convert to arrays and sort
      const categories = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({
          category,
          total: stats.total,
          causes: stats.causes,
          factors: stats.factors,
          subcategories: Array.from(stats.subcategories.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        }))
        .sort((a, b) => b.total - a.total);

      const findings = Array.from(findingMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 500); // Limit to top 500 findings

      return {
        totalFindings,
        totalCauses,
        totalFactors,
        categories,
        findings
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
