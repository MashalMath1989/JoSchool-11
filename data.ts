import { Subject, SubjectName, SubjectIndexData, Semester } from './types';

export const subjectsData: Subject[] = [
  // --- الفصل الأول ---
  {
    id: SubjectName.JordanHistory,
    coverImage: 'https://i.postimg.cc/PfB5Smtw/1760536062333-tarykh-alardn.jpg',
    fontClass: 'font-naskh',
    semester: Semester.First,
    textbookUrl: 'https://drive.google.com/file/d/1S9QTEgpTzZTKKkRdTF0OdDmwQNJFvvxS/view?usp=drivesdk',
  },
  {
    id: SubjectName.IslamicEducation,
    coverImage: 'https://i.postimg.cc/gcf2gvY8/1760541071199-aslamyt-11.png',
    fontClass: 'font-naskh',
    semester: Semester.First,
    textbookUrl: 'https://drive.google.com/file/d/1Fv17znBl9OEKStLMgBvNdECtouiivOiB/view?usp=drivesdk',
  },
  {
    id: SubjectName.Arabic,
    coverImage: 'https://i.postimg.cc/J79zpb1X/1760540922343-g11.png',
    fontClass: 'font-naskh',
    semester: Semester.First,
    textbookUrl: 'https://drive.google.com/file/d/1O7zMWn_hGQ-HnsLUZIZm-g68jDDEULCo/view?usp=drivesdk',
  },
  {
    id: SubjectName.English,
    coverImage: 'https://i.postimg.cc/3rPxtgK2/1760541032985-1760540938507-s11.png',
    fontClass: 'font-sans',
    semester: Semester.First,
    multiBooks: [
      { label: "Student's Book", url: "https://drive.google.com/file/d/1ZHbhPBZH49_W_HxffR4kV4fBzToMODkU/view?usp=drivesdk" },
      { label: "Workbook", url: "https://drive.google.com/file/d/1Msvajg0yTe06B8v8NgsiHFirjZJfqeF4/view?usp=drivesdk" }
    ]
  },

  // --- الفصل الثاني ---
  {
    id: SubjectName.JordanHistory,
    coverImage: 'https://i.postimg.cc/ZqcRFFCB/IMG-20260317-205243-209.png',
    fontClass: 'font-naskh',
    semester: Semester.Second,
    textbookUrl: 'https://drive.google.com/file/d/1aIJZ_nI_rqg9DdFEqqe1wvd45EUVH3MW/preview',
  },
  {
    id: SubjectName.IslamicEducation,
    coverImage: 'https://i.postimg.cc/Gp8R9FvH/IMG-20260317-205816-520.png',
    fontClass: 'font-naskh',
    semester: Semester.Second,
    textbookUrl: 'https://drive.google.com/file/d/1pFrCSZnSY0iFinv4NKZTiIDg2NMyxNaw/view?usp=drivesdk',
  },
  {
    id: SubjectName.Arabic,
    coverImage: 'https://i.postimg.cc/L5CcDhpX/IMG_20260317_200321_670.png',
    fontClass: 'font-naskh',
    semester: Semester.Second,
    textbookUrl: 'https://drive.google.com/file/d/1nv6jN5R14is3YuYLCUGWk8alegG10tTE/view?usp=drivesdk',
  },
  {
    id: SubjectName.English,
    coverImage: 'https://i.postimg.cc/Wpxzs4Z8/IMG_20260317_201514_910.png',
    fontClass: 'font-sans',
    semester: Semester.Second,
    multiBooks: [
      { label: "Student's Book", url: "https://drive.google.com/file/d/16pYv1Rl04Lj-kjdQDP7HG9e5lwjiS6ko/view?usp=drivesdk" },
      { label: "Workbook", url: "https://drive.google.com/file/d/1-s-kCsPeAFcifdvNn8oTIkRophhSQT2S/view?usp=drivesdk" }
    ]
  },
];

