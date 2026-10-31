import React from 'react';
import { ExternalLink, ShieldCheck, Info } from 'lucide-react';

interface DisclaimerSectionProps {
    className?: string;
    onOpenAbout?: () => void;
    showAboutButton?: boolean;
}

export const DisclaimerSection: React.FC<DisclaimerSectionProps> = ({
    className = '',
    onOpenAbout,
    showAboutButton = false,
}) => {
    return (
        <section 
            dir="rtl"
            aria-label="إخلاء مسؤولية والمصادر الرسمية"
            className={`bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 sm:p-5 text-right shadow-sm select-text text-slate-800 ${className}`}
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800 mt-0.5 shadow-2xs">
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                    {/* النص الأول: إخلاء المسؤولية */}
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed mb-3">
                        <span className="font-black text-slate-950">إخلاء مسؤولية: </span>
                        هذا تطبيق تعليمي مستقل، ولا يمثل وزارة التربية والتعليم الأردنية أو مركز تطوير المناهج أو أي جهة حكومية، ولا يتبع لها.
                    </p>

                    {/* النص الثاني: المصادر الرسمية */}
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed mb-2">
                        <span className="font-black text-slate-950">المصادر الرسمية: </span>
                        المحتوى مبني على الكتب والمناهج الرسمية المنشورة على موقع مركز تطوير المناهج:
                    </p>

                    {/* الرابط القابل للنقر تحت النص مباشرة */}
                    <div className="mt-2.5">
                        <a
                            href="https://nccd.gov.jo/Ar/Pages/textbooks"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-sky-50 active:bg-sky-100 text-sky-800 hover:text-sky-950 border-2 border-sky-600 rounded-xl font-black text-xs sm:text-sm transition-all shadow-xs group cursor-pointer"
                        >
                            <span>مركز تطوير المناهج - الكتب المدرسية</span>
                            <ExternalLink className="w-4 h-4 text-sky-600 transition-transform group-hover:scale-110" />
                        </a>
                    </div>
                </div>
            </div>

            {showAboutButton && onOpenAbout && (
                <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">منصة JoSchool 11 — جيل 2010</span>
                    <button
                        type="button"
                        onClick={onOpenAbout}
                        className="text-xs font-black text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                        <Info className="w-3.5 h-3.5" />
                        <span>حول التطبيق والمزيد</span>
                    </button>
                </div>
            )}
        </section>
    );
};

export default DisclaimerSection;
