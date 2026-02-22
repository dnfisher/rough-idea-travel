import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL!;

// Use connection pooling — Supabase pooler on port 6543
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
