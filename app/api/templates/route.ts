import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface Template {
    id: string;
    name: string;
    description: string;
    thumbnail_url: string;
    category: string;
    sort_order: number;
}

const MOCK_TEMPLATES: Template[] = [
    { id: 'mock-1', name: '라이트세이버 전투', description: '당신의 사진이 스타워즈 속 영웅으로 변신합니다.', thumbnail_url: 'https://placehold.co/640x360/111111/333333?text=Lightsaber', category: '액션', sort_order: 1 },
    { id: 'mock-2', name: '사이버펑크 네온', description: '비 내리는 네온 시티. 당신이 미래의 주인공이 됩니다.', thumbnail_url: 'https://placehold.co/640x360/111111/333333?text=Cyberpunk', category: '아트', sort_order: 2 },
    { id: 'mock-3', name: '마법사 각성', description: '파티클과 함께 깨어나는 압도적인 마법진 모션.', thumbnail_url: 'https://placehold.co/640x360/111111/333333?text=Magic', category: '판타지', sort_order: 3 },
    { id: 'mock-4', name: '벚꽃 흩날리는', description: '부드러운 시네마틱 카메라워킹과 벚꽃비.', thumbnail_url: 'https://placehold.co/640x360/111111/333333?text=Cherry', category: '일상', sort_order: 4 },
];

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('templates')
            .select('id, name, description, thumbnail_url, category, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            console.warn('[api/templates] DB error or empty, using mock data:', error);
            return NextResponse.json({ templates: MOCK_TEMPLATES });
        }

        return NextResponse.json({ templates: data });

    } catch (err) {
        console.warn('[api/templates] Internal error, using mock data:', err);
        return NextResponse.json({ templates: MOCK_TEMPLATES });
    }
}
