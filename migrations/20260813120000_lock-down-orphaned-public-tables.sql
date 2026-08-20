-- Backend Advisor security findings (2026-08-13): 5 tables from a
-- predecessor project (pre-dates hybrid-registro's extraction) left fully
-- open to anon/authenticated — orders, products, pending_registrations,
-- spectator_tickets had RLS disabled entirely; leads had RLS enabled but
-- an unrestricted anonymous INSERT policy.
--
-- Confirmed via grep across hybrid-registro, hybrid-event-landing, and
-- enforma-institutional-web: zero references to any of these table names
-- in current code. Confirmed with the user: this InsForge account has
-- only two projects — this one ("enforma") and the separate, unrelated
-- future "ready2hybrid" backend — so no other project depends on these
-- tables either. Locking down rather than dropping: a few real rows exist
-- (pending_registrations: 2, leads: 1, products: 6) and deletion was not
-- requested.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

ALTER TABLE public.spectator_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectator_tickets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrations FORCE ROW LEVEL SECURITY;

-- leads already had RLS enabled; the actual problem was the INSERT policy
-- itself (WITH CHECK (true), granted to `public`, no validation at all).
-- The advisor's generic remediation template assumes a `user_id` column,
-- which this table does not have (it's an anonymous contact-form capture
-- by design). Since nothing in any current codebase reads or writes this
-- table, the policy is dropped outright instead of rewritten to fit a
-- schema it doesn't match. The pre-existing "Allow authenticated select
-- for leads" policy is untouched.
DROP POLICY IF EXISTS "Allow anonymous insert for leads" ON public.leads;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
