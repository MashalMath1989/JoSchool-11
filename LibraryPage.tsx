import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Subject, SubjectName, Semester, LessonResource } from './types';
import { ArrowRightIcon, BookOpenIcon } from './data/Icons';
import { ResourceViewerModal } from './ResourceViewerModal';
import { 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    Download, 
    ExternalLink, 
    HelpCircle, 
    Sparkles, 
    BookMarked,
    CheckCircle2
} from 'lucide-react';

interface LibraryPageProps {
    subjectsData: Subject[];
    navigateTo: (view: View, subject?: any, title?: string) => void;
    onBack: () => void;
}

// Library categories requested by user
enum LibraryCategory {
    Dossiers = "دوسيات",
    Summaries = "ملخصات",
    Exams = "امتحانات",
    Cards = "بطاقات",
}

interface LibraryItem {
    title: string;
    description: string;
    url: string;
    pages?: string;
    size?: string;
}

interface Flashcard {
    question: string;
    answer: string;
}

const libraryMetadata: Record<
    SubjectName,
    Record<
        Semester,
        {
            [LibraryCategory.Dossiers]: LibraryItem[];
            [LibraryCategory.Summaries]: LibraryItem[];
            [LibraryCategory.Exams]: LibraryItem[];
            [LibraryCategory.Cards]: Flashcard[];
        }
    >
