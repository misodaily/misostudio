import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PACKS, PackType } from '@/lib/packs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { paymentKey, orderId, amount: rawAmount } = body;

        // ── 입력 검증 ──────────────────────────────────────────────
        if (!paymentKey || !orderId || rawAmount === undefined) {
            return NextResponse.json(
                { error: '필수 항목이 누락되었습니다. (paymentKey, orderId, amount)' },
                { status: 400 },
            );
        }

        // URL query로 전달된 amount는 string일 수 있으므로 Number로 통일
        const amount = Number(rawAmount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: '유효하지 않은 금액입니다.' }, { status: 400 });
        }

        // ── 1. DB에서 주문 조회 ────────────────────────────────────
        const { data: payment, error: fetchError } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (fetchError || !payment) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        // ── 2. 중복 confirm 방지 (idempotency) ────────────────────
        // 이미 CONFIRMED라면 크레딧 이중 지급 없이 ok 반환
        if (payment.status === 'CONFIRMED') {
            return NextResponse.json({ ok: true, alreadyConfirmed: true });
        }

        // ── 3. 금액 3중 검증 ──────────────────────────────────────
        // DB에 저장된 amount, 요청 amount, PACKS 정의 amount 모두 일치해야 함
        const pack = PACKS[payment.pack_type as PackType];
        if (!pack) {
            return NextResponse.json({ error: '상품 정보를 확인할 수 없습니다.' }, { status: 500 });
        }

        if (payment.amount !== amount || pack.amount !== amount) {
            console.error('[toss/confirm] Amount mismatch:', {
                db: payment.amount,
                packs: pack.amount,
                request: amount,
            });
            return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
        }

        // ── 4. Toss Payments confirm API 호출 ─────────────────────
        const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
        if (!TOSS_SECRET_KEY) {
            console.error('[toss/confirm] TOSS_SECRET_KEY is not set');
            return NextResponse.json({ error: '서버 설정 오류 (Toss Key 없음)' }, { status: 500 });
        }

        // Toss Basic Auth: base64(secretKey + ":")
        const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

        const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                Authorization:   `Basic ${encodedKey}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const tossData = await tossRes.json();

        if (!tossRes.ok) {
            // Toss confirm 실패 → payments를 FAILED로 업데이트
            await supabaseAdmin
                .from('payments')
                .update({ status: 'FAILED', payment_key: paymentKey })
                .eq('order_id', orderId);

            console.error('[toss/confirm] Toss API error:', tossData);
            return NextResponse.json(
                { error: tossData.message || '결제 확인에 실패했습니다.' },
                { status: tossRes.status },
            );
        }

        // ── 5. payments CONFIRMED 업데이트 ─────────────────────────
        const { error: updateError } = await supabaseAdmin
            .from('payments')
            .update({
                status:       'CONFIRMED',
                payment_key:  paymentKey,
                confirmed_at: new Date().toISOString(),
            })
            .eq('order_id', orderId);

        if (updateError) {
            console.error('[toss/confirm] payments update error:', updateError);
            // 결제는 됐지만 DB 업데이트 실패 — 재시도 시 idempotency가 처리 불가
            // TODO: 관리자 알림 연동 (Slack, PagerDuty 등)
            return NextResponse.json({ error: '결제 상태 업데이트에 실패했습니다.' }, { status: 500 });
        }

        // ── 6. credit_ledger에 크레딧 적립 ────────────────────────
        const { error: ledgerError } = await supabaseAdmin.from('credit_ledger').insert({
            user_id:      payment.user_id,
            delta:        pack.credits,
            reason:       payment.pack_type,  // 'PACK_5' | 'PACK_10'
            ref_order_id: orderId,
        });

        if (ledgerError) {
            console.error('[toss/confirm] credit_ledger insert error:', ledgerError);
            // 심각: 결제 성공 + CONFIRMED 업데이트는 됐지만 크레딧 지급 실패
            // TODO: 관리자 알림 + 보상 트랜잭션 처리 필요
            return NextResponse.json(
                { error: '크레딧 지급에 실패했습니다. 고객센터에 문의해주세요.' },
                { status: 500 },
            );
        }

        return NextResponse.json({ ok: true, credits: pack.credits });

    } catch (err) {
        console.error('[toss/confirm] Internal error:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
