import React from 'react';
import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { SubjectName, UserProgress, QuizResult } from './types';
import { SESSION_2008_EXAMS, SESSION_2008_SUP_EXAMS } from './data/exams';

// @ts-expect-error - html2pdf.js lacks standard types
import html2pdf from 'html2pdf.js';

interface MoEResultsPageProps {
    userProgress: UserProgress;
    userName: string;
    onBack: () => void;
    sessionTitle: string;
}

const MoEResultsPage: React.FC<MoEResultsPageProps> = ({
    userProgress,
    userName,
    onBack,
    sessionTitle
}) => {
    // Subject configurations for MoE results
    const moeConfigs = [
        { id: SubjectName.IslamicEducation, title: "التربية الإسلامية", max: 60, min: 24 },
        { id: SubjectName.Arabic, title: "اللغة العربية", max: 100, min: 40 },
        { id: SubjectName.English, title: "اللغة الإنجليزية", max: 100, min: 40 },
        { id: SubjectName.JordanHistory, title: "تاريخ الأردن", max: 40, min: 16 },
    ];

    // Helper to get weight for a subject in this session
    const getSubjectWeight = (subjectName: SubjectName) => {
        let baseTitle = "";
        if (sessionTitle === 'دورة 2008') {
            const exam = SESSION_2008_EXAMS.find(e => e.subject === subjectName);
            if (exam) baseTitle = exam.title;
        } else if (sessionTitle === 'دورة 2008 تكميلي') {
            const exam = SESSION_2008_SUP_EXAMS.find(e => e.subject === subjectName);
            if (exam) baseTitle = exam.title;
        } else if (sessionTitle === 'الدورة التجريبية') {
            // For experimental, maybe use a fixed title or some heuristic
            baseTitle = `دورة تجريبية - ${subjectName}`; 
        }

        const isEnglish = subjectName === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const lessonTitle = baseTitle ? `${baseTitle} - ${examLabel}` : "";

        // Find the best quiz result for this specific exam
        const result = userProgress.quizResults
            .filter(r => r.subjectId === subjectName && (baseTitle === "" || r.lessonTitle === lessonTitle))
            .sort((a, b) => (b.score / b.totalQuestions) - (a.score / a.totalQuestions))[0];

        if (!result || result.totalQuestions === 0) return 0;
        return result.score / result.totalQuestions;
    };

    const results = moeConfigs.map(config => {
        const weight = getSubjectWeight(config.id);
        const mark = Math.round(weight * config.max);
        return { ...config, mark };
    });

    const totalSum = results.reduce((sum, r) => sum + r.mark, 0);
    const totalMax = results.reduce((sum, r) => sum + r.max, 0);
    const average = (totalSum / 10).toFixed(1);
    
    const [isPrinting, setIsPrinting] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const reportRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const element = reportRef.current;
        if (!element) return;
        
        setIsPrinting(true);
        setIsExporting(true);
        
        // Brief delay to allow React to update the DOM with printing styles
        setTimeout(() => {
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `JoSchool11_Result_${userName || 'Student'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 3, 
                    useCORS: true,
                    letterRendering: true,
                    scrollY: 0,
                    windowWidth: 1200 // Force a wider capture context for PDF
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().set(opt).from(element).save().then(() => {
                setIsPrinting(false);
                setIsExporting(false);
            });
        }, 150);
    };

    // Generate current day and time
    const [currentTime, setCurrentTime] = React.useState('');
    React.useEffect(() => {
        const now = new Date();
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayName = days[now.getDay()];
        const dateStr = now.toLocaleDateString('ar-JO');
        const timeStr = now.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
        setCurrentTime(`${dayName}، ${dateStr} - الساعة ${timeStr}`);
    }, []);

    // Generate a consistent seat number for the session
    const [seatNumber, setSeatNumber] = React.useState(0);
    React.useEffect(() => {
        setSeatNumber(Math.floor(100000 + Math.random() * 900000));
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#f5f5f5] flex flex-col items-center py-8 px-4 relative"
            dir="rtl"
        >
            {/* Print Button (Floating Top Left) */}
            <button
                onClick={handlePrint}
                className="fixed top-4 left-4 z-50 p-3 bg-white border border-slate-900 rounded-full shadow-lg text-slate-700 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center"
                title="تحميل النتيجة PDF"
            >
                <Printer className="w-6 h-6" />
            </button>

            {/* Header Content */}
            <div 
                ref={reportRef} 
                className={`w-full flex flex-col items-center bg-white shadow-md border border-gray-100 rounded-lg transition-all duration-0 ${isPrinting ? 'max-w-3xl p-8 min-h-[280mm]' : 'max-w-xl p-6 h-auto'}`}
            >
                <div className={`${isPrinting ? 'w-24 h-24 mb-4' : 'w-16 h-16 mb-2'} border border-slate-900 rounded-xl p-1 bg-white shadow-sm overflow-hidden`}>
                    <img 
                        src="https://i.postimg.cc/y8GJVJ52/1777447368581.png" 
                        alt="JoSchool Logo" 
                        className="w-full h-full object-contain"
                    />
                </div>
                <h1 className="text-xl font-bold text-gray-700">المملكة الأردنية الهاشمية</h1>
                <h2 className="text-lg font-bold text-gray-600">منصة JoSchool11</h2>
                
                <div className="w-full h-[6px] bg-[#2d4a22] mt-4 mb-8"></div>

                <div className={`text-center ${isPrinting ? 'mb-6 space-y-2' : 'mb-10 space-y-2'}`}>
                    <h3 className={`${isPrinting ? 'text-3xl' : 'text-2xl'} font-bold text-[#8B0000]`}>نتائج امتحان شهادة الدراسة الثانوية العامة</h3>
                    <h3 className={`${isPrinting ? 'text-3xl' : 'text-2xl'} font-bold text-[#8B0000]`}>لعام 2026</h3>
                    <h4 className={`${isPrinting ? 'text-xl' : 'text-xl'} font-bold text-[#8B0000]`}>الصف الحادي عشر</h4>
                </div>

                {/* Student Info */}
                <div className={`w-full flex flex-col gap-3 text-black ${isPrinting ? 'text-xl mb-6' : 'text-lg mb-10'}`}>
                    <div className="flex gap-2 border-b border-gray-100 pb-1">
                        <span className="font-bold">رقم الجلوس :</span>
                        <span>{seatNumber}</span>
                    </div>
                    <div className="flex gap-2 border-b border-gray-100 pb-1">
                        <span className="font-bold">اسم الطالب :</span>
                        <span>{userName || 'زائر'}</span>
                    </div>
                    <div className={`flex items-center gap-4 mt-2 border-b border-gray-100 ${isPrinting ? 'pb-4' : 'pb-2'}`}>
                        <div className="flex gap-2 whitespace-nowrap">
                            <span className="font-bold">المجموع العام :</span>
                            <span className="font-bold text-sky-600">{totalSum}</span>
                        </div>
                        <div className="flex gap-2 items-center whitespace-nowrap">
                            <span className="font-bold">المعدل :</span>
                            <span className="font-bold text-sky-600 tracking-tighter" dir="ltr">{average} / 30</span>
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className={`w-full bg-white rounded-sm border border-gray-300 shadow-sm overflow-hidden ${isPrinting ? 'mb-4' : 'mb-6'}`}>
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr className={`bg-gray-50 text-gray-700 border-b border-gray-300 ${isPrinting ? 'text-lg' : 'text-sm'}`}>
                                <th className={`${isPrinting ? 'p-4' : 'p-2'} border-l border-gray-300 text-center font-bold w-[45%]`}>المبحث</th>
                                <th className={`${isPrinting ? 'p-4' : 'p-2'} border-l border-gray-300 text-center font-bold`}>العظمى</th>
                                <th className={`${isPrinting ? 'p-4' : 'p-2'} border-l border-gray-300 text-center font-bold`}>الصغرى</th>
                                <th className={`${isPrinting ? 'p-4' : 'p-2'} text-center font-bold`}>العلامة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} className={`border-b border-gray-200 text-gray-800 ${isPrinting ? 'text-xl' : 'text-base'}`}>
                                    <td className={`${isPrinting ? 'p-4' : 'p-2'} border-l border-gray-200 text-right font-medium`}>{r.title}</td>
                                    <td className={`${isPrinting ? 'p-4' : 'p-2'} border-l border-gray-200 text-center`}>{r.max}</td>
                                    <td className={`${isPrinting ? 'p-4' : 'p-2'} border-l border-gray-200 text-center`}>{r.min}</td>
                                    <td className={`${isPrinting ? 'p-4' : 'p-2'} text-center font-bold ${r.mark < r.min ? 'text-red-600' : ''}`}>{r.mark}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Alert */}
                <p className="text-[#8B0000] font-bold text-center px-4 mb-6 leading-relaxed text-sm">
                    * من شروط الالتحاق بالجامعات حصول الطالب على (50) بالمئة على الأقل من النهاية العظمى لكل مبحث
                </p>

                {/* Date and Time Timestamp */}
                <div className={`w-full text-center border-t border-gray-100 ${isPrinting ? 'mt-auto pt-4' : 'mt-4 pt-4'}`}>
                    <p className="text-gray-400 text-[10px] font-medium leading-none">تم إصدار هذه الوثيقة إلكترونياً من منصة JoSchool11</p>
                    <p className={`${isPrinting ? 'text-base' : 'text-xs'} text-gray-500 mt-1 font-bold`}>{currentTime}</p>
                </div>
            </div>

            {/* Back Button */}
            <div className="mt-8 mb-12">
                <button
                    onClick={onBack}
                    className="bg-[#C8922A] hover:bg-[#b07e20] text-white font-bold py-3 px-16 rounded-sm shadow-md transition-colors"
                >
                    رجوع
                </button>
            </div>

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
                                className="absolute inset-0 border-4 border-[#C8922A] rounded-full border-t-transparent"
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
        </motion.div>
    );
};

export default MoEResultsPage;
