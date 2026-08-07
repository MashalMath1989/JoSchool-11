import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, CheckIcon, XIcon, ArrowLeftIcon, ChevronRightIcon, ChevronLeftIcon, BookmarkIcon, BookmarkOutlineIcon, ShareIcon, FlagIcon, ChevronDownIcon, BookOpenIcon, DownloadIcon } from './data/Icons';
import { Question, Subject, SubjectName, UserProgress } from './types';
import { MathRenderer, renderTextWithUnderline } from './textRenderer';
import TrigGraph from './TrigGraph';
import { shareQuestionDirectly, isMathSubject } from './shareUtils';

interface QuizPageProps {
    currentQuiz: Question[];
    currentQuestionIndex: number;
    userAnswers: (string | undefined)[];
    handleAnswer: (choice: string) => void;
    handleNext: () => void;
    handlePrevious: () => void;
    handleFinish: () => void;
    timer: number;
    formatTimer: (seconds: number) => string;
    isEnglish?: boolean;
    onBack: () => void;
    selectedSubject: Subject | null;
    currentLessonTitle: string;
    isQuestionFavorite: (questionText: string) => boolean;
    toggleFavoriteQuestion: (question: Question, subjectId: string, lessonTitle: string) => void;
    isFavoriteDisabled?: boolean;
}

