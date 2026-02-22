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
    id: 'ignite',
    titleEn: 'Ignite',
    titleKo: '광선검',
    description: '손에서 광선검이 점화되고, 두 번 베고 한 번 찌르는 히어로 콤보를 펼칩니다.',
    category: 'action',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a3a5c 100%)',
    accentColor: '#67e8f9',
    textDark: false,
  },
  {
    id: 'flare',
    titleEn: 'Flare',
    titleKo: '불꽃 단검',
    description: '손에서 불꽃 단검이 생성되고, 위아래 연속 베기를 한 번에 마무리합니다.',
    category: 'action',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #1a0500 0%, #4a1000 50%, #300800 100%)',
    accentColor: '#f97316',
    textDark: false,
  },
  {
    id: 'firework',
    titleEn: 'Firework',
    titleKo: '폭죽',
    description: "손에서 폭죽이 뿅 나타나 '팡!' 하고 터지며 컨페티가 흩날립니다.",
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #1a0040 0%, #400060 50%, #200030 100%)',
    accentColor: '#f0abfc',
    textDark: false,
  },
  {
    id: 'bubblegun',
    titleEn: 'BubbleGun',
    titleKo: '비눗방울',
    description: '손에 버블건이 생기고 비눗방울이 몽글몽글 떠오릅니다.',
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #e0f4ff 0%, #c8ebff 50%, #d8f0ff 100%)',
    accentColor: '#0284c7',
    textDark: true,
  },
  {
    id: 'moneygun',
    titleEn: 'MoneyGun',
    titleKo: '머니건',
    description: '손에서 머니건이 등장! 지폐가 한 번에 촤르르 날아갑니다.',
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #0a1a00 0%, #1a3300 50%, #102200 100%)',
    accentColor: '#4ade80',
    textDark: false,
  },
  {
    id: 'toyhammer',
    titleEn: 'ToyHammer',
    titleKo: '뿅망치',
    description: "장난감 망치가 뿅 생기고 귀엽게 '툭' 한 번 내려칩니다.",
    category: 'daily',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #fff0e0 0%, #ffe4c8 50%, #ffd8b0 100%)',
    accentColor: '#ea580c',
    textDark: true,
  },
  {
    id: 'magicshow',
    titleEn: 'MagicShow',
    titleKo: '마술쇼',
    description: '멋지게 지팡이를 휘두르는데… 결과는 작은 연기 퐁!',
    category: 'fantasy',
    creditCost: 1,
    gradient: 'linear-gradient(135deg, #0d0221 0%, #1e0856 50%, #2d1266 100%)',
    accentColor: '#c4b5fd',
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
