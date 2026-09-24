import { LessonResource } from "../types";

export interface ResourceJsonLesson {
    lessonId: string;
    lessonTitle: string;
    resources: LessonResource[];
}

export interface ResourceJsonUnit {
    unitId: string;
    unitTitle: string;
    resources?: LessonResource[];
    lessons?: ResourceJsonLesson[];
}

export const INITIAL_ISLAMIC_RESOURCES: ResourceJsonUnit[] = [
  {
    "unitId": "unit1",
    "unitTitle": "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا",
    "resources": [
      {
        "resourceTitle": "مراجعة الوحدة الأولى",
        "type": "video",
        "url": "https://youtu.be/Smh12BkGXPE?si=JkfGc1bUNyjsl_Yo"
      },
      {
        "resourceTitle": "ملخص الوحدة",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان شامل(1)",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان الكتروني",
        "type": "link",
        "url": ""
      },
      {
        "resourceTitle": "",
        "type": "image",
        "url": ""
      }
    ],
    "lessons": [
      {
        "lessonId": "L1",
        "lessonTitle": "سورة آل عمران، الآيات الكريمة (١٠٢–١٠٥)",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/ITdmROpeL0o?si=imLz3j3L_PcCxcre"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/sgEULVJAaic?si=WyzO08-zo3m28mue"
          },
          {
            "resourceTitle": "مراجعة الوحدة الأولى",
            "type": "video",
            "url": "https://youtu.be/Smh12BkGXPE?si=tPq7cGTYTiP3MK-E"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L2",
        "lessonTitle": "الحديث الشريف: اتقاء الشُّبُهات",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/qBeC3R9okRg?si=7GGej4aeQ8tnU2M9"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/DjzXoaEvSOY?si=TcG5XT7SLFUFoBlE"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L3",
        "lessonTitle": "من صور الضلال",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/cdfmMkK6XVA?si=qYBFlc7yU9s23I2_"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/zjC6ZP3k_zo?si=yQz1KNsj_AeRkoIG"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L4",
        "lessonTitle": "كرامة الإنسان في الشريعة الإسلامية",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/SrmBkp_V7No?si=y9C8nCwyguLlD2xT"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/U-nOzvw-4iI?si=IOpjrgzAv4ZMQw28"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L5",
        "lessonTitle": "الزواج: مشروعيته، ومُقَدِّماته",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/SqBcHDMOkCQ?si=FJijPBB_0KUp8l0n"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/C6De1KuOU0U?si=1fw0Jx-eHKLWIIUC"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L6",
        "lessonTitle": "الجهاد في الإسلام",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/CyFMrsUIHgU?si=MmOBtFvpjytpijEe"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/NAB-Fh557Hw?si=ixAFpAIHqfyIL7sf"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      }
    ]
  },
  {
    "unitId": "unit2",
    "unitTitle": "وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا",
    "resources": [
      {
        "resourceTitle": "",
        "type": "video",
        "url": ""
      },
      {
        "resourceTitle": "ملخص الوحدة",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان شامل(1)",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان الكتروني",
        "type": "link",
        "url": ""
      },
      {
        "resourceTitle": "",
        "type": "image",
        "url": ""
      }
    ],
    "lessons": [
      {
        "lessonId": "L1",
        "lessonTitle": "جهود علماء المسلمين في خدمة القرآن الكريم",
        "resources": [
          {
            "resourceTitle": "شرح الدرس",
            "type": "video",
            "url": "https://youtu.be/6WLsWdrteGY?si=gLSpwbMc61uS_6BM"
          },
          {
            "resourceTitle": "حل أسئلة الدرس",
            "type": "video",
            "url": "https://youtu.be/WjgehAAASlA?si=5NjS-DSyPr2QNyh0"
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L2",
        "lessonTitle": "العزيمة والرخصة",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L3",
        "lessonTitle": "معركة مؤتة (8 هـ)",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L4",
        "lessonTitle": "المحرّمات من النساء",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L5",
        "lessonTitle": "التعايش الإنساني",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L6",
        "lessonTitle": "الحقوق المالية للمرأة في الإسلام",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      }
    ]
  },
  {
    "unitId": "unit3",
    "unitTitle": "وَقُلْ جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ",
    "resources": [
      {
        "resourceTitle": "",
        "type": "video",
        "url": ""
      },
      {
        "resourceTitle": "ملخص الوحدة",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان شامل(1)",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان الكتروني",
        "type": "link",
        "url": ""
      },
      {
        "resourceTitle": "",
        "type": "image",
        "url": ""
      }
    ],
    "lessons": [
      {
        "lessonId": "L1",
        "lessonTitle": "سورة آل عمران، الآيات الكريمة (١٦٩–١٧٤)",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L2",
        "lessonTitle": "الحديث الشريف: رضا الله تعالى",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L3",
        "lessonTitle": "فتح مكة (8 هـ)",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L4",
        "lessonTitle": "من خصائص الشريعة الإسلامية: الإيجابية",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L5",
        "lessonTitle": "شروط صِحَّة عَقْدِ الزواج",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L6",
        "lessonTitle": "الحقوق الاجتماعية للمرأة في الإسلام",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      }
    ]
  },
  {
    "unitId": "unit4",
    "unitTitle": "لِتَسْكُنُوا إِلَيْهَا",
    "resources": [
      {
        "resourceTitle": "",
        "type": "video",
        "url": ""
      },
      {
        "resourceTitle": "ملخص الوحدة",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان شامل(1)",
        "type": "pdf",
        "url": ""
      },
      {
        "resourceTitle": "امتحان الكتروني",
        "type": "link",
        "url": ""
      },
      {
        "resourceTitle": "",
        "type": "image",
        "url": ""
      }
    ],
    "lessons": [
      {
        "lessonId": "L1",
        "lessonTitle": "سورة الروم، الآيات الكريمة (٢١–٢٤)",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L2",
        "lessonTitle": "مكانة السنة النبوية الشريفة في التشريع الإسلامي",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L3",
        "lessonTitle": "مراعاة الأعراف في الشريعة الإسلامية",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L4",
        "lessonTitle": "حقوق الزوجين في الإسلام",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L5",
        "lessonTitle": "تنظيم النسل وتحديده",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L6",
        "lessonTitle": "الأمن الغذائي في الإسلام",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      },
      {
        "lessonId": "L7",
        "lessonTitle": "الإسلام والوحدة الوطنية",
        "resources": [
          {
            "resourceTitle": "",
            "type": "video",
            "url": ""
          },
          {
            "resourceTitle": "تلخيص الدرس",
            "type": "pdf",
            "url": ""
          },
          {
            "resourceTitle": "",
            "type": "image",
            "url": ""
          }
        ]
      }
    ]
  }
];
