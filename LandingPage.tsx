import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Semester, Subject, SubjectName } from './types';
import { SparklesIcon } from './data/Icons';
import { User } from 'firebase/auth';

interface LandingPageProps {
    subjectsData: Subject[];
    navigateTo: (view: any, subject?: Subject, title?: string) => void;
    View: any;
    user: User | null;
    handleLogout: () => void;
}

const SubjectGrid = ({ subjects, title, navigateTo, View, showAchievements }: { subjects: Subject[], title: string, navigateTo: any, View: any, showAchievements?: boolean }) => (
    <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-2 text-right">
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-8 bg-yellow-400 rounded-full"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{title}</h2>
            </div>
            {showAchievements && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateTo(View.Progress)}
                    className="w-10 h-10 bg-white border border-slate-900 rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50"
                >
                    <span className="text-xl">📊</span>
                </motion.button>
            )}
        </div>

        <div className="bg-gradient-to-br from-sky-400 to-slate-800 p-3 sm:p-6 rounded-xl shadow-2xl border border-slate-900">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {subjects.map((subject) => {
                    const isAvailable = 
                        subject.id === SubjectName.JordanHistory || 
                        subject.id === SubjectName.IslamicEducation || 
                        subject.id === SubjectName.English ||
                        (subject.semester === Semester.First && subject.id === SubjectName.Arabic);
                    
                    return (
                        <motion.div
                            key={`${subject.id}-${subject.semester}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigateTo(View.SubjectIndex, subject)}
                            className="bg-white rounded-lg p-2 sm:p-3 shadow-lg border border-slate-900 cursor-pointer flex flex-row items-center gap-2 sm:gap-4 transition-all hover:shadow-xl group relative overflow-hidden h-20 sm:h-24"
                        >
                            <div className="w-10 h-14 sm:w-14 sm:h-18 rounded-lg overflow-hidden shadow-sm shrink-0 z-10">
                                <img 
                                    src={subject.coverImage} 
                                    alt={subject.id} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    referrerPolicy="no-referrer" 
                                />
                            </div>
                            <div className="flex-1 text-right z-10 min-w-0">
                                <h3 className={`text-xs sm:text-xl font-black text-slate-800 truncate mb-0.5 sm:mb-1 ${subject.fontClass}`}>{subject.id}</h3>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span className={`text-[7px] sm:text-[10px] font-bold ${isAvailable ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {isAvailable ? 'متاح' : 'قريباً'}
                                    </span>
                                    {isAvailable && (
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({
    subjectsData,
    navigateTo,
    View,
    user,
    handleLogout
}) => {
    const firstSemesterSubjects = subjectsData.filter(s => s.semester === Semester.First);
    const secondSemesterSubjects = subjectsData.filter(s => s.semester === Semester.Second);

    return (
        <div className="container mx-auto p-4 max-w-2xl text-right" dir="rtl">
            {/* Header - Non-sticky */}
            <div className="mb-8 mt-2">
                <div className="relative flex items-center justify-between min-h-[64px]">
                    {/* Logout Button (Right side in RTL) */}
                    {user && (
                        <button 
                            onClick={handleLogout}
                            className="w-10 h-10 bg-white border border-slate-900 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 transition-all active:scale-95 shrink-0 z-10"
                            title="تسجيل الخروج"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}

                    {/* Logo Area (Centered Exactly) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-14 h-14 flex items-center justify-center border border-slate-900 rounded-xl p-1 bg-white shadow-sm"
                        >
                            <img 
                                src="https://i.postimg.cc/y8GJVJ52/1777447368581.png" 
                                alt="App Logo" 
                                className="w-full h-auto object-contain"
                            />
                        </motion.div>
                        <p className="font-bold text-slate-400 text-[9px] mt-1 whitespace-nowrap">المسار الأكاديمي 11 . جيل 2009</p>
                    </div>

                    {/* User Profile (Left side in RTL) */}
                    {user && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-1 z-10">
                            <span className="text-[10px] font-black text-slate-900 leading-[1.1] select-none max-w-[65px] text-right break-words py-0.5">
                                {(() => {
                                    if (!user.displayName) return 'مستخدم';
                                    const firstName = user.displayName.split(' ')[0];
                                    return firstName;
                                })()}
                            </span>
                            <div className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden shadow-sm bg-white shrink-0">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-lg">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <SubjectGrid subjects={firstSemesterSubjects} title="الفصل الأول" navigateTo={navigateTo} View={View} showAchievements={true} />
            <SubjectGrid subjects={secondSemesterSubjects} title="الفصل الثاني" navigateTo={navigateTo} View={View} />

            {/* Additional Sessions Section */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'الدورة التجريبية')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-yellow-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">دورة تجريبية</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'دورة 2008')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-sky-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">دورة 2008</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'الدوسيات')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-yellow-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">الدوسيات</span>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(View.SessionSubjects, undefined, 'دورة 2008 تكميلي')}
                    className="bg-white rounded-lg p-4 shadow-lg border-r-4 border-sky-400 flex items-center justify-center cursor-pointer transition-all hover:shadow-xl h-16 border border-slate-900"
                >
                    <span className="font-black text-slate-800 text-sm">دورة 2008 تكميلي</span>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPage;
