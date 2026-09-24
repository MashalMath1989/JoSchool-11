import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw, 
    PlayCircle, 
    FileText, 
    Image as ImageIcon,
    Loader2,
    Maximize2,
    Pencil,
    ExternalLink
} from 'lucide-react';
import { LessonResource } from './types';
import { cleanTitleText, extractYoutubeVideoId } from './services/resourceService';
import { DownloadConfirmModal } from './DownloadConfirmModal';
import { getGoogleViewerUrl } from './viewerUtils';

interface ResourceViewerModalProps {
    resource: LessonResource | null;
    lessonTitle?: string;
    downloadFileName?: string;
    isSyncing?: boolean;
    onClose: () => void;
}

export const ResourceViewerModal: React.FC<ResourceViewerModalProps> = ({
    resource,
    lessonTitle,
    downloadFileName,
    isSyncing = false,
    onClose
}) => {
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [fullScreenZoom, setFullScreenZoom] = useState<number>(1);
    const [isEditFileNameOpen, setIsEditFileNameOpen] = useState<boolean>(false);
    const [editableFileName, setEditableFileName] = useState<string>('');
    const lastTapTimeRef = useRef<number>(0);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const isFullScreenInHistoryRef = useRef<boolean>(false);

    const handleEnterFullScreen = useCallback(() => {
        setIsFullScreen(true);
        try {
            const currentState = window.history.state || {};
            if (!currentState.isResourceFullScreen) {
                window.history.pushState({ ...currentState, isResourceFullScreen: true }, '');
                isFullScreenInHistoryRef.current = true;
            }
        } catch (e) {
            console.warn("pushState error:", e);
        }
    }, []);

    const handleExitFullScreen = useCallback(() => {
        setIsFullScreen(false);
        setFullScreenZoom(1);
        if (isFullScreenInHistoryRef.current || window.history.state?.isResourceFullScreen) {
            isFullScreenInHistoryRef.current = false;
            try {
                window.history.back();
            } catch (e) {
                console.warn("history back error:", e);
            }
        }
    }, []);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const state = e.state || {};
            if (!state.isResourceFullScreen && isFullScreen) {
                isFullScreenInHistoryRef.current = false;
                setIsFullScreen(false);
                setFullScreenZoom(1);
            } else if (state.isResourceFullScreen) {
                isFullScreenInHistoryRef.current = true;
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isFullScreen]);

    // Handle PDF loading state for immediate visual feedback
    const [loadedPdfUrl, setLoadedPdfUrl] = useState<string | null>(null);
    const currentPdfUrl = resource?.type === 'pdf' ? (resource.url || '') : '';
    const isPdfLoading = currentPdfUrl !== '' && loadedPdfUrl !== currentPdfUrl;

    useEffect(() => {
        if (!currentPdfUrl) return;
        const timer = setTimeout(() => {
            setLoadedPdfUrl(currentPdfUrl);
        }, 3000);
        return () => clearTimeout(timer);
    }, [currentPdfUrl]);

    if (!resource) return null;

    const title = resource.resourceTitle?.trim() 
        ? resource.resourceTitle 
        : resource.type === 'video' 
            ? 'فيديو شرح الدرس' 
            : resource.type === 'pdf' 
                ? 'ملخص PDF' 
                : resource.type === 'link'
                    ? 'رابط خارجي'
                    : 'ملخص مصور';

    // Helper to format YouTube embed URL
    const getEmbedVideoUrl = (url: string) => {
        if (!url) return '';
        try {
            const videoId = extractYoutubeVideoId(url);
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
            }
        } catch (e) {
            // Return raw url
        }
        return url;
    };

    // Helper to format PDF URL so it renders inline in preview mode via Google Viewer for immediate display
    const getPdfPreviewUrl = (url: string) => {
        return getGoogleViewerUrl(url, true);
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
    const handleResetZoom = () => setZoomLevel(100);

    const handleInitiateDownload = () => {
        if (!resource?.url) return;
        const fileExt = resource.type === 'pdf' ? 'pdf' : resource.type === 'video' ? 'mp4' : 'png';
        let defaultName = downloadFileName;
        if (!defaultName) {
            const cleanTitle = cleanTitleText(resource.resourceTitle || title || 'ملف_تعليمي').replace(/[/\\?%*:|"<>]/g, '').trim();
            defaultName = `${cleanTitle}.${fileExt}`;
        }
        setEditableFileName(defaultName);
        setIsEditFileNameOpen(true);
    };

    const handleToggleVideoLandscapeFullScreen = async () => {
        handleEnterFullScreen();

        setTimeout(async () => {
            try {
                if (videoContainerRef.current) {
                    const elem = videoContainerRef.current as any;
                    if (elem.requestFullscreen) {
                        await elem.requestFullscreen();
                    } else if (elem.webkitRequestFullscreen) {
                        await elem.webkitRequestFullscreen();
                    } else if (elem.msRequestFullscreen) {
                        await elem.msRequestFullscreen();
                    }
                }
            } catch (e) {
                console.warn('Native fullscreen request warning:', e);
            }

            try {
                if (window.screen && window.screen.orientation && typeof (window.screen.orientation as any).lock === 'function') {
                    await (window.screen.orientation as any).lock('landscape').catch(() => {
                        return (window.screen.orientation as any).lock('landscape-primary').catch(() => {});
                    });
                }
            } catch (e) {
                console.warn('Screen orientation lock warning:', e);
            }
        }, 50);
    };

    const handleExitVideoLandscapeFullScreen = async () => {
        handleExitFullScreen();

        try {
            if (window.screen && window.screen.orientation && typeof (window.screen.orientation as any).unlock === 'function') {
                (window.screen.orientation as any).unlock();
            }
        } catch (e) {
            // Ignore
        }

        try {
            if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (e) {
            // Ignore
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fast-fade" dir="rtl">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                                {resource.type === 'video' && <PlayCircle className="w-5 h-5 text-red-500" />}
                                {resource.type === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                                {resource.type === 'image' && <ImageIcon className="w-5 h-5 text-emerald-400" />}
                                {resource.type === 'link' && <ExternalLink className="w-5 h-5 text-sky-400" />}
                            </div>
                            <div className="flex flex-col text-right truncate">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-sm sm:text-base text-white truncate">{title}</h3>
                                </div>
                                {lessonTitle && <span className="text-[10px] sm:text-xs text-slate-400 font-bold truncate">{lessonTitle}</span>}
                            </div>
                        </div>

                        {/* Top Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Image Zoom Toolbar */}
                            {resource.type === 'image' && (
                                <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 gap-1 text-slate-300">
                                    <button 
                                        onClick={handleZoomOut} 
                                        className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
                                        title="تصغير"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-mono font-bold px-1.5">{zoomLevel}%</span>
                                    <button 
                                        onClick={handleZoomIn} 
                                        className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
                                        title="تكبير"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleResetZoom} 
                                        className="p-1.5 hover:bg-slate-700 hover:text-white rounded transition-colors"
                                        title="إعادة ضبط"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* External Link Button for Link only */}
                            {resource.type === 'link' && (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                                    title="فتح الرابط"
                                >
                                    <ExternalLink className="w-4 h-4 text-white" />
                                    <span className="hidden sm:inline">فتح الرابط</span>
                                </a>
                            )}

                            {/* Fullscreen Button for Image & PDF */}
                            {(resource.type === 'image' || resource.type === 'pdf') && (
                                <button
                                    onClick={handleEnterFullScreen}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 border border-slate-700/50 shadow-sm cursor-pointer"
                                    title="عرض الشاشة كاملة"
                                >
                                    <Maximize2 className="w-4 h-4 text-emerald-400" />
                                    <span className="hidden sm:inline">شاشة كاملة</span>
                                </button>
                            )}

                            {/* Download Button (Image and PDF only) */}
                            {(resource.type === 'image' || resource.type === 'pdf') && (
                                <button
                                    onClick={handleInitiateDownload}
                                    disabled={isDownloading}
                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 shadow-sm"
                                    title="تحميل الملف إلى جهازك"
                                >
                                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{isDownloading ? 'جاري التحميل...' : 'تحميل'}</span>
                                </button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="p-2 bg-rose-500/20 hover:bg-rose-500 text-white rounded-xl transition-all active:scale-95"
                                title="إغلاق"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 bg-slate-100 relative overflow-auto flex items-center justify-center p-2 sm:p-4">
                        {resource.type === 'video' && (
                            <div ref={videoContainerRef} className="w-full h-full max-h-[78vh] flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-inner border border-slate-800">
                                <iframe
                                    src={getEmbedVideoUrl(resource.url)}
                                    className="w-full h-full border-none rounded-xl"
                                    title={title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        )}

                        {resource.type === 'pdf' && (
                            <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden relative">
                                {isPdfLoading && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50">
                                        <div className="w-9 h-9 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                        <p className="text-xs font-black text-slate-700">جاري فتح المستند فوراً عبر Google...</p>
                                        <span className="text-[11px] font-bold text-slate-400 mt-1">عرض سحابي مباشر عالي السرعة</span>
                                    </div>
                                )}
                                <iframe
                                    src={getPdfPreviewUrl(resource.url)}
                                    className="w-full h-full border-none rounded-xl"
                                    title={title}
                                    allow="autoplay"
                                    loading="eager"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                    onLoad={() => setLoadedPdfUrl(currentPdfUrl)}
                                />
                            </div>
                        )}

                        {resource.type === 'link' && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-lg mx-auto my-auto">
                                <div className="w-20 h-20 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-sky-600 mb-5 shadow-sm">
                                    <ExternalLink className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                                {lessonTitle && <p className="text-sm text-slate-400 font-bold mb-4">{lessonTitle}</p>}
                                <p className="text-xs text-slate-600 font-bold mb-6 leading-relaxed max-w-sm">
                                    هذا المصدر عبارة عن رابط خارجي، اضغط على الزر أدناه لفتحه في متصفح جوجل.
                                </p>
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>فتح الرابط في متصفح جوجل</span>
                                </a>
                            </div>
                        )}

                        {resource.type === 'image' && (
                            <div className="w-full h-full flex flex-col items-center justify-start overflow-auto p-2">
                                {/* Mobile Zoom & Fullscreen Controls */}
                                <div className="sm:hidden flex items-center bg-slate-900 text-white rounded-lg p-1.5 gap-2 mb-2 shadow-lg sticky top-0 z-20">
                                    <button onClick={handleZoomOut} className="p-1 hover:bg-slate-700 rounded" title="تصغير"><ZoomOut className="w-4 h-4" /></button>
                                    <span className="text-xs font-mono font-bold px-1">{zoomLevel}%</span>
                                    <button onClick={handleZoomIn} className="p-1 hover:bg-slate-700 rounded" title="تكبير"><ZoomIn className="w-4 h-4" /></button>
                                    <button onClick={handleResetZoom} className="p-1 hover:bg-slate-700 rounded" title="إعادة ضبط"><RotateCcw className="w-4 h-4" /></button>
                                    <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
                                    <button onClick={handleEnterFullScreen} className="p-1 text-emerald-400 hover:bg-slate-700 rounded" title="شاشة كاملة"><Maximize2 className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 flex items-center justify-center w-full min-h-0">
                                    <img
                                        src={resource.url}
                                        alt={title}
                                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                                        className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-md transition-transform duration-200 cursor-pointer"
                                        onClick={handleEnterFullScreen}
                                        title="انقر للعرض بالشاشة الكاملة"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Fullscreen Overlay Mode - PDF View */}
                {isFullScreen && resource.type === 'pdf' && (
                    <div 
                        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-2 sm:p-4 select-none animate-fast-fade"
                        dir="rtl"
                    >
                        {/* Floating Exit & Download Header in Fullscreen */}
                        <div className="fixed top-4 left-4 right-4 z-[220] flex items-center justify-between gap-2 pointer-events-none">
                            <div className="bg-slate-900/90 text-white px-4 py-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl pointer-events-auto flex items-center gap-2 max-w-[60%] truncate">
                                <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                                <span className="font-black text-xs sm:text-sm truncate">{title}</span>
                            </div>
                            <div className="flex items-center gap-2 pointer-events-auto">
                                <button
                                    onClick={handleInitiateDownload}
                                    disabled={isDownloading}
                                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full backdrop-blur-md border border-white/20 shadow-2xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-black"
                                    title="تحميل الملف"
                                >
                                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{isDownloading ? 'جاري التحميل...' : 'تحميل PDF'}</span>
                                </button>
                                <button
                                    onClick={handleExitFullScreen}
                                    className="p-2.5 bg-slate-900/90 hover:bg-rose-600 text-white rounded-full backdrop-blur-md border border-white/20 shadow-2xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-black"
                                    title="إغلاق الشاشة الكاملة"
                                >
                                    <X className="w-5 h-5" />
                                    <span className="hidden sm:inline">إغلاق</span>
                                </button>
                            </div>
                        </div>

                        {/* Pure Fullscreen PDF Canvas */}
                        <div className="w-full h-full pt-14 pb-2 rounded-2xl overflow-hidden">
                            <iframe
                                src={getPdfPreviewUrl(resource.url)}
                                className="w-full h-full border-none rounded-xl bg-white"
                                title={title}
                                allow="autoplay"
                                loading="eager"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                            />
                        </div>
                    </div>
                )}

                {/* Fullscreen Overlay Mode - Pure Image View */}
                {isFullScreen && resource.type === 'image' && (
                    <div 
                        className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-2 sm:p-4 select-none animate-fast-fade"
                        onClick={handleExitFullScreen}
                        dir="rtl"
                    >
                        {/* Floating Exit Fullscreen Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExitFullScreen();
                            }}
                            className="fixed top-4 left-4 z-[220] p-2.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full backdrop-blur-md border border-white/20 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            title="إغلاق الشاشة الكاملة"
                        >
                            <X className="w-5 h-5" />
                            <span className="text-xs font-bold px-1 hidden sm:inline">إغلاق</span>
                        </button>

                        {/* Floating Double Tap Tip */}
                        <div className="fixed bottom-4 z-[220] px-3.5 py-1.5 bg-slate-900/80 text-slate-200 text-xs font-bold rounded-full backdrop-blur-md border border-white/10 shadow-lg pointer-events-none">
                            {fullScreenZoom > 1 ? 'انقر مرتين متتاليتين للتصغير 🔍' : 'انقر مرتين متتاليتين للتكبير 🔍'}
                        </div>

                        {/* Pure Fullscreen Image Canvas with Overflow Panning */}
                        <div 
                            className="w-full h-full flex items-center justify-center overflow-auto p-2"
                            onClick={handleExitFullScreen}
                        >
                            <img
                                src={resource.url}
                                alt={title}
                                style={{ 
                                    transform: `scale(${fullScreenZoom})`,
                                    transformOrigin: 'center center',
                                    transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
                                }}
                                className={`max-w-full max-h-full object-contain rounded shadow-2xl ${
                                    fullScreenZoom > 1 ? 'cursor-zoom-out my-auto mx-auto' : 'cursor-zoom-in'
                                }`}
                                referrerPolicy="no-referrer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const now = Date.now();
                                    if (now - lastTapTimeRef.current < 300) {
                                        setFullScreenZoom(prev => (prev === 1 ? 2.5 : 1));
                                    }
                                    lastTapTimeRef.current = now;
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setFullScreenZoom(prev => (prev === 1 ? 2.5 : 1));
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Edit Filename & High-Speed Download Modal */}
                {resource && (
                    <DownloadConfirmModal
                        isOpen={isEditFileNameOpen}
                        onClose={() => setIsEditFileNameOpen(false)}
                        initialFileName={editableFileName || downloadFileName || ''}
                        fileUrl={resource.url}
                        fileType={resource.type}
                        itemTitle={cleanTitleText(resource.resourceTitle || title || '')}
                        subjectName={lessonTitle || title}
                    />
                )}
            </div>
        </AnimatePresence>
    );
};
