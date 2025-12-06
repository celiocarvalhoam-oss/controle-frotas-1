import { z } from "zod";
import { pgTable, text, integer, boolean, doublePrecision, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ============================================
// Drizzle ORM Table Definitions (PostgreSQL)
// ============================================

// Users table
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Vehicles table
export const vehiclesTable = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  licensePlate: text("license_plate").notNull(),
  model: text("model"),
  status: text("status", { enum: ["moving", "stopped", "idle", "offline"] }).notNull().default("offline"),
  ignition: text("ignition", { enum: ["on", "off"] }).notNull().default("off"),
  currentSpeed: integer("current_speed").notNull().default(0),
  speedLimit: integer("speed_limit").notNull().default(80),
  heading: integer("heading").notNull().default(0),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: integer("accuracy").notNull().default(5),
  lastUpdate: timestamp("last_update", { withTimezone: true }).defaultNow().notNull(),
  batteryLevel: integer("battery_level"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Geofences table
export const geofencesTable = pgTable("geofences", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["circle", "polygon"] }).notNull(),
  active: boolean("active").notNull().default(true),
  center: jsonb("center").$type<{ latitude: number; longitude: number } | null>(),
  radius: integer("radius"),
  points: jsonb("points").$type<Array<{ latitude: number; longitude: number }> | null>(),
  rules: jsonb("rules").$type<Array<{
    type: "entry" | "exit" | "dwell" | "time_violation";
    enabled: boolean;
    dwellTimeMinutes?: number;
    startTime?: string;
    endTime?: string;
    toleranceSeconds?: number;
  }>>().notNull().default([]),
  vehicleIds: jsonb("vehicle_ids").$type<string[]>().notNull().default([]),
  lastTriggered: timestamp("last_triggered", { withTimezone: true }),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Alerts table
export const alertsTable = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["speed", "geofence_entry", "geofence_exit", "geofence_dwell", "system"] }).notNull(),
  priority: text("priority", { enum: ["critical", "warning", "info"] }).notNull(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  vehicleName: text("vehicle_name").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  read: boolean("read").notNull().default(false),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  speed: integer("speed"),
  speedLimit: integer("speed_limit"),
  geofenceName: text("geofence_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Trips table
export const tripsTable = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  totalDistance: integer("total_distance").notNull().default(0),
  travelTime: integer("travel_time").notNull().default(0),
  stoppedTime: integer("stopped_time").notNull().default(0),
  averageSpeed: integer("average_speed").notNull().default(0),
  maxSpeed: integer("max_speed").notNull().default(0),
  stopsCount: integer("stops_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Location points table (for trip history)
export const locationPointsTable = pgTable("location_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  speed: integer("speed").notNull().default(0),
  heading: integer("heading").notNull().default(0),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  accuracy: doublePrecision("accuracy"),
});

// Route events table
export const routeEventsTable = pgTable("route_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["departure", "arrival", "stop", "speed_violation", "geofence_entry", "geofence_exit"] }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  duration: integer("duration"),
  speed: integer("speed"),
  speedLimit: integer("speed_limit"),
  geofenceName: text("geofence_name"),
  address: text("address"),
});

// Speed violations table
export const speedViolationsTable = pgTable("speed_violations", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  vehicleName: text("vehicle_name").notNull(),
  speed: integer("speed").notNull(),
  speedLimit: integer("speed_limit").notNull(),
  excessSpeed: integer("excess_speed").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  duration: integer("duration").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// Drizzle-Zod Schemas (Auto-generated)
// ============================================

export const insertUserDbSchema = createInsertSchema(usersTable);
export const selectUserDbSchema = createSelectSchema(usersTable);

export const insertVehicleDbSchema = createInsertSchema(vehiclesTable);
export const selectVehicleDbSchema = createSelectSchema(vehiclesTable);

export const insertGeofenceDbSchema = createInsertSchema(geofencesTable);
export const selectGeofenceDbSchema = createSelectSchema(geofencesTable);

export const insertAlertDbSchema = createInsertSchema(alertsTable);
export const selectAlertDbSchema = createSelectSchema(alertsTable);

export const insertTripDbSchema = createInsertSchema(tripsTable);
export const selectTripDbSchema = createSelectSchema(tripsTable);

export const insertLocationPointDbSchema = createInsertSchema(locationPointsTable);
export const selectLocationPointDbSchema = createSelectSchema(locationPointsTable);

export const insertRouteEventDbSchema = createInsertSchema(routeEventsTable);
export const selectRouteEventDbSchema = createSelectSchema(routeEventsTable);

export const insertSpeedViolationDbSchema = createInsertSchema(speedViolationsTable);
export const selectSpeedViolationDbSchema = createSelectSchema(speedViolationsTable);

// ============================================
// TypeScript Types (from Drizzle tables)
// ============================================

export type UserDb = typeof usersTable.$inferSelect;
export type InsertUserDb = typeof usersTable.$inferInsert;

export type VehicleDb = typeof vehiclesTable.$inferSelect;
export type InsertVehicleDb = typeof vehiclesTable.$inferInsert;

export type GeofenceDb = typeof geofencesTable.$inferSelect;
export type InsertGeofenceDb = typeof geofencesTable.$inferInsert;

export type AlertDb = typeof alertsTable.$inferSelect;
export type InsertAlertDb = typeof alertsTable.$inferInsert;

export type TripDb = typeof tripsTable.$inferSelect;
export type InsertTripDb = typeof tripsTable.$inferInsert;

export type LocationPointDb = typeof locationPointsTable.$inferSelect;
export type InsertLocationPointDb = typeof locationPointsTable.$inferInsert;

export type RouteEventDb = typeof routeEventsTable.$inferSelect;
export type InsertRouteEventDb = typeof routeEventsTable.$inferInsert;

export type SpeedViolationDb = typeof speedViolationsTable.$inferSelect;
export type InsertSpeedViolationDb = typeof speedViolationsTable.$inferInsert;

// ============================================
// Application Types (Zod schemas - for API validation)
// ============================================

export type VehicleStatus = "moving" | "stopped" | "idle" | "offline";
export type IgnitionStatus = "on" | "off";
export type AlertType = "speed" | "geofence_entry" | "geofence_exit" | "geofence_dwell" | "system";
export type AlertPriority = "critical" | "warning" | "info";
export type GeofenceType = "circle" | "polygon";
export type GeofenceRuleType = "entry" | "exit" | "dwell" | "time_violation";

export const vehicleSchema = z.object({
  id: z.string(),
  name: z.string(),
  licensePlate: z.string(),
  model: z.string().optional(),
  status: z.enum(["moving", "stopped", "idle", "offline"]),
  ignition: z.enum(["on", "off"]),
  currentSpeed: z.number(),
  speedLimit: z.number(),
  heading: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  lastUpdate: z.string(),
  batteryLevel: z.number().optional(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export const insertVehicleSchema = vehicleSchema.omit({ id: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export const locationPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number(),
  heading: z.number(),
  timestamp: z.string(),
  accuracy: z.number().optional(),
});

export type LocationPoint = z.infer<typeof locationPointSchema>;

export const routeEventSchema = z.object({
  id: z.string(),
  type: z.enum(["departure", "arrival", "stop", "speed_violation", "geofence_entry", "geofence_exit"]),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string(),
  duration: z.number().optional(),
  speed: z.number().optional(),
  speedLimit: z.number().optional(),
  geofenceName: z.string().optional(),
  address: z.string().optional(),
});

export type RouteEvent = z.infer<typeof routeEventSchema>;

export const tripSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalDistance: z.number(),
  travelTime: z.number(),
  stoppedTime: z.number(),
  averageSpeed: z.number(),
  maxSpeed: z.number(),
  stopsCount: z.number(),
  points: z.array(locationPointSchema),
  events: z.array(routeEventSchema),
});

export type Trip = z.infer<typeof tripSchema>;

export const geofenceRuleSchema = z.object({
  type: z.enum(["entry", "exit", "dwell", "time_violation"]),
  enabled: z.boolean(),
  dwellTimeMinutes: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  toleranceSeconds: z.number().optional(),
});

export type GeofenceRule = z.infer<typeof geofenceRuleSchema>;

export const geofenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["circle", "polygon"]),
  active: z.boolean(),
  center: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  radius: z.number().optional(),
  points: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).optional(),
  rules: z.array(geofenceRuleSchema),
  vehicleIds: z.array(z.string()),
  lastTriggered: z.string().optional(),
  color: z.string().optional(),
});

