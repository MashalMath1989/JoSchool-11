import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { XIcon } from './data/Icons';
import { Subject } from './types';
import { getGoogleViewerUrl } from './viewerUtils';

interface PdfViewerScreenProps {
    selectedSubject: Subject | null;
    openExternalBook: () => void;
}

const PdfViewerScreen: React.FC<PdfViewerScreenProps> = ({
    selectedSubject,
    openExternalBook
}) => {
    const currentUrl = selectedSubject?.textbookUrl || '';
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const isLoading = Boolean(currentUrl) && loadedUrl !== currentUrl;

    useEffect(() => {
        if (!currentUrl) return;
        const timer = setTimeout(() => {
            setLoadedUrl(currentUrl);
        }, 3000);
        return () => clearTimeout(timer);
    }, [currentUrl]);

    if (!selectedSubject) return null;

    const getTextbookPreviewUrl = (url?: string) => {
        return getGoogleViewerUrl(url || '', true);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col pt-2">
            <div className="flex-1 relative bg-app-bg">
                {selectedSubject.textbookUrl ? (
                    <>
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50">
                                <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm font-black text-slate-700">جاري فتح الكتاب فوراً عبر Google...</p>
                                <span className="text-xs font-bold text-slate-400 mt-1">عرض سحابي مباشر عالي السرعة</span>
                            </div>
                        )}
                        <iframe
                            src={getTextbookPreviewUrl(selectedSubject.textbookUrl)}
                            className="w-full h-full border-none"
                            title="Textbook Viewer"
                            allow="autoplay"
                            loading="eager"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                            onLoad={() => setLoadedUrl(currentUrl)}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                            <XIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-text-main mb-4">عذراً، الكتاب غير متوفر حالياً</h3>
                        <p className="text-text-sub font-bold text-sm max-w-xs leading-relaxed">نعمل على توفير النسخة الرقمية من هذا الكتاب في أقرب وقت ممكن</p>
                    </div>
                )}
                
                {selectedSubject.textbookUrl && (
                    <button
                        onClick={openExternalBook}
                        className="fixed bottom-8 left-8 bg-accent text-white p-4 rounded-full shadow-2xl flex items-center gap-2 active:scale-95 transition-transform z-20"
                    >
                        <ExternalLink className="w-5 h-5" />
                        <span className="font-black text-sm">فتح في المتصفح</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PdfViewerScreen;
