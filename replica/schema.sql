-- Schéma Postgres (Supabase) du clone. Première migration.
-- Règles : uuid partout, timestamptz en UTC, argent en centimes, crédits en entiers,
-- accès par Row Level Security (RLS) via des fonctions helper security definer.

create extension if not exists pgcrypto;

-- ───────────────────────── comptes et équipes ─────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  locale text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references profiles(id) on delete restrict,
  personal boolean not null default false,
  plan text not null default 'free'
    check (plan in ('free','casual','standard','pro','studio','enterprise')),
  credit_balance integer not null default 0 check (credit_balance >= 0),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on workspaces (owner_id);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on workspace_members (user_id);

create table invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  project_id uuid,                                   -- fk ajoutée après projects
  email text not null,
  access text not null check (access in ('member','edit','view')),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((workspace_id is null) <> (project_id is null))
);
create index on invites (lower(email)) where status = 'pending';

create table subscriptions (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  stripe_subscription_id text unique not null,
  plan text not null,
  interval text not null check (interval in ('month','year')),
  status text not null,                               -- statut Stripe tel quel
  current_period_end timestamptz not null,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── projets et toile ─────────────────────────

create table styles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,  -- null = catalogue public
  name text not null,
  preview_url text,
  prompt_suffix text not null default '',
  reference_asset_ids uuid[] not null default '{}' check (cardinality(reference_asset_ids) <= 5),
  created_at timestamptz not null default now()
);
create index on styles (workspace_id);

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  creator_id uuid not null references profiles(id) on delete set null,
  name text not null default 'Sans titre',
  aspect_ratio text not null default '16:9'
    check (aspect_ratio in ('16:9','9:16','1:1','21:9','4:3','3:4','5:4')),
  style_id uuid references styles(id) on delete set null,
  visibility text not null default 'private' check (visibility in ('private','shared')),
  link_access text not null default 'none' check (link_access in ('none','view','edit')),
  link_token text unique default encode(gen_random_bytes(16),'hex'),
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on projects (workspace_id, updated_at desc);
create index on projects (creator_id);

alter table invites add constraint invites_project_fk
  foreign key (project_id) references projects(id) on delete cascade;

create table project_guests (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  access text not null check (access in ('view','edit')),
  primary key (project_id, user_id)
);
create index on project_guests (user_id);

create table sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text,
  locked boolean not null default false,
  collapsed boolean not null default false,
  x real not null, y real not null, w real not null, h real not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on sections (project_id);

create table folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on folders (project_id);

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  kind text not null check (kind in ('image','video','audio','document','stage_take')),
  storage_path text not null,
  width integer, height integer, duration_ms integer,
  source text not null check (source in ('generated','uploaded','export')),
  favorite boolean not null default false,
  archived boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on assets (project_id, created_at desc);
create index on assets (folder_id);

create table nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  section_id uuid references sections(id) on delete set null,
  type text not null check (type in ('text','image','video','audio','generator','stage')),
  name text,
  x real not null, y real not null, w real, h real,
  asset_id uuid references assets(id) on delete set null,
  data jsonb not null default '{}',   -- prompt, modèle, réglages, action (generate_image, frame_to_video…)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on nodes (project_id);
create index on nodes (section_id);

create table edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  from_node uuid not null references nodes(id) on delete cascade,
  to_node uuid not null references nodes(id) on delete cascade,
  role text not null check (role in ('prompt','start_frame','end_frame','character_ref',
                                     'scene_ref','omni_ref','audio','source')),
  created_at timestamptz not null default now(),
  unique (to_node, role, from_node),
  check (from_node <> to_node)
);
create index on edges (project_id);
create index on edges (from_node);

-- ───────────────────────── générations et crédits ─────────────────────────

