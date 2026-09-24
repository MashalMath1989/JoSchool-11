import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Download, 
    X, 
    Pencil, 
    CheckCircle2, 
    FileText, 
    Zap, 
    AlertCircle,
    RotateCcw
} from 'lucide-react';

export interface DownloadConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFileName: string;
    fileUrl: string;
    fileType?: string;
    itemTitle?: string;
    subjectName?: string;
}

const getFastDownloadUrl = (url: string): string => {
    if (!url) return '';
    try {
        const trimmed = url.trim();
        // Google Drive export download link
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
        // Direct GitHub raw / standard URLs (no third party proxy timeouts!)
        return trimmed;
    } catch {
        return url;
    }
};

const downloadFileFast = async (
    url: string,
    fileName: string,
    onProgress?: (percent: number) => void
): Promise<void> => {
    const fastUrl = getFastDownloadUrl(url);

    // Google Drive has strict CORS on fetch; instant browser download is best
    if (fastUrl.includes('drive.google.com')) {
        const a = document.createElement('a');
        a.href = fastUrl;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (onProgress) onProgress(100);
        return;
    }

    try {
        const response = await fetch(fastUrl, {
            headers: {
                'Accept': '*/*',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        let blob: Blob;
        if (response.body && totalBytes > 0 && typeof ReadableStream !== 'undefined') {
            const reader = response.body.getReader();
            let receivedBytes = 0;
            const chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    receivedBytes += value.length;
                    if (onProgress) {
                        const percent = Math.min(Math.round((receivedBytes / totalBytes) * 100), 100);
                        onProgress(percent);
                    }
                }
            }
            blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
        } else {
            blob = await response.blob();
            if (onProgress) onProgress(100);
        }

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch (err) {
        console.warn('Fast blob download failed, falling back to direct anchor download:', err);
        const a = document.createElement('a');
        a.href = fastUrl;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (onProgress) onProgress(100);
    }
};

export const DownloadConfirmModal: React.FC<DownloadConfirmModalProps> = ({
    isOpen,
    onClose,
    initialFileName,
    fileUrl,
    fileType = 'pdf',
    itemTitle,
    subjectName
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine extension
    const ext = React.useMemo(() => {
        if (initialFileName && initialFileName.includes('.')) {
            const parts = initialFileName.split('.');
            return parts[parts.length - 1].toLowerCase();
        }
        return fileType === 'image' ? 'png' : fileType === 'video' ? 'mp4' : 'pdf';
    }, [initialFileName, fileType]);

    // Base name without extension for easy editing
    const getBaseName = (name: string, extension: string) => {
        if (!name) return 'ملف';
        const clean = name.trim();
        if (clean.toLowerCase().endsWith(`.${extension}`)) {
            return clean.slice(0, -(extension.length + 1));
        }
        return clean;
    };

    const defaultBaseName = React.useMemo(() => {
        return getBaseName(initialFileName || itemTitle || 'ملف_تعليمي', ext);
    }, [initialFileName, itemTitle, ext]);

    const [baseName, setBaseName] = useState<string>(defaultBaseName);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset when modal opens with new initialFileName
    useEffect(() => {
        if (isOpen) {
            setBaseName(defaultBaseName);
            setIsDownloading(false);
            setProgress(null);
            setIsSuccess(false);
            setErrorMsg(null);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 80);
        }
    }, [isOpen, defaultBaseName]);

    if (!isOpen) return null;

    const handleConfirmDownload = async () => {
        if (isDownloading) return;
        
        let cleaned = baseName.replace(/[/\\?%*:|"<>]/g, '').trim();
        if (!cleaned) {
            cleaned = defaultBaseName || 'ملف';
        }

        const finalFileName = `${cleaned}.${ext}`;
        setIsDownloading(true);
        setProgress(5);
        setErrorMsg(null);

        try {
            await downloadFileFast(fileUrl, finalFileName, (p) => {
                setProgress(p);
            });
            setIsSuccess(true);
            setProgress(100);
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (e) {
            console.error('Download error:', e);
            setErrorMsg('حدث خطأ أثناء بدء التحميل. سيتم فتح الرابط مباشرة.');
            setTimeout(() => {
                window.open(getFastDownloadUrl(fileUrl), '_blank');
                onClose();
            }, 1200);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs" dir="rtl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col text-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-l from-slate-50 to-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                                <Download className="w-5 h-5 stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-base leading-tight">تعديل اسم الملف قبل التحميل</h3>
                                <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    تحميل فائق السرعة ومباشر
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isDownloading}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                            title="إغلاق"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col gap-4">
                        {/* Information badge */}
                        {(itemTitle || subjectName) && (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start gap-2.5">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <span className="font-bold text-slate-500">الملف الأصلي: </span>
                                    <span className="font-black text-slate-800">{itemTitle || initialFileName}</span>
                                    {subjectName && (
                                        <span className="mr-1 text-slate-400 font-medium">({subjectName})</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Name Input with extension badge */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                    <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                                    اسم الملف عند الحفظ:
                                </label>
                                {baseName !== defaultBaseName && (
                                    <button
                                        type="button"
                                        onClick={() => setBaseName(defaultBaseName)}
                                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        استعادة الاسم الافتراضي
                                    </button>
                                )}
                            </div>

                            <div className="relative flex items-center" dir="ltr">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={baseName}
                                    onChange={(e) => setBaseName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isDownloading) {
                                            handleConfirmDownload();
                                        }
                                    }}
                                    disabled={isDownloading}
                                    placeholder="اكتب اسم الملف هنا..."
                                    className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-slate-900 text-sm outline-none transition-all shadow-inner text-right"
                                />
                                <div className="absolute right-2 px-2 py-1 bg-slate-200 text-slate-700 font-mono font-black text-xs rounded-lg uppercase tracking-wider select-none pointer-events-none">
                                    .{ext}
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                                يمكنك تغيير الاسم حسب رغبتك، وسيتم حفظ الملف بالصيغة الصحيحة تلقائياً.
                            </p>
                        </div>

                        {/* Live progress indicator when downloading */}
                        {isDownloading && (
                            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200/80 flex flex-col gap-2 animate-pulse">
                                <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                                    <span className="flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
                                        جاري تحميل الملف بأقصى سرعة...
                                    </span>
                                    <span className="font-mono">{progress !== null ? `${progress}%` : ''}</span>
                                </div>
                                <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-600 rounded-full transition-all duration-150"
                                        style={{ width: `${progress ?? 20}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Success message */}
                        {isSuccess && (
                            <div className="bg-emerald-50 text-emerald-800 rounded-xl p-3 border border-emerald-200 flex items-center gap-2 text-xs font-black">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                تم تحميل الملف وحفظه بنجاح على جهازك!
                            </div>
                        )}

                        {/* Error message */}
                        {errorMsg && (
                            <div className="bg-rose-50 text-rose-800 rounded-xl p-3 border border-rose-200 flex items-center gap-2 text-xs font-bold">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                {errorMsg}
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDownloading}
                            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDownload}
                            disabled={isDownloading || isSuccess}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>جاري التحميل...</span>
                                </>
                            ) : isSuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>تم بنجاح</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>تأكيد وبدء التحميل</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
