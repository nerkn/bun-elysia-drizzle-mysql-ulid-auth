import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createPool } from "mysql2";

// for migrations
// const migrationClient = postgres("postgres://postgres:adminadmin@0.0.0.0:5432/db", { max: 1 });
// migrate(drizzle(migrationClient), ...)

const queryClient = createPool(process.env.DB_URL || "");

const db = drizzle(queryClient, {
  // logger: process.env.NODE_ENV === "development",
});

export default db;
