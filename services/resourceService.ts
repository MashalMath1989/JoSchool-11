import { LessonResource, Unit, SubjectName } from '../types';

export interface ResourceJsonLesson {
    lessonId: string;
    lessonTitle: string;
    resources: LessonResource[];
}

export interface MathBasicsItem {
    videoId: string;
    videoTitle: string;
    type: string;
    url: string;
    youtubeTitle?: string;
}

export interface ResourceJsonUnit {
    unitId: string;
    unitTitle: string;
    resources?: LessonResource[];
    lessons: ResourceJsonLesson[];
}

export const INITIAL_JORDAN_HISTORY_RESOURCES: ResourceJsonUnit[] = [
    {
        unitId: "unit1",
        unitTitle: "الأردن في العصور القديمة",
        lessons: [
            {
                lessonId: "L1",
                lessonTitle: "الأردن في العصور الحجرية",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "الأردن في العصر الحديدي",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L3",
                lessonTitle: "مملكة الأنباط",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L4",
                lessonTitle: "مظاهر الحضارتين اليونانية والرومانية–البيزنطية في الأردن",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            }
        ]
    },
    {
        unitId: "unit2",
        unitTitle: "الأردن في العصور الإسلامية",
        lessons: [
            {
                lessonId: "L1",
                lessonTitle: "الأردن في صدر الإسلام",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "الأردن في العصرين الأموي والعباسي",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L3",
                lessonTitle: "الأردن خلال حملات الفرنجة",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L4",
                lessonTitle: "الأردن في العصر الأيوبي",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L5",
                lessonTitle: "الأردن في العصر المملوكي",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            }
        ]
    },
    {
        unitId: "unit3",
        unitTitle: "الأردن في العصر الحديث",
        lessons: [
            {
                lessonId: "L1",
                lessonTitle: "الأوضاع السياسية والإدارية في الأردن في العهد العثماني",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "الأوضاع الاجتماعية والاقتصادية في الأردن في العهد العثماني",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L3",
                lessonTitle: "الثورة العربية الكبرى (النهضة العربية)",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L4",
                lessonTitle: "الأردن في عهد المملكة العربية السورية والحكومات المحلية",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            }
        ]
    }
];

