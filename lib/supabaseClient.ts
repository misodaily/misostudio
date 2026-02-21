import { createClient } from '@supabase/supabase-js';

// ── 브라우저 전용 Supabase 클라이언트 ────────────────────────────────
// anon key 사용 — RLS가 적용되므로 공개 데이터만 접근 가능
// 주요 용도: Supabase Storage에 이미지 직접 업로드
//
// ⚠️ NEVER use supabaseAdmin (service role) on the client side.
// 이 파일은 'use client' 컴포넌트에서만 import하세요.

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnon);

// ── Storage 업로드 헬퍼 ───────────────────────────────────────────────
// 버킷: generation-images (Public)
// Supabase Dashboard에서 사전 생성 필요:
//   Storage → New Bucket → name: "generation-images" → Public: true
const BUCKET = 'generation-images';

export async function uploadGenerationImage(file: File): Promise<string> {
    // 파일명 충돌 방지: timestamp + random suffix
    const ext      = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path     = `uploads/${filename}`;

    const { error } = await supabaseClient.storage
        .from(BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    // 공개 URL 반환 (Runway API가 이 URL로 이미지를 접근)
    const { data } = supabaseClient.storage
        .from(BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
}
