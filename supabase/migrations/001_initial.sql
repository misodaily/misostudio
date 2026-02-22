-- ============================================================
-- Miso Studio — Initial Migration (idempotent, safe to re-run)
-- ============================================================

-- ── Extensions ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── 1. templates ───────────────────────────────────────────────────────────

create table if not exists public.templates (
  id           text        primary key,
  title_en     text        not null,
  title_ko     text        not null,
  description  text        not null,
  category     text        not null check (category in ('action', 'art', 'fantasy', 'daily')),
  credit_cost  int         not null check (credit_cost > 0),
  gradient     text,
  accent_color text,
  text_dark    boolean     not null default false,
  sort_order   int         not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- ── 2. profiles ────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  credit_balance int         not null default 15 check (credit_balance >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── 3. jobs ────────────────────────────────────────────────────────────────

create table if not exists public.jobs (
  job_id            uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  template_id       text        not null references public.templates(id),
  source_image_path text,
  options           jsonb       not null default '{}',
  status            text        not null default 'queued'
                                check (status in ('queued','processing','done','failed','canceled')),
  progress          int         not null default 0
                                check (progress >= 0 and progress <= 100),
  error_message     text,
  preview_video_url text,
  runway_task_id    text,
  share_token       text        unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz
);

-- 기존 테이블에 runway_task_id 없을 경우 추가
alter table public.jobs add column if not exists runway_task_id text;

-- ── 4. credit_ledger ───────────────────────────────────────────────────────

create table if not exists public.credit_ledger (
  id         bigserial   primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  amount     int         not null,
  reason     text        not null check (reason in ('topup', 'spend', 'refund')),
  job_id     uuid        references public.jobs(job_id),
  created_at timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists jobs_user_id_created_at_idx
  on public.jobs(user_id, created_at desc);

create index if not exists jobs_status_idx
  on public.jobs(status);

create index if not exists credit_ledger_user_id_idx
  on public.credit_ledger(user_id, created_at desc);

-- ── updated_at trigger ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ── Auto-create profile on new user ────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.templates     enable row level security;
alter table public.profiles      enable row level security;
alter table public.jobs          enable row level security;
alter table public.credit_ledger enable row level security;

drop policy if exists "templates_public_select" on public.templates;
create policy "templates_public_select" on public.templates
  for select using (is_active = true);

drop policy if exists "profiles_own_select" on public.profiles;
create policy "profiles_own_select" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update" on public.profiles
  for update using (auth.uid() = user_id);

drop policy if exists "jobs_own_select" on public.jobs;
create policy "jobs_own_select" on public.jobs
  for select using (auth.uid() = user_id);

drop policy if exists "jobs_own_insert" on public.jobs;
create policy "jobs_own_insert" on public.jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "jobs_own_update" on public.jobs;
create policy "jobs_own_update" on public.jobs
  for update using (auth.uid() = user_id);

drop policy if exists "ledger_own_select" on public.credit_ledger;
create policy "ledger_own_select" on public.credit_ledger
  for select using (auth.uid() = user_id);

drop policy if exists "ledger_own_insert" on public.credit_ledger;
create policy "ledger_own_insert" on public.credit_ledger
  for insert with check (auth.uid() = user_id);

-- ── Storage buckets ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'source-images',
  'source-images',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('preview-videos', 'preview-videos', true)
on conflict (id) do nothing;

drop policy if exists "source_images_insert" on storage.objects;
create policy "source_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'source-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "source_images_select" on storage.objects;
create policy "source_images_select" on storage.objects
  for select using (
    bucket_id = 'source-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "preview_videos_select" on storage.objects;
create policy "preview_videos_select" on storage.objects
  for select using (bucket_id = 'preview-videos');

-- ── Postgres Functions ───────────────────────────────────────────────────────

create or replace function public.create_job_with_credit(
  p_user_id           uuid,
  p_template_id       text,
  p_source_image_path text,
  p_options           jsonb,
  p_credit_cost       int
) returns uuid language plpgsql security definer as $$
declare
  v_job_id          uuid;
  v_current_balance int;
begin
  select credit_balance into v_current_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_current_balance < p_credit_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.profiles
  set credit_balance = credit_balance - p_credit_cost
  where user_id = p_user_id;

  insert into public.jobs (
    user_id, template_id, source_image_path, options,
    status, progress, started_at
  ) values (
    p_user_id, p_template_id, p_source_image_path, p_options,
    'processing', 0, now()
  )
  returning job_id into v_job_id;

  insert into public.credit_ledger (user_id, amount, reason, job_id)
  values (p_user_id, -p_credit_cost, 'spend', v_job_id);

  return v_job_id;
end;
$$;

create or replace function public.topup_credits(
  p_user_id uuid,
  p_amount  int
) returns int language plpgsql security definer as $$
declare
  v_new_balance int;
begin
  update public.profiles
  set credit_balance = credit_balance + p_amount
  where user_id = p_user_id
  returning credit_balance into v_new_balance;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  insert into public.credit_ledger (user_id, amount, reason)
  values (p_user_id, p_amount, 'topup');

  return v_new_balance;
end;
$$;

create or replace function public.cancel_job_with_refund(
  p_job_id      uuid,
  p_user_id     uuid,
  p_credit_cost int
) returns void language plpgsql security definer as $$
begin
  update public.jobs
  set status = 'canceled', finished_at = now()
  where job_id = p_job_id
    and user_id = p_user_id
    and status in ('queued', 'processing');

  if not found then
    raise exception 'JOB_NOT_CANCELABLE';
  end if;

  update public.profiles
  set credit_balance = credit_balance + p_credit_cost
  where user_id = p_user_id;

  insert into public.credit_ledger (user_id, amount, reason, job_id)
  values (p_user_id, p_credit_cost, 'refund', p_job_id);
end;
$$;

-- ── Template Seed ────────────────────────────────────────────────────────────

insert into public.templates
  (id, title_en, title_ko, description, category, credit_cost, gradient, accent_color, text_dark, sort_order)
values
  ('ignite',   'Ignite',   '광선검',   '손에서 광선검이 점화되고, 두 번 베고 한 번 찌르는 히어로 콤보를 펼칩니다.',  'action',  1, 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a3a5c 100%)', '#67e8f9', false, 1),
  ('flare',    'Flare',    '불꽃 단검', '손에서 불꽃 단검이 생성되고, 위아래 연속 베기를 한 번에 마무리합니다.',      'action',  1, 'linear-gradient(135deg, #1a0500 0%, #4a1000 50%, #300800 100%)', '#f97316', false, 2),
  ('firework', 'Firework', '폭죽',     '손에서 폭죽이 뿅 나타나 ''팡!'' 하고 터지며 컨페티가 흩날립니다.',          'daily',   1, 'linear-gradient(135deg, #1a0040 0%, #400060 50%, #200030 100%)', '#f0abfc', false, 3),
  ('bubblegun','BubbleGun','비눗방울', '손에 버블건이 생기고 비눗방울이 몽글몽글 떠오릅니다.',                        'daily',   1, 'linear-gradient(135deg, #e0f4ff 0%, #c8ebff 50%, #d8f0ff 100%)', '#0284c7', true,  4),
  ('moneygun', 'MoneyGun', '머니건',   '손에서 머니건이 등장! 지폐가 한 번에 촤르르 날아갑니다.',                    'daily',   1, 'linear-gradient(135deg, #0a1a00 0%, #1a3300 50%, #102200 100%)', '#4ade80', false, 5),
  ('toyhammer','ToyHammer','뿅망치',   '장난감 망치가 뿅 생기고 귀엽게 ''툭'' 한 번 내려칩니다.',                    'daily',   1, 'linear-gradient(135deg, #fff0e0 0%, #ffe4c8 50%, #ffd8b0 100%)', '#ea580c', true,  6),
  ('magicshow','MagicShow','마술쇼',   '멋지게 지팡이를 휘두르는데… 결과는 작은 연기 퐁!',                            'fantasy', 1, 'linear-gradient(135deg, #0d0221 0%, #1e0856 50%, #2d1266 100%)', '#c4b5fd', false, 7)
on conflict (id) do update set
  title_en     = excluded.title_en,
  title_ko     = excluded.title_ko,
  description  = excluded.description,
  category     = excluded.category,
  credit_cost  = excluded.credit_cost,
  gradient     = excluded.gradient,
  accent_color = excluded.accent_color,
  text_dark    = excluded.text_dark,
  sort_order   = excluded.sort_order;