create table model_prices (
  model text not null,                 -- id interne, ex. 'kling-3.0', 'nano-banana-pro'
  variant text not null default '',    -- ex. '1080p-5s-audio'
  kind text not null check (kind in ('image','video','audio','edit','upscale','music','sfx','lipsync')),
  provider text not null,              -- 'fal', 'elevenlabs', …
  provider_model text not null,
  credits integer not null check (credits > 0),
  min_plan text not null default 'free',
  active boolean not null default true,
  primary key (model, variant)
);

create table generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  node_id uuid references nodes(id) on delete set null,
  user_id uuid not null references profiles(id) on delete set null,
  agent_action_id uuid,                -- fk ajoutée après agent_actions
  kind text not null,
  model text not null,
  params jsonb not null default '{}',
  cost_credits integer not null check (cost_credits >= 0),
  status text not null default 'queued'
    check (status in ('queued','running','done','failed','flagged','refunded')),
  provider_job_id text unique,
  error text,
  output_asset_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on generations (project_id, created_at desc);
create index on generations (workspace_id, user_id, created_at);
create index on generations (status) where status in ('queued','running');

create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  delta integer not null,
  reason text not null check (reason in ('signup','plan','topup','weekly_free','referral',
                                         'generation','refund','tip_in','tip_out','payout','admin')),
  generation_id uuid references generations(id) on delete set null,
  idempotency_key text unique,          -- ex. id d'événement Stripe : un webhook rejoué ne crédite pas deux fois
  created_at timestamptz not null default now()
);
create index on credit_ledger (workspace_id, created_at desc);
create index on credit_ledger (workspace_id, user_id);

