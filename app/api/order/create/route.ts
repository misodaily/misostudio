import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PACKS, PackType } from '@/lib/packs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, packType, orderId } = body;

        // ── 입력 검증 ──────────────────────────────────────────────
        if (!userId || !packType || !orderId) {
            return NextResponse.json(
                { error: '필수 항목이 누락되었습니다. (userId, packType, orderId)' },
                { status: 400 },
            );
        }

        if (!PACKS[packType as PackType]) {
            return NextResponse.json(
                { error: '유효하지 않은 상품 유형입니다.' },
                { status: 400 },
            );
        }

        // amount는 클라이언트 입력이 아닌 서버 측 PACKS에서 강제로 결정
        const { amount } = PACKS[packType as PackType];

        // ── payments 테이블에 PENDING 레코드 삽입 ──────────────────
        // order_id는 UNIQUE 제약이 있으므로 중복 시 PostgreSQL error code 23505 반환
        // select → check 패턴(race condition 위험) 대신 INSERT 단건으로 처리
        const { error } = await supabaseAdmin.from('payments').insert({
            user_id:   userId,
            order_id:  orderId,
            pack_type: packType,
            amount,
            status:    'PENDING',
        });

        if (error) {
            // 23505: unique_violation — 동일 order_id가 이미 존재
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: '이미 존재하는 주문 ID입니다.' },
                    { status: 409 },
                );
            }
            console.error('[order/create] DB error:', error);
            return NextResponse.json(
                { error: '주문 생성에 실패했습니다.' },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, orderId, amount });

    } catch (err) {
        console.error('[order/create] Internal error:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
