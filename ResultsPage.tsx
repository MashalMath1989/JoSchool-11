import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { StarIcon, XIcon, CheckIcon, BookmarkIcon, BookmarkOutlineIcon, ShareIcon, FlagIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from './data/Icons';
import { Question, Subject, SubjectName, UserProgress, QuizResult } from './types';
import { renderTextWithUnderline } from './textRenderer';

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
    isFavoriteDisabled
}) => {
    const isEnglish = selectedSubject?.id === SubjectName.English;
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
            case SubjectName.English: return 100;
            case SubjectName.JordanHistory: return 40;
            default: return 40;
        }
    };

    const maxMark = getSubjectMaxMark(selectedSubject?.id);
    const score = userAnswers.reduce((acc, ans, idx) => acc + (checkIsCorrect(currentQuiz[idx], ans) ? 1 : 0), 0);
    const totalQuestions = currentQuiz.length || 1;
    const finalMark = Math.round((score / totalQuestions) * maxMark);
    const isPassed = finalMark >= (maxMark / 2);
    const pdfRef = useRef<HTMLDivElement>(null);
    const printPdfRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);

    const exportToPDF = (mode: 'mobile' | 'print') => {
        const element = mode === 'mobile' ? pdfRef.current : printPdfRef.current;
        if (!element) return;
        
        setShowExportDialog(false);
        setIsExporting(true);

        const opt = {
            margin: mode === 'mobile' ? [10, 10] : [15, 10],
            filename: `JoSchool_${mode === 'mobile' ? 'Mobile' : 'Print'}_${currentLessonTitle.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
    }, [selectedSubject, currentLessonTitle, examNumber, finalMark, totalQuestions, setUserProgress, userAnswers]);

    return (
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
                                <img src="https://i.postimg.cc/y8GJVJ52/1777447368581.png" alt="JoSchool" className="w-full h-auto object-contain" />
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
            <div className="text-right mb-6 px-2">
                <h3 className="text-base font-black text-text-main flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                    مراجعة الإجابات
                </h3>
                <p className="text-text-sub font-bold text-[9px] mt-1">راجع أداءك وتعرف على الإجابات الصحيحة</p>
            </div>

            <div className="space-y-6 pb-20">
                {currentQuiz.map((q, idx) => {
                    const userAnswer = userAnswers[idx];
                    const isCorrect = checkIsCorrect(q, userAnswer);
                    
                    return (
                        <div key={idx} className={`bg-white rounded-lg px-6 pb-6 pt-14 shadow-md border-r-8 ${isEnglish ? 'text-left' : 'text-right'} transition-all hover:shadow-lg border border-slate-900 relative ${isCorrect ? 'border-r-emerald-500' : 'border-r-red-500'}`}>
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
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: 'سؤال من JoSchool', text: q.question }).catch(() => {});
                                        }
                                    }}
                                    className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors border border-slate-900"
                                    title="مشاركة"
                                >
                                    <ShareIcon className="w-4 h-4" />
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

                            <h4 className={`font-black text-text-main text-base leading-relaxed mb-8 flex items-start gap-4 ${isEnglish ? 'text-left' : 'text-right'}`}>
                                <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-xs mt-1 shadow-inner ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                                    {idx + 1}
                                </span>
                                <span className="flex-1 pt-1">{renderTextWithUnderline(q.question)}</span>
                            </h4>

                            <div className="space-y-2 mb-6">
                                {q.choices && Array.isArray(q.choices) && q.choices.map((choice, cIdx) => {
                                    const isUserChoice = userAnswer === choice;
                                    const isCorrectChoice = checkIsCorrect(q, choice);
                                    
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
                                        <div key={cIdx} className={`p-3 rounded-lg border-2 font-bold text-xs flex items-center gap-3 border-slate-900 ${bgColor} ${borderColor} ${textColor}`}>
                                            <div className={`w-8 h-8 rounded-md border-2 flex items-center justify-center shrink-0 font-black text-xs transition-colors ${isCorrectChoice ? 'bg-emerald-500 text-white border-emerald-400' : isUserChoice ? 'bg-red-500 text-white border-red-400' : 'bg-white text-text-sub border-primary/10'}`}>
                                                {isEnglish ? ['A', 'B', 'C', 'D'][cIdx] : ['أ', 'ب', 'ج', 'د'][cIdx]}
                                            </div>
                                            <span className="flex-1">{renderTextWithUnderline(choice)}</span>
                                            <div className={`${isEnglish ? 'ml-auto' : 'mr-auto'} shrink-0`}>
                                                {isCorrectChoice && <CheckIcon className="w-5 h-5 text-emerald-600" />}
                                                {isUserChoice && !isCorrect && <XIcon className="w-5 h-5 text-red-600" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

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
                        </div>
                    );
                })}
            </div>

            {/* Hidden PDF Content */}
            <div 
                ref={pdfRef} 
                id="pdf-content" 
                dir={isEnglish ? 'ltr' : 'rtl'} 
                style={{ 
                    display: 'none', 
                    padding: '15px 30px', 
                    backgroundColor: 'white',
                    width: '740px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '4px solid #3b82f6', paddingBottom: '10px', position: 'relative', paddingTop: '0px' }}>
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
                            {currentUnitTitle && <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginTop: '4px' }}>{currentUnitTitle}</div>}
                            {examNumber && <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#64748b', marginTop: '2px' }}>رقم الامتحان: {examNumber}</div>}
                        </>
                    )}
                    <div style={{ fontSize: '16px', color: '#64748b', marginTop: '4px' }}>{currentLessonTitle}</div>
                    <div style={{ 
                        marginTop: '10px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#475569',
                        textAlign: isEnglish ? 'left' : 'right',
                        padding: '0 10px'
                    }}>
                        {isEnglish ? 'Student Name:' : 'اسم الطالب:'} ......................................................
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentQuiz.map((q, idx) => {
                        const userAnswer = userAnswers[idx];
                        const isCorrect = checkIsCorrect(q, userAnswer);
                        
                        return (
                            <div key={idx} style={{ marginBottom: '5px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '15px', pageBreakInside: 'avoid' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                                    <div style={{ 
                                        width: '26px', 
                                        height: '26px', 
                                        borderRadius: '50%', 
                                        backgroundColor: isCorrect ? '#ecfdf5' : '#fef2f2', 
                                        color: isCorrect ? '#059669' : '#dc2626',
                                        fontSize: '12px',
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                                        flexShrink: 0,
                                        marginTop: '2px'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', lineHeight: '1.4', flex: 1 }}>{renderTextWithUnderline(q.question)}</div>
                                    <div style={{ fontSize: '18px', color: isCorrect ? '#10b981' : '#ef4444', fontWeight: '900', flexShrink: 0 }}>
                                        {isCorrect ? '✓' : '✗'}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '6px' }}>
                                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, cIdx) => {
                                        const isUserChoice = userAnswer === choice;
                                        const isCorrectChoice = checkIsCorrect(q, choice);
                                        
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
                                                marginLeft: isEnglish ? '0' : 'auto',
                                                marginRight: isEnglish ? 'auto' : '0'
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
                                                    {isEnglish ? ['A', 'B', 'C', 'D'][cIdx] : ['أ', 'ب', 'ج', 'د'][cIdx]}
                                                </span>
                                                <span style={{ lineHeight: '1.1' }}>{renderTextWithUnderline(choice)}</span>
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
                
                <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '12px' }}>
                    تم استخراج هذه النتيجة عبر تطبيق JoSchool 11 - منصة التعليم التفاعلية
                </div>
            </div>

            {/* Hidden Print PDF Content (Ministry Style) */}
            <div 
                ref={printPdfRef} 
                id="print-pdf-content" 
                dir={isEnglish ? 'ltr' : 'rtl'} 
                style={{ 
                    display: 'none', 
                    padding: '30px 40px', 
                    backgroundColor: 'white',
                    width: '790px',
                    fontFamily: 'serif',
                    color: 'black',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '15px', position: 'relative', paddingTop: '5px' }}>
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
                            {currentUnitTitle && <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '10px' }}>{currentUnitTitle}</div>}
                            {examNumber && <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>رقم الامتحان: {examNumber}</div>}
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
                        padding: '0 10px'
                    }}>
                        <span style={{ flex: 1, textAlign: isEnglish ? 'left' : 'right', paddingLeft: isEnglish ? '30px' : '0' }}>{isEnglish ? 'Student Name:' : 'اسم الطالب:'} ......................................................</span>
                    </div>
                </div>

                <div style={{ fontSize: '17px', width: '100%' }}>
                    {currentQuiz.map((q, idx) => {
                        const userAnswer = userAnswers[idx];
                        const isCorrect = checkIsCorrect(q, userAnswer);
                        
                        return (
                            <div key={idx} style={{ marginBottom: '20px', pageBreakInside: 'avoid', width: '100%' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
                                    <div style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: '50%', 
                                        border: '1.5px solid black',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '15px', 
                                        fontWeight: 'bold',
                                        flexShrink: 0,
                                        marginTop: '1px'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <span style={{ fontWeight: 'bold', flex: 1, fontSize: '18px' }}>{renderTextWithUnderline(q.question)}</span>
                                    <span style={{ flexShrink: 0, fontSize: '18px', fontWeight: 'bold', marginRight: isEnglish ? '0' : '10px', marginLeft: isEnglish ? '10px' : '0' }}>{isCorrect ? '✓' : '✗'}</span>
                                </div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: '10px 40px', 
                                    paddingRight: isEnglish ? '20px' : '30px',
                                    paddingLeft: isEnglish ? '30px' : '20px'
                                }}>
                                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, cIdx) => {
                                        const isUserChoice = userAnswer === choice;
                                        const isCorrectChoice = checkIsCorrect(q, choice);
                                        const letter = isEnglish ? ['A', 'B', 'C', 'D'][cIdx] : ['أ', 'ب', 'ج', 'د'][cIdx];
                                        
                                        return (
                                            <div key={cIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold' }}>{letter})</span>
                                                <span style={{ 
                                                    fontWeight: isCorrectChoice ? 'bold' : 'normal',
                                                    color: isUserChoice && !isCorrect ? '#ef4444' : 'black',
                                                    textDecoration: isCorrectChoice ? 'underline' : 'none',
                                                    textUnderlineOffset: isCorrectChoice ? '6px' : '0',
                                                    textDecorationThickness: isCorrectChoice ? '1px' : '0',
                                                    display: 'inline-block'
                                                }}>
                                                    {renderTextWithUnderline(choice)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid black', paddingTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                    {isEnglish ? 'Questions Ended - Good Luck - JoSchool 11' : 'انتهت الأسئلة - مع تمنياتنا لكم بالتوفيق - JoSchool 11'}
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
