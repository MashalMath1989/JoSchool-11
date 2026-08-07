import { LessonResource, Unit } from '../types';

export interface ResourceJsonLesson {
    lessonId: string;
    lessonTitle: string;
    resources: LessonResource[];
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
                    { resourceTitle: "ملخص", type: "image", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/History11_s1_unit1_L1.png" }
                ]
            },
            {
                lessonId: "L2",
                lessonTitle: "الأردن في العصر الحديدي",
                resources: [
                    { resourceTitle: "", type: "video", url: "" },
                    { resourceTitle: "", type: "pdf", url: "" },
                    { resourceTitle: "ملخص الدرس", type: "image", url: "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/History11_s1_unit1_L2.png" }
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

const RESOURCE_GITHUB_URLS = [
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/HistoryStructureSources11_S1.json",
    "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/History11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/History11_s1.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/main/History11_s1_resources.json",
    "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_resources.json"
];

const LOCAL_STORAGE_KEY = "jordan_history_resources_v1";

export function loadCachedResources(): ResourceJsonUnit[] {
    try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (parsed[0].units && Array.isArray(parsed[0].units)) {
                    return parsed[0].units;
                }
                if (parsed[0].unitId || parsed[0].lessons) {
                    return parsed;
                }
            } else if (parsed && parsed.units && Array.isArray(parsed.units)) {
                return parsed.units;
            }
        }
    } catch (e) {
        console.warn("Failed to read cached resources:", e);
    }
    return INITIAL_JORDAN_HISTORY_RESOURCES;
}

export async function fetchRemoteHistoryResources(): Promise<ResourceJsonUnit[]> {
    for (const url of RESOURCE_GITHUB_URLS) {
        try {
            const response = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-cache' });
            if (!response.ok) continue;
            const text = await response.text();
            // Clean non-breaking spaces (\u00a0) and hidden control chars
            const cleanedText = text.replace(/\u00a0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
            const data = JSON.parse(cleanedText);
            
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
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(units));
                } catch (e) {
                    // Ignore storage quota errors
                }
                return units;
            }
        } catch (err) {
            console.warn(`Error parsing resources from ${url}:`, err);
        }
    }
    return loadCachedResources();
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
        ) || unitsData[0];
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

    // 3. Filter valid resources: url must be non-empty and non-null
    return matchedLesson.resources.filter(r => 
        r && 
        r.url && 
        typeof r.url === 'string' && 
        r.url.trim() !== '' && 
        r.url.trim() !== 'null'
    );
}

export function getResourcesForUnit(
    unitTitle: string,
    unitIndex: number,
    unitsData?: ResourceJsonUnit[],
    unitObj?: Unit
): LessonResource[] {
    let rawResources: LessonResource[] = [];

    if (unitObj && unitObj.resources && Array.isArray(unitObj.resources) && unitObj.resources.length > 0) {
        rawResources = unitObj.resources;
    } else if (unitsData && unitsData.length > 0) {
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
    }

    if (!rawResources || rawResources.length === 0) return [];

    return rawResources.filter(r => 
        r && 
        r.url && 
        typeof r.url === 'string' && 
        r.url.trim() !== '' && 
        r.url.trim() !== 'null'
    );
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