const QuizPage: React.FC<QuizPageProps> = React.memo(({
    currentQuiz = [],
    currentQuestionIndex = 0,
    userAnswers = [],
    handleAnswer,
    handleNext,
    handlePrevious,
    handleFinish,
    timer,
    formatTimer,
    isEnglish,
    onBack,
    selectedSubject,
    currentLessonTitle,
    isQuestionFavorite,
    toggleFavoriteQuestion,
    isFavoriteDisabled
}) => {
    const quizLength = currentQuiz?.length || 0;
    const safeIndex = (quizLength > 0)
        ? Math.min(Math.max(0, currentQuestionIndex), quizLength - 1)
        : 0;

    const q = currentQuiz && currentQuiz[safeIndex];
    const isMath = selectedSubject?.id === SubjectName.Math;
    const isLtr = isEnglish || isMath;
    const isArabicSubject = selectedSubject?.id === SubjectName.JordanHistory || 
                            selectedSubject?.id === SubjectName.IslamicEducation || 
                            selectedSubject?.id === SubjectName.Arabic || 
                            (!isLtr);
    const optionLabels = isArabicSubject ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
    const explanationText = q && (q.explanation || (q as any).Explanation);

    const [prevIndex, setPrevIndex] = useState(safeIndex);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    if (safeIndex !== prevIndex) {
        setPrevIndex(safeIndex);
        setShowExplanation(false);
    }

    // Auto-recovery timer if question is missing
    useEffect(() => {
        if (!q) {
            const timer = setTimeout(() => {
                console.warn("QuizPage: Question unavailable, auto-returning...");
                onBack();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [q, onBack]);

    const checkIsChoiceCorrect = (question: Question, choice: string) => {
        if (!choice || !question.correct_answer) return false;
        
        const trimmedChoice = choice.trim();
        const trimmedCorrect = String(question.correct_answer).trim();
        
        // 1. Direct match
        if (trimmedChoice === trimmedCorrect) return true;
        
        // 2. Match by letter (أ, ب, ج, د or A, B, C, D)
        const arabicLetters = ['أ', 'ب', 'ج', 'د'];
        const englishLetters = ['A', 'B', 'C', 'D'];
        const lowerEnglishLetters = ['a', 'b', 'c', 'd'];
        
        let letterIndex = arabicLetters.indexOf(trimmedCorrect);
        if (letterIndex === -1) letterIndex = englishLetters.indexOf(trimmedCorrect.toUpperCase());
        if (letterIndex === -1) letterIndex = lowerEnglishLetters.indexOf(trimmedCorrect.toLowerCase());
        
        if (letterIndex !== -1 && question.choices[letterIndex]?.trim() === trimmedChoice) return true;
        
        // 3. Match by index (0, 1, 2, 3)
        const numericIndex = parseInt(trimmedCorrect);
        if (!isNaN(numericIndex) && question.choices[numericIndex]?.trim() === trimmedChoice) return true;
        
        return false;
    };

    if (!q) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center" dir={isEnglish ? 'ltr' : 'rtl'}>
            <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-slate-900 max-w-sm w-full flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 border border-primary/20 animate-pulse">
                    <ClockIcon className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                    {isEnglish ? 'Loading Question...' : 'جاري تحميل السؤال...'}
                </h3>
                <p className="text-slate-500 font-bold text-xs mb-6 leading-relaxed">
                    {isEnglish 
                        ? 'If the question does not appear shortly, click below to return.' 
                        : 'إذا لم يظهر السؤال خلال لحظات، يرجى الضغط للعودة للقائمة.'}
                </p>
                <button 
                    onClick={onBack}
                    className="w-full py-3.5 bg-primary text-white font-black rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95 border border-slate-900"
                >
                    {isEnglish ? 'Return to List' : 'العودة للقائمة الرئيسية'}
                </button>
            </div>
        </div>
    );

    const progress = quizLength > 0 ? ((safeIndex + 1) / quizLength) * 100 : 0;
    const isLastQuestion = quizLength > 0 && safeIndex === quizLength - 1;
    const isFirstQuestion = safeIndex === 0;

    return (
        <div className={`container mx-auto p-4 max-w-2xl pt-6 ${isEnglish ? 'text-left' : 'text-right'}`} dir={isEnglish ? 'ltr' : 'rtl'}>
            <div className="flex items-center justify-between mb-8 px-2">
                <div className={`flex items-center gap-3 ${isEnglish ? 'flex-row' : 'flex-row-reverse'}`}>
                    <button 
                        onClick={onBack}
                        className="w-12 h-12 bg-white border-2 border-slate-900 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:text-primary transition-all active:scale-90"
                    >
                        {isEnglish ? <ChevronLeftIcon className="w-6 h-6" strokeWidth={3} /> : <ChevronRightIcon className="w-6 h-6" strokeWidth={3} />}
                    </button>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center shadow-inner">
                        <ClockIcon className="w-6 h-6" />
                    </div>
                    <div className={`flex flex-col ${isEnglish ? 'items-start' : 'items-end'}`}>
                        <span className="text-[9px] font-bold text-text-sub uppercase tracking-widest">{isEnglish ? 'Time Remaining' : 'الوقت المتبقي'}</span>
                        <span className="text-sm font-black text-text-main leading-tight tabular-nums">{formatTimer(timer)}</span>
                    </div>
                </div>
                <div className={`flex flex-col ${isEnglish ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-bold text-text-sub uppercase tracking-widest">{isEnglish ? 'Current Question' : 'السؤال الحالي'}</span>
                    <span className="text-sm font-black text-text-main leading-tight">{safeIndex + 1} <span className="text-text-sub/30">/ {quizLength}</span></span>
                </div>
            </div>

            <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden mb-10 shadow-inner border border-primary/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-secondary shadow-lg"
                />
            </div>

            <div className="bg-white rounded-xl px-4 pb-8 pt-14 shadow-2xl border-t-4 border-primary border border-slate-900 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>

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
                </div>

                <div className={`text-xl font-black text-text-main leading-relaxed mb-6 relative z-10 flex items-start gap-4 ${isEnglish ? 'text-left' : 'text-right'}`}>
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center shrink-0 border border-primary/10 font-bold mt-1 shadow-inner">
                        {currentQuestionIndex + 1}
                    </span>
                    <div className="flex-1 pt-1 min-w-0 w-full"><MathRenderer text={q.question} /></div>
                </div>

                {/* Question Graph */}
                {((q as any).questionGraph || (q as any).graph) && (
                    <div className="mb-6 relative z-10 w-full max-w-[340px] h-[220px] mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-center items-center shadow-sm">
                        <TrigGraph graphData={(q as any).questionGraph || (q as any).graph} />
                    </div>
                )}

                <div className={`grid gap-3 relative z-10 ${(q as any).options && (q as any).options.some((opt: any) => opt.graph) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 space-y-1'}`}>
                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, idx) => {
                        const isSelected = userAnswers[currentQuestionIndex] === choice;
                        const hasAnswered = isMath && userAnswers[currentQuestionIndex] !== undefined && userAnswers[currentQuestionIndex] !== null;
                        
                        let btnClass: string;
                        let badgeClass: string;
                        let isChoiceCorrect = false;

                        if (isMath && hasAnswered) {
                            isChoiceCorrect = checkIsChoiceCorrect(q, choice);
                            if (isChoiceCorrect) {
                                btnClass = "bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-sm cursor-default";
                                badgeClass = "bg-emerald-600 text-white border-emerald-600";
                            } else if (isSelected) {
                                btnClass = "bg-rose-50 border-2 border-rose-500 text-rose-900 shadow-sm cursor-default";
                                badgeClass = "bg-rose-600 text-white border-rose-600";
                            } else {
                                btnClass = "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60 cursor-default";
                                badgeClass = "bg-slate-100 text-slate-400 border-slate-200";
                            }
                        } else {
                            btnClass = isSelected 
                                ? "bg-primary border-slate-900 text-white shadow-xl scale-[1.02] cursor-pointer" 
                                : "bg-app-bg/50 border-slate-900 text-text-main hover:bg-white hover:border-slate-900 hover:shadow-md cursor-pointer";
                            badgeClass = isSelected 
                                ? "bg-white text-primary border-white" 
                                : "bg-white text-text-sub border-primary/10 group-hover:border-primary/30";
                        }

                        const option = (q as any).options && (q as any).options[idx];
                        const optionGraph = option && option.graph;

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (isMath && hasAnswered) return;
                                    handleAnswer(choice);
                                }}
                                dir={isLtr ? 'ltr' : 'rtl'}
                                className={`w-full p-4 rounded-lg font-black text-base transition-all duration-300 border flex items-center gap-4 group ${isLtr ? 'text-left font-sans' : 'text-right font-naskh'} ${btnClass}`}
                            >
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${badgeClass}`}>
                                    {optionLabels[idx] || ['A', 'B', 'C', 'D'][idx]}
                                </div>
                                {optionGraph ? (
                                    <div className="flex-1 flex justify-center items-center h-[105px] max-w-[160px] mx-auto py-1">
                                        <TrigGraph graphData={optionGraph} isOption={true} />
                                    </div>
                                ) : (
                                    <div className="flex-1 min-w-0 w-full"><MathRenderer text={choice} /></div>
                                )}
                                {isMath && hasAnswered && (
                                    <div className={`shrink-0 ${isLtr ? 'ml-auto' : 'mr-auto'}`}>
                                        {isChoiceCorrect ? (
                                            <CheckIcon className="w-6 h-6 text-emerald-600 font-bold" />
                                        ) : isSelected ? (
                                            <XIcon className="w-6 h-6 text-rose-600 font-bold" />
                                        ) : null}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-4 mt-10 items-center justify-between">
                {isMath ? (
                    <>
                        {/* السابق (Previous) */}
                        <button
                            onClick={handlePrevious}
                            disabled={isFirstQuestion}
                            className={`flex-1 py-5 rounded-xl font-black text-base shadow-lg active:scale-95 transition-transform flex items-center justify-center border border-slate-900 ${
                                isFirstQuestion 
                                    ? 'bg-slate-100/70 text-slate-400 border-slate-200 border-b-2 cursor-not-allowed shadow-none active:scale-100' 
                                    : 'bg-white text-text-main border-b-4'
                            }`}
                        >
                            {isEnglish ? 'Previous' : 'السابق'}
                        </button>

                        {/* الشرح (Explanation Button) */}
                        <button
                            onClick={() => {
                                if (userAnswers[currentQuestionIndex]) {
                                    setShowExplanation(prev => !prev);
                                }
                            }}
                            disabled={!userAnswers[currentQuestionIndex]}
                            className={`w-16 h-16 rounded-full shrink-0 flex flex-col items-center justify-center transition-all duration-300 border-2 ${
                                userAnswers[currentQuestionIndex]
                                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-500 text-emerald-800 cursor-pointer shadow-md active:scale-95'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                        >
                            <span className="text-[12px] font-black leading-none mb-1">الشرح</span>
                            <ChevronDownIcon 
                                className={`w-4 h-4 transition-transform duration-300 ${
                                    showExplanation ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                                }`} 
                            />
                        </button>

                        {/* التالي (Next) */}
                        <button
                            onClick={isLastQuestion ? handleFinish : handleNext}
                            disabled={!userAnswers[currentQuestionIndex]}
                            className={`flex-1 py-5 text-white rounded-xl font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center border border-slate-900 ${
                                !userAnswers[currentQuestionIndex] 
                                    ? 'bg-text-sub/30 cursor-not-allowed grayscale' 
                                    : 'bg-gradient-to-r from-primary to-secondary border-b-4 border-secondary/50'
                            }`}
                        >
                            {isLastQuestion ? (isEnglish ? 'Finish Quiz' : 'إنهاء الاختبار') : (isEnglish ? 'Next' : 'التالي')}
                        </button>
                    </>
                ) : (
                    <>
                        {!isFirstQuestion && (
                            <button
                                onClick={handlePrevious}
                                className="flex-1 py-5 bg-white text-text-main rounded-lg font-black text-base shadow-lg active:scale-95 transition-transform flex items-center justify-center border border-slate-900 border-b-4"
                            >
                                {isEnglish ? 'Previous' : 'السابق'}
                            </button>
                        )}
                        <button
                            onClick={isLastQuestion ? handleFinish : handleNext}
                            disabled={!userAnswers[currentQuestionIndex]}
                            className={`flex-1 py-5 text-white rounded-lg font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center border border-slate-900 ${!userAnswers[currentQuestionIndex] ? 'bg-text-sub/30 cursor-not-allowed grayscale' : 'bg-gradient-to-r from-primary to-secondary border-b-4 border-secondary/50'}`}
                        >
                            {isLastQuestion ? (isEnglish ? 'Finish Quiz' : 'إنهاء الاختبار') : (isEnglish ? 'Next' : 'التالي')}
                        </button>
                    </>
                )}
            </div>

            {/* Explanation collapsible card */}
            {isMath && explanationText && (
                <AnimatePresence>
                    {showExplanation && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden mt-6"
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 border-t-8 border-t-emerald-500 text-right" dir="rtl">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                            <BookOpenIcon className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-800">شرح خطوات الحل</h4>
                                    </div>
                                </div>
                                <div className="text-slate-700 font-medium text-base leading-relaxed font-naskh">
                                    <MathRenderer text={explanationText} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
});

export default QuizPage;
