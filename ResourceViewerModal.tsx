import React, { useState, useRef, useEffect } from 'react';
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
    Pencil
} from 'lucide-react';
import { LessonResource } from './types';
import { cleanTitleText } from './services/resourceService';

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

    useEffect(() => {
        if (!isFullScreen) {
            setFullScreenZoom(1);
        }
    }, [isFullScreen]);

    if (!resource) return null;

    const title = resource.resourceTitle?.trim() 
        ? resource.resourceTitle 
        : resource.type === 'video' 
            ? 'فيديو شرح الدرس' 
            : resource.type === 'pdf' 
                ? 'ملخص PDF' 
                : 'ملخص مصور';

    // Helper to format YouTube embed URL
    const getEmbedVideoUrl = (url: string) => {
        if (!url) return '';
        try {
            const trimmed = url.trim();
            if (trimmed.includes('youtube.com/shorts/')) {
                const id = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0];
                if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
            }
            if (trimmed.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(new URL(trimmed).search);
                const v = urlParams.get('v');
                if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0&playsinline=1`;
            } else if (trimmed.includes('youtu.be/')) {
                const id = trimmed.split('youtu.be/')[1]?.split('?')[0];
                if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
            } else if (trimmed.includes('youtube.com/embed/')) {
                if (!trimmed.includes('autoplay=')) {
                    return `${trimmed}${trimmed.includes('?') ? '&' : '?'}autoplay=1&rel=0&playsinline=1`;
                }
                return trimmed;
            }
        } catch (e) {
            // Return raw url
        }
        return url;
    };

    // Helper to format PDF URL so it renders inline in preview mode without triggering automatic file download
    const getPdfPreviewUrl = (url: string) => {
        if (!url) return '';
        try {
            const trimmed = url.trim();
            if (trimmed.includes('drive.google.com')) {
                let fileId = '';
                if (trimmed.includes('/file/d/')) {
                    fileId = trimmed.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] || '';
                } else if (trimmed.includes('id=')) {
                    const match = trimmed.match(/[?&]id=([^&]+)/);
                    if (match && match[1]) fileId = match[1];
                }
                if (fileId) {
                    return `https://drive.google.com/file/d/${fileId}/preview`;
                }
            }

            if (trimmed.includes('docs.google.com/gview') || trimmed.includes('/preview')) {
                return trimmed;
            }

            if (trimmed.toLowerCase().includes('.pdf') || trimmed.includes('raw.githubusercontent.com') || trimmed.includes('firebasestorage')) {
                return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
            }
        } catch (e) {
            console.warn('Error formatting PDF preview URL:', e);
        }
        return url;
    };

    // Helper to format Google Drive download URL when user explicitly clicks Download button
    const getDownloadUrl = (url: string) => {
        if (!url) return '';
        try {
            const trimmed = url.trim();
            if (trimmed.includes('drive.google.com')) {
                let fileId = '';
                if (trimmed.includes('/file/d/')) {
                    fileId = trimmed.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] || '';
                } else if (trimmed.includes('id=')) {
                    const match = trimmed.match(/[?&]id=([^&]+)/);
                    if (match && match[1]) fileId = match[1];
                }
                if (fileId) {
                    return `https://drive.google.com/uc?export=download&id=${fileId}`;
                }
            }
        } catch (e) {
            // Fallback
        }
        return url;
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
    const handleResetZoom = () => setZoomLevel(100);

    const handleInitiateDownload = () => {
        const fileExt = resource.type === 'pdf' ? 'pdf' : resource.type === 'video' ? 'mp4' : 'png';
        let defaultName = downloadFileName;
        if (!defaultName) {
            const cleanTitle = cleanTitleText(resource.resourceTitle || title || 'resource').replace(/[/\\?%*:|"<>]/g, '').trim();
            defaultName = `ملخص_${cleanTitle}.${fileExt}`;
        }
        setEditableFileName(defaultName);
        setIsEditFileNameOpen(true);
    };

    const handleConfirmDownload = async () => {
        if (!resource?.url) return;
        setIsEditFileNameOpen(false);
        setIsDownloading(true);

        const targetUrl = getDownloadUrl(resource.url);
        const fileExt = resource.type === 'pdf' ? 'pdf' : resource.type === 'video' ? 'mp4' : 'png';
        
        let finalFileName = editableFileName.trim();
        if (!finalFileName) {
            finalFileName = downloadFileName || `ملخص_${Date.now()}.${fileExt}`;
        }

        if (!finalFileName.toLowerCase().endsWith(`.${fileExt}`)) {
            finalFileName = `${finalFileName}.${fileExt}`;
        }

        finalFileName = finalFileName.replace(/[/\\?%*:|"<>]/g, '').trim();

        try {
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = finalFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.warn('Direct download failed, opening download URL in new tab fallback:', error);
            window.open(targetUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleToggleVideoLandscapeFullScreen = async () => {
        setIsFullScreen(true);

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
        setIsFullScreen(false);

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

                            {/* Fullscreen Button for Image & PDF */}
                            {(resource.type === 'image' || resource.type === 'pdf') && (
                                <button
                                    onClick={() => setIsFullScreen(true)}
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
                            <div className="w-full h-full max-h-[78vh] flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-inner border border-slate-800">
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
                            <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                                <iframe
                                    src={getPdfPreviewUrl(resource.url)}
                                    className="w-full h-full border-none"
                                    title={title}
                                    allow="autoplay"
                                />
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
                                    <button onClick={() => setIsFullScreen(true)} className="p-1 text-emerald-400 hover:bg-slate-700 rounded" title="شاشة كاملة"><Maximize2 className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 flex items-center justify-center w-full min-h-0">
                                    <img
                                        src={resource.url}
                                        alt={title}
                                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                                        className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-md transition-transform duration-200 cursor-pointer"
                                        onClick={() => setIsFullScreen(true)}
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
                                    onClick={() => setIsFullScreen(false)}
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
                            />
                        </div>
                    </div>
                )}

                {/* Fullscreen Overlay Mode - Pure Image View */}
                {isFullScreen && resource.type === 'image' && (
                    <div 
                        className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-2 sm:p-4 select-none animate-fast-fade"
                        onClick={() => setIsFullScreen(false)}
                        dir="rtl"
                    >
                        {/* Floating Exit Fullscreen Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFullScreen(false);
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
                            onClick={() => setIsFullScreen(false)}
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

                {/* Edit Filename Modal before download */}
                {isEditFileNameOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fast-fade" dir="rtl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-5 flex flex-col gap-4 text-right"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold shadow-sm">
                                        <Pencil className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-base">تعديل اسم الملف قبل التحميل</h4>
                                        <p className="text-xs text-slate-500 font-medium">يمكنك تغيير الاسم أو حفظه بالاسم الافتراضي</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditFileNameOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">اسم الملف عند الحفظ:</label>
                                <input
                                    type="text"
                                    value={editableFileName}
                                    onChange={(e) => setEditableFileName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleConfirmDownload();
                                        }
                                    }}
                                    autoFocus
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl font-bold text-slate-900 text-sm outline-none transition-all shadow-inner"
                                    placeholder="أدخل اسم الملف..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setIsEditFileNameOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleConfirmDownload}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5"
                                >
                                    <Download className="w-4 h-4" />
                                    تأكيد التحميل
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};
