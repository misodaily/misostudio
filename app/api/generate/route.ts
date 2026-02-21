import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── Vercel 함수 타임아웃 설정 (Pro 플랜 필요) ─────────────────────────
export const maxDuration = 300;

// ── 서버 전용 상수 (클라이언트 입력으로 변경 불가) ────────────────────
const RUNWAY_API_KEY  = process.env.RUNWAY_API_KEY;
const RUNWAY_BASE_URL = 'https://api.dev.runwayml.com';
const MODEL           = 'gen4_turbo';  // 고정
const DURATION        = 5;             // 고정 (초)
const RATIO           = '1:1';         // 고정

// 폴링 설정: 5초 간격 × 최대 24회 = 최대 2분 대기
const POLL_INTERVAL_MS  = 5_000;
const MAX_POLL_ATTEMPTS = 24;

// ── Runway task 폴링 ───────────────────────────────────────────────────
async function pollRunwayTask(taskId: string): Promise<string> {
    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

        const res = await fetch(`${RUNWAY_BASE_URL}/v1/tasks/${taskId}`, {
            headers: {
                'Authorization':    `Bearer ${RUNWAY_API_KEY}`,
                'X-Runway-Version': '2024-11-06',
            },
        });

        if (!res.ok) {
            throw new Error(`Runway task 조회 실패 (${res.status})`);
        }

        const task = await res.json();

        if (task.status === 'SUCCEEDED') {
            const videoUrl: string | undefined = task.output?.[0];
            if (!videoUrl) throw new Error('Runway 응답에 output URL이 없습니다.');
            return videoUrl;
        }

        if (task.status === 'FAILED') {
            throw new Error(`Runway task 실패: ${task.failure ?? 'Unknown'}`);
        }

        console.log(`[generate] polling ${attempt}/${MAX_POLL_ATTEMPTS} — status: ${task.status}`);
    }

    throw new Error('Runway task 폴링 타임아웃 (2분 초과)');
}

// ── 크레딧 환불 헬퍼 ─────────────────────────────────────────────────
async function refundCredit(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('credit_ledger').insert({
        user_id: userId,
        delta:   1,
        reason:  'REFUND',
    });
    if (error) {
        console.error('[generate] CRITICAL: credit refund failed for user', userId, error);
    }
}

// ── generations 상태 업데이트 헬퍼 ───────────────────────────────────
async function updateGeneration(
    id: string,
    fields: Record<string, unknown>,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('generations')
        .update(fields)
        .eq('id', id);
    if (error) {
        console.error('[generate] generations update error:', error);
    }
}

