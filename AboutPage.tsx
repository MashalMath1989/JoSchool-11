import React from 'react';
import { motion } from 'framer-motion';
import { 
    Info, 
    ArrowRight, 
    BookOpen, 
    Target, 
    Award, 
    ExternalLink, 
    Facebook, 
    Instagram, 
    MessageCircle, 
    ShieldCheck, 
    Sparkles, 
    CheckCircle2 
} from 'lucide-react';
import { LOGO_DATA_URI } from './logoDataUri';
import { DisclaimerSection } from './DisclaimerSection';

interface AboutPageProps {
    onBack?: () => void;
    navigateTo?: (view: any, subject?: any, title?: string) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack, navigateTo }) => {
    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 text-right font-naskh animate-fade-in" dir="rtl">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-8 bg-sky-500 rounded-full"></div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                            حول التطبيق
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                            منصة JoSchool 11 التعليمية المستقلة
                        </p>
                    </div>
                </div>

                {onBack && (
                    <button
                        onClick={onBack}
                        className="px-3.5 py-2 bg-white border border-slate-900 rounded-xl shadow-xs flex items-center gap-1.5 text-xs font-black text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                        title="رجوع"
                        aria-label="رجوع"
                    >
                        <span>رجوع</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* App Identification Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-slate-900 p-5 sm:p-6 shadow-md mb-5 text-center relative overflow-hidden"
            >
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-2xl border-2 border-slate-900 p-2 bg-white shadow-xs flex items-center justify-center">
                    <img 
                        src={LOGO_DATA_URI} 
                        alt="JoSchool 11" 
                        className="w-full h-full object-contain select-none"
                    />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300 text-xs font-black mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>تطبيق تعليمي مستقل — جيل 2010</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">
                    JoSchool 11
                </h3>

                <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-lg mx-auto">
                    تطبيق تعليمي مستقل يهدف إلى مساعدة طلبة الصف الأول الثانوي في الأردن (جيل 2010) على التدرب الذاتي وخوض اختبارات إلكترونية تفاعلية تحاكي أنماط أسئلة الاختيار من متعدد وورقة القارئ الضوئي، لمساعدة الطلبة على قياس مستواهم ومراجعة دروسهم بمرونة وسهولة.
                </p>
            </motion.div>

            {/* قسم إخلاء المسؤولية والمصادر الرسمية - ثابت وبارز */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-5"
            >
                <DisclaimerSection />
            </motion.div>

            {/* App Pillars / Features */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-md mb-5"
            >
                <h4 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-sky-600" />
                    <span>أهداف وخصائص التطبيق</span>
                </h4>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900">اختبارات تفاعلية محوسبة</h5>
                            <p className="text-xs font-bold text-slate-600 mt-0.5 leading-relaxed">
                                تدريب عملي للطلبة على بنوك الأسئلة متعددة الاختيارات في مباحث الرياضيات، اللغة العربية، التربية الإسلامية، وتاريخ الأردن.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900">محاكاة ورقة الماسح الضوئي</h5>
                            <p className="text-xs font-bold text-slate-600 mt-0.5 leading-relaxed">
                                توعية الطالب بكيفية تظليل الإجابات والتعامل مع ورقة الاختبار بدقة وسرعة، مع إدارة الوقت المحدد لكل اختبار.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900">متابعة الأداء والأسئلة المفضلة</h5>
                            <p className="text-xs font-bold text-slate-600 mt-0.5 leading-relaxed">
                                حفظ نتائج الاختبارات ومراجعة الأخطاء وحفظ الأسئلة المهمة للعودة إليها ومراجعتها لاحقاً.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Social & Contact Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-md mb-6"
            >
                <h4 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-sky-600" />
                    <span>تواصل معنا وقنوات المتابعة</span>
                </h4>

                <p className="text-xs font-bold text-slate-600 leading-relaxed mb-4">
                    نسعد دائماً باستقبال ملاحظاتكم واستفساراتكم واقتراحاتكم لتطوير المنصة وتقديم أفضل تجربة دراسية للطلبة:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <a
                        href="https://www.facebook.com/share/1EYUYgHUYi/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-xl font-black text-xs text-[#1877F2] transition-colors"
                    >
                        <Facebook className="w-4 h-4" />
                        <span>صفحة الفيسبوك</span>
                    </a>

                    <a
                        href="https://www.instagram.com/joschool11_2010?stkn=MXBlNDJjaTIwbDlodg=="
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-[#E4405F]/10 hover:bg-[#E4405F]/20 border border-[#E4405F]/30 rounded-xl font-black text-xs text-[#E4405F] transition-colors"
                    >
                        <Instagram className="w-4 h-4" />
                        <span>صفحة الإنستغرام</span>
                    </a>

                    <a
                        href="https://m.me/JoSchool11"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-[#0084FF]/10 hover:bg-[#0084FF]/20 border border-[#0084FF]/30 rounded-xl font-black text-xs text-[#0084FF] transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>راسلنا على ماسنجر</span>
                    </a>
                </div>
            </motion.div>

            {/* Footer / Copyright & Independence Statement */}
            <div className="text-center py-4 border-t border-slate-300 text-xs font-bold text-slate-500 space-y-1">
                <p>جميع حقوق المحتوى التعليمي للمناهج محفوظة لأصحابها وفق المصادر المنشورة.</p>
                <p>JoSchool 11 © منصة تعليمية مستقلة وغير تابعة لأي جهة رسمية • الإصدار 1.2.0</p>
            </div>
        </div>
    );
};

export default AboutPage;
