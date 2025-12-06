import { defineConfig } from "drizzle-kit";

// DATABASE_URL é necessária apenas para rodar migrações (npm run db:push)
// O sistema pode funcionar sem ela usando o cliente Supabase

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