export const subjectIndexData: SubjectIndexData = {
  [SubjectName.IslamicEducation]: [
    {
      title: 'الوحدة الأولى: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا"',
      lessons: [
        { title: 'الدرس الأول: سورة آل عمران الآيات الكريمة (١٠٢–١٠٥) – صفحة 6', page: 6 },
        { title: 'الدرس الثاني: الحديث الشريف: اتقاء الشبهات – صفحة 12', page: 12 },
        { title: 'الدرس الثالث: من صور الضلال – صفحة 20', page: 20 },
        { title: 'الدرس الرابع: كرامة الإنسان في الشريعة الإسلامية – صفحة 26', page: 26 },
        { title: 'الدرس الخامس: الزواج: مشروعيته ومقدماته – صفحة 31', page: 31 },
        { title: 'الدرس السادس: الجهاد في الإسلام – صفحة 37', page: 37 },
      ],
    },
    {
      title: 'الوحدة الثانية: "وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا"',
      lessons: [
        { title: 'الدرس الأول: جهود علماء المسلمين في خدمة القرآن الكريم – صفحة 44', page: 44 },
        { title: 'الدرس الثاني: العزيمة والرخصة – صفحة 50', page: 50 },
        { title: 'الدرس الثالث: معركة مؤتة (8 هـ) – صفحة 56', page: 56 },
        { title: 'الدرس الرابع: المحرّمات من النساء – صفحة 61', page: 61 },
        { title: 'الدرس الخامس: التعايش الإنساني – صفحة 67', page: 67 },
        { title: 'الدرس السادس: الحقوق الاجتماعية للمرأة في الإسلام – صفحة 73', page: 73 },
      ],
    },
    {
      title: 'الوحدة الثالثة: "وَقُلْ جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ"',
      lessons: [
        { title: 'الدرس الأول: سورة آل عمران الآيات الكريمة (169–174) – صفحة 81', page: 81 },
        { title: 'الدرس الثاني: الحديث الشريف: رضا الله تعالى – صفحة 87', page: 87 },
        { title: 'الدرس الثالث: فتح مكة (8 هـ) – صفحة 93', page: 93 },
        { title: 'الدرس الرابع: من خصائص الشريعة الإسلامية: الإيجابية – صفحة 99', page: 99 },
        { title: 'الدرس الخامس: شروط صحة عقد الزواج – صفحة 105', page: 105 },
        { title: 'الدرس السادس: الحقوق المالية للمرأة في الإسلام – صفحة 110', page: 110 },
      ],
    },
    {
      title: 'الوحدة الرابعة: "لِتَسْكُنُوا إِلَيْهَا"',
      lessons: [
        { title: 'الدرس الأول: سورة الروم الآيات الكريمة (21–24) – صفحة 115', page: 115 },
        { title: 'الدرس الثاني: مكانة السنة النبوية الشريفة في التشريع الإسلامي – صفحة 120', page: 120 },
        { title: 'الدرس الثالث: مراعاة الأعراف في الشريعة الإسلامية – صفحة 128', page: 128 },
        { title: 'الدرس الرابع: حقوق الزوجين في الإسلام – صفحة 134', page: 134 },
        { title: 'الدرس الخامس: تنظيم النسل وتحديده – صفحة 141', page: 141 },
        { title: 'الدرس السادس: الأمن الغذائي في الإسلام – صفحة 146', page: 146 },
        { title: 'الدرس السابع: الإسلام والوحدة الوطنية – صفحة 152', page: 152 },
      ],
    },
  ],
  [`${SubjectName.IslamicEducation}-${Semester.Second}`]: [
    {
      title: 'الوحدة الأولى: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا"',
      lessons: [
        { title: 'الدرس الأول: سورة البقرة، الآيات الكريمة (٢٨٤–٢٨٦) — صفحة 6', page: 6 },
        { title: 'الدرس الثاني: دلائل وجود الله تعالى — صفحة 14', page: 14 },
        { title: 'الدرس الثالث: إعجاز القرآن الكريم — صفحة 21', page: 21 },
        { title: 'الدرس الرابع: الأمر بالمعروف والنهي عن المنكر — صفحة 28', page: 28 },
        { title: 'الدرس الخامس: اليوم الآخر: أحداثه، وآثار الإيمان به — صفحة 34', page: 34 },
        { title: 'الدرس السادس: الاجتهاد في الإسلام — صفحة 41', page: 41 },
      ],
    },
    {
      title: 'الوحدة الثانية: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ"',
      lessons: [
        { title: 'الدرس الأول: سورة الأعراف، الآيات الكريمة (٣١–٣٤) — صفحة 48', page: 48 },
        { title: 'الدرس الثاني: مراعاة المصالح في الشريعة الإسلامية — صفحة 55', page: 55 },
        { title: 'الدرس الثالث: جهود علماء المسلمين في الحفاظ على السنة النبوية الشريفة — صفحة 61', page: 61 },
        { title: 'الدرس الرابع: الحديث الشريف: منهج الإسلام في الحياة — صفحة 67', page: 67 },
        { title: 'الدرس الخامس: رسائل النبي ﷺ إلى الملوك والزعماء في عصره — صفحة 73', page: 73 },
        { title: 'الدرس السادس: يوم تبوك (٩هـ) — صفحة 79', page: 79 },
        { title: 'الدرس السابع: الحقوق السياسية للمرأة في الإسلام — صفحة 85', page: 85 },
      ],
    },
    {
      title: 'الوحدة الثالثة: "وَبِعَهْدِ اللَّهِ أَوْفُوا"',
      lessons: [
        { title: 'الدرس الأول: سورة الفرقان، الآيات الكريمة (٦٣–٧٧) — صفحة 92', page: 92 },
        { title: 'الدرس الثاني: الطلاق — صفحة 100', page: 100 },
        { title: 'الدرس الثالث: العِدّة — صفحة 107', page: 107 },
        { title: 'الدرس الرابع: الوصية في الشريعة الإسلامية — صفحة 114', page: 114 },
        { title: 'الدرس الخامس: الميراث في الشريعة الإسلامية — صفحة 119', page: 119 },
        { title: 'الدرس السادس: من خصائص الشريعة الإسلامية: الوسطية — صفحة 125', page: 125 },
        { title: 'الدرس السابع: مجالات الوقف ودورها في التنمية — صفحة 133', page: 133 },
      ],
    },
    {
      title: 'الوحدة الرابعة: "يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ"',
      lessons: [
        { title: 'الدرس الأول: الحديث الشريف: مفهوم الإفلاس بين الدنيا والآخرة — صفحة 140', page: 140 },
        { title: 'الدرس الثاني: مقاصد الشريعة الإسلامية — صفحة 145', page: 145 },
        { title: 'الدرس الثالث: منهج الإسلام في مكافحة الجريمة — صفحة 152', page: 152 },
        { title: 'الدرس الرابع: من وصايا النبي ﷺ في حجة الوداع — صفحة 159', page: 159 },
        { title: 'الدرس الخامس: المسؤولية المجتمعية في الإسلام — صفحة 166', page: 166 },
        { title: 'الدرس السادس: حقوق الإنسان بين الإسلام والإعلان العالمي لحقوق الإنسان — صفحة 171', page: 171 },
      ],
    },
  ],
  [SubjectName.JordanHistory]: [
    {
      title: 'الوحدة الأولى: الأردن في العصور القديمة (صفحة 6)',
      lessons: [
        { title: 'الدرس الأول: الأردن في العصور الحجرية – صفحة 8', page: 8 },
        { title: 'الدرس الثاني: الأردن في العصر الحديدي – صفحة 16', page: 16 },
        { title: 'الدرس الثالث: مملكة الأنباط – صفحة 22', page: 22 },
        { title: 'الدرس الرابع: مظاهر الحضارتين اليونانية والرومانية–البيزنطية في الأردن – صفحة 31', page: 31 },
      ],
    },
    {
      title: 'الوحدة الثانية: الأردن في العصور الإسلامية (صفحة 44)',
      lessons: [
        { title: 'الدرس الأول: الأردن في صدر الإسلام – صفحة 46', page: 46 },
        { title: 'الدرس الثاني: الأردن في العصرين الأموي والعباسي – صفحة 56', page: 56 },
        { title: 'الدرس الثالث: الأردن خلال حملات الفرنجة – صفحة 66', page: 66 },
        { title: 'الدرس الرابع: الأردن في العصر الأيوبي – صفحة 72', page: 72 },
        { title: 'الدرس الخامس: الأردن في العصر المملوكي – صفحة 77', page: 77 },
      ],
    },
    {
      title: 'الوحدة الثالثة: الأردن في العصر الحديث (صفحة 86)',
      lessons: [
        { title: 'الدرس الأول: الأوضاع السياسية والإدارية في الأردن في العهد العثماني – صفحة 88', page: 88 },
        { title: 'الدرس الثاني: الأوضاع الاجتماعية والاقتصادية في الأردن في العهد العثماني – صفحة 94', page: 94 },
        { title: 'الدرس الثالث: الثورة العربية الكبرى (النهضة العربية) – صفحة 105', page: 105 },
        { title: 'الدرس الرابع: الأردن في عهد المملكة العربية السورية والحكومات المحلية – صفحة 118', page: 118 },
      ],
    },
  ],
  [`${SubjectName.JordanHistory}-${Semester.Second}`]: [
    {
      title: 'الوحدة الرابعة: الحياة السياسية في الأردن (ص 6)',
      lessons: [
        { title: 'الدرس الأول: تأسيس الإمارة الأردنية — صفحة 8', page: 8 },
        { title: 'الدرس الثاني: تطور الحياة السياسية في الأردن بين عامي (1947–1999م) — صفحة 18', page: 18 },
        { title: 'الدرس الثالث: الحياة السياسية في الأردن منذ عام 1999م — صفحة 30', page: 30 },
        { title: 'الدرس الرابع: الأردن والعلاقات العربية والدولية — صفحة 37', page: 37 },
        { title: 'الدرس الخامس: القوات المسلحة الأردنية – الجيش العربي والأجهزة الأمنية — صفحة 47', page: 47 },
      ],
    },
    {
      title: 'الوحدة الخامسة: الحياة الاقتصادية في الأردن (صفحة 58)',
      lessons: [
        { title: 'الدرس الأول: الحياة الاقتصادية في الأردن بين عامي (1921–1950م) — صفحة 60', page: 60 },
        { title: 'الدرس الثاني: الحياة الاقتصادية في الأردن بين عامي (1951–1999م) — صفحة 65', page: 65 },
        { title: 'الدرس الثالث: الحياة الاقتصادية في الأردن منذ عام 1999م — صفحة 74', page: 74 },
      ],
    },
    {
      title: 'الوحدة السادسة: الحياة الاجتماعية في الأردن (صفحة 80)',
      lessons: [
        { title: 'الدرس الأول: الحياة الاجتماعية في الأردن بين عامي (1921–1950م) — صفحة 82', page: 82 },
        { title: 'الدرس الثاني: الحياة الاجتماعية في الأردن بين عامي (1951–1999م) — صفحة 89', page: 89 },
        { title: 'الدرس الثالث: الحياة الاجتماعية في الأردن منذ عام 1999م — صفحة 94', page: 94 },
      ],
    },
    {
      title: 'الوحدة السابعة: التعليم والثقافة في الأردن (صفحة 102)',
      lessons: [
        { title: 'الدرس الأول: التعليم العام في الأردن بين عامي (1921–1950م) — صفحة 104', page: 104 },
        { title: 'الدرس الثاني: التعليم العام في الأردن منذ عام 1951م — صفحة 108', page: 108 },
        { title: 'الدرس الثالث: التعليم العالي والبحث العلمي في الأردن — صفحة 114', page: 114 },
        { title: 'الدرس الرابع: الحياة الثقافية في الأردن منذ عام 1921م — صفحة 118', page: 118 },
      ],
    },
    {
      title: 'الوحدة الثامنة: الأردن والقضية الفلسطينية (صفحة 128)',
      lessons: [
        { title: 'الدرس الأول: موقف الأردن من القضية الفلسطينية بين عامي (1916–1950م) — صفحة 130', page: 130 },
        { title: 'الدرس الثاني: موقف الأردن من القضية الفلسطينية منذ عام 1950م — صفحة 136', page: 136 },
        { title: 'الدرس الثالث: الوصاية والإعمار الهاشمي للمقدسات الدينية في القدس — صفحة 142', page: 142 },
      ],
    },
  ],
  [SubjectName.Arabic]: [
    {
      title: 'الوِحْدَةُ الأُولَى: مِنَ القِيَمِ الإِنْسَانِيَّةِ فِي القُرْآنِ',
      lessons: Array.from({ length: 12 }, (_, i) => ({ title: `الوحدة الأولى - امتحان ${i + 1}`, page: 10 + i }))
    },
    {
      title: 'الوِحْدَةُ الثَّانِيَةُ: فِي حُبِّ الوَطَنِ',
      lessons: Array.from({ length: 12 }, (_, i) => ({ title: `الوحدة الثانية - امتحان ${i + 1}`, page: 25 + i }))
    },
    {
      title: 'الوِحْدَةُ الثَّالِثَةُ: أَمْرَاضُ العَصْرِ',
      lessons: Array.from({ length: 13 }, (_, i) => ({ title: `الوحدة الثالثة - امتحان ${i + 1}`, page: 40 + i }))
    },
    {
      title: 'الوِحْدَةُ الرَّابِعَةُ: الإِعْلامُ الرَّقْمِيُّ',
      lessons: Array.from({ length: 13 }, (_, i) => ({ title: `الوحدة الرابعة - امتحان ${i + 1}`, page: 55 + i }))
    },
    {
      title: 'الوِحْدَةُ الخَامِسَةُ: التَّعْلِيمُ التِّقَنِيُّ بَوَّابَةُ المُسْتَقْبَلِ',
      lessons: Array.from({ length: 14 }, (_, i) => ({ title: `الوحدة الخامسة - امتحان ${i + 1}`, page: 70 + i }))
    }
  ],
  [SubjectName.English]: [
    {
      title: 'Unit 01 – Get the message',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 01 - Exam ${i + 1}`, page: 1 + i }))
    },
    {
      title: 'Unit 02 – Looking ahead',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 02 - Exam ${i + 1}`, page: 11 + i }))
    },
    {
      title: 'Unit 03 – Influences',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 03 - Exam ${i + 1}`, page: 21 + i }))
    },
    {
      title: 'Unit 04 – Inside story',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 04 - Exam ${i + 1}`, page: 31 + i }))
    },
    {
      title: 'Unit 05 – Making sense of the senses',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 05 - Exam ${i + 1}`, page: 41 + i }))
    }
  ],
  [`${SubjectName.English}-${Semester.Second}`]: [
    {
      title: 'Unit 06 – Where we live',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 06 - Exam ${i + 1}`, page: 51 + i }))
    },
    {
      title: 'Unit 07 – Is it fair?',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 07 - Exam ${i + 1}`, page: 61 + i }))
    },
    {
      title: 'Unit 08 – Digital perspectives',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 08 - Exam ${i + 1}`, page: 71 + i }))
    },
    {
      title: 'Unit 09 – Highs and lows',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 09 - Exam ${i + 1}`, page: 81 + i }))
    },
    {
      title: 'Unit 10 – Culture vulture',
      lessons: Array.from({ length: 10 }, (_, i) => ({ title: `Unit 10 - Exam ${i + 1}`, page: 91 + i }))
    }
  ],
};
