# RLS Security Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable Row Level Security on all 7 public tables to block unauthorized PostgREST API access.

**Architecture:** The app uses Drizzle ORM via the Postgres service role (bypasses RLS), so enabling RLS has zero effect on app behaviour. The fix closes the Supabase PostgREST API exposure by enabling RLS with no permissive policies — deny-by-default for all non-service-role callers. No app code changes needed.

**Tech Stack:** PostgreSQL RLS, Drizzle Kit migrations, Supabase

---

### Task 1: Create the RLS migration file

**Files:**
- Create: `src/lib/db/migrations/0001_add_rls.sql`

**Step 1: Create the migration file**

```sql
-- Enable RLS on all public tables.
-- No policies are added: the app uses Drizzle (service role) which bypasses RLS.
-- PostgREST (anon/authenticated roles) will be denied access to all tables.

ALTER TABLE public.sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_trips        ENABLE ROW LEVEL SECURITY;
```

**Step 2: Apply the migration**

Ensure `POSTGRES_URL_NON_POOLING` is set in your environment (Drizzle Kit needs a direct connection, not pooled):

```bash
cd /Users/dave/Rough\ Idea\ Travel/rough-idea-travel-main
npx drizzle-kit migrate
```

Expected output: migration `0001_add_rls.sql` applied successfully.

**Step 3: Verify in Supabase dashboard**

- Go to Supabase > Table Editor
- Check each of the 7 tables — the RLS badge should show "Enabled"
- Or run in the SQL editor: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- All 7 tables should show `rowsecurity = true`

**Step 4: Verify app still works**

```bash
npm run build
```

Expected: clean build, no errors. The app behaviour is unchanged since Drizzle bypasses RLS.

**Step 5: Commit**

```bash
git add src/lib/db/migrations/0001_add_rls.sql
git commit -m "security: enable RLS on all public tables to block PostgREST exposure"
```