> = {
    [SubjectName.JordanHistory]: {
        [Semester.First]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "دوسية الفرائد الذهبية في تاريخ الأردن",
                    description: "شرح شامل ومبسط لكافة دروس الفصل الأول مقسمة حسب الفصول مع جداول مقارنة ذكية.",
                    url: "https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk",
                    pages: "١٢٠ صفحة",
                    size: "١٢.٥ ميجابايت"
                },
                {
                    title: "حقيبة الخرائط الذهنية - تاريخ أركان الأردن",
                    description: "رسومات ومخططات شجرية تلخص التواريخ والمعارك والشخصيات لتسهيل الاستدعاء البصري.",
                    url: "https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk",
                    pages: "٢٨ صفحة",
                    size: "٤.١ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "ملخص ليلة الامتحان الشامل (سؤال وجواب)",
                    description: "أكثر من ٤٥٠ سؤال وجواب تغطي أدق تفاصيل الوحدات لضمان العلامة الكاملة.",
                    url: "https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk",
                    pages: "١٨ صفحة",
                    size: "٢.٨ ميجابايت"
                },
                {
                    title: "ورقة المفاهيم والمصطلحات التاريخية الكبرى",
                    description: "جميع التعريفات والمصطلحات المعتمدة وزارياً والمذكورة بهوامش الكتاب المدرسي.",
                    url: "https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk",
                    pages: "٨ صفحات",
                    size: "١.٥ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "الامتحان الوزاري الرسمي لعام ٢٠٢٤ (الدورة العادية)",
                    description: "كراسة الامتحان الوزاري الحقيقية مع نماذج الإجابة المعتمدة من مركز التصحيح الوطني.",
                    url: "https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk",
                    pages: "١٢ صفحة",
                    size: "٣.٢ ميجابايت"
                },
                {
                    title: "اختبار مقترح نهائي (تاريخ الأردن ١) محاكي للوزارة",
                    description: "صمم من قبل خبراء المناهج لتقديم قياس حقيقي لمستوى الطالب مع تفسير الحلول.",
                    url: "https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk",
                    pages: "١٠ صفحات",
                    size: "٢.٥ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "في أي عام تم تأسيس إمارة شرق الأردن؟", answer: "عـام ١٩٢١م عقب وصول الأمير عبد الله الأول إلى معان." },
                { question: "من الأمير الذي ترأس وفد الأردن لمفاوضات المعاهدة واستقلال البلاد؟", answer: "الأمير عبد الله الأول بن الحسين الباني." },
                { question: "ما هي عاصمة مملكة الأنباط الشهيرة المنحوتة بالكامل في الصخر؟", answer: "البـتراء (المدينة الوردية)." },
                { question: "في أي عصر حضاري بدأ عصر المعادن والسبائك الأولى في الأردن؟", answer: "في العصر النحاسي القديم." }
            ]
        },
        [Semester.Second]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "دوسية المآثر العلية في تاريخ الأردن ٢",
                    description: "نصوص مبسطة وتلخيص دقيق لوحدات الفصل الثاني (الحياة الاقتصادية والسياسية والتعليم).",
                    url: "https://drive.google.com/file/d/1aIJZ_nI_rqg9DdFEqqe1wvd45EUVH3MW/preview",
                    pages: "١١٢ صفحة",
                    size: "١١.٦ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "ملخص القوات المسلحة الأردنية والأجهزة الأمنية",
                    description: "جدول زمني مبسط لتطور أركان الجيش العربي والعمليات الحربية الكبرى والأوسمة.",
                    url: "https://drive.google.com/file/d/1aIJZ_nI_rqg9DdFEqqe1wvd45EUVH3MW/preview",
                    pages: "١٤ صفحة",
                    size: "٢.١ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "الامتحان الوزاري لعام ٢٠٢٤ (الدورة التكميلية)",
                    description: "الأسئلة الرسمية وحصيلة الإجابات المعتمدة ومطابقة الدرجات للفرع الأكاديمي.",
                    url: "https://drive.google.com/file/d/1aIJZ_nI_rqg9DdFEqqe1wvd45EUVH3MW/preview",
                    pages: "٨ صفحات",
                    size: "٢.٧ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "متى استقلت الأردن بالكامل وأُعلنت مملكة دستورية؟", answer: "في ٢٥ أيار لعام ١٩٤٦م." },
                { question: "من ملك الأردن الذي وضع دستور ١٩٥٢م العصري؟", answer: "الملك طلال بن عبد الله رحمه الله." },
                { question: "في أي تاريخ تم تعريب قيادة الجيش العربي الأردني؟", answer: "الأول من آذار لعام ١٩٥٦م بقرار تاريخي من الملك الحسين." },
                { question: "ما الاسم التاريخي الذي يطلق على معركة عام ١٩٦٨ البطولية؟", answer: "معركة الكرامة الخالدة التي ردت كرامة الأمة العربية." }
            ]
        }
    },
    [SubjectName.IslamicEducation]: {
        [Semester.First]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "دوسية السبيل الهادي في التربية الإسلامية",
                    description: "تفكيك وشرح الأحاديث والآيات الكريمة المقررة والمفاهيم الفقهية المعقدة بشكل وافي.",
                    url: "https://drive.google.com/file/d/1Fv17znBl9OEKStLMgBvNdECtouiivOiB/view?usp=drivesdk",
                    pages: "١٤٥ صفحة",
                    size: "١٤.٢ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "مكثف أحكام الزواج والخطبة في الشريعة",
                    description: "مخططات فقهية تيسر فهم الشروط والموانع وحق المهر والنفقة للزوجين.",
                    url: "https://drive.google.com/file/d/1Fv17znBl9OEKStLMgBvNdECtouiivOiB/view?usp=drivesdk",
                    pages: "١٢ صفحة",
                    size: "٢.٢ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "الاختبار الشامل لنصف العام - تربية إسلامية",
                    description: "نظام امتحانات تجريبية لقياس الحفظ والفهم لأول وحدتين مع الإجابات النموذجية.",
                    url: "https://drive.google.com/file/d/1Fv17znBl9OEKStLMgBvNdECtouiivOiB/view?usp=drivesdk",
                    pages: "١٦ صفحة",
                    size: "٣.١ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "ما تعريف الرُّخْصَة الشرعية؟", answer: "حكم شرعي ثبت على خلاف دليل شرعي مانع، لعذر طارئ للتخفيف والتيسير." },
                { question: "ما حكم الجهاد في سبيل الله لرد العدوان والصائل عن البلد؟", answer: "فرض عين على كل فرد مسلم مستطيع بالمال أو النفس." },
                { question: "ما هما سجدتا السهو وما حكمهما؟", answer: "سجدتان يسجدهما المصلي لجبر خلل طرأ في صلاته من زيادة أو نقصان أو شك." }
            ]
        },
        [Semester.Second]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "بينات الهداية شرح المنهاج الإسلامي الثاني",
                    description: "المرشد الكامل للوحدات المتقدمة بما تشمله من شأن الإرث وعقد المقاصد الشرعية الكبرى.",
                    url: "https://drive.google.com/file/d/1pFrCSZnSY0iFinv4NKZTiIDg2NMyxNaw/view?usp=drivesdk",
                    pages: "١٣٨ صفحة",
                    size: "١٣.٠ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "شجيرة فقه المواريث والوصايا المعقدة",
                    description: "جدول الأنصبة والوارثات والوارثين وموانع الإرث وحساب مسألة العول لتسهيل الرياضيات الفقهية.",
                    url: "https://drive.google.com/file/d/1pFrCSZnSY0iFinv4NKZTiIDg2NMyxNaw/view?usp=drivesdk",
                    pages: "١٨ صفحة",
                    size: "٢.٩ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "امتحان نهاية العام الوزاري المعتمد - مجمع التربية",
                    description: "اختبار الوزارة الرسمي متضمناً الأسئلة الموضوعية والمقالية مدموجة في صياغة حديثة.",
                    url: "https://drive.google.com/file/d/1pFrCSZnSY0iFinv4NKZTiIDg2NMyxNaw/view?usp=drivesdk",
                    pages: "١٢ صفحة",
                    size: "٣.٣ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "ما المقصود بـ (مقاصد الشريعة الإسلامية)؟", answer: "الغايات والحكم والمنافع التي وضعت الشريعة لأجل تحقيقها للعباد والبلاد." },
                { question: "ما هو حد الوصية المسموح به للميت شرعاً؟", answer: "لا تزيد عن ثلث التركة (للحديث: الثلث والثلث كثير) وتكون لغير وارث." },
                { question: "ما هو العِدّة شرعاً وحكمتها؟", answer: "مدة زمنية تتربص فيها المرأة لمعرفة براءة رحمها أو تعبداً لله وتفجعاً للزوج." }
            ]
        }
    },
    [SubjectName.Arabic]: {
        [Semester.First]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "حقيبة الوافي والمنهاج في قواعد المهارات",
                    description: "شرح معمق للقواعد النحوية والصرفية ومصادر الأفعال الثلاثية وغير الثلاثية بكليتها.",
                    url: "https://drive.google.com/file/d/1O7zMWn_hGQ-HnsLUZIZm-g68jDDEULCo/view?usp=drivesdk",
                    pages: "٩٨ صفحة",
                    size: "٩.٥ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "خلاصة علم العروض وتقطيع البحور الشعرية",
                    description: "طريقة ذكية في فك رموز تفاعيل بحر الوافر، الطويل والبسيط بثوانٍ معدودة.",
                    url: "https://drive.google.com/file/d/1O7zMWn_hGQ-HnsLUZIZm-g68jDDEULCo/view?usp=drivesdk",
                    pages: "١٠ صفحات",
                    size: "١.٨ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "الامتحان الوزاري المقارن للغة العربية المشتركة",
                    description: "الأسئلة من عام ٢٠٢١ لغاية ٢٠٢٤ مفرزة لسهولة التمرين والقياس حسب الوحدات.",
                    url: "https://drive.google.com/file/d/1O7zMWn_hGQ-HnsLUZIZm-g68jDDEULCo/view?usp=drivesdk",
                    pages: "٢٤ صفحة",
                    size: "٤.٧ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "ما هي تفاعيل بحر الوافر الرئيسي؟", answer: "تفاعيله الكلاسيكية هي: مُفَاعَلَتُنْ مُفَاعَلَتُنْ فَعُولُنْ." },
                { question: "كيف يُصاغ اسم الفاعل من فعل غير ثلاثي؟", answer: "بإتيان مضارعه ثم إبدال حرف المضارعة ميماً مضمومة وكسر ما قبل الآخر." },
                { question: "ما هو حكم المنادى المضاف الإعرابي؟", answer: "منادى منصوب وعلامة نصبه الفتحة الظاهرة." }
            ]
        },
        [Semester.Second]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "دوسية المآثر والبيان في المهارات ٢",
                    description: "تلخيص شامل وشروحات إعرابية دقيقة لجميع نصوص وقواعد الفصل الثاني التوجيهي.",
                    url: "https://drive.google.com/file/d/1nv6jN5R14is3YuYLCUGWk8alegG10tTE/view?usp=drivesdk",
                    pages: "١٠٥ صفحات",
                    size: "١٠.٢ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "المرشد البلاغي في التذوق الجمالي والمصطلحات",
                    description: "ورقة عمل سريعة لمراجعة الأساليب البلاغية والإنشائية، الصور الفنية والتعابير الإبداعية.",
                    url: "https://drive.google.com/file/d/1nv6jN5R14is3YuYLCUGWk8alegG10tTE/view?usp=drivesdk",
                    pages: "١٥ صفحة",
                    size: "٢.٤ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "اختبار المستوى الموحد للغة العربية المشتركة ٢",
                    description: "تحليل تجريبي لفرع المهارات مع مفاتيح الشرح الوافي للوزارة.",
                    url: "https://drive.google.com/file/d/1nv6jN5R14is3YuYLCUGWk8alegG10tTE/view?usp=drivesdk",
                    pages: "١٤ صفحة",
                    size: "٣.٠ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "ما هو الإعلال بالحذف في اللغة؟", answer: "حذف حرف علة من الكلمة تخفيفاً في اللفظ أو تخلصاً من التقاء الساكنين." },
                { question: "كيف نستدل على وزن الصفة المشبهة القياسي؟", answer: "يكون من الفعل اللازم على أوزان مشهورة منها: فَعْلَان، فَعِيل، فَعَل." },
                { question: "ما الفرق الأساسي بين كم الخبرية والاستفهامية؟", answer: "الاستفهامية تسأل عن كمية وتمييزها مفرد منصوب، والخبرية تدل على الكثرة وتمييزها مجرور." }
            ]
        }
    },
    [SubjectName.Math]: {
        [Semester.First]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "دوسية الماهر في الرياضيات - الفصل الأول",
                    description: "شرح وافي لكافة قواعد النهايات، التفاضل وتطبيقاته مع حلول التمارين الكتابية والأسئلة الوزارية.",
                    url: "https://drive.google.com/file/d/1ZHbhPBZH49_W_HxffR4kV4fBzToMODkU/view?usp=drivesdk",
                    pages: "١٥٠ صفحة",
                    size: "١٤.٥ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "ملخص القوانين والاشتقاقات السريعة",
                    description: "ورقة مفاهيم مركزة تحتوي على جميع قوانين النهايات، قواعد الاشتقاق، والمتطابقات المثلثية الهامة.",
                    url: "https://drive.google.com/file/d/1ZHbhPBZH49_W_HxffR4kV4fBzToMODkU/view?usp=drivesdk",
                    pages: "٨ صفحات",
                    size: "١.٨ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "امتحان مقترح شامل - الوحدة الأولى والثانية",
                    description: "أسئلة نموذجية تحاكي النمط الوزاري الجديد لقياس مهارات التفكير العليا للطلاب.",
                    url: "https://drive.google.com/file/d/1ZHbhPBZH49_W_HxffR4kV4fBzToMODkU/view?usp=drivesdk",
                    pages: "١٢ صفحة",
                    size: "٢.٥ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "ما هي نهاية (جا س / س) عندما تقترب س من الصفر؟", answer: "النهاية تساوي ١ (واحدة من النهايات الخاصة الهامة في حساب المثلثات)." },
                { question: "ما هي مشتقة جتا(س) بالنسبة لـ س؟", answer: "مشتقة جتا(س) هي -جا(س)." },
                { question: "ما هي قيمة المتطابقة (جا² س + جتا² س)؟", answer: "تساوي دائماً ١ لأي زاوية س." }
            ]
        },
        [Semester.Second]: {
            [LibraryCategory.Dossiers]: [
                {
                    title: "حقيبة التميز في الرياضيات - الفصل الثاني",
                    description: "ملف متكامل يغطي التكامل غير المحدود وتطبيقاته، القطوع المخروطية، والإحصاء والاحتمالات.",
                    url: "https://drive.google.com/file/d/16pYv1Rl04Lj-kjdQDP7HG9e5lwjiS6ko/view?usp=drivesdk",
                    pages: "١٦٥ صفحة",
                    size: "١٥.٢ ميجابايت"
                }
            ],
            [LibraryCategory.Summaries]: [
                {
                    title: "جدول التكاملات القياسية وتطبيقات المساحة",
                    description: "شروحات ورسومات توضيحية لتبسيط حساب المساحة تحت المنحنى وحجوم الأجسام الدورانية.",
                    url: "https://drive.google.com/file/d/16pYv1Rl04Lj-kjdQDP7HG9e5lwjiS6ko/view?usp=drivesdk",
                    pages: "١٠ صفحات",
                    size: "٢.٠ ميجابايت"
                }
            ],
            [LibraryCategory.Exams]: [
                {
                    title: "امتحان تجريبي نهائي وزاري - الفصل الثاني",
                    description: "أسئلة مقترحة شاملة للقطع المخروطية والتكامل لتأهيل الطالب للامتحان الوزاري الحقيقي.",
                    url: "https://drive.google.com/file/d/16pYv1Rl04Lj-kjdQDP7HG9e5lwjiS6ko/view?usp=drivesdk",
                    pages: "١٤ صفحة",
                    size: "٣.٢ ميجابايت"
                }
            ],
            [LibraryCategory.Cards]: [
                { question: "ما هو تكامل قا²(س) د س؟", answer: "تكامل قا²(س) د س هو ظا(س) + جـ (حيث جـ هو ثابت التكامل)." },
                { question: "ما هو الاختلاف المركزي للقطع المكافئ؟", answer: "الافتلاف المركزي للقطع المكافئ يساوي دائماً ١." },
                { question: "ما هي الصورة القياسية لمعادلة الدائرة التي مركزها نقطة الأصل ونصف قطرها نق؟", answer: "س² + ص² = نق²." }
            ]
        }
    }
};

