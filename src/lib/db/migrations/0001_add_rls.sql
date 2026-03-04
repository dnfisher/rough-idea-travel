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
