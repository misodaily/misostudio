'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Icons ─────────────────────────────────────────────────────────────
function IconCheck() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconSpark() {
    return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
        </svg>
    );
}

// ── Components ────────────────────────────────────────────────────────
function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');

    const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
    const [message, setMessage] = useState('결제 승인 중입니다...');
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!orderId || !paymentKey || !amount) {
            setStatus('fail');
            setMessage('잘못된 접근입니다. 결제 정보가 부족합니다.');
            return;
        }

        if (hasFetched.current) return;
        hasFetched.current = true;

        const confirmPayment = async () => {
            try {
                const res = await fetch('/api/toss/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, paymentKey, amount: Number(amount) }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || '결제 승인에 실패했습니다.');
                }

                setStatus('success');
                setMessage('크레딧 충전이 완료되었습니다.');

            } catch (err: any) {
                console.error('Confirm error:', err);
                setStatus('fail');
                setMessage(err.message || '결제 처리 중 오류가 발생했습니다.');
            }
        };

        confirmPayment();
    }, [orderId, paymentKey, amount]);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            {status === 'loading' && (
                <>
                    <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#FB8500] animate-spin mb-6 shadow-sm" />
                    <h2 className="text-2xl font-extrabold text-[#1D3557] mb-2">{message}</h2>
                    <p className="text-[#457B9D] text-sm">페이지를 닫거나 새로고침하지 마세요.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 shadow-sm border border-green-100">
                        <IconCheck />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#1D3557] mb-3 tracking-tight">결제 완료!</h2>
                    <p className="text-[#457B9D] font-medium mb-8">
                        {message} 이제 놀라운 영상을 생성해보세요.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                        <Link
                            href="/"
                            className="flex-1 py-3.5 px-6 rounded-full bg-[#FB8500] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#FFB703] transition-all shadow-md shadow-[#FB8500]/20 hover:scale-105"
                        >
                            <IconSpark />
                            영상 만들러 가기
                        </Link>
                    </div>
                </>
            )}

            {status === 'fail' && (
                <>
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-[#1D3557] mb-3">결제 실패</h2>
                    <p className="text-red-500 mb-8 font-medium">{message}</p>

                    <button
                        onClick={() => router.push('/pay')}
                        className="py-3.5 px-8 rounded-full bg-[#1D3557] text-white font-bold hover:bg-[#457B9D] transition-colors shadow-sm"
                    >
                        다시 결제하기
                    </button>
                </>
            )}
        </div>
    );
}

export default function PaySuccessPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FB8500] to-[#FFB703]" />
                <Suspense fallback={
                    <div className="p-12 flex flex-col items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#FB8500] rounded-full animate-spin" />
                    </div>
                }>
                    <SuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
