-- ============================================================
-- Miso Studio — Template Seed Data
-- ============================================================

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
