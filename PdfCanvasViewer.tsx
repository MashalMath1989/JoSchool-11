import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2, Globe } from 'lucide-react';
import { getGoogleViewerUrl } from './viewerUtils';

export interface PdfCanvasViewerProps {
    url: string;
    title?: string;
    onDownload?: () => void;
    onClose?: () => void;
    isFullScreen?: boolean;
    onToggleFullScreen?: () => void;
    initialPage?: number;
    className?: string;
    defaultEngine?: 'canvas' | 'google';
    showFloatingButton?: boolean;
}

interface PdfViewerInnerProps {
    url: string;
    title?: string;
    className?: string;
    showFloatingButton?: boolean;
}

const PdfViewerInner: React.FC<PdfViewerInnerProps> = ({
    url,
    title,
    className = '',
    showFloatingButton = false
}) => {
    const [iframeLoading, setIframeLoading] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(18);
    const [loadingStage, setLoadingStage] = useState<string>('الاتصال السريع بخوادم Google...');
    const isLoadedRef = useRef<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const embedUrl = useMemo(() => getGoogleViewerUrl(url, true), [url]);
    const externalOpenUrl = useMemo(() => getGoogleViewerUrl(url, false), [url]);

    // اكتمال التحميل الفوري بسلاسة
    const handleIframeLoaded = useCallback(() => {
        if (isLoadedRef.current) return;
        isLoadedRef.current = true;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
        }

        setProgress(100);
        setLoadingStage('اكتمل تجهيز الملف 100%');

        // مهلة خفيفة ليرى المستخدم اكتمال الشريط بنسبة 100% قبل الإظهار
        setTimeout(() => {
            setIframeLoading(false);
        }, 180);
    }, []);

    // محاكاة تسارع النسبة المئوية فائقة السرعة
    useEffect(() => {
        const startTime = Date.now();

        // مؤقت زيادة النسبة المئوية بمعدل استجابة كل 40 مللي ثانية
        timerRef.current = setInterval(() => {
            if (isLoadedRef.current) return;

            const elapsed = Date.now() - startTime;

            setProgress((prev) => {
                let delta: number;
                if (elapsed < 350) {
                    // مرحلة الاتصال السريع (18% -> 48%)
                    delta = Math.random() * 4 + 2;
                    setLoadingStage('الاتصال السريع بخوادم Google...');
                } else if (elapsed < 1100) {
                    // مرحلة تدفق وتحميل صفحات الملف (48% -> 76%)
                    delta = Math.random() * 2.5 + 1;
                    setLoadingStage('جاري نقل وتجهيز صفحات الملف...');
                } else if (elapsed < 2400) {
                    // مرحلة معالجة واجهة العرض (76% -> 91%)
                    delta = Math.random() * 1.2 + 0.5;
                    setLoadingStage('معالجة واجهة العرض الفورية...');
                } else {
                    // استقرار عند 92-95% بانتظار إشارة إطار العرض
                    delta = 0.25;
                    setLoadingStage('اكتمال العرض الآن...');
                }

                return Math.min(95, prev + delta);
            });
        }, 40);

        // مؤقت أمان فائق الذكاء: إذا تأخر إشعار onLoad بسبب سكربتات تتبع Google يتم فتح الملف تلقائياً عند 5.2 ثانية
        safetyTimeoutRef.current = setTimeout(() => {
            if (!isLoadedRef.current) {
                handleIframeLoaded();
            }
        }, 5200);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        };
    }, [handleIframeLoaded]);

    return (
        <div 
            className={`w-full h-full relative bg-slate-950 overflow-hidden flex flex-col ${className}`} 
            dir="rtl"
        >
            {/* شاشة تحميل فائقة السرعة مع شريط نسبة مئوية يظهر سرعة التحميل للعرض بدلاً من النص الثابت */}
            {iframeLoading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none transition-opacity duration-300">
                    <div className="w-full max-w-xs flex flex-col items-center">
                        {/* حلقة التحميل المضيئة المنسجمة مع واجهة التطبيق */}
                        <div className="relative mb-4 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.25)]">
                                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                            </div>
                        </div>

                        {/* عنوان سرعة التحميل للعرض ونسبة الإنجاز المئوية */}
                        <div className="w-full flex items-center justify-between mb-2 px-1 text-xs font-black">
                            <span className="text-sky-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                                <span>سرعة التحميل للعرض</span>
                            </span>
                            <span className="text-white font-mono text-sm tracking-wider font-black">
                                {Math.round(progress)}%
                            </span>
                        </div>

                        {/* شريط النسبة المئوية المتوهج فائق السلاسة */}
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                                style={{ width: `${Math.min(100, Math.max(6, progress))}%` }}
                            />
                        </div>

                        {/* مؤشر المرحلة الحالية */}
                        <p className="text-[11px] font-bold text-slate-400 mt-2.5 font-sans">
                            {loadingStage}
                        </p>
                    </div>
                </div>
            )}

            {/* إطار عرض الملف عبر Google بخصائص تحميل قصوى */}
            <iframe
                src={embedUrl}
                className="w-full h-full flex-1 border-none bg-white"
                title={title || 'عارض مستندات Google'}
                onLoad={handleIframeLoaded}
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                allow="autoplay; fullscreen"
                allowFullScreen
            />

            {/* زر المتصفح العائم إذا طُلب بدون تعديل */}
            {showFloatingButton && (
                <a
                    href={externalOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-5 left-5 z-30 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs sm:text-sm active:scale-95 transition-all border border-white/25 cursor-pointer select-none"
                    title="فتح في متصفح Google"
                >
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>فتح في متصفح Google</span>
                </a>
            )}
        </div>
    );
};

/**
 * عارض ملفات PDF عبر متصفح ومستندات Google حصرياً
 * فائق السرعة مع شريط نسبة مئوية ديناميكي يظهر سرعة التحميل للعرض
 */
export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = (props) => {
    return <PdfViewerInner key={props.url} {...props} />;
};
