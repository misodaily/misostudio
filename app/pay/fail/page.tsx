'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// useSearchParams는 반드시 Suspense 경계 안에서 사용
function FailContent() {
    const searchParams = useSearchParams();
    const router       = useRouter();

    const message = searchParams.get('message') || '결제가 취소되었거나 실패했습니다.';
    const code    = searchParams.get('code');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[#023047] text-white">
            <div className="text-red-400 mb-4 text-6xl">!</div>
            <h1 className="text-2xl font-bold text-white">결제 실패</h1>
            <p className="mt-2 text-white/55 max-w-xs">{message}</p>
            {code && <p className="text-xs text-white/30 mt-1">오류 코드: {code}</p>}

            <button
                onClick={() => router.push('/pay')}
                className="mt-8 px-6 py-3 bg-[#FB8500] text-white rounded-xl hover:bg-[#e07a00] font-semibold transition-colors shadow-lg shadow-[#FB8500]/20"
            >
                다시 결제하기
            </button>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#023047] text-white/40">
                로딩 중...
            </div>
        }>
            <FailContent />
        </Suspense>
    );
}
