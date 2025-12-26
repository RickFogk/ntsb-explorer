import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * NTSB Aviation Accidents table
 */
export const accidents = mysqlTable("accidents", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 64 }).notNull().unique(),
  ntsbNumber: varchar("ntsbNumber", { length: 32 }),
  eventDate: varchar("eventDate", { length: 32 }),
  
  // Location
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  country: varchar("country", { length: 64 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  
  // Aircraft
  aircraftMake: varchar("aircraftMake", { length: 128 }),
  aircraftModel: varchar("aircraftModel", { length: 128 }),
  aircraftCategory: varchar("aircraftCategory", { length: 32 }),
  farPart: varchar("farPart", { length: 32 }),
  damage: varchar("damage", { length: 32 }),
  
  // Conditions
  weather: varchar("weather", { length: 32 }),
  lightCondition: varchar("lightCondition", { length: 32 }),
  flightPhase: varchar("flightPhase", { length: 64 }),
  
  // Injuries
  highestSeverity: varchar("highestSeverity", { length: 16 }),
  fatalCount: int("fatalCount").default(0),
  seriousCount: int("seriousCount").default(0),
  minorCount: int("minorCount").default(0),
  
  // Narratives and Causes
  probableCause: text("probableCause"),
  narrativePreliminary: text("narrativePreliminary"),
  narrativeFactual: text("narrativeFactual"),
  
  // Contributing Factors
  findings: text("findings"),
  causeCount: int("causeCount").default(0),
  factorCount: int("factorCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Accident = typeof accidents.$inferSelect;
export type InsertAccident = typeof accidents.$inferInsert;