import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import { auth } from './firebase';
import { StarIcon, XIcon, CheckIcon, BookmarkIcon, BookmarkOutlineIcon, ShareIcon, FlagIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, BookOpenIcon } from './data/Icons';
import { Question, Subject, SubjectName, UserProgress, QuizResult } from './types';
import { MathRenderer, renderTextWithUnderline } from './textRenderer';
import { shareQuestionDirectly, isMathSubject } from './shareUtils';
import TrigGraph from './TrigGraph';
import { KATEX_CSS } from './katexCss';

interface ResultsPageProps {
    userAnswers: (string | undefined)[];
    currentQuiz: Question[];
    selectedSubject: Subject | null;
    currentLessonTitle: string;
    currentUnitTitle?: string;
    examNumber?: number | null;
    setUserProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
    setViewHistory: React.Dispatch<React.SetStateAction<any[]>>;
    goBack: () => void;
    goToHome: () => void;
    onBackToIndex: () => void;
    onBackToIndexLabel?: string;
    isQuestionFavorite: (questionText: string) => boolean;
    toggleFavoriteQuestion: (question: Question, subjectId: string, lessonTitle: string) => void;
    isFavoriteDisabled?: boolean;
    userProgress?: UserProgress;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
    userAnswers,
    currentQuiz,
    selectedSubject,
    currentLessonTitle,
    currentUnitTitle,
    examNumber,
    setUserProgress,
    setViewHistory,
    goBack,
    goToHome,
    onBackToIndex,
    onBackToIndexLabel,
    isQuestionFavorite,
    toggleFavoriteQuestion,
    isFavoriteDisabled,
    userProgress
}) => {
    const isEnglish = false;
    const isMath = selectedSubject?.id === SubjectName.Math;
    const isLtr = isEnglish || isMath;
    const isArabicSubject = selectedSubject?.id === SubjectName.JordanHistory || 
                            selectedSubject?.id === SubjectName.IslamicEducation || 
                            selectedSubject?.id === SubjectName.Arabic || 
                            (!isLtr);
    const optionLabels = isArabicSubject ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
    const studentName = userProgress?.studentProfile?.name || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || '';
    const seatNumber = userProgress?.studentProfile?.seatNumber || '';
    const isSessionExam = currentLessonTitle.includes('دورة') || 
                          currentLessonTitle.includes('الدورة') || 
                          currentLessonTitle.toLowerCase().includes('session') || 
                          currentLessonTitle.includes('تجريبي') ||
                          currentLessonTitle.includes('Comprehensive') ||
                          currentLessonTitle.includes('شامل');
    const checkIsCorrect = (q: Question, userAnswer: string | undefined) => {
        if (!userAnswer || !q.correct_answer) return false;
        
        const trimmedUser = userAnswer.trim();
        const trimmedCorrect = String(q.correct_answer).trim();
        
        // 1. Direct match
        if (trimmedUser === trimmedCorrect) return true;
        
        // 2. Match by letter (أ, ب, ج, د or A, B, C, D)
        const arabicLetters = ['أ', 'ب', 'ج', 'د'];
        const englishLetters = ['A', 'B', 'C', 'D'];
        const lowerEnglishLetters = ['a', 'b', 'c', 'd'];
        
        let letterIndex = arabicLetters.indexOf(trimmedCorrect);
        if (letterIndex === -1) letterIndex = englishLetters.indexOf(trimmedCorrect.toUpperCase());
        if (letterIndex === -1) letterIndex = lowerEnglishLetters.indexOf(trimmedCorrect.toLowerCase());
        
        if (letterIndex !== -1 && q.choices[letterIndex]?.trim() === trimmedUser) return true;
        
        // 3. Match by index (0, 1, 2, 3)
        const numericIndex = parseInt(trimmedCorrect);
        if (!isNaN(numericIndex) && q.choices[numericIndex]?.trim() === trimmedUser) return true;
        
        return false;
    };

    const getSubjectMaxMark = (subjectId: string | undefined) => {
        switch (subjectId) {
            case SubjectName.IslamicEducation: return 60;
            case SubjectName.Arabic: return 100;
            case SubjectName.Math: return 100;
            case SubjectName.JordanHistory: return 40;
            default: return 40;
        }
    };

    const maxMark = getSubjectMaxMark(selectedSubject?.id);
    const score = userAnswers.reduce((acc, ans, idx) => acc + (checkIsCorrect(currentQuiz[idx], ans) ? 1 : 0), 0);
    const totalQuestions = currentQuiz.length || 1;
    const finalMark = Math.round((score / totalQuestions) * maxMark);
    const isPassed = finalMark >= (maxMark / 2);
    const incorrectIndexes = currentQuiz
        .map((_, idx) => idx)
        .filter(idx => !checkIsCorrect(currentQuiz[idx], userAnswers[idx]));
    const pdfRef = useRef<HTMLDivElement>(null);
    const printPdfRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [shareQuestion, setShareQuestion] = useState<Question | null>(null);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
    const [reviewMode, setReviewMode] = useState<'all' | 'correct' | 'incorrect'>('all');

    const toggleExplanation = (idx: number) => {
        setExpandedExplanations(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const exportToPDF = (mode: 'mobile' | 'print') => {
        const element = mode === 'mobile' ? pdfRef.current : printPdfRef.current;
        if (!element) return;
        
        setShowExportDialog(false);
        setIsExporting(true);

        const opt = {
            margin: mode === 'mobile' ? ([10, 10] as [number, number]) : ([15, 10] as [number, number]),
            filename: `JoSchool_${mode === 'mobile' ? 'Mobile' : 'Print'}_${currentLessonTitle.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1200
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                avoid: ['.pdf-question-card', '.pdf-graph-block', '.pdf-graph-option']
            }
        };

        // Temporarily show the element for capture
        element.style.display = 'block';
        
        // Use a small delay to ensure rendering
        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                element.style.display = 'none';
                setIsExporting(false);
            }).catch(() => {
                element.style.display = 'none';
                setIsExporting(false);
            });
        }, 500);
    };

    useEffect(() => {
        if (selectedSubject) {
            const newResult: QuizResult = {
                subjectId: selectedSubject.id,
                lessonTitle: currentLessonTitle,
                examNumber: examNumber,
                score: score, // Save the raw number of correct answers
                totalQuestions: totalQuestions,
                date: new Date().toISOString(),
                userAnswers: userAnswers
            };
            setUserProgress(prev => ({
                ...prev,
                quizResults: [...prev.quizResults, newResult]
            }));
        }
    }, [selectedSubject, currentLessonTitle, examNumber, score, totalQuestions, setUserProgress, userAnswers]);

    return (
        <>
            <div className="container mx-auto p-4 max-w-2xl text-center pt-10" dir={isEnglish ? 'ltr' : 'rtl'}>
            {/* Back button moved inside card */}

            {/* زر التصدير في الزاوية العلوية - REMOVED per user request to move inside card */}
            {/* 
            <div className={`absolute top-4 z-10 ${isEnglish ? 'right-4' : 'left-4'}`}>
                ...
            </div>
            */}

            {/* حوار اختيار نوع التصدير */}
            {showExportDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full text-right shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-900">
                        <h3 className="text-xl font-black text-text-main mb-4">اختر نوع التصدير</h3>
                        <p className="text-text-sub text-sm font-bold mb-8">يرجى اختيار التنسيق المناسب لاحتياجاتك:</p>
                        
                        <div className="grid gap-4">
                            <button 
                                onClick={() => exportToPDF('mobile')}
                                className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary/10 hover:border-primary hover:bg-primary/5 transition-all text-right group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <DownloadIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-black text-text-main">نسخة الهاتف (ملونة)</div>
                                    <div className="text-[10px] text-text-sub font-bold">تنسيق مريح للقراءة من شاشة الهاتف مع مراجعة كاملة</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => exportToPDF('print')}
                                className="flex items-center gap-4 p-4 rounded-lg border-2 border-slate-900 hover:border-primary hover:bg-primary/5 transition-all text-right group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:bg-secondary group-hover:text-white transition-colors">
                                    <DownloadIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-black text-text-main">نسخة الطباعة (مكثفة)</div>
                                    <div className="text-[10px] text-text-sub font-bold">تنسيق مشابه لامتحانات الوزارة لتوفير الورق عند الطباعة</div>
                                </div>
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowExportDialog(false)}
                            className="w-full mt-8 py-4 text-text-sub font-black hover:text-red-500 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* رسالة التحميل */}
            {isExporting && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] p-10 max-w-xs w-full text-center shadow-2xl border-2 border-slate-900"
                    >
                        <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <motion.div 
                                className="absolute inset-0 border-4 border-[#1d5bfc] rounded-full border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                <img src="https://i.postimg.cc/GtXVRVcp/IMG-20260704-001239-098.png" alt="JoSchool" className="w-full h-auto object-contain" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">جاري التحميل...</h3>
                        <p className="text-slate-500 text-sm font-black leading-relaxed">
                            انتظر لحظات لحين اكتمال التحميل
                        </p>
                    </motion.div>
                </div>
            )}

            {/* ملخص النتيجة */}
            <div className="bg-white rounded-xl p-8 shadow-2xl border-t-4 border-primary mb-10 text-center border border-slate-900 relative">
                {/* زر الرجوع داخل البطاقة */}
                <div className={`absolute top-4 ${isEnglish ? 'left-4' : 'right-4'}`}>
                    <button 
                        onClick={goBack}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-slate-900 hover:text-primary transition-all active:scale-95"
                        title="رجوع"
                    >
                        {isEnglish ? <ChevronLeftIcon className="w-5 h-5" strokeWidth={3} /> : <ChevronRightIcon className="w-5 h-5" strokeWidth={3} />}
                    </button>
                </div>

                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${isPassed ? 'bg-emerald-500 animate-bounce' : 'bg-red-500'}`}>
                    {isPassed ? <StarIcon className="w-8 h-8 text-white" /> : <XIcon className="w-8 h-8 text-white" />}
                </div>
                <h2 className={`text-lg font-black mb-6 ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>{isPassed ? 'أحسنت يا بطل!' : 'حاول مرة أخرى'}</h2>
                <div className="flex justify-center items-baseline gap-2 mb-2">
                    <span className="text-2xl font-black text-text-main">{finalMark}</span>
                    <span className="text-base font-black text-text-sub/30">/ {maxMark}</span>
                </div>
                <div className="flex justify-center gap-4 text-[8px] font-bold text-text-sub/60 mb-8">
                    <span>{isEnglish ? 'Correct:' : 'الإجابات الصحيحة:'} {score}</span>
                    <span>{isEnglish ? 'Incorrect:' : 'الإجابات الخاطئة:'} {totalQuestions - score}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
                    {/* Row 1: Home and Export */}
                    <button 
                        onClick={goToHome} 
                        className="py-4 bg-slate-900 text-white rounded-lg font-black shadow-xl border-2 border-slate-900 hover:bg-slate-800 active:scale-95 transition-all text-sm"
                    >
                        الرئيسية
                    </button>
                    <button 
                        onClick={() => setShowExportDialog(true)} 
                        disabled={isExporting}
                        className="py-4 bg-white text-primary rounded-lg font-black shadow-lg flex items-center justify-center gap-2 border-2 border-slate-900 hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50 text-xs"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>تصدير PDF</span>
                    </button>

                    {/* Row 2: Back to Index and Retry */}
                    <button 
                        onClick={onBackToIndex} 
                        className="py-4 bg-primary text-white rounded-lg font-black shadow-xl border-2 border-slate-900 hover:brightness-110 active:scale-95 transition-all text-xs"
                    >
                        {onBackToIndexLabel || (isEnglish ? 'Back to Index' : 'العودة للفهرس')}
                    </button>
                    <button 
                        onClick={goBack} 
                        className="py-4 bg-secondary text-white rounded-lg font-black shadow-xl border-2 border-slate-900 hover:brightness-110 active:scale-95 transition-all text-xs"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </div>

            {/* مراجعة الأسئلة */}
            <div id="review-section" className="text-right mb-6 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-black text-text-main flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        مراجعة الإجابات
                    </h3>
                    <p className="text-text-sub font-bold text-[9px] mt-1">راجع أداءك وتعرف على الإجابات الصحيحة</p>
                </div>
                
                {/* مفتاح التبديل للنمط */}
                <div className="grid grid-cols-3 w-full sm:flex sm:w-auto bg-slate-100 p-1 rounded-xl border border-slate-900 shrink-0 self-stretch sm:self-auto gap-1" dir="rtl">
                    <button
                        onClick={() => setReviewMode('all')}
                        className={`flex items-center justify-center gap-1 py-2.5 px-1 sm:px-4 text-[10px] sm:text-xs font-black rounded-lg transition-all text-center ${reviewMode === 'all' ? 'bg-primary text-white shadow-md font-black border border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-bold'}`}
                    >
                        <span>الكل ({totalQuestions})</span>
                    </button>
                    <button
                        onClick={() => setReviewMode('correct')}
                        className={`flex items-center justify-center gap-1 py-2.5 px-1 sm:px-4 text-[10px] sm:text-xs font-black rounded-lg transition-all text-center ${reviewMode === 'correct' ? 'bg-emerald-600 text-white shadow-md font-black border border-transparent' : 'text-emerald-600 hover:bg-emerald-50 font-bold'}`}
                    >
                        <CheckIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>الصحيحة ({score})</span>
                    </button>
                    <button
                        onClick={() => setReviewMode('incorrect')}
                        className={`flex items-center justify-center gap-1 py-2.5 px-1 sm:px-4 text-[10px] sm:text-xs font-black rounded-lg transition-all text-center ${reviewMode === 'incorrect' ? 'bg-red-600 text-white shadow-md font-black border border-transparent' : 'text-red-600 hover:bg-red-50 font-bold'}`}
                    >
                        <XIcon className="w-3.5 h-3.5 shrink-0 stroke-[3px]" />
                        <span>الخاطئة ({totalQuestions - score})</span>
                    </button>
                </div>
            </div>

            {/* القائمة المفلترة للأسئلة مع الشرح */}
            <div className="space-y-6 pb-20">
                {(() => {
                    const filteredQuestions = currentQuiz
                        .map((q, idx) => ({ q, idx }))
                        .filter(({ q, idx }) => {
                            const userAnswer = userAnswers[idx];
                            const isCorrect = checkIsCorrect(q, userAnswer);
                            if (reviewMode === 'correct') return isCorrect;
                            if (reviewMode === 'incorrect') return !isCorrect;
                            return true;
                        });

                    if (filteredQuestions.length === 0) {
                        return (
                            <div className="bg-white rounded-xl p-8 shadow-md border-2 border-dashed border-slate-300 text-center py-12" dir="rtl">
                                <CheckIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4 bg-emerald-50 p-2 rounded-full border border-emerald-100" />
                                <h4 className="text-base font-black text-text-main mb-2">لا توجد أسئلة في هذا القسم</h4>
                                <p className="text-xs text-text-sub font-bold">
                                    {reviewMode === 'correct' ? 'لم تقم بالإجابة على أي سؤال بشكل صحيح بعد.' : 'أحسنت! لم ترتكب أي أخطاء في هذا الاختبار.'}
                                </p>
                            </div>
                        );
                    }

                    return filteredQuestions.map(({ q, idx }) => {
                        const userAnswer = userAnswers[idx];
                        const isCorrect = checkIsCorrect(q, userAnswer);
                        const explanationText = q.explanation || (q as any).Explanation;
                        
                        return (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0.9, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.08, ease: "easeOut" }}
                                className={`bg-white rounded-xl px-6 pb-6 pt-14 shadow-md border-r-8 ${isEnglish ? 'text-left' : 'text-right'} transition-all hover:shadow-lg border border-slate-900 relative ${isCorrect ? 'border-r-emerald-500' : 'border-r-red-500'}`}
                            >
                                <div className={`flex items-center gap-2 absolute top-3 z-10 ${isEnglish ? 'right-3' : 'left-3'}`}>
                                    {!isFavoriteDisabled && (
                                        <button 
                                            onClick={() => toggleFavoriteQuestion(q, selectedSubject?.id || '', currentLessonTitle)}
                                            className={`p-2 rounded-lg transition-colors border border-slate-900 ${isQuestionFavorite(q.question) ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                            title="إضافة للمفضلة"
                                        >
                                            {isQuestionFavorite(q.question) ? <BookmarkIcon className="w-4 h-4" /> : <BookmarkOutlineIcon className="w-4 h-4" />}
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => shareQuestionDirectly({
                                            question: q,
                                            subjectName: selectedSubject?.id,
                                            lessonTitle: currentLessonTitle,
                                            isEnglish: isEnglish
                                        })}
                                        className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors border border-slate-900"
                                        title={isMathSubject(selectedSubject?.id, q) ? "تصدير بطاقة السؤال كملف PDF" : "مشاركة السؤال كنص"}
                                    >
                                        {isMathSubject(selectedSubject?.id, q) ? <DownloadIcon className="w-4 h-4 text-emerald-600" /> : <ShareIcon className="w-4 h-4" />}
                                    </button>
                                    <button 
                                        className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors border border-slate-900"
                                        title="تبليغ عن مشكلة"
                                    >
                                        <FlagIcon className="w-4 h-4" />
                                    </button>
                                    <div className={`shrink-0 p-2 rounded-lg border border-slate-900 ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                                        {isCorrect ? <CheckIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
                                    </div>
                                </div>

                                <div className={`font-black text-text-main text-base leading-relaxed mb-6 flex items-start gap-2 ${isEnglish ? 'text-left' : 'text-right'}`}>
                                    <span className={`shrink-0 font-black text-sm mt-1 ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {idx + 1}.
                                    </span>
                                    <div className="flex-1 pt-1 min-w-0 w-full"><MathRenderer text={q.question} /></div>
                                </div>

                                {/* Question Graph if available */}
                                {((q as any).questionGraph || (q as any).graph) && (
                                    <div className="mb-6 relative z-10 w-full max-w-[340px] h-[220px] mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-center items-center shadow-sm">
                                        <TrigGraph graphData={(q as any).questionGraph || (q as any).graph} />
                                    </div>
                                )}

                                <div className={`grid gap-3 mb-6 ${(q as any).options && (q as any).options.some((opt: any) => opt.graph) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, cIdx) => {
                                        const isUserChoice = userAnswer === choice;
                                        const isCorrectChoice = checkIsCorrect(q, choice);
                                        const option = (q as any).options && (q as any).options[cIdx];
                                        const optionGraph = option && option.graph;
                                        
                                        let bgColor = 'bg-app-bg/30';
                                        let borderColor = 'border-transparent';
                                        let textColor = 'text-text-main';

                                        if (isCorrectChoice) {
                                            bgColor = 'bg-emerald-500/10';
                                            borderColor = 'border-emerald-500/30';
                                            textColor = 'text-emerald-600';
                                        } else if (isUserChoice && !isCorrect) {
                                            bgColor = 'bg-red-500/10';
                                            borderColor = 'border-red-500/30';
                                            textColor = 'text-red-500';
                                        }

                                        return (
                                            <div 
                                                key={cIdx} 
                                                dir={isLtr ? 'ltr' : 'rtl'}
                                                className={`p-3 rounded-lg border font-bold text-xs flex items-center gap-3 border-slate-900 ${bgColor} ${textColor}`}
                                            >
                                                <div className={`w-8 h-8 rounded-md border-2 flex items-center justify-center shrink-0 font-black text-xs transition-colors ${isCorrectChoice ? 'bg-emerald-500 text-white border-emerald-400' : isUserChoice ? 'bg-red-500 text-white border-red-400' : 'bg-white text-text-sub border-primary/10'}`}>
                                                    {optionLabels[cIdx] || ['A', 'B', 'C', 'D'][cIdx]}
                                                </div>
                                                {optionGraph ? (
                                                    <div className="flex-1 flex justify-center items-center h-[105px] max-w-[160px] mx-auto py-1">
                                                        <TrigGraph graphData={optionGraph} isOption={true} />
                                                    </div>
                                                ) : (
                                                    <div className={`flex-1 min-w-0 w-full ${isLtr ? 'text-left font-sans' : 'text-right font-naskh'}`}><MathRenderer text={choice} /></div>
                                                )}
                                                <div className={`${isLtr ? 'ml-auto' : 'mr-auto'} shrink-0`}>
                                                    {isCorrectChoice && <CheckIcon className="w-5 h-5 text-emerald-600" />}
                                                    {isUserChoice && !isCorrect && <XIcon className="w-5 h-5 text-red-600" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {explanationText && (
                                    <div className="mt-6 mb-6 p-4 rounded-xl bg-emerald-50/50 border border-emerald-500/20 text-right w-full" dir="rtl">
                                        <div className="flex items-center gap-2 mb-2 text-emerald-800">
                                            <BookOpenIcon className="w-5 h-5 shrink-0" />
                                            <span className="font-black text-xs">الشرح والحل الصحيح</span>
                                        </div>
                                        <div className="text-sm text-emerald-950 font-medium leading-relaxed font-naskh">
                                            <MathRenderer text={explanationText} />
                                        </div>
                                    </div>
                                )}

                                {(q.page || q.source_text) && (
                                    <div className="bg-primary/5 rounded-lg p-4 border border-slate-900">
                                        <div className="flex items-center gap-2 mb-2 text-primary">
                                            <CheckIcon className="w-4 h-4" />
                                            <span className="font-bold text-xs">مصدر الإجابة</span>
                                        </div>
                                        <p className="text-xs text-text-sub leading-relaxed">
                                            {q.source_text} {q.page && <span className="mr-2 font-black text-primary">(صفحة {q.page})</span>}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    });
                })()}
            </div>
            </div>

            {/* Hidden PDF Content */}
            <div 
                ref={pdfRef} 
                id="pdf-content" 
                dir={isEnglish ? 'ltr' : 'rtl'} 
                style={{ 
                    display: 'none', 
                    padding: isEnglish ? '15px 65px' : '15px 30px', 
                    backgroundColor: 'white',
                    width: '740px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box',
                    position: 'relative',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'600\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'sans-serif\' font-size=\'36\' font-weight=\'900\' fill=\'rgba(0,0,0,0.06)\' text-anchor=\'middle\' transform=\'rotate(-25 300 200)\'%3EJoSchool11.netlify.app%3C/text%3E%3C/svg%3E")',
                    backgroundRepeat: 'repeat',
                    backgroundAttachment: 'local'
                }}
            >
                <style>{`
                    ${KATEX_CSS}
                    .pdf-question-card, .pdf-graph-block, .pdf-graph-option {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        -webkit-column-break-inside: avoid !important;
                    }
                `}</style>
                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '4px solid #3b82f6', paddingBottom: '10px', position: 'relative', paddingTop: '0px', zIndex: 1 }}>
                    {/* App Logo & Brand */}
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        [isEnglish ? 'left' : 'right']: isEnglish ? '65px' : '15px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10
                    }}>
                        <img 
                            src="https://i.postimg.cc/GtXVRVcp/IMG-20260704-001239-098.png" 
                            alt="Logo" 
                            style={{ width: '45px', height: '45px', objectFit: 'contain' }} 
                        />
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#1e293b', marginTop: '2px' }}>JoSchool11</span>
                    </div>

                    {/* Result Square */}
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        [isEnglish ? 'right' : 'left']: '15px',
                        width: '70px',
                        height: '100px',
                        border: `3px solid ${isPassed ? '#10b981' : '#ef4444'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        boxSizing: 'border-box',
                        zIndex: 10
                    }}>
                        <div style={{ 
                            flex: 1.2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '26px', 
                            fontWeight: '900', 
                            color: isPassed ? '#10b981' : '#ef4444'
                        }}>
                            {finalMark}
                        </div>
                        <div style={{ 
                            height: '3px', 
                            backgroundColor: isPassed ? '#10b981' : '#ef4444',
                            width: '100%'
                        }}></div>
                        <div style={{ 
                            flex: 0.8, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '20px', 
                            fontWeight: '900', 
                            color: 'black'
                        }}>
                            {maxMark}
                        </div>
                    </div>

                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: '0' }}>JoSchool <span style={{ color: '#3b82f6' }}>11</span></h1>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginTop: '8px' }}>{selectedSubject?.id}</div>
                    {(selectedSubject?.id === SubjectName.JordanHistory || selectedSubject?.id === SubjectName.IslamicEducation) && (
                        <>
                            {currentUnitTitle && !isSessionExam && <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginTop: '4px' }}>{currentUnitTitle}</div>}
                            {examNumber && !isSessionExam && <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#64748b', marginTop: '2px' }}>رقم الامتحان: {examNumber}</div>}
                        </>
                    )}
                    <div style={{ 
                        fontSize: '16px', 
                        color: '#64748b', 
                        marginTop: '4px' 
                    }}>{currentLessonTitle}</div>
                    <div style={{ 
                        marginTop: '10px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#475569',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: isEnglish ? '0 25px' : '0 35px',
                        direction: isEnglish ? 'ltr' : 'rtl'
                    }}>
                        <span>
                            {isEnglish ? `Student Name: ${studentName || '.................'}` : `اسم الطالب: ${studentName || '.................'}`}
                        </span>
                        <span style={{
                            [isEnglish ? 'marginRight' : 'marginLeft']: '30px'
                        }}>
                            {isEnglish ? `Seat Number: ${seatNumber || '.................'}` : `رقم الجلوس: ${seatNumber || '.................'}`}
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {currentQuiz.map((q, idx) => {
                        const userAnswer = userAnswers[idx];
                        const isCorrect = checkIsCorrect(q, userAnswer);
                        
                        return (
                            <div key={idx} className="pdf-question-card" style={{ marginBottom: '8px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '15px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    gap: isEnglish ? '12px' : '6px', 
                                    marginBottom: '10px',
                                    paddingLeft: isEnglish ? '20px' : '0'
                                }}>
                                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', lineHeight: '1.4', flex: 1 }}>
                                        <span style={{ 
                                            marginRight: isEnglish ? '5px' : '0', 
                                            marginLeft: isEnglish ? '0' : '5px',
                                            color: isCorrect ? '#059669' : '#dc2626'
                                        }}>
                                            {idx + 1}.
                                        </span>
                                        <MathRenderer text={q.question} />
                                    </div>
                                    <div style={{ fontSize: '18px', color: isCorrect ? '#10b981' : '#ef4444', fontWeight: '900', flexShrink: 0 }}>
                                        {isCorrect ? '✓' : '✗'}
                                    </div>
                                </div>

                                {/* Question Graph if present */}
                                {((q as any).questionGraph || (q as any).graph) && (
                                    <div className="pdf-graph-block" style={{ margin: '10px auto', width: '300px', height: '195px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                        <TrigGraph graphData={(q as any).questionGraph || (q as any).graph} />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: '6px' }}>
                                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, cIdx) => {
                                        const isUserChoice = userAnswer === choice;
                                        const isCorrectChoice = checkIsCorrect(q, choice);
                                        const option = (q as any).options && (q as any).options[cIdx];
                                        const optionGraph = option && option.graph;
                                        
                                        let bgColor = '#f8fafc';
                                        let borderColor = '#f1f5f9';
                                        let textColor = '#475569';

                                        if (isCorrectChoice) {
                                            bgColor = '#ecfdf5';
                                            borderColor = '#10b981';
                                            textColor = '#059669';
                                        } else if (isUserChoice && !isCorrect) {
                                            bgColor = '#fef2f2';
                                            borderColor = '#ef4444';
                                            textColor = '#dc2626';
                                        }

                                        return (
                                            <div key={cIdx} style={{ 
                                                padding: '6px 12px 8px 12px', 
                                                borderRadius: '8px', 
                                                border: `2px solid ${borderColor}`, 
                                                backgroundColor: bgColor,
                                                color: textColor,
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                width: '92%',
                                                marginLeft: isLtr ? '0' : 'auto',
                                                marginRight: isLtr ? 'auto' : '0',
                                                direction: isLtr ? 'ltr' : 'rtl',
                                                textAlign: isLtr ? 'left' : 'right'
                                            }}>
                                                <span style={{ 
                                                    width: '24px', 
                                                    height: '24px', 
                                                    borderRadius: '6px', 
                                                    backgroundColor: isCorrectChoice ? '#10b981' : isUserChoice ? '#ef4444' : '#fff',
                                                    color: (isCorrectChoice || isUserChoice) ? '#fff' : '#64748b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '13px',
                                                    fontWeight: '900',
                                                    lineHeight: '1',
                                                    paddingBottom: '2px'
                                                }}>
                                                    {optionLabels[cIdx] || ['A', 'B', 'C', 'D'][cIdx]}
                                                </span>
                                                {optionGraph ? (
                                                    <div className="pdf-graph-option" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '145px', height: '95px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                        <TrigGraph graphData={optionGraph} isOption={true} />
                                                    </div>
                                                ) : (
                                                    <div style={{ 
                                                        lineHeight: '1.1',
                                                        textDecoration: isCorrectChoice ? 'underline' : 'none',
                                                        textDecorationColor: isCorrectChoice ? 'black' : 'inherit',
                                                        textUnderlineOffset: isCorrectChoice ? '4px' : '0',
                                                        textDecorationThickness: isCorrectChoice ? '1.5px' : '0',
                                                        flex: 1,
                                                        minWidth: 0,
                                                        width: '100%'
                                                    }}>
                                                        <MathRenderer text={choice} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {(q.page || q.source_text) && (
                                    <div style={{ 
                                        marginTop: '8px', 
                                        padding: '6px 12px', 
                                        backgroundColor: '#f0f9ff', 
                                        borderRadius: '8px', 
                                        border: '1px solid #bae6fd',
                                        width: '92%',
                                        marginLeft: isEnglish ? '0' : 'auto',
                                        marginRight: isEnglish ? 'auto' : '0',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#0369a1', marginBottom: '2px' }}>مصدر الإجابة:</div>
                                        <div style={{ fontSize: '11px', color: '#0c4a6e', lineHeight: '1.4', wordWrap: 'break-word' }}>
                                            {q.source_text} {q.page && <span style={{ fontWeight: '900', color: '#0369a1', marginRight: '6px' }}>(صفحة {q.page})</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '12px', position: 'relative', zIndex: 1 }}>
                    تم استخراج هذه النتيجة عبر تطبيق JoSchool 11 - منصة التعليم التفاعلية
                    <div style={{ marginTop: '10px', color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }}>زوروا موقعنا: JoSchool11.netlify.app</div>
                </div>
            </div>

            {/* Hidden Print PDF Content (Ministry Style) */}
            <div 
                ref={printPdfRef} 
                id="print-pdf-content" 
                dir={isEnglish ? 'ltr' : 'rtl'} 
                style={{ 
                    display: 'none', 
                    padding: isEnglish ? '30px 75px' : '30px 40px', 
                    backgroundColor: 'white',
                    width: '790px',
                    fontFamily: 'serif',
                    color: 'black',
                    boxSizing: 'border-box',
                    position: 'relative',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'700\' height=\'500\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'serif\' font-size=\'40\' font-weight=\'bold\' fill=\'rgba(0,0,0,0.06)\' text-anchor=\'middle\' transform=\'rotate(-25 350 250)\'%3EJoSchool11.netlify.app%3C/text%3E%3C/svg%3E")',
                    backgroundRepeat: 'repeat',
                    backgroundAttachment: 'local'
                }}
            >
                <style>{`
                    ${KATEX_CSS}
                    .pdf-question-card, .pdf-graph-block, .pdf-graph-option {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        -webkit-column-break-inside: avoid !important;
                    }
                `}</style>
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '15px', position: 'relative', paddingTop: '5px', zIndex: 1 }}>
                    {/* App Logo & Brand */}
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        [isEnglish ? 'left' : 'right']: isEnglish ? '75px' : '50px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10
                    }}>
                        <img 
                            src="https://i.postimg.cc/GtXVRVcp/IMG-20260704-001239-098.png" 
                            alt="Logo" 
                            style={{ width: '60px', height: '60px', objectFit: 'contain' }} 
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'black', marginTop: '5px' }}>JoSchool11</span>
                    </div>

                    {/* Result Square */}
                    <div style={{
                        position: 'absolute',
                        top: '-25px',
                        [isEnglish ? 'right' : 'left']: '50px',
                        width: '75px',
                        height: '110px',
                        border: `3px solid ${isPassed ? '#059669' : '#dc2626'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        boxSizing: 'border-box',
                        zIndex: 10
                    }}>
                        <div style={{ 
                            flex: 1.2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '30px', 
                            fontWeight: 'bold',
                            color: isPassed ? '#059669' : '#dc2626'
                        }}>
                            {finalMark}
                        </div>
                        <div style={{ 
                            height: '3px', 
                            backgroundColor: isPassed ? '#059669' : '#dc2626',
                            width: '100%'
                        }}></div>
                        <div style={{ 
                            flex: 0.8, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '24px', 
                            fontWeight: 'bold',
                            color: 'black'
                        }}>
                            {maxMark}
                        </div>
                    </div>

                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>بسم الله الرحمن الرحيم</div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '15px' }}>امتحان مادة: {selectedSubject?.id}</div>
                    {(selectedSubject?.id === SubjectName.JordanHistory || selectedSubject?.id === SubjectName.IslamicEducation) && (
                        <>
                            {currentUnitTitle && !isSessionExam && <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '10px' }}>{currentUnitTitle}</div>}
                            {examNumber && !isSessionExam && <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>رقم الامتحان: {examNumber}</div>}
                        </>
                    )}
                    <div style={{ fontSize: '20px', marginTop: '8px' }}>{currentLessonTitle}</div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '25px', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        width: '100%',
                        padding: isEnglish ? '0 25px' : '0 35px',
                        direction: isEnglish ? 'ltr' : 'rtl'
                    }}>
                        <span style={{ textAlign: isEnglish ? 'left' : 'right' }}>
                            {isEnglish ? `Student Name: ${studentName || '.................'}` : `اسم الطالب: ${studentName || '.................'}`}
                        </span>
                        <span style={{ 
                            textAlign: isEnglish ? 'right' : 'left',
                            [isEnglish ? 'marginRight' : 'marginLeft']: '30px'
                        }}>
                            {isEnglish ? `Seat Number: ${seatNumber || '.................'}` : `رقم الجلوس: ${seatNumber || '.................'}`}
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: '17px', width: '100%', position: 'relative', zIndex: 1 }}>
                    {currentQuiz.map((q, idx) => {
                        const userAnswer = userAnswers[idx];
                        const isCorrect = checkIsCorrect(q, userAnswer);
                        
                        return (
                            <div key={idx} className="pdf-question-card" style={{ marginBottom: '16px', pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: isEnglish ? '14px' : '8px', 
                                    marginBottom: '10px', 
                                    alignItems: 'flex-start',
                                    paddingLeft: isEnglish ? '25px' : '0'
                                }}>
                                    <div style={{ fontWeight: 'bold', flex: 1, fontSize: '18px', display: 'block', minWidth: 0, width: '100%' }}>
                                        <span style={{ 
                                            marginRight: isEnglish ? '8px' : '0', 
                                            marginLeft: isEnglish ? '0' : '8px',
                                            color: isCorrect ? '#16a34a' : '#ef4444'
                                        }}>
                                            {idx + 1}.
                                        </span>
                                        <MathRenderer text={q.question} />
                                    </div>
                                    <span style={{ flexShrink: 0, fontSize: '18px', fontWeight: 'bold', marginRight: isEnglish ? '0' : '10px', marginLeft: isEnglish ? '10px' : '0' }}>{isCorrect ? '✓' : '✗'}</span>
                                </div>
                                
                                {/* Question Graph if present */}
                                {((q as any).questionGraph || (q as any).graph) && (
                                    <div className="pdf-graph-block" style={{ margin: '10px auto', width: '280px', height: '180px', backgroundColor: '#f8fafc', padding: '6px', border: '1px solid black', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                        <TrigGraph graphData={(q as any).questionGraph || (q as any).graph} />
                                    </div>
                                )}

                                <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: '10px 40px', 
                                    paddingRight: isLtr ? '30px' : '20px',
                                    paddingLeft: isLtr ? '35px' : '30px',
                                    direction: isLtr ? 'ltr' : 'rtl',
                                    textAlign: isLtr ? 'left' : 'right'
                                }}>
                                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, cIdx) => {
                                        const isUserChoice = userAnswer === choice;
                                        const isCorrectChoice = checkIsCorrect(q, choice);
                                        const letter = optionLabels[cIdx] || ['A', 'B', 'C', 'D'][cIdx];
                                        const option = (q as any).options && (q as any).options[cIdx];
                                        const optionGraph = option && option.graph;
                                        
                                        return (
                                            <div key={cIdx} style={{ 
                                                display: 'flex', 
                                                gap: '8px', 
                                                alignItems: 'center',
                                                paddingLeft: isLtr ? '12px' : '0',
                                                paddingRight: isLtr ? '0' : '12px'
                                            }}>
                                                <span style={{ fontWeight: 'bold' }}>{letter})</span>
                                                {optionGraph ? (
                                                    <div className="pdf-graph-option" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '135px', height: '85px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                        <TrigGraph graphData={optionGraph} isOption={true} />
                                                    </div>
                                                ) : (
                                                    <span style={{ 
                                                        fontWeight: isCorrectChoice ? 'bold' : 'normal',
                                                        color: isCorrectChoice ? '#16a34a' : (isUserChoice && !isCorrect ? '#ef4444' : 'black'),
                                                        textDecoration: isCorrectChoice ? 'underline' : 'none',
                                                        textDecorationColor: isCorrectChoice ? 'black' : 'inherit',
                                                        textUnderlineOffset: isCorrectChoice ? '6px' : '0',
                                                        textDecorationThickness: isCorrectChoice ? '1.5px' : '0',
                                                        display: 'block', flex: 1, minWidth: 0, width: '100%'
                                                    }}>
                                                        <MathRenderer text={choice} />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid black', paddingTop: '10px', fontSize: '14px', fontWeight: 'bold', position: 'relative', zIndex: 1 }}>
                    {isEnglish ? 'Questions Ended - Good Luck - JoSchool 11' : 'انتهت الأسئلة - مع تمنياتنا لكم بالتوفيق - JoSchool 11'}
                    <div style={{ marginTop: '10px' }}>زوروا موقعنا: JoSchool11.netlify.app</div>
                </div>
            </div>
        </>
    );
};

export default ResultsPage;
