'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { PACKS } from '@/lib/packs';

const creditPacks = Object.entries(PACKS).map(([id, p]) => ({
    id,
    name: p.name,
    credits: p.credits,
    price: p.amount,
    bonus: id === 'PACK_5' ? 0 : 2,
}));

export default function PayPage() {
    const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const selectedPack = creditPacks.find(p => p.id === selectedPackId);

    const handlePayment = async () => {
        if (!selectedPack) return;
        setIsLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packId: selectedPack.id }),
            });
            const orderData = await res.json();

            if (!res.ok) {
                throw new Error(orderData.error || '주문 생성 실패');
            }

            const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
            const payment = tossPayments.payment({ customerKey: orderData.customerKey });

            await payment.requestPayment({
                method: 'CARD',
                amount: {
                    currency: 'KRW',
                    value: selectedPack.price
                },
                orderId: orderData.orderId,
                orderName: selectedPack.name,
                successUrl: `${window.location.origin}/pay/success`,
                failUrl: `${window.location.origin}/pay/fail`,
                customerEmail: 'customer@miso.studio',
                customerName: '홍길동',
            });

        } catch (error: any) {
            console.error('결제 에러:', error);
            setErrorMsg(error.message || '결제 진행 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ffffff] text-[#1D3557] font-sans flex flex-col pt-16">
            <header className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
                <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group text-[#1D3557] hover:text-[#FB8500] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform">
                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-semibold text-sm">돌아가기</span>
                    </Link>
                    <div className="font-bold tracking-tight">Miso Studio</div>
                </nav>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10 animate-fade-in">
                <div className="text-center mb-16 relative">
                    <span className="inline-block px-3 py-1 bg-[#FFB703]/10 text-[#FB8500] border border-[#FB8500]/20 rounded-full text-xs font-bold mb-4">크레딧 충전</span>
                    <h1 className="text-4xl font-extrabold text-[#1D3557] mb-4 tracking-tight">당신의 아이디어를<br />현실로 만들 크레딧</h1>
                    <p className="text-[#457B9D]">원하는 작업량에 맞는 크레딧 패키지를 선택하세요.<br />영상 생성 1회당 1 크레딧이 소진됩니다.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 relative z-10">
                    {creditPacks.map((pack) => {
                        const isSelected = selectedPackId === pack.id;
                        return (
                            <div
                                key={pack.id}
                                onClick={() => setSelectedPackId(pack.id)}
                                className={`
                                    relative p-6 rounded-3xl cursor-pointer transition-all duration-300 border
                                    ${isSelected ? 'bg-white border-[#FB8500] shadow-[0_10px_30px_rgba(251,133,0,0.15)] scale-105' : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-[#FFB703]/50'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-[#1D3557] mb-1">{pack.name}</h3>
                                        <p className="text-sm font-semibold text-[#457B9D]">{pack.credits} Credits</p>
                                    </div>
                                    {pack.bonus > 0 && (
                                        <span className="px-2 py-1 bg-[#FFB703]/10 text-[#FB8500] text-xs font-bold rounded-xl border border-[#FB8500]/20">+{pack.bonus} 보너스</span>
                                    )}
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100 flex items-end gap-1">
                                    <span className="text-3xl font-extrabold text-[#1D3557] tracking-tight">₩{pack.price.toLocaleString()}</span>
                                </div>
                                <div className={`mt-6 h-1 w-full rounded-full transition-colors ${isSelected ? 'bg-[#FB8500]' : 'bg-gray-100'}`} />
                            </div>
                        );
                    })}
                </div>

                {errorMsg && (
                    <div className="mt-10 max-w-lg mx-auto p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">
                        {errorMsg}
                    </div>
                )}

                <div className="mt-16 flex flex-col items-center gap-4 relative z-10">
                    <button
                        className={`w-full max-w-sm h-14 rounded-full text-lg font-bold flex items-center justify-center transition-all shadow-md
                        ${!selectedPackId || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#FB8500] text-white hover:bg-[#FFB703] shadow-[#FB8500]/20 hover:scale-105'}
                        `}
                        disabled={!selectedPackId || isLoading}
                        onClick={handlePayment}
                    >
                        {isLoading ? '결제 준비 중...' : selectedPack ? `${selectedPack.price.toLocaleString()}원 결제하기` : '패키지를 선택해주세요'}
                    </button>
                    <p className="text-xs text-[#457B9D] text-center leading-relaxed">
                        결제 시 토스페이먼츠(Toss Payments) 창으로 이동합니다.<br />
                        안전하고 간편하게 결제를 진행할 수 있습니다.
                    </p>
                </div>
            </main>
        </div>
    );
}
