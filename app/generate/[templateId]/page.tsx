'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadGenerationImage } from '@/lib/supabaseClient';

// ── 타입 ──────────────────────────────────────────────────────────────
interface Template {
    id:            string;
    name:          string;
    description:   string;
    thumbnail_url: string;
    category:      string;
}

type GenerateStep =
    | 'idle'           // 대기
    | 'uploading'      // Supabase Storage 업로드 중
    | 'generating'     // Runway API 폴링 중
    | 'completed'      // 완료
    | 'error';         // 실패

// TODO: Supabase Auth에서 실제 userId 획득
// import { supabaseClient } from '@/lib/supabaseClient';
// const { data: { user } } = await supabaseClient.auth.getUser();
const TEMP_USER_ID = 'TODO_REPLACE_WITH_SUPABASE_AUTH_USER_ID';

// ── 아이콘 ────────────────────────────────────────────────────────────
function IconUpload() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V5M12 5L8 9M12 5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 17v1a3 3 0 003 3h12a3 3 0 003-3v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconBack() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconDownload() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}
function IconSpark() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
        </svg>
    );
}
function IconX() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

// ── 생성 단계 인디케이터 ─────────────────────────────────────────────
const STEPS = [
    { key: 'uploading',   label: '이미지 업로드 중' },
    { key: 'generating',  label: '영상 생성 중 (최대 2분)' },
    { key: 'completed',   label: '완료' },
] as const;