// ── POST handler ──────────────────────────────────────────────────────
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, templateId, imageUrl } = body;

        // ── 입력 검증 ────────────────────────────────────────────
        if (!userId || !templateId || !imageUrl) {
            return NextResponse.json(
                { error: '필수 항목이 누락되었습니다. (userId, templateId, imageUrl)' },
                { status: 400 },
            );
        }

        if (!RUNWAY_API_KEY) {
            return NextResponse.json(
                { error: '서버 설정 오류 (Runway API Key 없음)' },
                { status: 500 },
            );
        }

        // TODO: Supabase Auth로 userId 서버 측 검증
        // const authHeader = request.headers.get('Authorization');
        // const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader?.split(' ')[1]);
        // if (!user) return NextResponse.json({ error: '인증 실패' }, { status: 401 });
        // const userId = user.id;

        // ── 0. 템플릿 조회 (prompt 획득) ─────────────────────────
        const { data: template, error: templateError } = await supabaseAdmin
            .from('templates')
            .select('id, name, prompt')
            .eq('id', templateId)
            .eq('is_active', true)
            .single();

        if (templateError || !template) {
            return NextResponse.json(
                { error: '템플릿을 찾을 수 없습니다.' },
                { status: 404 },
            );
        }

        // ── 1. generations 레코드 생성 (PENDING) ─────────────────
        const { data: generation, error: genError } = await supabaseAdmin
            .from('generations')
            .insert({
                user_id:         userId,
                template_id:     templateId,
                input_image_url: imageUrl,
                status:          'PENDING',
            })
            .select('id')
            .single();

        if (genError || !generation) {
            console.error('[generate] generations insert error:', genError);
            return NextResponse.json(
                { error: '생성 요청 기록에 실패했습니다.' },
                { status: 500 },
            );
        }

        const generationId = generation.id;

        // ── 2. 크레딧 잔액 조회 ──────────────────────────────────
        const { data: creditData, error: creditError } = await supabaseAdmin
            .from('user_credits')
            .select('credit_balance')
            .eq('user_id', userId)
            .single();

        if (creditError && creditError.code !== 'PGRST116') {
            await updateGeneration(generationId, { status: 'FAILED' });
            return NextResponse.json({ error: '크레딧 조회에 실패했습니다.' }, { status: 500 });
        }

        const currentBalance = Number(creditData?.credit_balance ?? 0);
        if (currentBalance < 1) {
            await updateGeneration(generationId, { status: 'FAILED' });
            return NextResponse.json(
                { error: `크레딧이 부족합니다. (현재: ${currentBalance})`, code: 'INSUFFICIENT_CREDITS' },
                { status: 402 },
            );
        }

        // ── 3. 크레딧 선차감 (-1) ────────────────────────────────
        const { error: deductError } = await supabaseAdmin.from('credit_ledger').insert({
            user_id: userId,
            delta:   -1,
            reason:  'GENERATE',
        });

        if (deductError) {
            await updateGeneration(generationId, { status: 'FAILED' });
            return NextResponse.json({ error: '크레딧 차감에 실패했습니다.' }, { status: 500 });
        }

        // ── 4. Runway API 호출 ────────────────────────────────────
        await updateGeneration(generationId, { status: 'PROCESSING' });

        let videoUrl: string;

        try {
            // 4-a. image_to_video task 생성
            const runwayRes = await fetch(`${RUNWAY_BASE_URL}/v1/image_to_video`, {
                method: 'POST',
                headers: {
                    'Authorization':    `Bearer ${RUNWAY_API_KEY}`,
                    'Content-Type':     'application/json',
                    'X-Runway-Version': '2024-11-06',
                },
                body: JSON.stringify({
                    model:       MODEL,            // gen4_turbo (고정)
                    promptImage: imageUrl,
                    promptText:  template.prompt,  // 템플릿 프롬프트 사용
                    duration:    DURATION,         // 5초 (고정)
                    ratio:       RATIO,            // 1:1 (고정)
                }),
            });

            if (!runwayRes.ok) {
                const errBody = await runwayRes.json().catch(() => ({}));
                throw new Error(`Runway API 오류 (${runwayRes.status}): ${errBody?.error ?? ''}`);
            }

            const runwayData = await runwayRes.json();
            const taskId: string = runwayData.id;

            if (!taskId) throw new Error('Runway API 응답에 task ID가 없습니다.');

            // runway_task_id 저장 (디버깅용)
            await updateGeneration(generationId, { runway_task_id: taskId });

            console.log(`[generate] Runway task created: ${taskId} for generation: ${generationId}`);

            // 4-b. 폴링
            videoUrl = await pollRunwayTask(taskId);

        } catch (apiError) {
            console.error('[generate] Runway 실패:', apiError);

            // generations FAILED + 크레딧 환불
            await Promise.all([
                updateGeneration(generationId, { status: 'FAILED' }),
                refundCredit(userId),
            ]);

            return NextResponse.json(
                { error: '영상 생성에 실패했습니다. 크레딧이 환불되었습니다.' },
                { status: 500 },
            );
        }

        // ── 5. 성공: generations COMPLETED 업데이트 ──────────────
        await updateGeneration(generationId, {
            status:           'COMPLETED',
            output_video_url: videoUrl,
        });

        return NextResponse.json({ success: true, videoUrl, generationId });

    } catch (err) {
        console.error('[generate] Internal error:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
