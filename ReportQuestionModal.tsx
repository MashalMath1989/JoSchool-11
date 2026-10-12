import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from './types';
import { submitQuestionReport } from './services/firestoreService';
import { Flag, X, Loader2, AlertCircle } from 'lucide-react';

function showReportSuccessToast(message: string = 'تم إرسال البلاغ بنجاح، شكرًا لمساعدتنا في تحسين التطبيق.') {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('report-question-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'report-question-toast';
    toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[999999] bg-slate-900/95 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 text-sm font-black transition-all duration-300 pointer-events-none';
    toast.setAttribute('dir', 'rtl');
    toast.innerHTML = `
      <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

interface ReportQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    questionNumber?: number;
    subject?: string;
    unitTitle?: string;
    examTitle?: string;
}

export const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
    isOpen,
    onClose,
    question,
    questionNumber,
    subject,
    unitTitle,
    examTitle
}) => {
    const [reportText, setReportText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isSubmittingRef = useRef(false);

    // Focus textarea on modal open
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen || !question) return null;

    const handleClose = () => {
        if (isSubmitting) return;
        setReportText('');
        setErrorMessage('');
        onClose();
    };

    const handleSubmit = async () => {
        const trimmed = reportText.trim();
        if (!trimmed) {
            setErrorMessage('يرجى كتابة وصف الخطأ أولًا.');
            textareaRef.current?.focus();
            return;
        }

        if (isSubmitting || isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            // Extract choices safely
            const currentChoices = (question.choices && Array.isArray(question.choices) && question.choices.length > 0)
                ? question.choices
                : ((question as any).options && Array.isArray((question as any).options) 
                    ? (question as any).options.map((opt: any) => typeof opt === 'string' ? opt : opt.label || '') 
                    : []);

            const correctAnswer = question.correct_answer || (question as any).correctAnswer || '';
            const explanation = question.explanation || (question as any).hint || undefined;

            await submitQuestionReport({
                subject: subject || undefined,
                unitTitle: unitTitle || undefined,
                examTitle: examTitle || undefined,
                questionNumber: typeof questionNumber === 'number' ? questionNumber : (question.number || undefined),
                questionText: question.question || '',
                choices: currentChoices.length > 0 ? currentChoices : undefined,
                correctAnswer: correctAnswer || undefined,
                explanation: explanation,
                studentReport: trimmed
            });

            // Successfully saved in Firestore
            setIsSubmitting(false);
            isSubmittingRef.current = false;
            setReportText('');
            onClose();
            showReportSuccessToast('تم إرسال البلاغ بنجاح، شكرًا لمساعدتنا في تحسين التطبيق.');
        } catch (error) {
            console.error('Error submitting question report:', error);
            setIsSubmitting(false);
            isSubmittingRef.current = false;
            setErrorMessage('تعذر إرسال البلاغ. يرجى المحاولة مرة أخرى.');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
                <motion.div 
                    key="report-question-card"
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                                <Flag className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-snug">
                                    الإبلاغ عن خطأ في السؤال
                                </h3>
                                <p className="text-xs font-bold text-slate-500 mt-0.5">
                                    ما الخطأ الذي لاحظته في هذا السؤال؟
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            title="إغلاق"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Question summary badge if available */}
                    {(questionNumber !== undefined || examTitle || subject) && (
                        <div className="bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-100 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                            {subject && <span className="text-primary font-black">{subject}</span>}
                            {examTitle && <span>• {examTitle}</span>}
                            {questionNumber !== undefined && <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">سؤال {questionNumber}</span>}
                        </div>
                    )}

                    {/* Textarea */}
                    <div className="flex flex-col gap-1.5">
                        <textarea
                            ref={textareaRef}
                            value={reportText}
                            onChange={(e) => {
                                setReportText(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="اكتب وصف الخطأ بالتفصيل هنا..."
                            rows={4}
                            disabled={isSubmitting}
                            className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-slate-800 font-bold text-sm leading-relaxed resize-none transition-all placeholder:text-slate-400 placeholder:font-medium disabled:bg-slate-50 disabled:opacity-70"
                        />
                        <div className="flex justify-between items-center px-1 text-[11px] text-slate-400 font-bold">
                            <span>يرجى توضيح الخطأ بدقة لنتمكن من مراجعته</span>
                            <span>{reportText.length} حرف</span>
                        </div>
                    </div>

                    {/* Error message */}
                    {errorMessage && (
                        <div className="text-xs font-bold text-red-600 bg-red-50/90 border border-red-200 p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>جاري الإرسال...</span>
                                </>
                            ) : (
                                <span>إرسال البلاغ</span>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
export default ReportQuestionModal;
