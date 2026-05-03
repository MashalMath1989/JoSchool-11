import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, CheckIcon, XIcon, ArrowLeftIcon, ChevronRightIcon, ChevronLeftIcon, BookmarkIcon, BookmarkOutlineIcon, ShareIcon, FlagIcon } from './data/Icons';
import { Question, Subject, UserProgress } from './types';
import { renderTextWithUnderline } from './textRenderer';

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

const QuizPage: React.FC<QuizPageProps> = ({
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
    const q = currentQuiz && currentQuiz[currentQuestionIndex];
    if (!q) return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <p className="font-black text-slate-800">جاري تحميل السؤال...</p>
        </div>
    );

    const quizLength = currentQuiz?.length || 0;
    const progress = quizLength > 0 ? ((currentQuestionIndex + 1) / quizLength) * 100 : 0;
    const isLastQuestion = quizLength > 0 && currentQuestionIndex === quizLength - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

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
                    <span className="text-sm font-black text-text-main leading-tight">{currentQuestionIndex + 1} <span className="text-text-sub/30">/ {quizLength}</span></span>
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
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: 'سؤال من الشامل', text: q.question }).catch(() => {});
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
                </div>

                <h3 className={`text-xl font-black text-text-main leading-relaxed mb-10 relative z-10 flex items-start gap-4 ${isEnglish ? 'text-left' : 'text-right'}`}>
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center shrink-0 border border-primary/10 font-bold mt-1 shadow-inner">
                        {currentQuestionIndex + 1}
                    </span>
                    <span className="flex-1 pt-1">{renderTextWithUnderline(q.question)}</span>
                </h3>

                <div className="space-y-1 relative z-10">
                    {q.choices && Array.isArray(q.choices) && q.choices.map((choice, idx) => {
                        const isSelected = userAnswers[currentQuestionIndex] === choice;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(choice)}
                                className={`w-full p-4 rounded-lg font-black text-base transition-all duration-300 border flex items-center gap-4 group ${isEnglish ? 'text-left' : 'text-right'} ${isSelected ? 'bg-primary border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-app-bg/50 border-slate-900 text-text-main hover:bg-white hover:border-slate-900 hover:shadow-md'}`}
                            >
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${isSelected ? 'bg-white text-primary border-white' : 'bg-white text-text-sub border-primary/10 group-hover:border-primary/30'}`}>
                                    {isEnglish ? ['A', 'B', 'C', 'D'][idx] : ['أ', 'ب', 'ج', 'د'][idx]}
                                </div>
                                <span className="flex-1">{renderTextWithUnderline(choice)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-4 mt-10">
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
            </div>
        </div>
    );
};

export default QuizPage;