function StepIndicator({ currentStep }: { currentStep: GenerateStep }) {
    return (
        <div className="flex items-center gap-3">
            {STEPS.map((step, i) => {
                const stepKeys = ['uploading', 'generating', 'completed'];
                const currentIdx = stepKeys.indexOf(currentStep);
                const stepIdx    = stepKeys.indexOf(step.key);
                const isDone     = stepIdx < currentIdx || currentStep === 'completed';
                const isActive   = stepIdx === currentIdx && currentStep !== 'completed';

                return (
                    <div key={step.key} className="flex items-center gap-2">
                        <div className={[
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                            isDone   ? 'bg-[#219EBC] text-white' :
                            isActive ? 'bg-[#FB8500] text-white animate-pulse' :
                                       'bg-white/[0.07] text-white/30',
                        ].join(' ')}>
                            {isDone ? '✓' : i + 1}
                        </div>
                        <span className={[
                            'text-xs',
                            isActive ? 'text-white/80' : isDone ? 'text-[#8ECAE6]' : 'text-white/25',
                        ].join(' ')}>
                            {step.label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <div className={[
                                'w-8 h-px mx-1',
                                isDone ? 'bg-[#219EBC]/50' : 'bg-white/[0.07]',
                            ].join(' ')} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function GeneratePage() {
    const params    = useParams();
    const router    = useRouter();
    const templateId = params.templateId as string;

    const [template,      setTemplate]      = useState<Template | null>(null);
    const [templateLoading, setTemplateLoading] = useState(true);

    // 이미지 상태
    const [imageFile,     setImageFile]     = useState<File | null>(null);
    const [imagePreview,  setImagePreview]  = useState<string | null>(null);
    const [isDragging,    setIsDragging]    = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 생성 상태
    const [step,          setStep]          = useState<GenerateStep>('idle');
    const [videoUrl,      setVideoUrl]      = useState<string | null>(null);
    const [errorMsg,      setErrorMsg]      = useState('');

    // ── 템플릿 조회 ────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/templates');
                const { templates } = await res.json();
                const found = (templates as Template[]).find(t => t.id === templateId);
                if (!found) {
                    router.replace('/');
                    return;
                }
                setTemplate(found);
            } catch {
                router.replace('/');
            } finally {
                setTemplateLoading(false);
            }
        })();
    }, [templateId, router]);

    // ── 이미지 선택 ────────────────────────────────────────────────
    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setErrorMsg('이미지 파일만 업로드 가능합니다. (JPG, PNG, WEBP)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrorMsg('파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        setErrorMsg('');
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setStep('idle');
        setVideoUrl(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // ── 영상 생성 ──────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!imageFile || !template) return;

        setErrorMsg('');
        setVideoUrl(null);

        try {
            // 1. Supabase Storage 업로드
            setStep('uploading');
            const imageUrl = await uploadGenerationImage(imageFile);

            // 2. Runway 생성 요청
            setStep('generating');
            const res = await fetch('/api/generate', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId:     TEMP_USER_ID,
                    templateId: template.id,
                    imageUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 402) {
                    // 크레딧 부족
                    setErrorMsg(`${data.error} 크레딧을 충전해주세요.`);
                    setStep('error');
                    return;
                }
                throw new Error(data.error ?? '영상 생성에 실패했습니다.');
            }

            setVideoUrl(data.videoUrl);
            setStep('completed');

        } catch (err) {
            console.error('[generate] error:', err);
            setErrorMsg(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            setStep('error');
        }
    };

    const resetImage = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        setStep('idle');
        setVideoUrl(null);
        setErrorMsg('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const isGenerating = step === 'uploading' || step === 'generating';

    // ── 로딩 ───────────────────────────────────────────────────────
    if (templateLoading) {
        return (
            <div className="min-h-screen bg-[#023047] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#FB8500]/30 border-t-[#FB8500] animate-spin" />
            </div>
        );
    }

    if (!template) return null;

    return (
        <div className="min-h-screen bg-[#023047] text-white antialiased">

            {/* 배경 글로우 */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(33,158,188,0.12) 0%, transparent 60%)',
                }}
            />

            {/* ── 네비게이션 ─────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#023047]/80 backdrop-blur-xl">
                <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
                    >
                        <IconBack />
                        템플릿 목록
                    </Link>

                    <Link
                        href="/pay"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FB8500] text-white text-sm font-semibold hover:bg-[#e07a00] transition-colors"
                    >
                        크레딧 충전
                    </Link>
                </nav>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10">
                <div className="grid lg:grid-cols-[340px,1fr] gap-8 items-start">

                    {/* ── 왼쪽: 템플릿 정보 ──────────────────────── */}
                    <div className="space-y-4">
                        {/* 썸네일 */}
                        <div className="rounded-2xl overflow-hidden border border-white/[0.07] aspect-video bg-white/[0.02]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={template.thumbnail_url}
                                alt={template.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* 템플릿 메타 */}
                        <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <h1 className="text-lg font-bold text-white/90">{template.name}</h1>
                                <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#219EBC]/15 border border-[#219EBC]/25 text-[#8ECAE6] text-xs font-medium">
                                    {template.category}
                                </span>
                            </div>
                            <p className="text-white/45 text-sm leading-relaxed">
                                {template.description}
                            </p>

                            <div className="pt-3 border-t border-white/[0.06] flex items-center gap-4 text-xs text-white/30">
                                <div className="flex items-center gap-1.5">
                                    <IconSpark />
                                    Gen4 Turbo
                                </div>
                                <span>·</span>
                                <span>5초 영상</span>
                                <span>·</span>
                                <span>1:1 비율</span>
                            </div>
                        </div>

                        {/* 사용 안내 */}
                        <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] space-y-2">
                            {[
                                '사진 속 주인공이 템플릿 스타일로 영상화됩니다',
                                '인물 사진이 가장 좋은 결과를 보여줍니다',
                                '생성 실패 시 크레딧이 자동 환불됩니다',
                            ].map((tip) => (
                                <div key={tip} className="flex items-start gap-2 text-xs text-white/35">
                                    <span className="text-[#FB8500]/60 mt-0.5 flex-shrink-0">•</span>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── 오른쪽: 업로드 + 생성 ─────────────────── */}
                    <div className="space-y-5">

                        {/* 이미지 업로드 영역 */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-white/80">사진 업로드</h2>
                                {imageFile && (
                                    <button
                                        onClick={resetImage}
                                        className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        <IconX />
                                        다시 선택
                                    </button>
                                )}
                            </div>

                            {imagePreview ? (
                                /* 이미지 미리보기 */
                                <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] aspect-square max-w-sm mx-auto lg:mx-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imagePreview}
                                        alt="선택된 이미지"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* 업로드 중 오버레이 */}
                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full border-2 border-[#FB8500]/30 border-t-[#FB8500] animate-spin" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* 드래그 드롭 업로드 영역 */
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={[
                                        'aspect-square max-w-sm mx-auto lg:mx-0 rounded-2xl border-2 border-dashed',
                                        'flex flex-col items-center justify-center gap-3 cursor-pointer',
                                        'transition-all duration-200',
                                        isDragging
                                            ? 'border-[#FB8500]/60 bg-[#FB8500]/10'
                                            : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]',
                                    ].join(' ')}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-white/30">
                                        <IconUpload />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white/60 text-sm font-medium">
                                            {isDragging ? '여기에 놓으세요' : '클릭하거나 드래그하여 업로드'}
                                        </p>
                                        <p className="text-white/25 text-xs mt-1">
                                            JPG, PNG, WEBP · 최대 10MB
                                        </p>
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* 단계 표시 (생성 중일 때) */}
                        {isGenerating && (
                            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto">
                                <StepIndicator currentStep={step} />
                            </div>
                        )}

                        {/* 완료 — 비디오 결과 */}
                        {step === 'completed' && videoUrl && (
                            <div className="space-y-3">
                                <div className="rounded-2xl overflow-hidden border border-[#219EBC]/20 bg-white/[0.02]">
                                    <video
                                        src={videoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={videoUrl}
                                        download="miso-studio-video.mp4"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.1] text-white/70 text-sm font-medium hover:bg-white/[0.05] transition-all"
                                    >
                                        <IconDownload />
                                        영상 다운로드
                                    </a>
                                    <button
                                        onClick={resetImage}
                                        className="flex-1 py-3 rounded-xl border border-[#219EBC]/30 text-[#8ECAE6] text-sm font-medium hover:bg-[#219EBC]/10 transition-all"
                                    >
                                        새 영상 만들기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 에러 메시지 */}
                        {errorMsg && step !== 'completed' && (
                            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.06]">
                                <p className="text-red-400 text-sm">{errorMsg}</p>
                                {errorMsg.includes('크레딧') && (
                                    <Link
                                        href="/pay"
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#8ECAE6] hover:text-[#8ECAE6]/80 transition-colors"
                                    >
                                        <IconSpark />
                                        크레딧 충전하러 가기
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* 생성 버튼 */}
                        {step !== 'completed' && (
                            <button
                                onClick={handleGenerate}
                                disabled={!imageFile || isGenerating}
                                className={[
                                    'w-full py-4 rounded-2xl font-bold text-base transition-all duration-200',
                                    'flex items-center justify-center gap-2.5',
                                    !imageFile || isGenerating
                                        ? 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                                        : 'bg-[#FB8500] text-white hover:bg-[#e07a00] shadow-lg shadow-[#FB8500]/20',
                                ].join(' ')}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        {step === 'uploading' ? '업로드 중...' : '영상 생성 중...'}
                                    </>
                                ) : (
                                    <>
                                        <IconSpark />
                                        영상 생성하기 (1 크레딧)
                                    </>
                                )}
                            </button>
                        )}

                        {/* 이미지 미선택 안내 */}
                        {!imageFile && step === 'idle' && (
                            <p className="text-center text-xs text-white/25">
                                사진을 먼저 업로드해주세요
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
