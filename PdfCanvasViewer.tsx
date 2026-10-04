import React, { useState } from 'react';
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

/**
 * عارض PDF عبر متصفح ومستندات Google حصرياً
 * يعرض الملف مباشرة ونقياً في الإطار
 */
export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
    url,
    title,
    className = '',
    showFloatingButton = false
}) => {
    const [iframeLoading, setIframeLoading] = useState<boolean>(true);

    const embedUrl = getGoogleViewerUrl(url, true);
    const externalOpenUrl = getGoogleViewerUrl(url, false);

    return (
        <div 
            className={`w-full h-full relative bg-slate-950 overflow-hidden flex flex-col ${className}`} 
            dir="rtl"
        >
            {/* شاشة تحميل سريعة وبسيطة تختفي بمجرد اكتمال تجهيز الإطار */}
            {iframeLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-3" />
                    <span className="text-sm font-bold text-slate-200">جاري فتح الملف...</span>
                </div>
            )}

            {/* إطار عرض الملف عبر Google */}
            <iframe
                src={embedUrl}
                className="w-full h-full flex-1 border-none bg-white"
                title={title || 'عارض مستندات Google'}
                onLoad={() => setIframeLoading(false)}
                allow="autoplay; fullscreen"
                allowFullScreen
            />

            {/* زر المتصفح العائم إذا طُلب */}
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
