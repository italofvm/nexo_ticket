import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn('⚠️ DATABASE_URL is not defined. DB queries will fail.');
}

export const sql: NeonQueryFunction<false, false> = dbUrl 
  ? neon(dbUrl) 
  : (() => { throw new Error("DATABASE_URL not configured"); }) as unknown as NeonQueryFunction<false, false>;
