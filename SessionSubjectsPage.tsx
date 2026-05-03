import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject, Semester, View, SubjectName, UserProgress, QuizResult } from './types';
import { SESSION_2008_EXAMS, SESSION_2008_SUP_EXAMS } from './data/exams';

interface SessionSubjectsPageProps {
    subjectsData: Subject[];
    navigateTo: (view: View, subject?: Subject) => void;
    onBack: () => void;
    sessionTitle: string;
    handleStartSessionExam: (subjectId: SubjectName, sessionName: string) => void;
    userProgress: UserProgress;
}

const SessionSubjectsPage: React.FC<SessionSubjectsPageProps> = ({
    subjectsData,
    navigateTo,
    onBack,
    sessionTitle,
    handleStartSessionExam,
    userProgress
}) => {
    const [showComingSoon, setShowComingSoon] = useState(false);

    useEffect(() => {
        if (showComingSoon) {
            const timer = setTimeout(() => setShowComingSoon(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showComingSoon]);

    const sessionSubjects = [
        SubjectName.JordanHistory,
        SubjectName.IslamicEducation,
        SubjectName.Arabic,
        SubjectName.English
    ];

    const getProgress = (subjectName: SubjectName) => {
        let baseTitle = "";
        if (sessionTitle === 'دورة 2008') {
            const exam = SESSION_2008_EXAMS.find(e => e.subject === subjectName);
            if (exam) baseTitle = exam.title;
        } else if (sessionTitle === 'دورة 2008 تكميلي') {
            const exam = SESSION_2008_SUP_EXAMS.find(e => e.subject === subjectName);
            if (exam) baseTitle = exam.title;
        }
        
        if (!baseTitle) return { percent: 0, isPerfect: false };
        
        const isEnglish = subjectName === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const lessonTitle = `${baseTitle} - ${examLabel}`;
        const fullKey = `${subjectName}_${lessonTitle}`;
        
        // Stricter check for perfect score: must be exactly 40/40 and have a significant number of questions 
        // to avoid matching partial or test quizzes that might scale to 40.
        // For ministerial session exams, they must have at least 40 questions to be considered "full".
        const isPerfect = userProgress?.quizResults?.some((r: QuizResult) => 
            r.subjectId === subjectName && 
            r.lessonTitle === lessonTitle && 
            Number(r.score) === 40 && 
            r.lessonTitle.startsWith('امتحان دورة') &&
            (r.totalQuestions || 0) >= 40 
        ) || false;

        const progressResult = userProgress?.examProgresses?.[fullKey];
        if (!progressResult || progressResult.totalQuestions === 0) return { percent: 0, isPerfect };
        
        const answeredCount = (progressResult.userAnswers || []).filter(a => a !== null).length;
        return { percent: (answeredCount / progressResult.totalQuestions) * 100, isPerfect };
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 relative" dir="rtl">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-2.5 h-8 bg-yellow-400 rounded-full shrink-0"></div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight flex-1">
                    {sessionTitle === 'الدوسيات' ? 'اختر المادة للإطلاع على الدوسية:' : 'اختر الامتحان لبدء التقديم:'}
                </h2>
                <button 
                    onClick={onBack}
                    className="p-2.5 bg-white text-slate-600 rounded-lg font-black shadow-lg flex items-center justify-center border-2 border-slate-900 hover:text-primary transition-all active:scale-95 shrink-0"
                >
                    <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {showComingSoon && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="bg-white text-slate-900 px-6 py-4 rounded-2xl text-center font-black shadow-2xl border-2 border-slate-900 max-w-xs"
                                dir="rtl"
                            >
                                <div className="text-3xl mb-2">⏳</div>
                                غير متاحة حالياً سيتم توفيرها قريباً
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {sessionSubjects.map((subjectName, idx) => {
                    const subject = subjectsData.find(s => s.id === subjectName && s.semester === Semester.First);
                    const { percent: progress, isPerfect } = (sessionTitle === 'دورة 2008' || sessionTitle === 'دورة 2008 تكميلي') 
                        ? getProgress(subjectName as SubjectName) 
                        : { percent: 0, isPerfect: false };
                    
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (sessionTitle === 'دورة 2008' || sessionTitle === 'دورة 2008 تكميلي' || sessionTitle === 'الدورة التجريبية') {
                                    handleStartSessionExam(subjectName as SubjectName, sessionTitle);
                                } else if (sessionTitle === 'الدوسيات') {
                                    setShowComingSoon(true);
                                } else if (subject) {
                                    navigateTo(View.SubjectIndex, subject);
                                }
                            }}
                            className={`relative ${isPerfect ? 'bg-emerald-50 shadow-emerald-100' : 'bg-white'} rounded-lg p-6 shadow-lg border-r-8 ${isPerfect ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-sky-500'} flex items-center justify-between cursor-pointer hover:shadow-xl transition-all group border border-slate-900 overflow-hidden`}
                        >
                            {/* Progress overlay */}
                            {isPerfect ? (
                                <div className="absolute inset-0 bg-emerald-400/10 z-0 pointer-events-none" />
                            ) : progress > 0 && (
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="absolute inset-y-0 right-0 bg-yellow-400/30 z-0 pointer-events-none border-l border-yellow-400/40"
                                />
                            )}

                            <div className="flex items-center gap-4 z-10">
                                <div className={`w-12 h-12 ${isPerfect ? 'bg-emerald-50' : 'bg-sky-50'} rounded-lg flex items-center justify-center group-hover:${isPerfect ? 'bg-emerald-100' : 'bg-sky-100'} transition-colors`}>
                                    <div className={`w-2 h-2 rounded-full ${isPerfect ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-sky-500'}`}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-slate-800">{subjectName}</span>
                                    {isPerfect && (
                                        <span className="text-[10px] text-emerald-600 font-bold">مكتمل - علامة كاملة ✨</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:${isPerfect ? 'bg-emerald-500' : 'bg-sky-500'} transition-colors z-10`}>
                                <svg 
                                    className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors transform rotate-180" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                        </motion.div>
                    );
                })}

                {sessionTitle !== 'الدوسيات' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigateTo(View.Progress)}
                        className="bg-white rounded-lg p-4 shadow-lg shadow-green-100 border-r-4 border-green-500 flex items-center justify-center cursor-pointer hover:shadow-xl transition-all group mx-auto w-48 mt-4 border border-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-lg font-black text-green-600">النتيجة</span>
                        </div>
                    </motion.div>
                )}
            </div>


        </div>
    );
};

export default SessionSubjectsPage;
