-- Run this in your Supabase SQL editor (https://app.supabase.com → SQL Editor)

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid references auth.users on delete cascade primary key,
  email               text,
  name                text,
  role                text,
  industry            text,
  bio                 text,
  experience          text,
  positioning         text,
  unique_angle        text,
  target_audience     text,
  audience_pain_points text,
  tone                text,
  content_formats     text[],
  past_content        text,
  favourite_creators  text[],
  onboarding_complete boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure handle_updated_at();

-- ── Saved Ideas ───────────────────────────────────────────────────────────────
create table if not exists public.saved_ideas (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  title       text not null,
  hook        text,
  format      text,
  angle       text,
  source      text,   -- 'creator_analysis' | 'research'
  tags        text[],
  created_at  timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.saved_ideas enable row level security;

-- Profiles: users can only read/write their own row
create policy "Own profile" on public.profiles
  for all using (auth.uid() = id);

-- Saved ideas: users can only access their own ideas
create policy "Own saved ideas" on public.saved_ideas
  for all using (auth.uid() = user_id);

-- Auto-create profile row on new sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
