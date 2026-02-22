'use client'

import { useRouter } from 'next/navigation'
import type { Template } from '@/lib/templates'

type TemplateCardProps = {
  template: Template
}

function splitCamelCase(title: string): string[] {
  return title.split(/(?<=[a-z])(?=[A-Z])/)
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter()
  const titleWords = splitCamelCase(template.titleEn)

  return (
    <button
      onClick={() => router.push(`/t/${template.id}`)}
      aria-label={`${template.titleKo} 템플릿 선택`}
      className="group relative w-full rounded-3xl overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-4 transition-transform duration-300 hover:-translate-y-1"
      style={{ aspectRatio: '4/5' }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        style={{ background: template.gradient }}
        aria-hidden="true"
      />

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Credit badge */}
        <div className="flex justify-end">
          <span
            className={[
              'text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm',
              template.textDark
                ? 'bg-black/10 text-gray-700'
                : 'bg-white/10 text-white/80',
            ].join(' ')}
          >
            {template.creditCost}크레딧
          </span>
        </div>

        {/* Big English title — fills the card */}
        <div className="flex-1 flex items-center">
          <p
            className="font-black leading-none tracking-tighter select-none"
            style={{
              fontSize: 'clamp(1.8rem, 5.5vw, 3rem)',
              color: template.accentColor,
              textShadow: template.textDark
                ? 'none'
                : `0 0 60px ${template.accentColor}55`,
              wordBreak: 'break-word',
            }}
            aria-hidden="true"
          >
            {titleWords.map((word, i) => (
              <span key={i} style={{ display: 'block' }}>{word}</span>
            ))}
          </p>
        </div>

        {/* Bottom info */}
        <div className="mt-4">
          {/* Divider */}
          <div
            className={[
              'h-px mb-4',
              template.textDark ? 'bg-black/10' : 'bg-white/10',
            ].join(' ')}
          />
          <h3
            className={[
              'font-bold text-base mb-1',
              template.textDark ? 'text-gray-900' : 'text-white',
            ].join(' ')}
          >
            {template.titleKo}
          </h3>
          <p
            className={[
              'text-xs leading-relaxed',
              template.textDark ? 'text-gray-600' : 'text-white/60',
            ].join(' ')}
          >
            {template.description}
          </p>

          {/* CTA arrow */}
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={[
                'text-xs font-semibold',
                template.textDark ? 'text-gray-700' : 'text-white/70',
              ].join(' ')}
            >
              선택하기
            </span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{
                color: template.textDark ? '#374151' : 'rgba(255,255,255,0.7)',
              }}
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M3 7h8M8 4l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Hover shimmer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${template.accentColor}15 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
    </button>
  )
}
