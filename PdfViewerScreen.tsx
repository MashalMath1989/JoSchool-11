import React from 'react';
import { X } from 'lucide-react';
import { XIcon } from './data/Icons';
import { Subject } from './types';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface PdfViewerScreenProps {
    selectedSubject: Subject | null;
    openExternalBook: () => void;
}

const PdfViewerScreen: React.FC<PdfViewerScreenProps> = ({
    selectedSubject,
    openExternalBook
}) => {
    if (!selectedSubject) return null;

    const bookTitle = `الكتاب المدرسي — ${selectedSubject.name || selectedSubject.id}`;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col" dir="rtl">
            <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
                {/* زر الإغلاق السريع للعودة */}
                <button
                    onClick={openExternalBook}
                    className="absolute top-4 left-4 z-40 p-2.5 bg-slate-900/90 hover:bg-rose-600 text-white rounded-xl border border-white/20 shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="إغلاق"
                >
                    <X className="w-5 h-5" />
                    <span className="text-xs font-bold hidden sm:inline">إغلاق</span>
                </button>

                {selectedSubject.textbookUrl ? (
                    <div className="w-full h-full flex flex-col relative">
                        <PdfCanvasViewer
                            url={selectedSubject.textbookUrl}
                            title={bookTitle}
                            className="w-full h-full"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                        <div className="w-20 h-20 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center mb-6 border border-rose-500/20">
                            <XIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4">عذراً، الكتاب غير متوفر حالياً</h3>
                        <p className="text-slate-400 font-bold text-sm max-w-xs leading-relaxed">
                            نعمل على توفير النسخة الرقمية من هذا الكتاب في أقرب وقت ممكن
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfViewerScreen;