-- Débit atomique : verrouille la ligne du workspace, refuse si le solde ne suffit pas.
-- Un lot de l'agent appelle cette fonction UNE fois avec le coût total (pas de lot à moitié lancé).
create function spend_credits(p_workspace uuid, p_user uuid, p_amount integer, p_key text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_balance integer;
begin
  select credit_balance into v_balance from workspaces where id = p_workspace for update;
  if v_balance < p_amount then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;
  update workspaces set credit_balance = credit_balance - p_amount where id = p_workspace;
  insert into credit_ledger (workspace_id, user_id, delta, reason, idempotency_key)
    values (p_workspace, p_user, -p_amount, 'generation', p_key);
  return v_balance - p_amount;
end $$;

create function grant_credits(p_workspace uuid, p_amount integer, p_reason text, p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into credit_ledger (workspace_id, delta, reason, idempotency_key)
    values (p_workspace, p_amount, p_reason, p_key)
    on conflict (idempotency_key) do nothing;
  if found then
    update workspaces set credit_balance = credit_balance + p_amount where id = p_workspace;
  end if;
end $$;

-- ───────────────────────── agent ─────────────────────────

create table conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on conversations (project_id, updated_at desc);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content jsonb not null,            -- blocs : texte, références d'assets/nœuds, boutons
  attachments uuid[] not null default '{}',
  context_node_ids uuid[] not null default '{}',   -- nœuds sélectionnés au moment de l'envoi
  model text,
  created_at timestamptz not null default now()
);
create index on chat_messages (conversation_id, created_at);

create table agent_actions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chat_messages(id) on delete cascade,
  tool text not null,                -- generate_image, generate_video, read_timeline, edit_timeline, create_section…
  input jsonb not null,
  status text not null default 'running' check (status in ('running','done','failed')),
  error_user text,                   -- message lisible pour l'utilisateur
  error_internal text,               -- détail technique, jamais affiché
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on agent_actions (message_id);

alter table generations add constraint generations_action_fk
  foreign key (agent_action_id) references agent_actions(id) on delete set null;

create table chat_rules (
  user_id uuid primary key references profiles(id) on delete cascade,
  rules text not null default '',
  personalization text not null default '',
  updated_at timestamptz not null default now()
);

-- ───────────────────────── histoire, montage, 3D, export ─────────────────────────

create table documents (                 -- onglet Histoire (Brief, Narration, Direction, Scénario)
  project_id uuid primary key references projects(id) on delete cascade,
  content jsonb not null,                -- document TipTap
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table timelines (
  project_id uuid primary key references projects(id) on delete cascade,
  aspect_ratio text not null default '16:9',
  fps integer not null default 30 check (fps in (24,25,30,60)),
  tracks jsonb not null default '{"main":[],"music":[],"text":[]}',
  version integer not null default 1,    -- verrou optimiste contre les écritures concurrentes (agent + humain)
  updated_at timestamptz not null default now()
);

create table stages (
  project_id uuid primary key references projects(id) on delete cascade,
  scenes jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete set null,
  resolution text not null check (resolution in ('720p','1080p','4k')),
  watermark boolean not null,
  timeline_version integer not null,
  status text not null default 'queued' check (status in ('queued','rendering','done','failed')),
  asset_id uuid references assets(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on exports (project_id, created_at desc);

-- ───────────────────────── galerie publique ─────────────────────────

create table films (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  video_asset_id uuid not null references assets(id) on delete restrict,
  duration_ms integer not null,
  share_workflow boolean not null default true,
  likes_count integer not null default 0,
  remix_count integer not null default 0,
  tips_total integer not null default 0,
  status text not null default 'published' check (status in ('published','hidden','removed')),
  published_at timestamptz not null default now()
);
create index on films (published_at desc) where status = 'published';
create index on films (creator_id);

create table film_likes (
  film_id uuid not null references films(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (film_id, user_id)
);

create table tips (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references films(id) on delete cascade,
  from_user uuid not null references profiles(id) on delete set null,
  to_user uuid not null references profiles(id) on delete cascade,
  amount integer not null check (amount >= 5),
  anonymous boolean not null default false,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index on tips (to_user, created_at desc);

create table comments (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references films(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  tip_id uuid references tips(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on comments (film_id, created_at);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete restrict,
  credits integer not null,
  amount_cents integer not null check (amount_cents >= 2000),
  currency text not null default 'usd',
  stripe_transfer_id text unique,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc) where read_at is null;

create table referrals (
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid primary key references profiles(id) on delete cascade,
  signup_rewarded boolean not null default false,
  subscribe_rewarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table webhook_events (              -- idempotence des webhooks (Stripe, fal)
  id text primary key,                     -- id d'événement du fournisseur
  source text not null,
  received_at timestamptz not null default now()
);

-- ───────────────────────── accès (RLS) ─────────────────────────

create function is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members where workspace_id = ws and user_id = auth.uid())
$$;

create function can_view_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects pr
    where pr.id = p and (
      pr.creator_id = auth.uid()
      or (pr.visibility = 'shared' and is_member(pr.workspace_id))
      or exists (select 1 from project_guests g where g.project_id = p and g.user_id = auth.uid())
    ))
$$;

create function can_edit_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects pr
    where pr.id = p and (
      pr.creator_id = auth.uid()
      or (pr.visibility = 'shared' and is_member(pr.workspace_id))
      or exists (select 1 from project_guests g
                 where g.project_id = p and g.user_id = auth.uid() and g.access = 'edit')
    ))
$$;
-- L'accès par lien (link_token) passe par une fonction serveur qui ajoute l'invité dans project_guests.

alter table profiles enable row level security;
create policy "soi" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "lecture publique" on profiles for select using (true);   -- nom + avatar affichés dans la galerie

alter table workspaces enable row level security;
create policy "membres lisent" on workspaces for select using (is_member(id));
create policy "owner modifie" on workspaces for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
-- credit_balance, plan : modifiés uniquement côté serveur (service role) via spend_credits/grant_credits.
-- Un revoke par colonne ne suffit pas tant que le droit UPDATE sur la table existe :
-- on retire le droit sur la table et on ne rend que la colonne name.
revoke update on workspaces from authenticated;
grant update (name) on workspaces to authenticated;

alter table workspace_members enable row level security;
create policy "membres se voient" on workspace_members for select using (is_member(workspace_id));
create policy "on peut partir" on workspace_members for delete using (user_id = auth.uid() and role <> 'owner');

alter table projects enable row level security;
create policy "voir" on projects for select using (can_view_project(id));
create policy "créer" on projects for insert with check (is_member(workspace_id) and creator_id = auth.uid());
create policy "modifier" on projects for update using (can_edit_project(id));
create policy "supprimer" on projects for delete using (creator_id = auth.uid());

-- Toutes les tables rattachées à un projet suivent le même modèle.
do $$
declare t text;
begin
  foreach t in array array['sections','folders','assets','nodes','edges','conversations',
                           'documents','timelines','stages','exports','generations']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "voir" on %I for select using (can_view_project(project_id))', t);
    execute format('create policy "écrire" on %I for all using (can_edit_project(project_id)) with check (can_edit_project(project_id))', t);
  end loop;
end $$;
-- generations : l'insertion réelle passe par le serveur (débit de crédits), la policy client ne sert qu'à lire.
revoke insert, update, delete on generations from authenticated;

alter table chat_messages enable row level security;
create policy "voir" on chat_messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and can_view_project(c.project_id)));
alter table agent_actions enable row level security;
create policy "voir" on agent_actions for select using (
  exists (select 1 from chat_messages m join conversations c on c.id = m.conversation_id
          where m.id = message_id and can_view_project(c.project_id)));
-- messages et actions sont écrits par le serveur de l'agent (service role).

alter table credit_ledger enable row level security;
create policy "owner voit tout, membre voit le sien" on credit_ledger for select using (
  user_id = auth.uid()
  or exists (select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));

alter table styles enable row level security;
create policy "catalogue ou workspace" on styles for select using (workspace_id is null or is_member(workspace_id));
create policy "styles perso" on styles for all using (is_member(workspace_id)) with check (is_member(workspace_id));

alter table films enable row level security;
create policy "publics" on films for select using (status = 'published' or creator_id = auth.uid());
create policy "créateur" on films for update using (creator_id = auth.uid());

alter table film_likes enable row level security;
create policy "lire" on film_likes for select using (true);
create policy "liker" on film_likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table comments enable row level security;
create policy "lire" on comments for select using (true);
create policy "écrire" on comments for insert with check (user_id = auth.uid());
create policy "supprimer le sien" on comments for delete using (user_id = auth.uid());

alter table notifications enable row level security;
create policy "les siennes" on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table chat_rules enable row level security;
create policy "les siennes" on chat_rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Écrites uniquement par le serveur (service role) : pas de policy client.
alter table invites enable row level security;
alter table project_guests enable row level security;
create policy "voir ses accès" on project_guests for select using (user_id = auth.uid() or can_edit_project(project_id));
alter table subscriptions enable row level security;
create policy "membres lisent" on subscriptions for select using (is_member(workspace_id));
alter table tips enable row level security;
create policy "envoyés ou reçus" on tips for select using (from_user = auth.uid() or to_user = auth.uid());
alter table payouts enable row level security;
create policy "les siens" on payouts for select using (user_id = auth.uid());
alter table referrals enable row level security;
alter table model_prices enable row level security;
create policy "lecture" on model_prices for select using (true);
alter table webhook_events enable row level security;

-- ───────────────────────── inscription ─────────────────────────

-- À la création d'un compte : profil + workspace perso + crédits offerts.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  insert into profiles (id, name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  insert into workspaces (name, owner_id, personal) values ('Personnel', new.id, true) returning id into ws;
  insert into workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  perform grant_credits(ws, 300, 'signup', 'signup:' || new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- À la création d'un projet : document Histoire (modèle), timeline et plateau vides.
create function handle_new_project() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into documents (project_id, content) values (new.id, '{"template":"story-v1"}');
  insert into timelines (project_id, aspect_ratio) values (new.id, new.aspect_ratio);
  insert into stages (project_id, scenes)
    values (new.id, '[{"name":"Scène 1","objects":[{"type":"camera","name":"Caméra 1"},{"type":"human","name":"Humain 1"}]}]');
  return new;
end $$;
create trigger on_project_created after insert on projects
  for each row execute function handle_new_project();