const LibraryPage: React.FC<LibraryPageProps> = ({ subjectsData, navigateTo, onBack }) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectName | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<Semester | 'both' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | null>(null);

    // Flashcard deck state
    const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    // Explicit state setters to avoid calling setState synchronously inside an effect
    const handleSetSubject = (id: SubjectName) => {
        setSelectedSubjectId(id);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const handleSetSemester = (sem: Semester | 'both') => {
        setSelectedSemester(sem);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const handleSetCategory = (cat: LibraryCategory) => {
        setSelectedCategory(cat);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    // List of available subject names
    const subjectsList = [
        SubjectName.JordanHistory,
        SubjectName.IslamicEducation,
        SubjectName.Arabic,
        SubjectName.Math,
    ];

    // Semesters
    const semestersList: (Semester | 'both')[] = [
        Semester.First,
        Semester.Second,
        'both',
    ];

    // Categories
    const categoriesList = [
        LibraryCategory.Dossiers,
        LibraryCategory.Summaries,
        LibraryCategory.Exams,
        LibraryCategory.Cards,
    ];

    // Find the currently selected subject configuration for cover image and primary books
    const activeSubjectBook = selectedSubjectId && selectedSemester && selectedSemester !== 'both'
        ? subjectsData.find(s => s.id === selectedSubjectId && s.semester === selectedSemester)
        : null;

    // Get specific library items dynamically based on choices
    const currentCategoryItems = selectedSubjectId && selectedSemester && selectedCategory && selectedCategory !== LibraryCategory.Cards
        ? (selectedSemester === 'both'
            ? [
                ...(libraryMetadata[selectedSubjectId]?.[Semester.First]?.[selectedCategory] || []),
                ...(libraryMetadata[selectedSubjectId]?.[Semester.Second]?.[selectedCategory] || [])
              ]
            : libraryMetadata[selectedSubjectId]?.[selectedSemester]?.[selectedCategory] || []
          )
        : [];

    // Get specific flashcards
    const currentFlashcards = selectedSubjectId && selectedSemester && selectedCategory === LibraryCategory.Cards
        ? (selectedSemester === 'both'
            ? [
                ...(libraryMetadata[selectedSubjectId]?.[Semester.First]?.[LibraryCategory.Cards] || []),
                ...(libraryMetadata[selectedSubjectId]?.[Semester.Second]?.[LibraryCategory.Cards] || [])
              ]
            : libraryMetadata[selectedSubjectId]?.[selectedSemester]?.[LibraryCategory.Cards] || []
          )
        : [];

    const [activeResourceModal, setActiveResourceModal] = useState<{ resource: LessonResource; title: string } | null>(null);

    const handleOpenBook = (url: string, title?: string) => {
        if (!url) return;
        if (url.includes('wa.me') || url.includes('whatsapp.com')) {
            window.open(url, '_blank');
            return;
        }
        setActiveResourceModal({
            resource: {
                type: 'pdf',
                url: url,
                resourceTitle: title || 'ملف PDF المعتمد'
            },
            title: title || 'المكتبة الدراسية'
        });
    };

    return (
        <div id="library-page" className="container mx-auto p-4 max-w-2xl pt-2 text-right animate-fade-in" dir="rtl">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-3">
                        <div className="w-2.5 h-10 bg-yellow-400 rounded-full"></div>
                        المكتبة الدراسية
                    </h3>
                    <p className="text-slate-500 font-extrabold text-[10px] mt-1">تصفح الكتب والمنشورات، الدوسيات، والامتحانات، والبطاقات التفاعلية</p>
                </div>
                <button 
                    onClick={onBack}
                    className="w-11 h-11 sm:w-14 sm:h-14 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center group"
                    title="رجوع"
                >
                    <ArrowRightIcon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" strokeWidth={3} />
                </button>
            </div>

            {/* Selection Steps */}
            <div className="space-y-5">
                {/* 1. Choose Subject */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        ١. اختر المادة الدراسية:
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                        {subjectsList.map((id) => {
                            const isSelected = selectedSubjectId === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleSetSubject(id)}
                                    className={`p-3 rounded-xl border-2 font-black text-xs sm:text-sm text-center transition-all ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-none'
                                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 shadow-sm'
                                    }`}
                                >
                                    {id}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Choose Semester */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        ٢. اختر الفصل الدراسي:
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {semestersList.map((sem) => {
                            const isSelected = selectedSemester === sem;
                            return (
                                <button
                                    key={sem}
                                    onClick={() => handleSetSemester(sem)}
                                    className={`p-2 sm:p-3 rounded-xl border-2 font-black text-xs sm:text-sm text-center transition-all ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-none'
                                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 shadow-sm'
                                    }`}
                                >
                                    {sem === 'both' ? 'الفصلين معاً' : sem}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Choose Category */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        ٣. اختر التصنيف المطلوب:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {categoriesList.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleSetCategory(cat)}
                                    className={`p-3 rounded-xl border-2 font-black text-xs sm:text-sm text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-none'
                                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 shadow-sm'
                                    }`}
                                >
                                    <span className="text-base sm:text-lg">
                                        {cat === LibraryCategory.Dossiers ? '📚' :
                                         cat === LibraryCategory.Summaries ? '📝' :
                                         cat === LibraryCategory.Exams ? '📋' :
                                         '🎴'}
                                    </span>
                                    <span>{cat}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Result Block */}
                <AnimatePresence mode="wait">
                    {selectedSubjectId && selectedSemester && selectedCategory && (
                        <motion.div
                            key={`${selectedSubjectId}-${selectedSemester}-${selectedCategory}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Standard materials view (Dossier, Summaries, Exams) */}
                            {selectedCategory !== LibraryCategory.Cards ? (
                                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-3">
                                        <div>
                                            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                محتوى قسم ({selectedCategory}) المتوفر
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedSubjectId} - {selectedSemester === 'both' ? 'الفصلين معاً' : selectedSemester}</p>
                                        </div>
                                        <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-black uppercase">
                                            {selectedCategory}
                                        </span>
                                    </div>

                                    {currentCategoryItems.length > 0 ? (
                                        <div className="space-y-3">
                                            {currentCategoryItems.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm hover:border-slate-800 transition-all text-right"
                                                >
                                                    <div className="space-y-1">
                                                        <h5 className="font-black text-slate-900 text-xs sm:text-sm">{item.title}</h5>
                                                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{item.description}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {item.pages && (
                                                                <span className="text-[10px] bg-sky-50 text-sky-700 font-extrabold px-2 py-0.5 rounded-md border border-sky-100">
                                                                    📄 {item.pages}
                                                                </span>
                                                            )}
                                                            {item.size && (
                                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md border border-emerald-100">
                                                                    💾 {item.size}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenBook(item.url, item.title)}
                                                        className="sm:shrink-0 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        عرض المادة (PDF)
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                                            <p className="text-amber-600 font-black text-xs sm:text-sm">عذراً، لم يتوفر ملفات رسمية لهذا التصنيف حالياً. جاري رفع المحتوى قريباً!</p>
                                            <p className="text-[10px] text-slate-400 mt-1">يتم تحديث المكتبة دورياً من خلال المنسقين الأكاديميين لدفعة التوجيهي.</p>
                                        </div>
                                    )}

                                    {/* Default school Ministry Textbook reference as bonus */}
                                    {activeSubjectBook?.textbookUrl && (
                                        <div className="pt-3 border-t border-slate-200 mt-4">
                                            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                                                        <BookMarked className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-right">
                                                        <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">الكتاب الرسمي المعتمد من وزارة التربية</h5>
                                                        <p className="text-[10px] text-slate-500 font-bold">يمكنك دائماً الرجوع للكتاب المدرسي الأصلي لمطابقة المادة.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenBook(activeSubjectBook.textbookUrl!, 'الكتاب المدرسي المعتمد - وزارة التربية والتعليم')}
                                                    className="w-full sm:w-auto py-2 px-3 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-black text-[11px] flex items-center justify-center gap-1 border border-amber-400 transition-all"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    عرض كتاب الوزارة
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Interactive Flashcards view (🎴 بطاقات) */
                                <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border-2 border-emerald-950/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                                    <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                                        <div>
                                            <h4 className="font-black text-emerald-950 text-sm sm:text-base flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                                                البطاقات التعليمية الذكية (Flash Cards)
                                            </h4>
                                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">اختبر حفظك واسترجع معلوماتك بأفضل طريقة بصرية</p>
                                        </div>
                                        <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-full font-black">
                                            تفاعلي
                                        </span>
                                    </div>

                                    {currentFlashcards.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Tactile Flip Card */}
                                            <div className="relative w-full h-48 sm:h-56 perspe mt-2">
                                                <motion.div 
                                                    onClick={() => setIsFlipped(!isFlipped)}
                                                    className="w-full h-full cursor-pointer relative select-none rounded-2xl"
                                                    style={{ transformStyle: "preserve-3d" }}
                                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    {/* Front Side: Question */}
                                                    <div 
                                                        className="absolute inset-0 w-full h-full bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col justify-between items-center text-center backface-hidden"
                                                        style={{ backfaceVisibility: "hidden" }}
                                                    >
                                                        <span className="text-[10px] bg-slate-100 text-slate-800 font-black px-2.5 py-1 rounded-full border border-slate-200">
                                                            السـؤال
                                                        </span>
                                                        <h5 className="font-black text-slate-900 text-sm sm:text-base md:text-lg max-w-md leading-relaxed">
                                                            {currentFlashcards[currentCardIndex]?.question}
                                                        </h5>
                                                        <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold flex items-center gap-1 select-none">
                                                            <span>👆 اضغط على البطاقة لقلبها لرؤية الإجابة</span>
                                                        </p>
                                                    </div>

                                                    {/* Back Side: Answer */}
                                                    <div 
                                                        className="absolute inset-0 w-full h-full bg-emerald-500 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col justify-between items-center text-center backface-hidden"
                                                        style={{ 
                                                            backfaceVisibility: "hidden",
                                                            transform: "rotateY(180deg)"
                                                        }}
                                                    >
                                                        <span className="text-[10px] bg-white text-emerald-900 font-black px-2.5 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            الإجابة المعتمدة
                                                        </span>
                                                        <p className="font-bold text-white text-xs sm:text-sm md:text-base max-w-md leading-relaxed">
                                                            {currentFlashcards[currentCardIndex]?.answer}
                                                        </p>
                                                        <p className="text-[9px] sm:text-[10px] text-emerald-100 font-bold select-none">
                                                            اضغط مجدداً للعودة للسؤال
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Flashcard Deck Controls */}
                                            <div className="flex items-center justify-between gap-4 mt-4 px-2">
                                                <button
                                                    onClick={() => {
                                                        const targetIndex = currentCardIndex === 0 ? currentFlashcards.length - 1 : currentCardIndex - 1;
                                                        setIsFlipped(false);
                                                        setTimeout(() => setCurrentCardIndex(targetIndex), 100);
                                                    }}
                                                    className="w-10 h-10 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                                    title="البطاقة السابقة"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-slate-800" />
                                                </button>

                                                <span className="text-xs font-black text-slate-700">
                                                    البطاقة {currentCardIndex + 1} من {currentFlashcards.length}
                                                </span>

                                                <button
                                                    onClick={() => {
                                                        const targetIndex = currentCardIndex === currentFlashcards.length - 1 ? 0 : currentCardIndex + 1;
                                                        setIsFlipped(false);
                                                        setTimeout(() => setCurrentCardIndex(targetIndex), 100);
                                                    }}
                                                    className="w-10 h-10 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                                    title="البطاقة التالية"
                                                >
                                                    <ChevronLeft className="w-5 h-5 text-slate-800" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                                            <p className="text-amber-600 font-black text-xs sm:text-sm">لا يتوفر بطاقات دراسية مخصصة حالياً للفصل المختار.</p>
                                        </div>
                                    )}

                                    {/* Informative Platform Card section */}
                                    <div className="pt-3 border-t border-emerald-250 mt-4">
                                        <div className="bg-white rounded-xl p-3.5 border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">💳</span>
                                                <div className="text-right">
                                                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">بطاقات شحن الاشتراكات التعليمية والمنصات</h5>
                                                    <p className="text-[10px] text-slate-500 font-bold">تريد تفعيل كود منصة الدراسة الخاصة بك؟ تواصل معنا مباشرة.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleOpenBook("https://wa.me/962770000000")}
                                                className="w-full sm:w-auto py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[11px] flex items-center justify-center gap-1 transition-all"
                                            >
                                                طلب بطاقة مكثف
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Resource Viewer Modal for Library PDF items */}
            {activeResourceModal && (
                <ResourceViewerModal
                    resource={activeResourceModal.resource}
                    lessonTitle={activeResourceModal.title}
                    onClose={() => setActiveResourceModal(null)}
                />
            )}
        </div>
    );
};

export default LibraryPage;
