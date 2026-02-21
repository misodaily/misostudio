-- ============================================================
-- Miso Studio MVP - Supabase Schema
-- ============================================================

-- UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. payments 테이블
--    결제 요청 및 확인 상태를 추적하는 원장
-- ============================================================
create table public.payments (
  id            uuid    default uuid_generate_v4() primary key,
  user_id       uuid    references auth.users not null,
  order_id      text    unique not null,           -- 클라이언트에서 생성한 UUID (idempotency key)
  payment_key   text    unique,                    -- Toss에서 발급한 결제 키 (confirm 후 기록)
  amount        integer not null,                  -- 결제 금액 (KRW)
  pack_type     text    not null check (pack_type in ('PACK_5', 'PACK_10')),
  status        text    not null default 'PENDING'
                        check (status in ('PENDING', 'CONFIRMED', 'FAILED')),
  confirmed_at  timestamp with time zone,          -- Toss confirm 성공 시점
  created_at    timestamp with time zone default timezone('utc', now()) not null,
  updated_at    timestamp with time zone default timezone('utc', now()) not null
);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- 성능 인덱스
create index idx_payments_user_id    on public.payments (user_id);
create index idx_payments_order_id   on public.payments (order_id);
create index idx_payments_status     on public.payments (status);

-- ============================================================
-- 2. credit_ledger 테이블
--    크레딧 변동 이력을 원장(ledger) 방식으로 보관
--    잔액 = sum(delta) — 절대 직접 수정하지 않음
-- ============================================================
create table public.credit_ledger (
  id           uuid    default uuid_generate_v4() primary key,
  user_id      uuid    references auth.users not null,
  delta        integer not null,  -- 양수: 적립, 음수: 차감 (예: +5, -1)
  reason       text    not null check (reason in ('PACK_5', 'PACK_10', 'GENERATE', 'REFUND')),
  ref_order_id text    references public.payments(order_id),  -- 결제 연결 (GENERATE/REFUND는 null)
  created_at   timestamp with time zone default timezone('utc', now()) not null
);

-- 성능 인덱스
create index idx_credit_ledger_user_id on public.credit_ledger (user_id);

-- ============================================================
-- 3. user_credits 뷰
--    유저별 현재 크레딧 잔액 (sum of delta)
--    Service Role로 조회 시 모든 유저 가능,
--    인증된 유저로 조회 시 RLS에 의해 본인 것만 반환
-- ============================================================
create or replace view public.user_credits as
  select
    user_id,
    coalesce(sum(delta), 0) as credit_balance
  from public.credit_ledger
  group by user_id;

-- ============================================================
-- 4. RLS (Row Level Security) 설정
--    SELECT: 본인 데이터만 허용
--    INSERT/UPDATE: 서버(Service Role)만 허용 — 정책 없음 = 클라이언트 불가
-- ============================================================
alter table public.payments      enable row level security;
alter table public.credit_ledger enable row level security;

-- payments: 본인 결제 내역만 조회 가능
create policy "본인 결제 내역 조회"
  on public.payments for select
  using (auth.uid() = user_id);

-- credit_ledger: 본인 크레딧 내역만 조회 가능
create policy "본인 크레딧 내역 조회"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

-- NOTE: INSERT / UPDATE 정책은 의도적으로 생성하지 않습니다.
--   → 클라이언트(anon/authenticated role)는 쓰기 불가
--   → 서버의 SUPABASE_SERVICE_ROLE_KEY(supabaseAdmin)는 RLS를 bypass하여 쓰기 가능

-- ============================================================
-- 5. templates 테이블
--    관리자가 사전 구성한 Gen4 Turbo 영상 템플릿 카탈로그
--    INSERT/UPDATE는 Supabase SQL Editor(서버)에서만 수행
-- ============================================================
create table public.templates (
  id            uuid    default uuid_generate_v4() primary key,
  name          text    not null,                    -- 템플릿 이름 (예: "라이트세이버 전투")
  description   text    not null,                    -- 사용자에게 표시될 설명
  thumbnail_url text    not null,                    -- 미리보기 이미지 URL
  prompt        text    not null,                    -- Runway Gen4 Turbo에 전달할 전체 프롬프트
  category      text    not null default '기타',      -- 카테고리 (예: 액션, 판타지, 일상, 아트)
  sort_order    integer not null default 0,           -- 갤러리 정렬 순서 (낮을수록 먼저)
  is_active     boolean not null default true,        -- false이면 갤러리에서 숨김
  created_at    timestamp with time zone default timezone('utc', now()) not null
);

-- templates: 활성 템플릿은 누구나 조회 가능 (공개 카탈로그)
alter table public.templates enable row level security;

create policy "템플릿 공개 조회"
  on public.templates for select
  using (is_active = true);

