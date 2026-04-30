-- Fanpantae GeoGuessr — Supabase schema
-- Run this once in the Supabase SQL editor for a new project.

-- ---------- Question sets ----------
create table if not exists question_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null,
  is_open boolean not null default true,

  mode1_main_question text not null default '',
  mode1_questions jsonb not null default '[]'::jsonb,

  mode2_question text not null default '',
  mode2_image_url text,
  mode2_answer text not null default '',
  mode2_choices jsonb not null default '[]'::jsonb,

  mode3_question text not null default '',
  mode3_image_url text,
  mode3_answer text not null default '',

  mode4_question text not null default '',
  mode4_answer text not null default '',
  mode4_properties jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists question_sets_created_at_idx
  on question_sets (created_at desc);

-- ---------- Attempts ----------
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references question_sets(id) on delete cascade,
  player_name text not null,
  mode1_score int not null default 0,
  mode2_score int not null default 0,
  mode3_score int not null default 0,
  mode4_score int not null default 0,
  total_score int generated always as
    (mode1_score + mode2_score + mode3_score + mode4_score) stored,
  finished boolean not null default false,
  progress jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (set_id, player_name)
);

create index if not exists attempts_set_id_total_idx
  on attempts (set_id, total_score desc);

-- ---------- Storage bucket for uploaded images ----------
-- Create a public bucket named 'fanpantae' from the Supabase dashboard,
-- or via SQL:
insert into storage.buckets (id, name, public)
values ('fanpantae', 'fanpantae', true)
on conflict (id) do nothing;

-- All API access is performed via the service-role key on the server,
-- so we leave RLS disabled on these tables. Do NOT expose the service
-- role key to clients.
