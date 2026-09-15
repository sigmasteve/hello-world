-- Hound: fix "infinite recursion detected in policy for relation
-- challenge_participants" (Postgres error 42P17) on challenge creation.
--
-- 0001's "Participants can view each other" policy queries
-- challenge_participants from inside its own USING clause, to check "is
-- the current user also a participant in this challenge". But evaluating
-- that subquery is itself a SELECT against challenge_participants, which
-- re-triggers the very same policy, which queries the table again, and
-- so on — Postgres detects the cycle and refuses the query rather than
-- actually looping forever. "Participants can view their challenges"
-- (on challenges) and "Participants can view challenge progress" (on
-- progress_snapshots) inherit the same failure one level removed: they
-- query challenge_participants directly, so evaluating *their* policies
-- still has to evaluate challenge_participants' broken one internally.
--
-- The fix is Supabase's own documented pattern for exactly this case: a
-- `security definer` function to check membership. Such a function runs
-- with its owner's privileges rather than the calling role's, so the
-- select inside it does not go through challenge_participants' RLS at
-- all — breaking the cycle. Policies call the function instead of
-- querying the table directly.
--
-- Run this once, after 0001_challenges_schema.sql, in the SQL Editor —
-- including on a project where 0001 already ran and hit this error.

create or replace function public.is_challenge_participant(p_challenge_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.challenge_participants
    where challenge_id = p_challenge_id and user_id = p_user_id
  );
$$;

drop policy if exists "Participants can view their challenges" on public.challenges;
create policy "Participants can view their challenges"
  on public.challenges for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_challenge_participant(id, auth.uid())
  );

drop policy if exists "Participants can view each other" on public.challenge_participants;
create policy "Participants can view each other"
  on public.challenge_participants for select
  to authenticated
  using (public.is_challenge_participant(challenge_id, auth.uid()));

drop policy if exists "Participants can view challenge progress" on public.progress_snapshots;
create policy "Participants can view challenge progress"
  on public.progress_snapshots for select
  to authenticated
  using (public.is_challenge_participant(challenge_id, auth.uid()));
