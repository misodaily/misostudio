import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── 팔레트 (Ultrathink Minimalist Theme with Orange Accents) ─────────
// #ffffff  베이스 배경 (완전백색, 극대화된 여백)
// #000000  핵심 타이틀 (강력한 대비)
// #FB8500  메인 포인트 액센트 (버튼, 호버 상태)
// rgba(251, 133, 0, 0.25) 주황색 그림자 투영

interface Template {
    id: string;
    name: string;
    description: string;
    thumbnail_url: string;
    category: string;
    sort_order: number;
}

const MOCK_TEMPLATES: Template[] = [
    { id: 'mock-1', name: '라이트세이버 전투', description: '당신의 사진이 스타워즈 속 영웅으로 변신합니다.', thumbnail_url: 'https://placehold.co/640x360/f8f9fa/1d3557?text=Lightsaber', category: '액션', sort_order: 1 },
    { id: 'mock-2', name: '사이버펑크 네온', description: '비 내리는 네온 시티. 당신이 미래의 주인공이 됩니다.', thumbnail_url: 'https://placehold.co/640x360/f8f9fa/1d3557?text=Cyberpunk', category: '아트', sort_order: 2 },
    { id: 'mock-3', name: '마법사 각성', description: '파티클과 함께 깨어나는 압도적인 마법진 모션.', thumbnail_url: 'https://placehold.co/640x360/f8f9fa/1d3557?text=Magic', category: '판타지', sort_order: 3 },
    { id: 'mock-4', name: '벚꽃 흩날리는', description: '부드러운 시네마틱 카메라워킹과 벚꽃비.', thumbnail_url: 'https://placehold.co/640x360/f8f9fa/1d3557?text=Cherry', category: '일상', sort_order: 4 },
];

async function getTemplates(): Promise<{ templates: Template[]; isMock: boolean }> {
    try {
        const { data, error } = await supabaseAdmin
            .from('templates')
            .select('id, name, description, thumbnail_url, category, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return { templates: MOCK_TEMPLATES, isMock: true };
        return { templates: data, isMock: false };
    } catch (err) {
        return { templates: MOCK_TEMPLATES, isMock: true };
    }
}

function IconSpark() {
    return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
        </svg>
    );
}

function IconPlay() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor" />
        </svg>
    );
}

export default async function GalleryPage() {
    const { templates, isMock } = await getTemplates();
    const categories = ['전체', ...Array.from(new Set(templates.map(t => t.category)))];

    return (
        <div className="min-h-screen bg-[#ffffff] text-[#000000] font-sans selection:bg-[#FB8500]/20">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 transition-all">
                <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="text-[#FB8500] group-hover:scale-110 transition-transform">
                            <IconSpark />
                        </div>
                        <span className="font-extrabold tracking-tight text-[#000000] text-lg">Miso Studio</span>
                    </Link>

                    <div className="flex items-center gap-5">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 bg-gray-50/50">
                            <span className="text-xs font-bold text-gray-500">크레딧 잔액 15</span>
                        </div>
                        <Link href="/pay" className="px-5 py-2 text-sm font-bold text-[#FB8500] bg-[#FFB703]/10 border border-[#FB8500]/20 rounded-full hover:bg-[#FFB703]/20 transition-colors">
                            충전하기
                        </Link>
                        <Link href="/login" className="px-6 py-2 text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(251,133,0,0.25)] bg-gradient-to-r from-[#FB8500] to-[#FFB703] hover:shadow-[0_6px_20px_rgba(251,133,0,0.4)] rounded-full hover:-translate-y-0.5 transition-all">
                            로그인
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-32 relative z-10">
                {isMock && (
                    <div className="mb-12 flex justify-center animate-fade-in">
                        <span className="px-4 py-1.5 text-xs bg-red-50 text-red-600 border border-red-100 rounded-full font-bold shadow-sm">
                            미리보기 모드 (Supabase 미연결)
                        </span>
                    </div>
                )}

                <div className="max-w-3xl mx-auto text-center mb-20 animate-slide-up">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#000000] mb-6 leading-tight">
                        놀라운 순간의 <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB8500] to-[#FFB703]">영상화.</span>
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-12">
                        클릭 한 번으로 당신의 사진이 압도적인 시네마틱 영상으로 다시 태어납니다. 극한의 미니멀리즘과 함께 놀라움을 경험하세요.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.map((cat, i) => (
                            <button
                                key={cat}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${i === 0
                                        ? 'bg-[#FB8500] text-white shadow-[0_4px_14px_0_rgba(251,133,0,0.25)]'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-[#FB8500] hover:text-[#FB8500] hover:bg-[#FFB703]/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {templates.map((template) => (
                        <Link key={template.id} href={`/generate/${template.id}`} className="block group">
                            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 h-full flex flex-col relative">
                                <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={template.thumbnail_url}
                                        alt={template.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-[#000000] shadow-sm">
                                            {template.category}
                                        </span>
                                    </div>

                                    {/* Hover Action Overlay */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="px-6 py-3 bg-[#FB8500] text-white rounded-full flex items-center gap-2 font-bold text-sm shadow-[0_4px_20px_rgba(251,133,0,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <IconPlay /> 시작하기
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 bg-white">
                                    <h3 className="font-extrabold text-lg text-[#000000] mb-2 group-hover:text-[#FB8500] transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 line-clamp-2">
                                        {template.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
