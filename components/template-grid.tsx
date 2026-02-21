import { TemplateCard } from './template-card'
import type { Template } from '@/lib/templates'

type TemplateGridProps = {
  templates: Template[]
}

export function TemplateGrid({ templates }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-4xl mb-4" aria-hidden="true">✦</p>
        <p className="text-gray-400 text-sm">해당 카테고리에 템플릿이 없습니다.</p>
      </div>
    )
  }

  return (
    <div
      role="list"
      aria-label="템플릿 목록"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {templates.map((template) => (
        <div key={template.id} role="listitem">
          <TemplateCard template={template} />
        </div>
      ))}
    </div>
  )
}