-- 성능 인덱스
create index idx_templates_category   on public.templates (category);
create index idx_templates_sort_order on public.templates (sort_order);

-- ============================================================
-- 6. generations 테이블
--    영상 생성 요청 이력 (크레딧 차감과 연계)
-- ============================================================
create table public.generations (
  id               uuid    default uuid_generate_v4() primary key,
  user_id          uuid    references auth.users not null,
  template_id      uuid    references public.templates(id) not null,
  input_image_url  text    not null,                 -- Supabase Storage 공개 URL
  output_video_url text,                             -- Runway 완료 후 채워짐
  status           text    not null default 'PENDING'
                           check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  runway_task_id   text,                             -- Runway task ID (폴링용)
  created_at       timestamp with time zone default timezone('utc', now()) not null,
  updated_at       timestamp with time zone default timezone('utc', now()) not null
);

create trigger generations_set_updated_at
  before update on public.generations
  for each row execute function public.set_updated_at();  -- 기존 트리거 함수 재사용

-- 성능 인덱스
create index idx_generations_user_id on public.generations (user_id);
create index idx_generations_status  on public.generations (status);

-- generations: 본인 생성 이력만 조회 가능
alter table public.generations enable row level security;

create policy "본인 생성 이력 조회"
  on public.generations for select
  using (auth.uid() = user_id);

-- NOTE: INSERT / UPDATE는 서버(Service Role)만 수행

-- ============================================================
-- 7. 샘플 템플릿 데이터
--    썸네일은 placeholder 서비스 사용 (실서비스 시 교체)
--    prompt는 실제 Runway Gen4 Turbo에 최적화된 프롬프트
-- ============================================================
insert into public.templates (name, description, thumbnail_url, prompt, category, sort_order) values

(
  '라이트세이버 전투',
  '당신의 사진이 스타워즈 속 영웅으로 변신합니다. 라이트세이버를 점화하고 한 번의 강력한 스윙을 휘두릅니다.',
  'https://placehold.co/640x360/0f0f1a/7c3aed?text=Lightsaber',
  'The subject ignites a glowing lightsaber with a dramatic hum, holds a heroic stance, then executes one clean powerful swing. Cinematic lighting with lens flares. Timing: 0.0-0.8s subtle live-photo motion and breathing; 0.8-1.2s lightsaber blade ignites from hilt outward with electric glow; 1.2-3.5s one clean diagonal swing with motion blur and light trail; 3.5-5.0s hold heroic pose with lightsaber raised, cape billowing.',
  '액션',
  1
),

(
  '벚꽃 속 산책',
  '봄바람에 벚꽃이 흩날리는 몽환적인 장면. 일상 사진이 시네마틱 순간으로 변합니다.',
  'https://placehold.co/640x360/0f0f1a/f472b6?text=Cherry+Blossom',
  'Soft spring breeze causes cherry blossom petals to drift gently around the subject. Warm golden hour sunlight filters through the branches. Timing: 0.0-1.0s gentle sway and hair movement in breeze; 1.0-2.5s petals begin falling in slow motion around subject; 2.5-4.0s subject looks up with a gentle smile as petals shower; 4.0-5.0s camera slowly pulls back revealing full blossom scene. Dreamy, romantic atmosphere with soft bokeh.',
  '일상',
  2
),

(
  '사이버펑크 도시',
  '네온 빛이 가득한 미래 도시 속 주인공. 비가 내리는 사이버펑크 세계로 이동합니다.',
  'https://placehold.co/640x360/0f0f1a/06b6d4?text=Cyberpunk',
  'The subject stands in a futuristic cyberpunk cityscape with neon signs reflecting on wet streets. Rain falls in slow motion. Timing: 0.0-0.8s rain droplets appear and neon lights flicker to life; 0.8-2.0s camera rotates slowly around subject revealing glowing city behind; 2.0-3.5s holographic UI elements appear floating around subject; 3.5-5.0s dramatic zoom out showing full neon-lit megacity. Blade Runner aesthetic, volumetric fog, electric blue and magenta color palette.',
  '아트',
  3
),

(
  '마법사의 각성',
  '손끝에서 마법이 깨어납니다. 신비로운 빛과 파티클이 당신을 감싸는 판타지 장면.',
  'https://placehold.co/640x360/0f0f1a/8b5cf6?text=Magic',
  'The subject awakens magical power, with glowing energy particles swirling from their hands. Ancient runes appear in the air. Timing: 0.0-0.8s subtle shimmer around hands begins; 0.8-1.5s golden and purple energy particles spiral upward from palms; 1.5-3.0s magical runes materialize floating in circle around subject, rotating slowly; 3.0-4.5s full magical aura erupts with wind effect and glowing eyes; 4.5-5.0s hold powerful mage pose with all effects at peak. Fantasy epic atmosphere.',
  '판타지',
  4
);

