import React from 'react';
import { ExternalLink } from 'lucide-react';
import { XIcon } from './data/Icons';
import { Subject } from './types';

interface PdfViewerScreenProps {
    selectedSubject: Subject | null;
    openExternalBook: () => void;
}

const PdfViewerScreen: React.FC<PdfViewerScreenProps> = ({
    selectedSubject,
    openExternalBook
}) => {
    if (!selectedSubject) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col pt-2">
            <div className="flex-1 relative bg-app-bg">
                {selectedSubject.textbookUrl ? (
                    <iframe
                        src={`${selectedSubject.textbookUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-none"
                        title="Textbook Viewer"
                    />
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