export const INITIAL_MATH_RESOURCES: ResourceJsonUnit[] = [
    {
        unitId: "unit1",
        unitTitle: "الاقترانات والمقادير الجبرية",
        resources: [
            { resourceTitle: "", type: "video", url: "" },
            { resourceTitle: "دوسية الوحدة", type: "pdf", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_Unit1_Dosya.pdf" },
            { resourceTitle: "دفتر الوحدة", type: "pdf", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_Unit1_StudentBook.pdf" },
            { resourceTitle: "", type: "image", url: "" }
        ],
        lessons: [
            {
                lessonId: "L1",
                lessonTitle: "الاقترانات المتشعبة",
                resources: [
                    { resourceTitle: "شرح الدرس ج1", type: "video", url: "https://youtu.be/xkyV17DpifM?si=5nSOlQNOFy9emlxM" },
                    { resourceTitle: "شرح الدرس ج2", type: "video", url: "https://youtu.be/BsyIke2KJcY?si=q1qT2Ea2eJNkIR8J" },
                    { resourceTitle: "شرح الدرس ج3", type: "video", url: "https://youtu.be/vY6K83DZEyY?si=5WuR11azZvqe8T47" },
                    { resourceTitle: "شرح الدرس ج4", type: "video", url: "https://youtu.be/bBNh_tzDJss?si=fbKnb2405zRWdbCs" },
                    { resourceTitle: "شرح الدرس ج5", type: "video", url: "https://youtu.be/v0lq-r_Kpy4?si=NRpZL1iiDbyxpGYo" },
                    { resourceTitle: "شرح الدرس ج6", type: "video", url: "https://youtu.be/00pi638-MHw?si=J6xZLvNL_zutkZqd" },
                    { resourceTitle: "شرح الدرس ج7", type: "video", url: "https://youtu.be/9BLMa5sv-S8?si=tOW1-G1jhn6dvjfK" },
                    { resourceTitle: "شرح الدرس ج8", type: "video", url: "https://youtu.be/If5dzTDEgEY?si=b5FWRx-10Uqn3rni" },
                    { resourceTitle: "شرح الدرس ج9", type: "video", url: "https://youtu.be/ful-NVmfbBA?si=kWhnQPk5zq2jIaVE" },
                    { resourceTitle: "شرح الدرس ج10", type: "video", url: "https://youtu.be/6Devz730Yb8?si=ohwPL6UI-hEFtDQr" },
                    { resourceTitle: "شرح الدرس ج11", type: "video", url: "https://youtu.be/zOr8os5XA9g?si=YxscFlcGbuoc-Cpi" },
                    { resourceTitle: "شرح الدرس ج12", type: "video", url: "https://youtu.be/jallt-ZBsO0?si=12zDIDq1wM0GOvrO" },
                    { resourceTitle: "ورقة عمل1", type: "pdf", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_U1_L1_Questions.pdf" },
                    { resourceTitle: "ورقة عمل2", type: "pdf", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_U1_L1_Questions1.pdf" },
                    { resourceTitle: "امتحان الكتروني", type: "link", url: "https://forms.gle/c9NwktkqA1yRT76m8" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "حل معادلات القيمة المطلقة ومتبايناتها",
                resources: [
                    { resourceTitle: "شرح الدرس ج1", type: "video", url: "https://youtu.be/Y50B4zpo47U?si=T-TbiSkTOpHdcfhd" },
                    { resourceTitle: "شرح الدرس ج2", type: "video", url: "https://youtu.be/lz1sMBiyzDo?si=NDjEBqxfE5RJXSDm" },
                    { resourceTitle: "شرح الدرس ج3", type: "video", url: "https://youtu.be/JbK41eaEMt4?si=DpbLlJlVjwzOjJER" },
                    { resourceTitle: "امتحان الكتروني", type: "link", url: "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAN__7gm-NdURDZBSUdYRkNGNkJMN1pVWkpXVEdFVVpEUy4u" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L3",
                lessonTitle: "نظريتا الباقي والعوامل",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L4",
                lessonTitle: "الكسور الجزئية",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            }
        ]
    },
    {
        unitId: "unit2",
        unitTitle: "الاقترانات المثلثية",
        resources: [
            { resourceTitle: "", type: "video", url: "" },
            { resourceTitle: "دفتر الوحدة", type: "pdf", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_Unit2_StudentBook.pdf" },
            { resourceTitle: "", type: "image", url: "" }
        ],
        lessons: [
            {
                lessonId: "L1",
                lessonTitle: "قياس الزاوية بالراديان",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "الاقترانات المثلثية",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L3",
                lessonTitle: "تمثيل الاقترانات الجيبية بيانياً",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            }
        ]
    },
    {
        unitId: "unit3",
        unitTitle: "النهايات والمشتقات",
        resources: [
            { resourceTitle: "", type: "video", url: "" },
            { resourceTitle: "ملخص الوحدة", type: "pdf", url: "" },
            { resourceTitle: "", type: "image", url: "" }
        ],
        lessons: [
            {
                lessonId: "L1",
                lessonTitle: "النهايات والاتصال",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "الاشتقاق",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L3",
                lessonTitle: "القيم العظمى والصغرى",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L4",
                lessonTitle: "المشتقة الثانية وتطبيقاتها",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L5",
                lessonTitle: "تطبيقات القيم القصوى",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            },
            {
                lessonId: "L6",
                lessonTitle: "قاعدة السلسلة",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "تلخيص الدرس", type: "pdf", url: "" },
                    { resourceTitle: "", type: "image", url: "" }
                ]
            }
        ]
    }
];

export const INITIAL_MATH_BASICS_RESOURCES: MathBasicsItem[] = [
    {
        videoId: "foundation1",
        videoTitle: "حصة التأسيس 1",
        type: "video",
        url: "https://youtu.be/TINRELdppRk?si=MTQ1ClflDuBz3qkj",
        youtubeTitle: "الحصة الاولى من تاسيس مادة الرياضيات لجيل 2010 🔥من الصفر : مع الأستاذ يزن العقرباوي"
    },
    {
        videoId: "foundation2",
        videoTitle: "حصة التأسيس 2",
        type: "video",
        url: "https://youtu.be/W7PrTq4xvqg?si=JkICZ_7kGJxtkCtf",
        youtubeTitle: "الحصة الثانية من تاسيس مادة الرياضيات لجيل 2010 🔥من الصفر : مع الأستاذ يزن العقرباوي"
    },
    {
        videoId: "foundation3_part1",
        videoTitle: "حصة التأسيس 3 - ج1",
        type: "video",
        url: "https://youtu.be/WzeC_iUuL_w?si=X0R2q9_uHJWR1Eu0",
        youtubeTitle: "الحصة الثالثة من تاسيس مادة الرياضيات لجيل 2010 🔥الجزء الاول : مع الأستاذ يزن العقرباوي"
    },
    {
        videoId: "foundation3_part2",
        videoTitle: "حصة التأسيس 3 - ج2",
        type: "video",
        url: "https://youtu.be/1ViGTnHjOz8?si=skI214ibu1tnn-4B",
        youtubeTitle: "الحصة الثالثة من تاسيس مادة الرياضيات لجيل 2010 🔥الجزء الثاني : مع الأستاذ يزن العقرباوي"
    },
    {
        videoId: "foundation4",
        videoTitle: "حصة التأسيس 4",
        type: "video",
        url: "https://youtu.be/KUogAXDYjP0?si=PKqfWD0o_ahv4MkD",
        youtubeTitle: "الحصة الرابعة من تاسيس مادة الرياضيات لجيل 2010 🔥شرح التعامل مع الة الحاسبة : الأستاذ يزن العقرباوي"
    },
    {
        videoId: "foundation5",
        videoTitle: "حصة التأسيس 5",
        type: "video",
        url: "https://youtu.be/yEpCKnRZZ44?si=stz-Pc-nBZdygHAd",
        youtubeTitle: "الحصة الخامسة من تاسيس مادة الرياضيات لجيل 2010 🔥: الأستاذ يزن العقرباوي 🏅"
    },
    {
        videoId: "foundation6",
        videoTitle: "حصة التأسيس 6",
        type: "video",
        url: "https://youtu.be/SUda2-nd1Is?si=fhdCroOMf38yXDe1",
        youtubeTitle: "الحصة السادسة من تاسيس مادة الرياضيات لجيل 2010 🔥: الأستاذ يزن العقرباوي 🏅"
    },
    {
        videoId: "foundation7",
        videoTitle: "حصة التأسيس 7",
        type: "video",
        url: "https://youtu.be/fOx9VL51pLc?si=8A_fnHUjuntw5F6X",
        youtubeTitle: "الحصة السابعة من تاسيس مادة الرياضيات لجيل 2010 🔥: الأستاذ يزن العقرباوي 🏅"
    },
    {
        videoId: "foundation8",
        videoTitle: "حصة التأسيس 8",
        type: "video",
        url: "https://youtu.be/cvOOBDmSn0k?si=DIxfmjU484UJfA6c",
        youtubeTitle: "الحصة الثامنة من تاسيس مادة الرياضيات لجيل 2010 👨🏻‍🎓: مع الأستاذ يزن العقرباوي 💪🏻🔥"
    },
    {
        videoId: "foundation9",
        videoTitle: "حصة التأسيس 9",
        type: "video",
        url: "https://youtu.be/hNg2EXEUzuE?si=LhxZvKSUq-RLS8W5",
        youtubeTitle: "الحصة التاسعة من تاسيس مادة الرياضيات لجيل 2010 👨🏻‍🎓: مع الأستاذ يزن العقرباوي🔥"
    },
    {
        videoId: "foundation10",
        videoTitle: "حصة التأسيس 10",
        type: "video",
        url: "https://youtu.be/GX24wWuZnXg?si=dBnkcNbQcAwSTeb5",
        youtubeTitle: "الحصة العاشرة والأخيرة من تاسيس مادة الرياضيات لجيل 2010 👨🏻‍🎓: مع الأستاذ يزن العقرباوي🔥"
    }
];

const MATH_BASICS_CACHE_KEY = "math_basics_resources_v1";

export function loadCachedMathBasics(): MathBasicsItem[] {
    try {
        const cached = localStorage.getItem(MATH_BASICS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            let items: MathBasicsItem[] = [];
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (parsed[0].foundation && Array.isArray(parsed[0].foundation)) {
                    items = parsed[0].foundation;
                } else if (parsed[0].videoId) {
                    items = parsed;
                }
            } else if (parsed && parsed.foundation && Array.isArray(parsed.foundation)) {
                items = parsed.foundation;
            }
            if (items.length > 0) return items;
        }
    } catch (e) {
        console.warn("Failed to read cached math basics:", e);
    }
    return INITIAL_MATH_BASICS_RESOURCES;
}

export async function fetchRemoteMathBasics(): Promise<MathBasicsItem[]> {
    const urls = [
        "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/MathBasicsStructureSources11_S1.json",
        "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/main/MathBasicsStructureSources11_S1.json",
        "https://api.github.com/repos/MashalMath/joschool-11-arabic-exams/contents/MathBasicsStructureSources11_S1.json?ref=JoSchool112010"
    ];

    for (const url of urls) {
        try {
            const isApi = url.includes("api.github.com");
            const headers: Record<string, string> = {};
            if (isApi) {
                headers['Accept'] = 'application/vnd.github.v3.raw';
            }
            const cacheBuster = (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
            const response = await fetch(`${url}${cacheBuster}`, { headers });
            if (!response.ok) continue;

            const text = await response.text();
            const data = JSON.parse(text);

            let items: MathBasicsItem[] = [];
            if (Array.isArray(data) && data.length > 0) {
                if (data[0].foundation && Array.isArray(data[0].foundation)) {
                    items = data[0].foundation;
                } else if (data[0].videoId) {
                    items = data;
                }
            } else if (data && data.foundation && Array.isArray(data.foundation)) {
                items = data.foundation;
            }

            if (items && items.length > 0) {
                localStorage.setItem(MATH_BASICS_CACHE_KEY, JSON.stringify(items));
                return items;
            }
        } catch (e) {
            console.warn(`Error fetching math basics from ${url}:`, e);
        }
    }
    return loadCachedMathBasics();
}

const JORDAN_HISTORY_RESOURCE_GITHUB_URLS = [
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/HistoryStructureSources11_S1.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/main/HistoryStructureSources11_S1.json",
    "https://api.github.com/repos/MashalMath/joschool-11-arabic-exams/contents/HistoryStructureSources11_S1.json?ref=JoSchool112010",
    "https://api.github.com/repos/MashalMath/Pdf_Library/contents/History11_s1_resources.json",
    "https://api.github.com/repos/MashalMath/Pdf_Library/contents/History11_s1.json",
    "https://api.github.com/repos/MashalMath/joschool-11-arabic-exams/contents/History11_s1_resources.json?ref=JoSchool112010",
    "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/History11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/History11_s1.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/main/History11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_resources.json"
];

const MATH_RESOURCE_GITHUB_URLS = [
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/MathStructureSources11_S1.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/main/MathStructureSources11_S1.json",
    "https://api.github.com/repos/MashalMath/joschool-11-arabic-exams/contents/MathStructureSources11_S1.json?ref=JoSchool112010",
    "https://api.github.com/repos/MashalMath/joschool-11-arabic-exams/contents/Math11_s1_resources.json?ref=JoSchool112010",
    "https://api.github.com/repos/MashalMath/Pdf_Library/contents/MathStructureSources11_S1.json",
    "https://api.github.com/repos/MashalMath/Pdf_Library/contents/Math11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/MathStructureSources11_S1.json",
    "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/main/Math11_s1_resources.json"
];

const LOCAL_STORAGE_KEY_HISTORY = "jordan_history_resources_v1";
const LOCAL_STORAGE_KEY_MATH = "math_resources_v1";

function getLocalStorageKey(subject?: string): string {
    if (subject === SubjectName.Math) {
        return LOCAL_STORAGE_KEY_MATH;
    }
    return LOCAL_STORAGE_KEY_HISTORY;
}

function getResourceUrls(subject?: string): string[] {
    if (subject === SubjectName.Math) {
        return MATH_RESOURCE_GITHUB_URLS;
    }
    return JORDAN_HISTORY_RESOURCE_GITHUB_URLS;
}

export function normalizeResource(r: LessonResource): LessonResource {
    if (!r) return r;
    const url = (r.url || '').trim();
    const lowerUrl = url.toLowerCase();
    const rawType = (r.type || '').toLowerCase();
    
    // If explicitly marked as link/exam/form/url, preserve it as link
    if (rawType === 'link' || rawType === 'exam' || rawType === 'form' || rawType === 'url') {
        return {
            ...r,
            url,
            type: 'link'
        };
    }

    let detectedType = r.type;

    if (lowerUrl.includes('.pdf') || (lowerUrl.includes('drive.google.com') && !lowerUrl.includes('youtube') && !lowerUrl.includes('forms'))) {
        detectedType = 'pdf';
    } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        detectedType = 'video';
    } else if (lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.webp') || lowerUrl.includes('.gif')) {
        detectedType = 'image';
    } else if (
        lowerUrl.includes('forms.gle') || 
        lowerUrl.includes('docs.google.com/forms') || 
        lowerUrl.includes('forms.office.com') || 
        lowerUrl.includes('forms.cloud.microsoft') ||
        lowerUrl.startsWith('http://') || 
        lowerUrl.startsWith('https://')
    ) {
        detectedType = 'link';
    }

    return {
        ...r,
        url,
        type: detectedType || r.type || 'link'
    };
}

export function isValidResource(r: LessonResource | null | undefined): boolean {
    if (!r) return false;
    if (!r.url || typeof r.url !== 'string') return false;
    const trimmedUrl = r.url.trim().toLowerCase();
    if (
        trimmedUrl === '' || 
        trimmedUrl === 'null' || 
        trimmedUrl === 'undefined' || 
        trimmedUrl === '#' || 
        trimmedUrl === 'about:blank' ||
        trimmedUrl === 'none' ||
        trimmedUrl === 'false' ||
        trimmedUrl.includes('deleted')
    ) {
        return false;
    }
    return true;
}

/**
 * Robust JSON parser and auto-repair function.
 * Handles mobile-editing mistakes such as accidental closing brackets, trailing commas,
 * smart quotes, unexpected trailing non-whitespace characters, and unclosed tags.
 */
export function cleanAndRepairJson<T = any>(rawText: string): T | null {
    if (!rawText || typeof rawText !== 'string') return null;

    // 1. Normalize smart quotes, non-breaking spaces, and hidden control characters
    let text = rawText
        .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
        .replace(/[\u2018\u2019]/g, '"')
        .replace(/\u00a0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Fast path: try standard JSON.parse first
    try {
        return JSON.parse(text);
    } catch (e) {
        // Proceed with repairs
    }

    // 2. Fix misplaced resource array close before subsequent resource objects
    // Example: user inserted a resource and closed with `] },` right before another resource `{ "resourceTitle": ... }`
    text = text.replace(/\]\s*\}\s*,\s*\{\s*(?=(?:"resourceTitle"|"type"|"url"))/g, ',\n          {');

    // 3. Fix trailing commas before } or ]
    text = text.replace(/,\s*([\]}])/g, '$1');

    try {
        return JSON.parse(text);
    } catch (e) {
        // Proceed
    }

    // 4. Handle "Unexpected non-whitespace character after JSON at position X"
    try {
        JSON.parse(text);
    } catch (err: any) {
        const match = err?.message?.match(/after JSON at position (\d+)/);
        if (match) {
            const pos = parseInt(match[1], 10);
            const sub = text.slice(0, pos).trim();
            try {
                return JSON.parse(sub);
            } catch {
                // Continue to next repair strategy
            }
        }
    }

    // 5. Extract balanced JSON array if outer boundaries have mismatched trailing brackets
    const firstBracket = text.indexOf('[');
    if (firstBracket !== -1) {
        let depth = 0;
        let inString = false;
        let escape = false;
        for (let i = firstBracket; i < text.length; i++) {
            const c = text[i];
            if (escape) { escape = false; continue; }
            if (c === '\\') { escape = true; continue; }
            if (c === '"') { inString = !inString; continue; }
            if (!inString) {
                if (c === '[') depth++;
                else if (c === ']') {
                    depth--;
                    if (depth === 0) {
                        const candidate = text.slice(firstBracket, i + 1);
                        try {
                            return JSON.parse(candidate);
                        } catch {
                            // Continue to next repair strategy
                        }
                    }
                }
            }
        }
    }

    // 6. Stack-based repair for unclosed brackets at the end of the file
    const stack: string[] = [];
    let inString = false;
    let escape = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (escape) { escape = false; continue; }
        if (c === '\\') { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (!inString) {
            if (c === '{') stack.push('}');
            else if (c === '[') stack.push(']');
            else if (c === '}' || c === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === c) {
                    stack.pop();
                }
            }
        }
    }

    let balanced = text.trim();
    while (stack.length > 0) {
        balanced += stack.pop();
    }
    try {
        return JSON.parse(balanced);
    } catch {
        // All repair attempts completed
    }

    return null;
}

function countValidResourcesInUnits(units: ResourceJsonUnit[]): number {
    if (!units || !Array.isArray(units)) return 0;
    let count = 0;
    for (const u of units) {
        if (u.resources && Array.isArray(u.resources)) {
            count += u.resources.filter(isValidResource).length;
        }
        if (u.lessons && Array.isArray(u.lessons)) {
            for (const l of u.lessons) {
                if (l.resources && Array.isArray(l.resources)) {
                    count += l.resources.filter(isValidResource).length;
                }
            }
        }
    }
    return count;
}

export function loadCachedResources(subject?: string): ResourceJsonUnit[] {
    const defaultData = subject === SubjectName.Math ? INITIAL_MATH_RESOURCES : INITIAL_JORDAN_HISTORY_RESOURCES;
    try {
        const key = getLocalStorageKey(subject);
        const cached = localStorage.getItem(key);
        if (cached) {
            const parsed = cleanAndRepairJson<any>(cached);
            let units: ResourceJsonUnit[] = [];
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (parsed[0].units && Array.isArray(parsed[0].units)) {
                    units = parsed[0].units;
                } else if (parsed[0].unitId || parsed[0].lessons) {
                    units = parsed;
                }
            } else if (parsed && parsed.units && Array.isArray(parsed.units)) {
                units = parsed.units;
            }

            if (units.length > 0) {
                const cachedValidCount = countValidResourcesInUnits(units);
                const defaultValidCount = countValidResourcesInUnits(defaultData);
                if (cachedValidCount >= defaultValidCount) {
                    return units;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to read cached resources:", e);
    }
    return defaultData;
}

export async function fetchRemoteResources(subject?: string): Promise<ResourceJsonUnit[]> {
    const urls = getResourceUrls(subject);
    const key = getLocalStorageKey(subject);

    for (const url of urls) {
        try {
            const isApi = url.includes("api.github.com");
            const headers: Record<string, string> = {};
            if (isApi) {
                headers['Accept'] = 'application/vnd.github.v3.raw';
            }

            const cacheBuster = (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
            const response = await fetch(`${url}${cacheBuster}`, { 
                headers,
                cache: 'no-store'
            });
            if (!response.ok) continue;
            const text = await response.text();
            
            const data = cleanAndRepairJson<any>(text);
            if (!data) continue;
            
            let units: ResourceJsonUnit[] = [];
            if (Array.isArray(data) && data.length > 0) {
                if (data[0].units && Array.isArray(data[0].units)) {
                    units = data[0].units;
                } else if (data[0].unitId || data[0].lessons) {
                    units = data;
                }
            } else if (data && data.units && Array.isArray(data.units)) {
                units = data.units;
            }

            if (units.length > 0) {
                try {
                    localStorage.setItem(key, JSON.stringify(units));
                } catch (e) {
                    // Ignore storage quota errors
                }
                return units;
            }
        } catch (err) {
            console.warn(`Error parsing resources from ${url}:`, err);
        }
    }
    return loadCachedResources(subject);
}

export async function fetchRemoteHistoryResources(): Promise<ResourceJsonUnit[]> {
    return fetchRemoteResources(SubjectName.JordanHistory);
}

function cleanString(str: string): string {
    if (!str) return '';
    return str
        .replace(/—|–|-/g, ' ')
        .replace(/صفحة\s*\d+/g, '')
        .replace(/الدرس\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر):?/g, '')
        .replace(/الوحدة\s*(الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة):?/g, '')
        .replace(/\(.*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getResourcesForLesson(
    unitTitle: string,
    lessonTitle: string,
    unitIndex: number,
    lessonIndex: number,
    unitsData: ResourceJsonUnit[]
): LessonResource[] {
    if (!unitsData || unitsData.length === 0) return [];

    // 1. Try finding unit by index or title
    let matchedUnit = unitsData[unitIndex];
    if (!matchedUnit) {
        const cleanedUnitTitle = cleanString(unitTitle);
        matchedUnit = unitsData.find(u => 
            u.unitId === `unit${unitIndex + 1}` || 
            cleanString(u.unitTitle).includes(cleanedUnitTitle) ||
            cleanedUnitTitle.includes(cleanString(u.unitTitle))
        );
    }

    if (!matchedUnit || !matchedUnit.lessons) return [];

    // 2. Try finding lesson by index, lessonId, or title
    let matchedLesson = matchedUnit.lessons[lessonIndex];
    if (!matchedLesson || matchedLesson.lessonId !== `L${lessonIndex + 1}`) {
        const cleanedLessonTitle = cleanString(lessonTitle);
        const candidate = matchedUnit.lessons.find(l => 
            l.lessonId === `L${lessonIndex + 1}` ||
            cleanString(l.lessonTitle).includes(cleanedLessonTitle) ||
            cleanedLessonTitle.includes(cleanString(l.lessonTitle))
        );
        if (candidate) {
            matchedLesson = candidate;
        }
    }

    if (!matchedLesson || !matchedLesson.resources || !Array.isArray(matchedLesson.resources)) {
        return [];
    }

    // 3. Filter valid resources using isValidResource and normalize type
    return matchedLesson.resources.filter(isValidResource).map(normalizeResource);
}

export function getResourcesForUnit(
    unitTitle: string,
    unitIndex: number,
    unitsData?: ResourceJsonUnit[],
    unitObj?: Unit
): LessonResource[] {
    let rawResources: LessonResource[] = [];

    // Always prioritize remote/cached JSON unitsData over static unitObj
    if (unitsData && unitsData.length > 0) {
        let matchedUnit = unitsData[unitIndex];
        if (!matchedUnit) {
            const cleanedUnitTitle = cleanString(unitTitle);
            matchedUnit = unitsData.find(u => 
                u.unitId === `unit${unitIndex + 1}` || 
                cleanString(u.unitTitle).includes(cleanedUnitTitle) ||
                cleanedUnitTitle.includes(cleanString(u.unitTitle))
            );
        }
        if (matchedUnit && matchedUnit.resources && Array.isArray(matchedUnit.resources)) {
            rawResources = matchedUnit.resources;
        }
    } else if (unitObj && unitObj.resources && Array.isArray(unitObj.resources)) {
        rawResources = unitObj.resources;
    }

    if (!rawResources || rawResources.length === 0) return [];

    return rawResources.filter(isValidResource).map(normalizeResource);
}

export function getOrdinalText(num: number, type: 'lesson' | 'unit'): string {
    const lessonOrdinals = [
        'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 
        'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
        'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر'
    ];
    const unitOrdinals = [
        'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 
        'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
        'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة', 'الخامسة عشرة'
    ];

    if (type === 'lesson') {
        const ord = lessonOrdinals[num - 1] || `${num}`;
        return `الدرس ${ord}`;
    } else {
        const ord = unitOrdinals[num - 1] || `${num}`;
        return `الوحدة ${ord}`;
    }
}

export function cleanTitleText(text: string): string {
    if (!text) return '';
    return text
        .replace(/^(الدرس|الوحدة)\s*([\u0600-\u06FF0-9]*)\s*[:\-–]?\s*/i, '')
        .replace(/[([{]?\s*(من\s+)?(الصفحة|صفحة|ص\.?)\s*\d+\s*([-–—إلى]\s*\d+)?\s*[)]}]?/gi, '')
        .replace(/[([{]?\s*صفحات?\s*\d+\s*([-–—إلى]\s*\d+)?\s*[)]}]?/gi, '')
        .replace(/[\s\-_–:]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function generatePdfDownloadFileName(
    type: 'lesson' | 'unit',
    uIdx: number,
    lIdx: number,
    title: string,
    resourceTitle?: string,
    resourceType: string = 'pdf'
): string {
    const fileExt = resourceType === 'pdf' ? 'pdf' : resourceType === 'video' ? 'mp4' : 'png';

    if (type === 'unit') {
        const unitOrdinals = [
            'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 
            'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
            'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة', 'الخامسة عشرة'
        ];
        const unitOrd = unitOrdinals[uIdx] || `${uIdx + 1}`;
        const rawName = `ملخص الوحدة ${unitOrd}.${fileExt}`;
        return rawName.replace(/[/\\?%*:|"<>]/g, '').trim();
    } else {
        const lessonNum = lIdx + 1;
        const unitNum = uIdx + 1;
        const cleanedTitle = cleanTitleText(title);
        const rawName = `الدرس${lessonNum}وحدة${unitNum}-${cleanedTitle}.${fileExt}`;
        return rawName.replace(/[/\\?%*:|"<>]/g, '').trim();
    }
}

export function getYoutubeThumbnailUrl(url: string): string | null {
    if (!url) return null;
    try {
        const trimmed = url.trim();
        let videoId: string | undefined;
        if (trimmed.includes('youtube.com/shorts/')) {
            videoId = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0];
        } else if (trimmed.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(trimmed).search);
            videoId = urlParams.get('v') || undefined;
        } else if (trimmed.includes('youtu.be/')) {
            videoId = trimmed.split('youtu.be/')[1]?.split('?')[0];
        } else if (trimmed.includes('youtube.com/embed/')) {
            videoId = trimmed.split('youtube.com/embed/')[1]?.split('?')[0];
        }
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    } catch (e) {
        // Return null
    }
    return null;
}

const ytTitleMemoryCache: Record<string, string> = {};

export async function fetchYoutubeVideoTitle(url: string): Promise<string | null> {
    if (!url) return null;
    if (ytTitleMemoryCache[url]) return ytTitleMemoryCache[url];
    try {
        const cachedStr = localStorage.getItem(`yt_title_${url}`);
        if (cachedStr) {
            ytTitleMemoryCache[url] = cachedStr;
            return cachedStr;
        }
    } catch (e) {
        // ignore
    }

    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.title) {
                const title = data.title as string;
                ytTitleMemoryCache[url] = title;
                try {
                    localStorage.setItem(`yt_title_${url}`, title);
                } catch (e) {
                    // ignore
                }
                return title;
            }
        }
    } catch (e) {
        // ignore
    }
    return null;
}

