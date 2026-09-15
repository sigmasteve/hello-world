-- Hound: challenge/competition data schema.
--
-- Run this once in your Supabase project's SQL Editor (Database > SQL
-- Editor > New query), or via the Supabase CLI (`supabase db push`) if you
-- have a project linked. See ../../README.md "The backend (Supabase)" for
-- how the app connects to whatever project you run this against.

create extension if not exists pgcrypto;

-- One row per signed-up user, keyed to Supabase Auth's own user id.
-- Populated automatically by the trigger below — the app never inserts
-- into this table directly.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  initials text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up, so every other
-- table can have a plain foreign key to public.profiles instead of
-- reaching into the auth schema. `raw_user_meta_data->>'name'` is set on
-- sign-up by supabaseAuth.ts's `options: { data: { name } }`; email/OAuth
-- providers that don't supply one fall back to the address's local part.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, initials, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create type public.challenge_kind as enum ('hunt', 'steps', 'streak', 'distance');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.challenge_kind not null,
  created_by uuid not null references public.profiles (id),
  duration_days int not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  daily_goal_steps int,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

-- Who's in which challenge. `role` is only meaningful for 'hunt' challenges
-- ('hunter' | 'hunted'); every other kind leaves it null.
create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

alter table public.challenge_participants enable row level security;

-- One row per participant per day. The leaderboard sums these rather than
-- reading a running total, so a corrected/re-synced day just overwrites
-- (upserts) its own row instead of needing a separate adjustment entry.
create table public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  steps int not null default 0,
  distance_mi numeric(6, 2) not null default 0,
  recorded_at timestamptz not null default now(),
  unique (challenge_id, user_id, day)
);

alter table public.progress_snapshots enable row level security;

-- RLS: everything below scopes to "am I a participant (or creator) of this
-- challenge" — there's no "public" or "admin" tier yet, just per-challenge
-- membership.

create policy "Participants can view their challenges"
  on public.challenges for select
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = id and cp.user_id = auth.uid()
    )
  );

create policy "Signed-in users can create challenges"
  on public.challenges for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Participants can view each other"
  on public.challenge_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.challenge_participants me
      where me.challenge_id = challenge_participants.challenge_id
        and me.user_id = auth.uid()
    )
  );

create policy "Users can join a challenge as themselves"
  on public.challenge_participants for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Participants can view challenge progress"
  on public.progress_snapshots for select
  to authenticated
  using (
    exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = progress_snapshots.challenge_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Users can record their own progress"
  on public.progress_snapshots for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can correct their own progress"
  on public.progress_snapshots for update
  to authenticated
  using (user_id = auth.uid());
