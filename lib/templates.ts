export type TemplateCategory = 'all' | 'action' | 'art' | 'fantasy' | 'daily'

export type Template = {
  id: string
  titleEn: string
  titleKo: string
  description: string
  category: Exclude<TemplateCategory, 'all'>
  creditCost: number
  gradient: string
  accentColor: string
  textDark: boolean // true = dark text on light bg
}

export const TEMPLATES: Template[] = [
  {
    id: 'lightsaber',
    titleEn: 'Lightsaber',
    titleKo: '라이트세이버 전투',
    description: '당신의 사진이 스타워즈 속 영웅으로 변신합니다.',
    category: 'action',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a3a5c 100%)',
    accentColor: '#67e8f9',
    textDark: false,
  },
  {
    id: 'cyberpunk',
    titleEn: 'Cyberpunk',
    titleKo: '사이버펑크 네온',
    description: '비 내리는 네온 시티. 당신이 미래의 주인공이 됩니다.',
    category: 'action',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #1a0533 0%, #3d0066 50%, #1a0020 100%)',
    accentColor: '#f0abfc',
    textDark: false,
  },
  {
    id: 'magic',
    titleEn: 'Magic',
    titleKo: '마법사 각성',
    description: '파티클과 함께 깨어나는 압도적인 마법진 모션.',
    category: 'fantasy',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #0d0221 0%, #1e0856 50%, #2d1266 100%)',
    accentColor: '#c4b5fd',
    textDark: false,
  },
  {
    id: 'cherry',
    titleEn: 'Cherry',
    titleKo: '벚꽃 흩날리는',
    description: '부드러운 시네마틱 카메라워크와 벚꽃비.',
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #fdd9e5 100%)',
    accentColor: '#be185d',
    textDark: true,
  },
  {
    id: 'samurai',
    titleEn: 'Samurai',
    titleKo: '사무라이의 검',
    description: '피어나는 벚꽃 속, 칼날 위에 새겨진 당신의 의지.',
    category: 'action',
    creditCost: 2,
    gradient: 'linear-gradient(135deg, #1a0000 0%, #4a0f0f 50%, #2d0808 100%)',
    accentColor: '#fca5a5',
    textDark: false,
  },
  {
    id: 'underwater',
    titleEn: 'Underwater',
    titleKo: '심해의 탐험가',
    description: '빛이 닿지 않는 심해. 그 속에서 당신이 유영합니다.',
    category: 'art',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #001220 0%, #003355 50%, #004477 100%)',
    accentColor: '#7dd3fc',
    textDark: false,
  },
  {
    id: 'neon-city',
    titleEn: 'Neon City',
    titleKo: '야경 속 거리',
    description: '도시의 네온 불빛이 당신의 실루엣을 감쌉니다.',
    category: 'art',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
    accentColor: '#fb923c',
    textDark: false,
  },
  {
    id: 'dragon',
    titleEn: 'Dragon',
    titleKo: '불꽃 드래곤',
    description: '하늘을 가르는 불꽃과 함께 당신의 전설이 시작됩니다.',
    category: 'fantasy',
    creditCost: 2,
    gradient: 'linear-gradient(135deg, #1a0500 0%, #5c1500 50%, #3d0c00 100%)',
    accentColor: '#fdba74',
    textDark: false,
  },
  {
    id: 'snow',
    titleEn: 'Snowfall',
    titleKo: '첫눈의 순간',
    description: '소복이 쌓이는 눈 속, 포근한 겨울 감성의 한 장면.',
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #e8f4f8 0%, #d0e8f0 50%, #c8e4ef 100%)',
    accentColor: '#1e40af',
    textDark: true,
  },
  {
    id: 'galaxy',
    titleEn: 'Galaxy',
    titleKo: '은하수를 건너며',
    description: '광활한 우주를 배경으로 펼쳐지는 압도적인 스케일.',
    category: 'fantasy',
    creditCost: 2,
    gradient: 'linear-gradient(135deg, #000005 0%, #0a0a2e 50%, #050520 100%)',
    accentColor: '#a78bfa',
    textDark: false,
  },
  {
    id: 'cafe',
    titleEn: 'Café',
    titleKo: '카페 한 켠에서',
    description: '김이 모락모락 나는 커피잔과 따스한 오후의 감성.',
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #fdf6ec 0%, #f5e6c8 50%, #eedcb4 100%)',
    accentColor: '#92400e',
    textDark: true,
  },
  {
    id: 'aurora',
    titleEn: 'Aurora',
    titleKo: '오로라 아래에서',
    description: '춤추는 오로라 커튼 아래, 당신의 실루엣이 빛납니다.',
    category: 'art',
    creditCost: 2,
    gradient: 'linear-gradient(135deg, #001a00 0%, #003300 50%, #004d00 100%)',
    accentColor: '#6ee7b7',
    textDark: false,
  },
]

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function filterByCategory(
  templates: Template[],
  category: TemplateCategory,
): Template[] {
  if (category === 'all') return templates
  return templates.filter((t) => t.category === category)
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  all: '전체',
  action: '액션',
  art: '아트',
  fantasy: '판타지',
  daily: '일상',
}
