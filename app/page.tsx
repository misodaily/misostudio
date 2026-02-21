'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CategoryTabs } from '@/components/category-tabs'
import { TemplateGrid } from '@/components/template-grid'
import { TEMPLATES, filterByCategory, type TemplateCategory } from '@/lib/templates'

const fadeUp = {
  initial: { y: 8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
}

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all')

  const filtered = filterByCategory(TEMPLATES, activeCategory)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center"
        aria-label="히어로 섹션"
      >
        {/* Preview mode badge */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-orange-50 text-orange-500 border border-orange-100">
            <span
              className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"
              aria-hidden="true"
            />
            미리보기 모드 (Supabase 미연결)
          </span>
        </div>

        {/* Headline */}
        <motion.div
          className="mb-6"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-gray-900">
            <span className="block">일상에</span>
            <span className="block">
              <span className="bg-gradient-to-r from-[#E8420A] to-[#F97316] bg-clip-text text-transparent">
                상상
              </span>
              더하기
            </span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.div
          className="max-w-md mx-auto mb-12"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
        >
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            업로드 한 번으로 AI 라이브포토가 완성됩니다.
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.22 }}
        >
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </motion.div>
      </section>

      {/* Template grid */}
      <section
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-24"
        aria-label="템플릿 목록"
      >
        <TemplateGrid templates={filtered} />
      </section>
    </div>
  )
}
