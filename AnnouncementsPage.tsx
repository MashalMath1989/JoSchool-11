import React from 'react';
import { motion } from 'framer-motion';

interface AnnouncementsPageProps {
    goBack?: () => void;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = () => {
    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 text-right animate-fade-in" dir="rtl">
            {/* Title Section */}
            <div className="text-right mb-6 px-2 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-text-main flex items-center gap-3">
                        <div className="w-2 h-10 bg-primary rounded-full"></div>
                        لوحة الإعلانات والأخبار
                    </h3>
                    <p className="text-text-sub font-bold text-[9px] mt-1">آخر الأخبار والتعميمات الرسمية لطلبة الثاني عشر والحادي عشر</p>
                </div>
            </div>

            {/* Main Announcement Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-900 overflow-hidden mb-6">
                {/* Image Section with referrerPolicy="no-referrer" */}
                <div className="relative border-b border-slate-900 bg-slate-100 max-h-[380px] overflow-hidden flex items-center justify-center">
                    <img 
                        src="https://i.postimg.cc/RCkCc0JY/FB-IMG-1779441485437.jpg" 
                        alt="إعلان أرقام الجلوس لعام 2026" 
                        className="w-full h-auto object-cover max-h-[380px] hover:scale-[1.02] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-900 shadow-md">
                        إعلان رسمي هام
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-5">
                    {/* Header text with nice styling */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-primary tracking-wider uppercase">وزارة التربية والتعليم الأردنية</span>
                        <h4 className="text-lg font-black text-slate-800 leading-tight">
                            بدء الاطلاع على أرقام الجلوس الإلكترونية لطلبة الصف الحادي عشر
                        </h4>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* Main Announcement Body */}
                    <div className="text-slate-700 font-bold text-sm leading-relaxed space-y-4">
                        <p className="font-extrabold text-slate-900 text-base">
                            طلبة الصف الحادي عشر
                            <br />
                            <span className="text-primary text-sm font-black">المسجلين للجزء الأول من امتحان #شهادة_الدراسة_الثانوية_العامة لعام 2026</span>
                        </p>

                        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-2">
                            <p className="text-blue-900 font-black">
                                تكرّموا بالاطلاع على <span className="underline">#أرقام_الجلوس</span>
                            </p>
                            <a 
                                href="https://exams.moe.gov.jo" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-2 text-primary hover:underline font-black bg-white border border-slate-900 px-4 py-2 rounded-lg text-xs mt-1 transition-all active:scale-[0.98] shadow-sm"
                            >
                                🌐 رابط الموقع الإلكتروني: exams.moe.gov.jo
                            </a>
                        </div>

                        {/* Bulleted Info */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                            <p className="font-black text-slate-800 text-xs">
                                ✅ من خلال إدخال الرقم الوطني وتاريخ الميلاد في الموقع الالكتروني المخصص، بإمكان المشترك معرفة:
                            </p>
                            <ul className="space-y-2 text-xs text-slate-600 font-bold pr-1">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">🔹</span>
                                    <span>رقم الجلوس.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">🔹</span>
                                    <span>اسم القاعة التي سيتقدم فيها للامتحان.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">🔹</span>
                                    <span>موقع القاعة الجغرافي.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">🔹</span>
                                    <span>المباحث التي قام بتسجيلها.</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">
                            تكرَّموا لُطفًا بتدقيق البيانات الواردة في بطاقات الجلوس الإلكترونية؛ للتأكد من صحة المباحث المسجلة..
                        </p>

                        {/* Correction Announcement Block */}
                        <div className="bg-amber-50/70 border-r-4 border-amber-500 border border-amber-200 p-4 rounded-xl space-y-2">
                            <p className="text-amber-900 font-black flex items-center gap-2 text-xs">
                                <span className="text-base">🟩</span>
                                وفي حال وجود أي خطأ في البيانات:
                            </p>
                            <p className="text-xs leading-relaxed text-slate-700">
                                يتوجب على المشترك تقديم <span className="font-extrabold text-slate-900">#طلب_تصويب</span> عبر الخانة المخصصة على الصفحة ذاتها، في موعد أقصاه:
                                <br />
                                <span className="inline-block bg-white text-rose-600 font-black border border-slate-900 px-3 py-1 rounded-md text-xs mt-2 shadow-sm">
                                    🗓️ مساء الأحد ( 24 / 5 / 2026 )
                                </span>
                            </p>
                        </div>

                        <p className="text-center font-extrabold text-slate-800 text-sm pt-2">
                            تمنياتنا لكم بالتوفيق ✨
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsPage;