export type Geofence = z.infer<typeof geofenceSchema>;

export const insertGeofenceSchema = geofenceSchema.omit({ id: true });
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;

export const alertSchema = z.object({
  id: z.string(),
  type: z.enum(["speed", "geofence_entry", "geofence_exit", "geofence_dwell", "system"]),
  priority: z.enum(["critical", "warning", "info"]),
  vehicleId: z.string(),
  vehicleName: z.string(),
  message: z.string(),
  timestamp: z.string(),
  read: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  speed: z.number().optional(),
  speedLimit: z.number().optional(),
  geofenceName: z.string().optional(),
});

export type Alert = z.infer<typeof alertSchema>;

export const insertAlertSchema = alertSchema.omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export const speedViolationSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  vehicleName: z.string(),
  speed: z.number(),
  speedLimit: z.number(),
  excessSpeed: z.number(),
  timestamp: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  duration: z.number(),
});

export type SpeedViolation = z.infer<typeof speedViolationSchema>;

export const vehicleStatsSchema = z.object({
  totalViolations: z.number(),
  vehiclesWithViolations: z.number(),
  averageExcessSpeed: z.number(),
  violationsByDay: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  topViolators: z.array(z.object({
    vehicleId: z.string(),
    vehicleName: z.string(),
    totalViolations: z.number(),
    averageExcessSpeed: z.number(),
    lastViolation: z.string(),
  })),
});

export type VehicleStats = z.infer<typeof vehicleStatsSchema>;

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
