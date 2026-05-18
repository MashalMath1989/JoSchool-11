import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject, Semester, View, SubjectName, UserProgress, QuizResult } from './types';
import { SESSION_2008_EXAMS, SESSION_2008_SUP_EXAMS } from './data/exams';
import { RefreshIcon } from './data/Icons';

interface SessionSubjectsPageProps {
    subjectsData: Subject[];
    navigateTo: (view: View, subject?: Subject) => void;
    onBack: () => void;
    sessionTitle: string;
    handleStartSessionExam: (subjectId: SubjectName, sessionName: string) => void;
    handleResetExamResult: (subjectId: SubjectName, lessonTitle: string) => void;
    handleResetSession: (sessionName: string) => void;
    handleViewSessionResult: (subjectId: SubjectName, sessionName: string, result?: QuizResult) => void;
    userProgress: UserProgress;
}

const SessionSubjectsPage: React.FC<SessionSubjectsPageProps> = ({
    subjectsData,
    navigateTo,
    onBack,
    sessionTitle,
    handleStartSessionExam,
    handleResetExamResult,
    handleResetSession,
    handleViewSessionResult,
    userProgress
}) => {
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [confirmReset, setConfirmReset] = useState<{subjectName: SubjectName, lessonTitle: string} | null>(null);
    const [confirmSessionReset, setConfirmSessionReset] = useState(false);

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

    const getSubjectConfig = (subjectName: SubjectName) => {
        const configs: Record<string, { max: number; min: number }> = {
            [SubjectName.IslamicEducation]: { max: 60, min: 24 },
            [SubjectName.Arabic]: { max: 100, min: 40 },
            [SubjectName.English]: { max: 100, min: 40 },
            [SubjectName.JordanHistory]: { max: 40, min: 16 },
        };
        return configs[subjectName] || { max: 100, min: 50 };
    };

    const getSubjectResult = (subjectName: SubjectName) => {
        let baseTitle = "";
        if (sessionTitle === 'دورة 2008') {
            const exam = SESSION_2008_EXAMS.find(e => e.subject === subjectName);
            if (exam) baseTitle = exam.title;
        } else if (sessionTitle === 'دورة 2008 تكميلي') {
            const exam = SESSION_2008_SUP_EXAMS.find(e => e.subject === subjectName);
            if (exam) baseTitle = exam.title;
        } else if (sessionTitle === 'الدورة التجريبية') {
            baseTitle = `دورة تجريبية - ${subjectName}`;
        }

        const isEnglish = subjectName === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const lessonTitle = baseTitle ? `${baseTitle} - ${examLabel}` : "";
        
        const result = userProgress?.quizResults?.filter((r: QuizResult) => 
            r.subjectId === subjectName && 
            (baseTitle === "" || r.lessonTitle === lessonTitle || r.lessonTitle.includes(baseTitle))
        ).sort((a, b) => (b.score / b.totalQuestions) - (a.score / a.totalQuestions))[0];

        if (!result) return null;
        
        const config = getSubjectConfig(subjectName);
        
        // Helper to get raw score if possible, or handle already scaled scores
        const calculateMark = (res: QuizResult, max: number) => {
            // If score > totalQuestions, it's definitely already scaled
            if (res.score > res.totalQuestions) {
                // If it's already scaled, we trust it but cap it at max
                return Math.min(res.score, max);
            }
            
            // Otherwise assume it's raw and scale it
            const calculated = Math.round((res.score / (res.totalQuestions || 1)) * max);
            // If the calculated mark exceeds max, it was probably already scaled
            return Math.min(calculated, max);
        };

        const mark = calculateMark(result, config.max);
        return { mark, max: config.max, result };
    };

    const areAllExamsFinished = () => {
        return sessionSubjects.every(subjectName => {
            let baseTitle = "";
            if (sessionTitle === 'دورة 2008') {
                const exam = SESSION_2008_EXAMS.find(e => e.subject === subjectName);
                if (exam) baseTitle = exam.title;
            } else if (sessionTitle === 'دورة 2008 تكميلي') {
                const exam = SESSION_2008_SUP_EXAMS.find(e => e.subject === subjectName);
                if (exam) baseTitle = exam.title;
            } else if (sessionTitle === 'الدورة التجريبية') {
                baseTitle = `دورة تجريبية - ${subjectName}`;
            }

            const isEnglish = subjectName === SubjectName.English;
            const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
            const lessonTitle = baseTitle ? `${baseTitle} - ${examLabel}` : "";
            
            return userProgress?.quizResults?.some((r: QuizResult) => 
                r.subjectId === subjectName && 
                (baseTitle === "" || r.lessonTitle === lessonTitle)
            );
        });
    };

    const isFinished = areAllExamsFinished();

    return (
        <div className="container mx-auto p-2 max-w-2xl pt-2 relative" dir="rtl">
            <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-2 h-6 bg-yellow-400 rounded-full shrink-0"></div>
                <h2 className="text-xl font-black text-slate-800 leading-tight flex-1">
                    {sessionTitle === 'الدوسيات' ? 'اختر المادة للإطلاع على الدوسية:' : 'اختر الامتحان لبدء التقديم:'}
                </h2>
                
                {sessionTitle !== 'الدوسيات' && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setConfirmSessionReset(true);
                        }}
                        className="w-12 h-12 bg-white text-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-slate-900 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 shrink-0 group"
                        title="إعادة تصفير الدورة بالكامل"
                    >
                        <RefreshIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                )}

                <button 
                    onClick={onBack}
                    className="p-3 bg-white text-slate-600 rounded-lg font-black shadow-lg flex items-center justify-center border-2 border-slate-900 hover:text-primary transition-all active:scale-95 shrink-0"
                >
                    <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="space-y-1.5 flex flex-col">
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

                    {confirmReset && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-900 max-w-sm w-full"
                                dir="rtl"
                            >
                                <div className="text-4xl mb-4 text-center">🔄</div>
                                <h3 className="text-xl font-black text-slate-800 text-center mb-2">إعادة الامتحان</h3>
                                <p className="text-slate-600 text-center mb-6 font-medium">
                                    هل أنت متأكد من رغبتك في إعادة امتحان <span className="font-bold text-slate-900">{confirmReset.subjectName}</span>؟ 
                                    <br/>
                                    سيتم حذف النتيجة الحالية واعتماد النتيجة الجديدة.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            handleResetExamResult(confirmReset.subjectName, confirmReset.lessonTitle);
                                            handleStartSessionExam(confirmReset.subjectName, sessionTitle);
                                            setConfirmReset(null);
                                        }}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl shadow-lg border-b-4 border-red-700 transition-all active:scale-95"
                                    >
                                        نعم، أعد الامتحان
                                    </button>
                                    <button
                                        onClick={() => setConfirmReset(null)}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-xl transition-all"
                                    >
                                        إلغاء، ابقِ النتيجة الحالية
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {confirmSessionReset && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-900 max-w-sm w-full"
                                dir="rtl"
                            >
                                <div className="text-5xl mb-4 text-center">♻️</div>
                                <h3 className="text-2xl font-black text-slate-800 text-center mb-2">إعادة تصفير الدورة</h3>
                                <p className="text-slate-600 text-center mb-6 font-bold leading-relaxed">
                                    هل أنت متأكد من رغبتك في مسح جميع نتائج الامتحانات في <span className="text-red-600 underline font-black">{sessionTitle}</span> والبدء من جديد؟
                                    <br/>
                                    <span className="text-xs text-slate-400">سيتم مسح التقدم والنتائج الحالية لهذا القسم.</span>
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            handleResetSession(sessionTitle);
                                            setConfirmSessionReset(false);
                                        }}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-[0_4px_0_rgb(153,27,27)] transition-all active:translate-y-1 active:shadow-none mb-1"
                                    >
                                        نعم، ابدأ من جديد
                                    </button>
                                    <button
                                        onClick={() => setConfirmSessionReset(false)}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-xl transition-all"
                                    >
                                        تراجع
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {sessionSubjects.map((subjectName, idx) => {
                    const subject = subjectsData.find(s => s.id === subjectName && s.semester === Semester.First);
                    const { percent: progress, isPerfect } = (sessionTitle === 'دورة 2008' || sessionTitle === 'دورة 2008 تكميلي') 
                        ? getProgress(subjectName as SubjectName) 
                        : { percent: 0, isPerfect: false };
                    
                    const subjectResult = getSubjectResult(subjectName as SubjectName);
                    const isSubjectFinished = !!subjectResult;
                    const isPass = subjectResult && subjectResult.mark >= (subjectResult.max / 2);

                    // Calculate lesson title for reset
                    let baseTitleForReset = "";
                    if (sessionTitle === 'دورة 2008') {
                        const exam = SESSION_2008_EXAMS.find(e => e.subject === subjectName);
                        if (exam) baseTitleForReset = exam.title;
                    } else if (sessionTitle === 'دورة 2008 تكميلي') {
                        const exam = SESSION_2008_SUP_EXAMS.find(e => e.subject === subjectName);
                        if (exam) baseTitleForReset = exam.title;
                    } else if (sessionTitle === 'الدورة التجريبية') {
                        baseTitleForReset = `دورة تجريبية - ${subjectName}`;
                    }
                    const isEnglish = subjectName === SubjectName.English;
                    const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
                    const lessonTitleForReset = baseTitleForReset ? `${baseTitleForReset} - ${examLabel}` : "";
                    
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
                            className={`relative bg-white ${isSubjectFinished ? (isPass ? 'shadow-emerald-100 border-emerald-500' : 'shadow-red-100 border-red-500') : (isPerfect ? 'shadow-emerald-100 border-emerald-500' : 'shadow-sky-100 border-sky-500')} rounded-lg p-4 shadow-lg border-r-8 flex items-center justify-between cursor-pointer hover:shadow-xl transition-all group border border-slate-900 overflow-hidden`}
                        >
                            {/* Progress overlay */}
                            {isPerfect && !isSubjectFinished ? (
                                <div className="absolute inset-0 bg-emerald-400/10 z-0 pointer-events-none" />
                            ) : progress > 0 && !isSubjectFinished && (
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="absolute inset-y-0 right-0 bg-yellow-400/20 z-0 pointer-events-none border-l border-yellow-400/30"
                                />
                            )}
 
                            <div className="flex items-center gap-4 z-10">
                                <div className={`w-12 h-16 ${isSubjectFinished ? (isPass ? 'bg-emerald-100' : 'bg-red-100') : (isPerfect ? 'bg-emerald-50' : 'bg-sky-50')} rounded-md flex items-center justify-center group-hover:${isSubjectFinished ? (isPass ? 'bg-emerald-200' : 'bg-red-200') : (isPerfect ? 'bg-emerald-100' : 'bg-sky-100')} transition-colors overflow-hidden border border-slate-200`}>
                                    {subject?.coverImage ? (
                                        <img src={subject.coverImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-2 h-2 rounded-full ${isSubjectFinished ? (isPass ? 'bg-emerald-600' : 'bg-red-600') : (isPerfect ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-sky-500')}`}></div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-slate-800">{subjectName}</span>
                                    {isSubjectFinished ? (
                                        <span className={`text-[10px] ${isPass ? 'text-emerald-700' : 'text-red-700'} font-bold`}>
                                            {isPass ? 'تم إنهاء الامتحان ✅' : 'لم يتم اجتياز الامتحان ❌'}
                                        </span>
                                    ) : isPerfect && (
                                        <span className="text-[10px] text-emerald-600 font-bold">مكتمل - علامة كاملة ✨</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 z-30">
                                <button 
                                    id={`view-result-${idx}`}
                                    type="button"
                                    onClick={(e) => {
                                        if (isSubjectFinished && subjectResult.result) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleViewSessionResult(subjectName as SubjectName, sessionTitle, subjectResult.result);
                                        }
                                    }}
                                    className={`px-3 py-2 rounded-full ${isSubjectFinished ? (isPass ? 'bg-emerald-200 hover:bg-emerald-300 ring-2 ring-emerald-500/20' : 'bg-red-200 hover:bg-red-300 ring-2 ring-red-500/20') + ' text-black border border-slate-900 shadow-md cursor-pointer' : 'bg-slate-50 text-slate-400'} flex items-center justify-center transition-all font-black scale-100 hover:scale-110 active:scale-90 z-40 relative`}
                                    title={isSubjectFinished ? "عرض نتيجتي ومراجعة الإجابات" : ""}
                                >
                                    {isSubjectFinished ? (
                                        <span className="text-lg tabular-nums pointer-events-none">{subjectResult.max} / {subjectResult.mark}</span>
                                    ) : (
                                        <svg 
                                            className="w-5 h-5 group-hover:text-white transition-colors transform rotate-180 pointer-events-none" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    )}
                                </button>
                                {isSubjectFinished && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setConfirmReset({ subjectName: subjectName as SubjectName, lessonTitle: lessonTitleForReset });
                                        }}
                                        className={`text-[9px] ${isPass ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white px-2 py-1 rounded shadow transition-colors font-bold whitespace-nowrap z-40 relative`}
                                    >
                                        إعادة الامتحان
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {sessionTitle !== 'الدوسيات' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={isFinished ? { scale: 1.05 } : {}}
                        whileTap={isFinished ? { scale: 0.95 } : {}}
                        onClick={() => isFinished && navigateTo(View.MoEResults)}
                        className={`rounded-lg p-3 shadow-lg border border-slate-900 flex items-center justify-center transition-all group mx-auto w-40 mt-2 ${
                            isFinished 
                                ? 'bg-green-50 border-green-500 shadow-green-100 cursor-pointer' 
                                : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isFinished ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className={`text-lg font-black ${isFinished ? 'text-green-600' : 'text-gray-400'}`}>النتيجة</span>
                        </div>
                    </motion.div>
                )}
            </div>


        </div>
    );
};

export default SessionSubjectsPage;
