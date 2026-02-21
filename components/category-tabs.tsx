'use client'

import { CATEGORY_LABELS, type TemplateCategory } from '@/lib/templates'

const CATEGORIES: TemplateCategory[] = ['all', 'action', 'art', 'fantasy', 'daily']

type CategoryTabsProps = {
  active: TemplateCategory
  onChange: (category: TemplateCategory) => void
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="카테고리 필터"
      className="flex items-center gap-2 flex-wrap justify-center"
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2',
              isActive
                ? 'bg-[#F97316] text-white shadow-sm shadow-orange-200'
                : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600',
            ].join(' ')}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        )
      })}
    </div>
  )
}
