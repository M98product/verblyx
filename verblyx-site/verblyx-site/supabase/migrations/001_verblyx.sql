-- =========================================================
-- VERBLYX — base de données
-- À coller dans Supabase > SQL Editor, puis « Run ».
-- =========================================================

-- Le profil de chaque élève (progression, vies, pièces, vocabulaire)
create table if not exists public.learners (
  id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  vocab jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Les leçons générées par Vex, partagées entre tous les élèves
create table if not exists public.content (
  id text primary key check (id ~ '^[abc][12]u[1-9]l[1-9]$'),
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Le nombre d'appels à l'IA par élève et par jour (protège tes crédits gratuits)
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  calls int not null default 0,
  primary key (user_id, day)
);

-- Sécurité : chaque élève ne lit et n'écrit que SES données
alter table public.learners enable row level security;
alter table public.content enable row level security;
alter table public.ai_usage enable row level security;

drop policy if exists "learner read own" on public.learners;
create policy "learner read own" on public.learners for select to authenticated using (auth.uid() = id);
drop policy if exists "learner insert own" on public.learners;
create policy "learner insert own" on public.learners for insert to authenticated with check (auth.uid() = id);
drop policy if exists "learner update own" on public.learners;
create policy "learner update own" on public.learners for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Les leçons : tout élève connecté peut les lire et en ajouter une nouvelle,
-- mais personne ne peut modifier ou supprimer une leçon existante (sauf toi, depuis le tableau de bord Supabase).
drop policy if exists "content read" on public.content;
create policy "content read" on public.content for select to authenticated using (true);
drop policy if exists "content add" on public.content;
create policy "content add" on public.content for insert to authenticated with check (created_by = auth.uid());

-- ai_usage : aucune règle → seul le serveur (fonction « ai ») y a accès.

grant usage on schema public to authenticated, service_role;
grant select, insert, update on public.learners to authenticated;
grant select, insert on public.content to authenticated;
grant all on public.learners, public.content, public.ai_usage to service_role;
