import { VocabularySet, VocabularyWord } from "../types";
import { topik35ListeningWords } from "./topik-35-listening-words";
import { topik36ReadingWords } from "./topik-36-reading-words";
import { topik36ListeningWords } from "./topik-36-listening-words";
import { topik37ReadingWords } from "./topik-37-reading-words";
import { topik41ReadingWords } from "./topik-41-reading-words";
import { topik41ListeningWords } from "./topik-41-listening-words";
import { topik47ReadingWords } from "./topik-47-reading-words";
import { topik52ReadingWords } from "./topik-52-reading-words";
import { topik60ReadingWords } from "./topik-60-reading-words";
import { topik64ReadingWords } from "./topik-64-reading-words";
import { topik83ReadingWords } from "./topik-83-reading-words";
import { topik91ReadingWords } from "./topik-91-reading-words";
import { SEOUL_VOCAB_SETS, SEOUL_VOCAB_WORDS } from "./seoulHangugoWords";

// ─────────────────────────────────────────────────────────────────────────
// VOCABULARY DATA CONTRACT
// ─────────────────────────────────────────────────────────────────────────
// This is the ONLY file the rest of the app depends on for vocabulary
// content. Everything else (flashcards, quiz engine, exam engine, spaced
// repetition, statistics, teacher panel) reads from VOCAB_SETS and
// VOCAB_WORDS below — nothing else needs to change when you plug in your
// own data.
//
// Shape reference (see lib/types.ts for the full type):
//
//   VocabularySet {
//     id: string            e.g. "topik-35-reading"
//     topikLevel: number    grouped level 1-6, used for /statistics progress
//     setNumber: number     e.g. 35
//     title: string         e.g. "35-TOPIK 읽기"
//     description: string
//     wordCount: number
//   }
//
//   VocabularyWord {
//     id: string             unique, e.g. "topik-35-reading-1"
//     setId: string          must match a VocabularySet.id
//     koreanWord: string
//     pronunciation: string  romanization
//     uzbekTranslation: string
//     exampleSentenceKo: string
//     exampleSentenceUz: string
//     synonym?: string
//     antonym?: string
//     partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "expression"
//     audioUrl?: string
//     imageUrl?: string
//     topic: string
//     order: number
//   }
//
// HOW TO ADD MORE SETS (e.g. 35-TOPIK 듣기):
//   1. Write a new array following the same shape as topik35ReadingWords
//      below (unique id/setId per set, e.g. "topik-35-listening").
//   2. Add its VocabularySet entry next to TOPIK_35_READING_SET.
//   3. Push both into the VOCAB_SETS / VOCAB_WORDS arrays at the bottom.
// ─────────────────────────────────────────────────────────────────────────

// Eslatma: manba ro'yxatida bir nechta so'zlar aniq matn xatosi (typo) bilan berilgan edi.
// Ular eng yaqin va mantiqan to'g'ri so'zga tuzatildi (masalan: 동근→둥근, 데다가→게다가,
// 자유럽다→자유롭다, 반박심→반발심, 의눈하다→의논하다, 볽다→붉다, 농양→농업,
// 응답한다→응답하다, 도리아→도리어, 단성되다→형성되다, 휫수→횟수).
// "코코의" so'zi kontekstsiz noaniq bo'lganligi uchun eng yaqin talqin bilan kiritildi.

export const topik35ReadingWords: VocabularyWord[] = [
  { id: "topik-35-reading-1", setId: "topik-35-reading", koreanWord: "바로", pronunciation: "baro", uzbekTranslation: "aynan; darhol", exampleSentenceKo: "바로 이 자리에서 만나요.", exampleSentenceUz: "Aynan shu joyda uchrashamiz.", partOfSpeech: "adverb", topic: "Umumiy so'zlar", order: 1 },
  { id: "topik-35-reading-2", setId: "topik-35-reading", koreanWord: "이사하다", pronunciation: "isahada", uzbekTranslation: "ko'chib o'tmoq", exampleSentenceKo: "다음 달에 새 집으로 이사해요.", exampleSentenceUz: "Kelasi oy yangi uyga ko'chib o'tamiz.", partOfSpeech: "verb", topic: "Umumiy so'zlar", order: 2 },
  { id: "topik-35-reading-3", setId: "topik-35-reading", koreanWord: "눈물이 나다", pronunciation: "nunmuri nada", uzbekTranslation: "ko'z yosh chiqmoq", exampleSentenceKo: "영화를 보다가 눈물이 났어요.", exampleSentenceUz: "Film ko'rayotib ko'z yoshim chiqdi.", partOfSpeech: "expression", topic: "Umumiy so'zlar", order: 3 },
  { id: "topik-35-reading-4", setId: "topik-35-reading", koreanWord: "세상", pronunciation: "sesang", uzbekTranslation: "dunyo", exampleSentenceKo: "세상은 넓고 할 일은 많다.", exampleSentenceUz: "Dunyo katta va qiladigan ishlar ko'p.", partOfSpeech: "noun", topic: "Umumiy so'zlar", order: 4 },
  { id: "topik-35-reading-5", setId: "topik-35-reading", koreanWord: "상담", pronunciation: "sangdam", uzbekTranslation: "maslahat, konsultatsiya", exampleSentenceKo: "진로 상담을 받으러 갔어요.", exampleSentenceUz: "Kasb tanlash bo'yicha maslahatga bordim.", partOfSpeech: "noun", topic: "Umumiy so'zlar", order: 5 },
  { id: "topik-35-reading-6", setId: "topik-35-reading", koreanWord: "수술하다", pronunciation: "susulhada", uzbekTranslation: "operatsiya qilmoq", exampleSentenceKo: "어제 무릎을 수술했어요.", exampleSentenceUz: "Kecha tizzamga operatsiya qilishdi.", partOfSpeech: "verb", topic: "Umumiy so'zlar", order: 6 },
  { id: "topik-35-reading-7", setId: "topik-35-reading", koreanWord: "숲", pronunciation: "sup", uzbekTranslation: "o'rmon", exampleSentenceKo: "숲속에서 산책을 했어요.", exampleSentenceUz: "O'rmon ichida sayr qildim.", partOfSpeech: "noun", topic: "Umumiy so'zlar", order: 7 },
  { id: "topik-35-reading-8", setId: "topik-35-reading", koreanWord: "궁금하다", pronunciation: "gunggeumhada", uzbekTranslation: "qiziqmoq, bilgisi kelmoq", exampleSentenceKo: "결과가 너무 궁금해요.", exampleSentenceUz: "Natijani bilishga juda qiziqyapman.", partOfSpeech: "adjective", topic: "Umumiy so'zlar", order: 8 },
  { id: "topik-35-reading-9", setId: "topik-35-reading", koreanWord: "박람회", pronunciation: "bangnamhoe", uzbekTranslation: "ko'rgazma, yarmarka", exampleSentenceKo: "애완동물 박람회에 다녀왔어요.", exampleSentenceUz: "Uy hayvonlari ko'rgazmasiga bordim.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 9 },
  { id: "topik-35-reading-10", setId: "topik-35-reading", koreanWord: "단체", pronunciation: "danche", uzbekTranslation: "guruh, tashkilot", exampleSentenceKo: "단체로 입장하면 할인돼요.", exampleSentenceUz: "Guruh bo'lib kirsangiz chegirma bo'ladi.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 10 },
  { id: "topik-35-reading-11", setId: "topik-35-reading", koreanWord: "입장권", pronunciation: "ipjanggwon", uzbekTranslation: "kirish bileti", exampleSentenceKo: "입장권은 미리 예매하세요.", exampleSentenceUz: "Kirish biletini oldindan buyurtma qiling.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 11 },
  { id: "topik-35-reading-12", setId: "topik-35-reading", koreanWord: "애완동물", pronunciation: "aewandongmul", uzbekTranslation: "uy hayvoni", exampleSentenceKo: "저는 애완동물을 키우고 싶어요.", exampleSentenceUz: "Men uy hayvoni boqmoqchiman.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 12 },
  { id: "topik-35-reading-13", setId: "topik-35-reading", koreanWord: "주인", pronunciation: "juin", uzbekTranslation: "egasi", exampleSentenceKo: "강아지 주인이 누구예요?", exampleSentenceUz: "Kuchukning egasi kim?", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 13 },
  { id: "topik-35-reading-14", setId: "topik-35-reading", koreanWord: "포스터", pronunciation: "poseuteo", uzbekTranslation: "plakat", exampleSentenceKo: "행사 포스터를 벽에 붙였어요.", exampleSentenceUz: "Tadbir plakatini devorga yopishtirdim.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 14 },
  { id: "topik-35-reading-15", setId: "topik-35-reading", koreanWord: "추억", pronunciation: "chueok", uzbekTranslation: "xotira", exampleSentenceKo: "좋은 추억을 만들었어요.", exampleSentenceUz: "Yaxshi xotiralar qoldirdim.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 15 },
  { id: "topik-35-reading-16", setId: "topik-35-reading", koreanWord: "관람하다", pronunciation: "gwallamhada", uzbekTranslation: "tomosha qilmoq", exampleSentenceKo: "전시회를 관람했어요.", exampleSentenceUz: "Ko'rgazmani tomosha qildim.", partOfSpeech: "verb", topic: "Uy hayvonlari ko'rgazmasi", order: 16 },
  { id: "topik-35-reading-17", setId: "topik-35-reading", koreanWord: "남녀노소", pronunciation: "namnyeonoso", uzbekTranslation: "yosh-u qari, erkak-ayol", exampleSentenceKo: "이 행사는 남녀노소 모두 즐길 수 있어요.", exampleSentenceUz: "Bu tadbirdan hamma, yoshu qari zavqlanadi.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 17 },
  { id: "topik-35-reading-18", setId: "topik-35-reading", koreanWord: "최근", pronunciation: "choegeun", uzbekTranslation: "yaqinda, so'nggi paytda", exampleSentenceKo: "최근 관람객이 많이 늘었어요.", exampleSentenceUz: "Yaqinda tomoshabinlar soni ko'paydi.", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 18 },
  { id: "topik-35-reading-19", setId: "topik-35-reading", koreanWord: "입장료", pronunciation: "ipjangnyo", uzbekTranslation: "kirish narxi", exampleSentenceKo: "입장료가 얼마예요?", exampleSentenceUz: "Kirish narxi qancha?", partOfSpeech: "noun", topic: "Uy hayvonlari ko'rgazmasi", order: 19 },
  { id: "topik-35-reading-20", setId: "topik-35-reading", koreanWord: "유행하다", pronunciation: "yuhaenghada", uzbekTranslation: "moda bo'lmoq", exampleSentenceKo: "요즘 이 스타일이 유행해요.", exampleSentenceUz: "Hozirda shu uslub modada.", partOfSpeech: "verb", topic: "Niqob taqish tendensiyasi", order: 20 },
  { id: "topik-35-reading-21", setId: "topik-35-reading", koreanWord: "간단하다", pronunciation: "gandanhada", uzbekTranslation: "oddiy, sodda", exampleSentenceKo: "만드는 방법이 간단해요.", exampleSentenceUz: "Tayyorlash usuli oddiy.", partOfSpeech: "adjective", topic: "Niqob taqish tendensiyasi", order: 21 },
  { id: "topik-35-reading-22", setId: "topik-35-reading", koreanWord: "내부에", pronunciation: "naebue", uzbekTranslation: "ichida", exampleSentenceKo: "가면 내부에 부드러운 천을 댔어요.", exampleSentenceUz: "Niqob ichiga yumshoq mato qo'yildi.", partOfSpeech: "adverb", topic: "Niqob taqish tendensiyasi", order: 22 },
  { id: "topik-35-reading-23", setId: "topik-35-reading", koreanWord: "가면을 쓰다", pronunciation: "gamyeoneul sseuda", uzbekTranslation: "niqob taqmoq", exampleSentenceKo: "아이들이 가면을 쓰고 놀아요.", exampleSentenceUz: "Bolalar niqob taqib o'ynashyapti.", partOfSpeech: "expression", topic: "Niqob taqish tendensiyasi", order: 23 },
  { id: "topik-35-reading-24", setId: "topik-35-reading", koreanWord: "현실", pronunciation: "hyeonsil", uzbekTranslation: "haqiqat, real hayot", exampleSentenceKo: "현실을 받아들여야 해요.", exampleSentenceUz: "Haqiqatni qabul qilish kerak.", partOfSpeech: "noun", topic: "Niqob taqish tendensiyasi", order: 24 },
  { id: "topik-35-reading-25", setId: "topik-35-reading", koreanWord: "표현하다", pronunciation: "pyohyeonhada", uzbekTranslation: "ifodalamoq", exampleSentenceKo: "감정을 자유롭게 표현했어요.", exampleSentenceUz: "His-tuyg'ularini erkin ifoda etdi.", partOfSpeech: "verb", topic: "Niqob taqish tendensiyasi", order: 25 },
  { id: "topik-35-reading-26", setId: "topik-35-reading", koreanWord: "약하다", pronunciation: "yakhada", uzbekTranslation: "kuchsiz, zaif", exampleSentenceKo: "이 재료는 약해서 쉽게 부서져요.", exampleSentenceUz: "Bu material zaif, tez sinadi.", partOfSpeech: "adjective", topic: "Niqob taqish tendensiyasi", order: 26 },
  { id: "topik-35-reading-27", setId: "topik-35-reading", koreanWord: "세다", pronunciation: "seda", uzbekTranslation: "kuchli", exampleSentenceKo: "바람이 아주 세게 불어요.", exampleSentenceUz: "Shamol juda kuchli esyapti.", partOfSpeech: "adjective", topic: "Niqob taqish tendensiyasi", order: 27 },
  { id: "topik-35-reading-28", setId: "topik-35-reading", koreanWord: "호랑이", pronunciation: "horangi", uzbekTranslation: "yo'lbars", exampleSentenceKo: "호랑이 가면이 인기가 많아요.", exampleSentenceUz: "Yo'lbars niqobi mashhur.", partOfSpeech: "noun", topic: "Niqob taqish tendensiyasi", order: 28 },
  { id: "topik-35-reading-29", setId: "topik-35-reading", koreanWord: "행동하다", pronunciation: "haengdonghada", uzbekTranslation: "harakat qilmoq", exampleSentenceKo: "생각한 대로 행동하세요.", exampleSentenceUz: "O'ylaganingizdek harakat qiling.", partOfSpeech: "verb", topic: "Niqob taqish tendensiyasi", order: 29 },
  { id: "topik-35-reading-30", setId: "topik-35-reading", koreanWord: "스스로", pronunciation: "seuseuro", uzbekTranslation: "o'zi, mustaqil ravishda", exampleSentenceKo: "숙제를 스스로 해요.", exampleSentenceUz: "Vazifani o'zi bajaradi.", partOfSpeech: "adverb", topic: "Niqob taqish tendensiyasi", order: 30 },
  { id: "topik-35-reading-31", setId: "topik-35-reading", koreanWord: "원하다", pronunciation: "wonhada", uzbekTranslation: "xohlamoq", exampleSentenceKo: "무엇을 원하는지 말해 보세요.", exampleSentenceUz: "Nima xohlashingizni ayting.", partOfSpeech: "verb", topic: "Niqob taqish tendensiyasi", order: 31 },
  { id: "topik-35-reading-32", setId: "topik-35-reading", koreanWord: "모습", pronunciation: "moseup", uzbekTranslation: "qiyofa, ko'rinish", exampleSentenceKo: "예전 모습 그대로예요.", exampleSentenceUz: "Avvalgi qiyofasi bilan bir xil.", partOfSpeech: "noun", topic: "Niqob taqish tendensiyasi", order: 32 },
  { id: "topik-35-reading-33", setId: "topik-35-reading", koreanWord: "제작", pronunciation: "jejak", uzbekTranslation: "ishlab chiqarish, tayyorlash", exampleSentenceKo: "유니폼 제작에 시간이 걸려요.", exampleSentenceUz: "Formani tayyorlash vaqt oladi.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 33 },
  { id: "topik-35-reading-34", setId: "topik-35-reading", koreanWord: "비용", pronunciation: "biyong", uzbekTranslation: "xarajat", exampleSentenceKo: "제작 비용이 많이 들어요.", exampleSentenceUz: "Ishlab chiqarish xarajati ko'p.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 34 },
  { id: "topik-35-reading-35", setId: "topik-35-reading", koreanWord: "선수", pronunciation: "seonsu", uzbekTranslation: "sportchi", exampleSentenceKo: "선수들이 유니폼을 입었어요.", exampleSentenceUz: "Sportchilar forma kiyishdi.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 35 },
  { id: "topik-35-reading-36", setId: "topik-35-reading", koreanWord: "유니폼", pronunciation: "yuniform", uzbekTranslation: "sport formasi", exampleSentenceKo: "새 유니폼을 받았어요.", exampleSentenceUz: "Yangi forma oldim.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 36 },
  { id: "topik-35-reading-37", setId: "topik-35-reading", koreanWord: "플라스틱", pronunciation: "peullaseutik", uzbekTranslation: "plastik", exampleSentenceKo: "플라스틱 병을 모았어요.", exampleSentenceUz: "Plastik shishalarni yig'ib oldim.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 37 },
  { id: "topik-35-reading-38", setId: "topik-35-reading", koreanWord: "재활용하다", pronunciation: "jaehwallyonghada", uzbekTranslation: "qayta ishlamoq", exampleSentenceKo: "플라스틱을 재활용해서 옷을 만들어요.", exampleSentenceUz: "Plastikni qayta ishlab kiyim tikishadi.", partOfSpeech: "verb", topic: "Sport formasini qayta ishlash", order: 38 },
  { id: "topik-35-reading-39", setId: "topik-35-reading", koreanWord: "운동복", pronunciation: "undongbok", uzbekTranslation: "sport kiyimi", exampleSentenceKo: "운동복을 입고 뛰었어요.", exampleSentenceUz: "Sport kiyimida yugurdim.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 39 },
  { id: "topik-35-reading-40", setId: "topik-35-reading", koreanWord: "시원하다", pronunciation: "siwonhada", uzbekTranslation: "salqin, yoqimli", exampleSentenceKo: "이 옷감은 시원해서 여름에 좋아요.", exampleSentenceUz: "Bu mato salqin, yozga yaxshi.", partOfSpeech: "adjective", topic: "Sport formasini qayta ishlash", order: 40 },
  { id: "topik-35-reading-41", setId: "topik-35-reading", koreanWord: "짝", pronunciation: "jjak", uzbekTranslation: "juft", exampleSentenceKo: "양말 짝이 안 맞아요.", exampleSentenceUz: "Paypoqning jufti mos kelmayapti.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 41 },
  { id: "topik-35-reading-42", setId: "topik-35-reading", koreanWord: "순간", pronunciation: "sungan", uzbekTranslation: "lahza", exampleSentenceKo: "그 순간을 잊지 못해요.", exampleSentenceUz: "O'sha lahzani unuta olmayman.", partOfSpeech: "noun", topic: "Sport formasini qayta ishlash", order: 42 },
  { id: "topik-35-reading-43", setId: "topik-35-reading", koreanWord: "떨어뜨리다", pronunciation: "tteoreotteurida", uzbekTranslation: "tushirib yubormoq", exampleSentenceKo: "컵을 떨어뜨려서 깨졌어요.", exampleSentenceUz: "Piyolani tushirib yuborib sindirdim.", partOfSpeech: "verb", topic: "Sport formasini qayta ishlash", order: 43 },
  { id: "topik-35-reading-44", setId: "topik-35-reading", koreanWord: "희망하다", pronunciation: "huimanghada", uzbekTranslation: "umid qilmoq", exampleSentenceKo: "좋은 결과를 희망해요.", exampleSentenceUz: "Yaxshi natijani umid qilaman.", partOfSpeech: "verb", topic: "Sport formasini qayta ishlash", order: 44 },
  { id: "topik-35-reading-45", setId: "topik-35-reading", koreanWord: "지원", pronunciation: "jiwon", uzbekTranslation: "yordam, qo'llab-quvvatlash", exampleSentenceKo: "정부 지원을 받았어요.", exampleSentenceUz: "Hukumat yordamini oldim.", partOfSpeech: "noun", topic: "Davlat siyosati va byudjet", order: 45 },
  { id: "topik-35-reading-46", setId: "topik-35-reading", koreanWord: "사업", pronunciation: "saeop", uzbekTranslation: "loyiha, biznes", exampleSentenceKo: "새 사업을 시작했어요.", exampleSentenceUz: "Yangi loyihani boshladim.", partOfSpeech: "noun", topic: "Davlat siyosati va byudjet", order: 46 },
  { id: "topik-35-reading-47", setId: "topik-35-reading", koreanWord: "운행", pronunciation: "unhaeng", uzbekTranslation: "qatnov (transport)", exampleSentenceKo: "버스 운행이 늘었어요.", exampleSentenceUz: "Avtobus qatnovi ko'paydi.", partOfSpeech: "noun", topic: "Davlat siyosati va byudjet", order: 47 },
  { id: "topik-35-reading-48", setId: "topik-35-reading", koreanWord: "비해", pronunciation: "bihae", uzbekTranslation: "solishtirganda", exampleSentenceKo: "작년에 비해 많이 늘었어요.", exampleSentenceUz: "O'tgan yilga solishtirganda ko'p oshdi.", partOfSpeech: "adverb", topic: "Davlat siyosati va byudjet", order: 48 },
  { id: "topik-35-reading-49", setId: "topik-35-reading", koreanWord: "예산", pronunciation: "yesan", uzbekTranslation: "byudjet", exampleSentenceKo: "예산이 부족해요.", exampleSentenceUz: "Byudjet yetarli emas.", partOfSpeech: "noun", topic: "Davlat siyosati va byudjet", order: 49 },
  { id: "topik-35-reading-50", setId: "topik-35-reading", koreanWord: "정부", pronunciation: "jeongbu", uzbekTranslation: "hukumat", exampleSentenceKo: "정부가 새 정책을 발표했어요.", exampleSentenceUz: "Hukumat yangi siyosat e'lon qildi.", partOfSpeech: "noun", topic: "Davlat siyosati va byudjet", order: 50 },
  { id: "topik-35-reading-51", setId: "topik-35-reading", koreanWord: "아끼다", pronunciation: "akkida", uzbekTranslation: "tejamoq, ayamoq", exampleSentenceKo: "돈을 아껴서 저축해요.", exampleSentenceUz: "Pulni tejab jamg'arma qilaman.", partOfSpeech: "verb", topic: "Davlat siyosati va byudjet", order: 51 },
  { id: "topik-35-reading-52", setId: "topik-35-reading", koreanWord: "추가", pronunciation: "chuga", uzbekTranslation: "qo'shimcha", exampleSentenceKo: "추가 요금이 있어요.", exampleSentenceUz: "Qo'shimcha to'lov bor.", partOfSpeech: "noun", topic: "Davlat siyosati va byudjet", order: 52 },
  { id: "topik-35-reading-53", setId: "topik-35-reading", koreanWord: "부담하다", pronunciation: "budamhada", uzbekTranslation: "yuklamoq (xarajatni)", exampleSentenceKo: "비용을 반씩 부담하기로 했어요.", exampleSentenceUz: "Xarajatni yarim-yarim to'lashga kelishdik.", partOfSpeech: "verb", topic: "Davlat siyosati va byudjet", order: 53 },
  { id: "topik-35-reading-54", setId: "topik-35-reading", koreanWord: "등장하다", pronunciation: "deungjanghada", uzbekTranslation: "paydo bo'lmoq", exampleSentenceKo: "새로운 서비스가 등장했어요.", exampleSentenceUz: "Yangi xizmat paydo bo'ldi.", partOfSpeech: "verb", topic: "Davlat siyosati va byudjet", order: 54 },
  { id: "topik-35-reading-55", setId: "topik-35-reading", koreanWord: "업무", pronunciation: "eommu", uzbekTranslation: "ish vazifasi", exampleSentenceKo: "업무가 너무 많아요.", exampleSentenceUz: "Ish vazifalari juda ko'p.", partOfSpeech: "noun", topic: "Ish va oila", order: 55 },
  { id: "topik-35-reading-56", setId: "topik-35-reading", koreanWord: "인간관계", pronunciation: "inganggwangye", uzbekTranslation: "insoniy munosabatlar", exampleSentenceKo: "직장에서 인간관계가 중요해요.", exampleSentenceUz: "Ish joyida insoniy munosabatlar muhim.", partOfSpeech: "noun", topic: "Ish va oila", order: 56 },
  { id: "topik-35-reading-57", setId: "topik-35-reading", koreanWord: "기혼", pronunciation: "gihon", uzbekTranslation: "turmush qurgan", exampleSentenceKo: "기혼 여성이 늘고 있어요.", exampleSentenceUz: "Turmush qurgan ayollar soni oshmoqda.", partOfSpeech: "noun", topic: "Ish va oila", order: 57 },
  { id: "topik-35-reading-58", setId: "topik-35-reading", koreanWord: "여성", pronunciation: "yeoseong", uzbekTranslation: "ayol", exampleSentenceKo: "많은 여성들이 일하고 있어요.", exampleSentenceUz: "Ko'plab ayollar ishlashyapti.", partOfSpeech: "noun", topic: "Ish va oila", order: 58 },
  { id: "topik-35-reading-59", setId: "topik-35-reading", koreanWord: "육아", pronunciation: "yuga", uzbekTranslation: "bola tarbiyasi", exampleSentenceKo: "육아와 일을 같이 하기 힘들어요.", exampleSentenceUz: "Bola tarbiyasi va ishni birga olib borish qiyin.", partOfSpeech: "noun", topic: "Ish va oila", order: 59 },
  { id: "topik-35-reading-60", setId: "topik-35-reading", koreanWord: "여전히", pronunciation: "yeojeonhi", uzbekTranslation: "hali ham", exampleSentenceKo: "여전히 문제가 남아 있어요.", exampleSentenceUz: "Hali ham muammo qolmoqda.", partOfSpeech: "adverb", topic: "Ish va oila", order: 60 },
  { id: "topik-35-reading-61", setId: "topik-35-reading", koreanWord: "승진하다", pronunciation: "seungjinhada", uzbekTranslation: "lavozimi ko'tarilmoq", exampleSentenceKo: "이번에 부장으로 승진했어요.", exampleSentenceUz: "Bu safar bo'lim boshlig'iga ko'tarildim.", partOfSpeech: "verb", topic: "Ish va oila", order: 61 },
  { id: "topik-35-reading-62", setId: "topik-35-reading", koreanWord: "추석", pronunciation: "chuseok", uzbekTranslation: "Chusok bayrami", exampleSentenceKo: "추석에 가족들이 모여요.", exampleSentenceUz: "Chusok bayramida oila yig'iladi.", partOfSpeech: "noun", topic: "Chusok bayrami", order: 62 },
  { id: "topik-35-reading-63", setId: "topik-35-reading", koreanWord: "환하다", pronunciation: "hwanhada", uzbekTranslation: "yorqin, nurli", exampleSentenceKo: "달빛이 환하게 비쳐요.", exampleSentenceUz: "Oy nuri yorqin porlaydi.", partOfSpeech: "adjective", topic: "Chusok bayrami", order: 63 },
  { id: "topik-35-reading-64", setId: "topik-35-reading", koreanWord: "둥근", pronunciation: "dunggeun", uzbekTranslation: "yumaloq", exampleSentenceKo: "둥근 보름달이 떴어요.", exampleSentenceUz: "Yumaloq to'lin oy chiqdi.", partOfSpeech: "adjective", topic: "Chusok bayrami", order: 64 },
  { id: "topik-35-reading-65", setId: "topik-35-reading", koreanWord: "보름달이 뜨다", pronunciation: "boreumdari tteuda", uzbekTranslation: "to'lin oy chiqmoq", exampleSentenceKo: "오늘 밤 보름달이 떠요.", exampleSentenceUz: "Bugun kechqurun to'lin oy chiqadi.", partOfSpeech: "expression", topic: "Chusok bayrami", order: 65 },
  { id: "topik-35-reading-66", setId: "topik-35-reading", koreanWord: "반달", pronunciation: "bandal", uzbekTranslation: "yarim oy", exampleSentenceKo: "하늘에 반달이 떠 있어요.", exampleSentenceUz: "Osmonda yarim oy ko'rinib turibdi.", partOfSpeech: "noun", topic: "Chusok bayrami", order: 66 },
  { id: "topik-35-reading-67", setId: "topik-35-reading", koreanWord: "미래", pronunciation: "mirae", uzbekTranslation: "kelajak", exampleSentenceKo: "밝은 미래를 꿈꿔요.", exampleSentenceUz: "Yorqin kelajakni orzu qilaman.", partOfSpeech: "noun", topic: "Chusok bayrami", order: 67 },
  { id: "topik-35-reading-68", setId: "topik-35-reading", koreanWord: "의미하다", pronunciation: "uimihada", uzbekTranslation: "anglatmoq", exampleSentenceKo: "이 단어는 무엇을 의미해요?", exampleSentenceUz: "Bu so'z nimani anglatadi?", partOfSpeech: "verb", topic: "Chusok bayrami", order: 68 },
  { id: "topik-35-reading-69", setId: "topik-35-reading", koreanWord: "즉", pronunciation: "jeuk", uzbekTranslation: "ya'ni", exampleSentenceKo: "즉, 다시 말하면 이런 뜻이에요.", exampleSentenceUz: "Ya'ni, boshqacha aytganda, shunday ma'noni bildiradi.", partOfSpeech: "adverb", topic: "Chusok bayrami", order: 69 },
  { id: "topik-35-reading-70", setId: "topik-35-reading", koreanWord: "완전하다", pronunciation: "wanjeonhada", uzbekTranslation: "to'liq, mukammal", exampleSentenceKo: "완전한 원의 모양이에요.", exampleSentenceUz: "To'liq doira shaklida.", partOfSpeech: "adjective", topic: "Chusok bayrami", order: 70 },
  { id: "topik-35-reading-71", setId: "topik-35-reading", koreanWord: "모양", pronunciation: "moyang", uzbekTranslation: "shakl", exampleSentenceKo: "달의 모양이 매일 바뀌어요.", exampleSentenceUz: "Oyning shakli har kuni o'zgaradi.", partOfSpeech: "noun", topic: "Chusok bayrami", order: 71 },
  { id: "topik-35-reading-72", setId: "topik-35-reading", koreanWord: "발전하다", pronunciation: "baljeonhada", uzbekTranslation: "rivojlanmoq", exampleSentenceKo: "기술이 빠르게 발전해요.", exampleSentenceUz: "Texnologiya tez rivojlanmoqda.", partOfSpeech: "verb", topic: "Ovqatlanish tezligini o'lchash", order: 72 },
  { id: "topik-35-reading-73", setId: "topik-35-reading", koreanWord: "나가다", pronunciation: "nagada", uzbekTranslation: "chiqib ketmoq", exampleSentenceKo: "밖으로 나가서 놀아요.", exampleSentenceUz: "Tashqariga chiqib o'ynayman.", partOfSpeech: "verb", topic: "Ovqatlanish tezligini o'lchash", order: 73 },
  { id: "topik-35-reading-74", setId: "topik-35-reading", koreanWord: "포함되다", pronunciation: "pohamdoeda", uzbekTranslation: "kiritilmoq, o'z ichiga olmoq", exampleSentenceKo: "가격에 세금이 포함되어 있어요.", exampleSentenceUz: "Narxga soliq kiritilgan.", partOfSpeech: "verb", topic: "Ovqatlanish tezligini o'lchash", order: 74 },
  { id: "topik-35-reading-75", setId: "topik-35-reading", koreanWord: "소화", pronunciation: "sohwa", uzbekTranslation: "ovqat hazm qilish", exampleSentenceKo: "빨리 먹으면 소화가 잘 안돼요.", exampleSentenceUz: "Tez yesangiz ovqat yaxshi hazm bo'lmaydi.", partOfSpeech: "noun", topic: "Ovqatlanish tezligini o'lchash", order: 75 },
  { id: "topik-35-reading-76", setId: "topik-35-reading", koreanWord: "속도", pronunciation: "sokdo", uzbekTranslation: "tezlik", exampleSentenceKo: "먹는 속도를 조절해 보세요.", exampleSentenceUz: "Ovqatlanish tezligini boshqarib ko'ring.", partOfSpeech: "noun", topic: "Ovqatlanish tezligini o'lchash", order: 76 },
  { id: "topik-35-reading-77", setId: "topik-35-reading", koreanWord: "조절하다", pronunciation: "jojeolhada", uzbekTranslation: "sozlamoq, moslashtirmoq", exampleSentenceKo: "온도를 조절할 수 있어요.", exampleSentenceUz: "Haroratni sozlash mumkin.", partOfSpeech: "verb", topic: "Ovqatlanish tezligini o'lchash", order: 77 },
  { id: "topik-35-reading-78", setId: "topik-35-reading", koreanWord: "포크", pronunciation: "pokeu", uzbekTranslation: "vilka", exampleSentenceKo: "포크로 음식을 먹어요.", exampleSentenceUz: "Vilka bilan ovqat yeyman.", partOfSpeech: "noun", topic: "Ovqatlanish tezligini o'lchash", order: 78 },
  { id: "topik-35-reading-79", setId: "topik-35-reading", koreanWord: "횟수", pronunciation: "hoetsu", uzbekTranslation: "marta soni", exampleSentenceKo: "씹는 횟수를 늘려 보세요.", exampleSentenceUz: "Chaynash sonini oshirib ko'ring.", partOfSpeech: "noun", topic: "Ovqatlanish tezligini o'lchash", order: 79 },
  { id: "topik-35-reading-80", setId: "topik-35-reading", koreanWord: "측정하다", pronunciation: "cheukjeonghada", uzbekTranslation: "o'lchamoq", exampleSentenceKo: "속도를 측정하는 기계예요.", exampleSentenceUz: "Bu tezlikni o'lchaydigan qurilma.", partOfSpeech: "verb", topic: "Ovqatlanish tezligini o'lchash", order: 80 },
  { id: "topik-35-reading-81", setId: "topik-35-reading", koreanWord: "경고하다", pronunciation: "gyeonggohada", uzbekTranslation: "ogohlantirmoq", exampleSentenceKo: "너무 빠르다고 경고했어요.", exampleSentenceUz: "Juda tez deb ogohlantirdim.", partOfSpeech: "verb", topic: "Ovqatlanish tezligini o'lchash", order: 81 },
  { id: "topik-35-reading-82", setId: "topik-35-reading", koreanWord: "익히다", pronunciation: "ikida", uzbekTranslation: "pishirmoq; o'rgatib olmoq", exampleSentenceKo: "고기를 충분히 익혀서 드세요.", exampleSentenceUz: "Go'shtni yetarlicha pishirib yeng.", partOfSpeech: "verb", topic: "Meva va oziq-ovqat", order: 82 },
  { id: "topik-35-reading-83", setId: "topik-35-reading", koreanWord: "화학 물질", pronunciation: "hwahak muljil", uzbekTranslation: "kimyoviy modda", exampleSentenceKo: "화학 물질을 사용하지 않았어요.", exampleSentenceUz: "Kimyoviy modda ishlatilmagan.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 83 },
  { id: "topik-35-reading-84", setId: "topik-35-reading", koreanWord: "겉", pronunciation: "geot", uzbekTranslation: "tashqi tomon", exampleSentenceKo: "겉은 딱딱하고 속은 부드러워요.", exampleSentenceUz: "Tashqi tomoni qattiq, ichi yumshoq.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 84 },
  { id: "topik-35-reading-85", setId: "topik-35-reading", koreanWord: "속", pronunciation: "sok", uzbekTranslation: "ichki tomon", exampleSentenceKo: "속이 노란 과일이에요.", exampleSentenceUz: "Ichi sariq mevadir.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 85 },
  { id: "topik-35-reading-86", setId: "topik-35-reading", koreanWord: "대개", pronunciation: "daegae", uzbekTranslation: "odatda", exampleSentenceKo: "대개 여름에 많이 먹어요.", exampleSentenceUz: "Odatda yozda ko'p iste'mol qilishadi.", partOfSpeech: "adverb", topic: "Meva va oziq-ovqat", order: 86 },
  { id: "topik-35-reading-87", setId: "topik-35-reading", koreanWord: "숙성되다", pronunciation: "suksseongdoeda", uzbekTranslation: "yetilmoq, pishmoq", exampleSentenceKo: "과일이 서서히 숙성돼요.", exampleSentenceUz: "Meva asta-sekin pishib yetiladi.", partOfSpeech: "verb", topic: "Meva va oziq-ovqat", order: 87 },
  { id: "topik-35-reading-88", setId: "topik-35-reading", koreanWord: "향", pronunciation: "hyang", uzbekTranslation: "hid, aroma", exampleSentenceKo: "향이 아주 좋아요.", exampleSentenceUz: "Hidi juda yoqimli.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 88 },
  { id: "topik-35-reading-89", setId: "topik-35-reading", koreanWord: "껍질", pronunciation: "kkeopjil", uzbekTranslation: "po'st", exampleSentenceKo: "껍질을 벗기고 드세요.", exampleSentenceUz: "Po'stini archib yeng.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 89 },
  { id: "topik-35-reading-90", setId: "topik-35-reading", koreanWord: "지속적", pronunciation: "jisokjeok", uzbekTranslation: "davomiy", exampleSentenceKo: "지속적인 관리가 필요해요.", exampleSentenceUz: "Davomiy g'amxo'rlik kerak.", partOfSpeech: "adjective", topic: "Meva va oziq-ovqat", order: 90 },
  { id: "topik-35-reading-91", setId: "topik-35-reading", koreanWord: "인공", pronunciation: "ingong", uzbekTranslation: "sun'iy", exampleSentenceKo: "인공 색소를 넣지 않았어요.", exampleSentenceUz: "Sun'iy bo'yoq qo'shilmagan.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 91 },
  { id: "topik-35-reading-92", setId: "topik-35-reading", koreanWord: "선택하다", pronunciation: "seontaekhada", uzbekTranslation: "tanlamoq", exampleSentenceKo: "신선한 과일을 선택했어요.", exampleSentenceUz: "Yangi mevani tanladim.", partOfSpeech: "verb", topic: "Meva va oziq-ovqat", order: 92 },
  { id: "topik-35-reading-93", setId: "topik-35-reading", koreanWord: "고르다", pronunciation: "goreuda", uzbekTranslation: "tanlamoq, saralamoq", exampleSentenceKo: "좋은 것만 골랐어요.", exampleSentenceUz: "Faqat yaxshisini tanladim.", partOfSpeech: "verb", topic: "Meva va oziq-ovqat", order: 93 },
  { id: "topik-35-reading-94", setId: "topik-35-reading", koreanWord: "정보", pronunciation: "jeongbo", uzbekTranslation: "ma'lumot", exampleSentenceKo: "인터넷에서 정보를 찾았어요.", exampleSentenceUz: "Internetdan ma'lumot topdim.", partOfSpeech: "noun", topic: "Meva va oziq-ovqat", order: 94 },
  { id: "topik-35-reading-95", setId: "topik-35-reading", koreanWord: "수집하다", pronunciation: "sujiphada", uzbekTranslation: "to'plamoq", exampleSentenceKo: "자료를 수집하고 있어요.", exampleSentenceUz: "Ma'lumot to'playapman.", partOfSpeech: "verb", topic: "Meva va oziq-ovqat", order: 95 },
  { id: "topik-35-reading-96", setId: "topik-35-reading", koreanWord: "노력하다", pronunciation: "noryeokhada", uzbekTranslation: "harakat qilmoq", exampleSentenceKo: "매일 노력하고 있어요.", exampleSentenceUz: "Har kuni harakat qilyapman.", partOfSpeech: "verb", topic: "Meva va oziq-ovqat", order: 96 },
  { id: "topik-35-reading-97", setId: "topik-35-reading", koreanWord: "함께", pronunciation: "hamkke", uzbekTranslation: "birga", exampleSentenceKo: "가족과 함께 먹어요.", exampleSentenceUz: "Oila bilan birga yeymiz.", partOfSpeech: "adverb", topic: "Meva va oziq-ovqat", order: 97 },
  { id: "topik-35-reading-98", setId: "topik-35-reading", koreanWord: "상황", pronunciation: "sanghwang", uzbekTranslation: "vaziyat", exampleSentenceKo: "상황이 좀 복잡해요.", exampleSentenceUz: "Vaziyat biroz murakkab.", partOfSpeech: "noun", topic: "Ortiqcha maqtash oqibatlari", order: 98 },
  { id: "topik-35-reading-99", setId: "topik-35-reading", koreanWord: "오히려", pronunciation: "ohiryeo", uzbekTranslation: "aksincha", exampleSentenceKo: "칭찬이 오히려 부담이 될 수 있어요.", exampleSentenceUz: "Maqtov aksincha yukka aylanishi mumkin.", partOfSpeech: "adverb", topic: "Ortiqcha maqtash oqibatlari", order: 99 },
  { id: "topik-35-reading-100", setId: "topik-35-reading", koreanWord: "결과", pronunciation: "gyeolgwa", uzbekTranslation: "natija", exampleSentenceKo: "나쁜 결과를 불러왔어요.", exampleSentenceUz: "Yomon natijaga olib keldi.", partOfSpeech: "noun", topic: "Ortiqcha maqtash oqibatlari", order: 100 },
  { id: "topik-35-reading-101", setId: "topik-35-reading", koreanWord: "불러오다", pronunciation: "bulleooda", uzbekTranslation: "keltirib chiqarmoq", exampleSentenceKo: "지나친 칭찬은 문제를 불러와요.", exampleSentenceUz: "Ortiqcha maqtov muammo keltirib chiqaradi.", partOfSpeech: "verb", topic: "Ortiqcha maqtash oqibatlari", order: 101 },
  { id: "topik-35-reading-102", setId: "topik-35-reading", koreanWord: "골치만 아프다", pronunciation: "golchiman apeuda", uzbekTranslation: "faqat bosh og'rig'i keltiradi", exampleSentenceKo: "생각할수록 골치만 아파요.", exampleSentenceUz: "O'ylagan sayin faqat bosh og'riydi.", partOfSpeech: "expression", topic: "Ortiqcha maqtash oqibatlari", order: 102 },
  { id: "topik-35-reading-103", setId: "topik-35-reading", koreanWord: "콧대만 높아지다", pronunciation: "kotdaeman nopajida", uzbekTranslation: "manman bo'lib qolmoq", exampleSentenceKo: "칭찬만 받으면 콧대만 높아져요.", exampleSentenceUz: "Faqat maqtov eshitsa, manman bo'lib qoladi.", partOfSpeech: "expression", topic: "Ortiqcha maqtash oqibatlari", order: 103 },
  { id: "topik-35-reading-104", setId: "topik-35-reading", koreanWord: "눈치만 빨라지다", pronunciation: "nunchiman ppallajida", uzbekTranslation: "faqat sezgirligi oshib qolmoq", exampleSentenceKo: "아이가 눈치만 빨라졌어요.", exampleSentenceUz: "Bola faqat sezgirligi oshib qoldi.", partOfSpeech: "expression", topic: "Ortiqcha maqtash oqibatlari", order: 104 },
  { id: "topik-35-reading-105", setId: "topik-35-reading", koreanWord: "비행기만 태우다", pronunciation: "bihaenggiman taeuda", uzbekTranslation: "ortiqcha maqtab yubormoq", exampleSentenceKo: "친구를 너무 비행기만 태웠어요.", exampleSentenceUz: "Do'stimni ortiqcha maqtab yubordim.", partOfSpeech: "expression", topic: "Ortiqcha maqtash oqibatlari", order: 105 },
  { id: "topik-35-reading-106", setId: "topik-35-reading", koreanWord: "운영하다", pronunciation: "unyeonghada", uzbekTranslation: "boshqarmoq, yuritmoq", exampleSentenceKo: "작은 공장을 운영해요.", exampleSentenceUz: "Kichik zavodni boshqaraman.", partOfSpeech: "verb", topic: "Biznes va qiyinchiliklar", order: 106 },
  { id: "topik-35-reading-107", setId: "topik-35-reading", koreanWord: "사정", pronunciation: "sajeong", uzbekTranslation: "holat, sabab", exampleSentenceKo: "사정이 있어서 못 갔어요.", exampleSentenceUz: "Sababi bor edi, bora olmadim.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 107 },
  { id: "topik-35-reading-108", setId: "topik-35-reading", koreanWord: "공장", pronunciation: "gongjang", uzbekTranslation: "zavod", exampleSentenceKo: "공장에서 불이 났어요.", exampleSentenceUz: "Zavodda yong'in chiqdi.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 108 },
  { id: "topik-35-reading-109", setId: "topik-35-reading", koreanWord: "불이 나다", pronunciation: "buri nada", uzbekTranslation: "yong'in chiqmoq", exampleSentenceKo: "어젯밤 창고에 불이 났어요.", exampleSentenceUz: "Kecha kechqurun omborda yong'in chiqdi.", partOfSpeech: "expression", topic: "Biznes va qiyinchiliklar", order: 109 },
  { id: "topik-35-reading-110", setId: "topik-35-reading", koreanWord: "게다가", pronunciation: "gedaga", uzbekTranslation: "bundan tashqari", exampleSentenceKo: "게다가 매출도 줄었어요.", exampleSentenceUz: "Bundan tashqari savdo ham kamaydi.", partOfSpeech: "adverb", topic: "Biznes va qiyinchiliklar", order: 110 },
  { id: "topik-35-reading-111", setId: "topik-35-reading", koreanWord: "매출", pronunciation: "maechul", uzbekTranslation: "savdo hajmi", exampleSentenceKo: "이번 달 매출이 늘었어요.", exampleSentenceUz: "Bu oy savdo hajmi oshdi.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 111 },
  { id: "topik-35-reading-112", setId: "topik-35-reading", koreanWord: "감다", pronunciation: "gamda", uzbekTranslation: "o'rab olmoq; ko'zni yummoq", exampleSentenceKo: "눈을 감고 생각했어요.", exampleSentenceUz: "Ko'zimni yumib o'yladim.", partOfSpeech: "verb", topic: "Biznes va qiyinchiliklar", order: 112 },
  { id: "topik-35-reading-113", setId: "topik-35-reading", koreanWord: "부르다", pronunciation: "bureuda", uzbekTranslation: "chaqirmoq; kuylamoq", exampleSentenceKo: "이름을 불러 주세요.", exampleSentenceUz: "Ismimni chaqiring.", partOfSpeech: "verb", topic: "Biznes va qiyinchiliklar", order: 113 },
  { id: "topik-35-reading-114", setId: "topik-35-reading", koreanWord: "살리다", pronunciation: "sallida", uzbekTranslation: "saqlab qolmoq, tiriltirmoq", exampleSentenceKo: "회사를 살리려고 노력했어요.", exampleSentenceUz: "Kompaniyani saqlab qolish uchun harakat qildim.", partOfSpeech: "verb", topic: "Biznes va qiyinchiliklar", order: 114 },
  { id: "topik-35-reading-115", setId: "topik-35-reading", koreanWord: "섭섭하다", pronunciation: "seopseophada", uzbekTranslation: "afsuslanmoq, xafa bo'lmoq", exampleSentenceKo: "그 말에 섭섭했어요.", exampleSentenceUz: "O'sha gapdan xafa bo'ldim.", partOfSpeech: "adjective", topic: "Biznes va qiyinchiliklar", order: 115 },
  { id: "topik-35-reading-116", setId: "topik-35-reading", koreanWord: "당황하다", pronunciation: "danghwanghada", uzbekTranslation: "sarosimaga tushmoq", exampleSentenceKo: "갑자기 질문을 받아서 당황했어요.", exampleSentenceUz: "Kutilmagan savoldan sarosimaga tushdim.", partOfSpeech: "verb", topic: "Biznes va qiyinchiliklar", order: 116 },
  { id: "topik-35-reading-117", setId: "topik-35-reading", koreanWord: "부끄럽다", pronunciation: "bukkeureopda", uzbekTranslation: "uyalmoq", exampleSentenceKo: "실수해서 부끄러웠어요.", exampleSentenceUz: "Xato qilganim uchun uyaldim.", partOfSpeech: "adjective", topic: "Biznes va qiyinchiliklar", order: 117 },
  { id: "topik-35-reading-118", setId: "topik-35-reading", koreanWord: "곤란하다", pronunciation: "gollanhada", uzbekTranslation: "qiyin, mushkul", exampleSentenceKo: "대답하기 곤란한 질문이에요.", exampleSentenceUz: "Javob berish qiyin savol.", partOfSpeech: "adjective", topic: "Biznes va qiyinchiliklar", order: 118 },
  { id: "topik-35-reading-119", setId: "topik-35-reading", koreanWord: "방향", pronunciation: "banghyang", uzbekTranslation: "yo'nalish", exampleSentenceKo: "새로운 방향으로 나아가요.", exampleSentenceUz: "Yangi yo'nalishga qadam qo'yamiz.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 119 },
  { id: "topik-35-reading-120", setId: "topik-35-reading", koreanWord: "독특하다", pronunciation: "dokteukhada", uzbekTranslation: "o'ziga xos", exampleSentenceKo: "간판이 독특하게 생겼어요.", exampleSentenceUz: "Peshtaxta lavhasi o'ziga xos ko'rinishga ega.", partOfSpeech: "adjective", topic: "Biznes va qiyinchiliklar", order: 120 },
  { id: "topik-35-reading-121", setId: "topik-35-reading", koreanWord: "간판", pronunciation: "ganpan", uzbekTranslation: "peshtaxta lavhasi", exampleSentenceKo: "새 간판을 달았어요.", exampleSentenceUz: "Yangi lavha osdim.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 121 },
  { id: "topik-35-reading-122", setId: "topik-35-reading", koreanWord: "지나가다", pronunciation: "jinagada", uzbekTranslation: "o'tib ketmoq", exampleSentenceKo: "사람들이 그냥 지나갔어요.", exampleSentenceUz: "Odamlar shunchaki o'tib ketishdi.", partOfSpeech: "verb", topic: "Biznes va qiyinchiliklar", order: 122 },
  { id: "topik-35-reading-123", setId: "topik-35-reading", koreanWord: "시선", pronunciation: "siseon", uzbekTranslation: "nigoh", exampleSentenceKo: "사람들의 시선을 끌었어요.", exampleSentenceUz: "Odamlarning nigohini o'ziga tortdi.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 123 },
  { id: "topik-35-reading-124", setId: "topik-35-reading", koreanWord: "취업률", pronunciation: "chwieomnyul", uzbekTranslation: "ishga joylashish darajasi", exampleSentenceKo: "취업률이 낮아졌어요.", exampleSentenceUz: "Ishga joylashish darajasi pasaydi.", partOfSpeech: "noun", topic: "Biznes va qiyinchiliklar", order: 124 },
  { id: "topik-35-reading-125", setId: "topik-35-reading", koreanWord: "석 달째", pronunciation: "seok daljjae", uzbekTranslation: "uchinchi oy davomida", exampleSentenceKo: "석 달째 장사가 안돼요.", exampleSentenceUz: "Uchinchi oydirki savdo yurishmayapti.", partOfSpeech: "expression", topic: "Biznes va qiyinchiliklar", order: 125 },
  { id: "topik-35-reading-126", setId: "topik-35-reading", koreanWord: "자유롭다", pronunciation: "jayuropda", uzbekTranslation: "erkin", exampleSentenceKo: "자유롭게 이야기해도 돼요.", exampleSentenceUz: "Erkin gaplashishingiz mumkin.", partOfSpeech: "adjective", topic: "Teleserial va tahrirlash", order: 126 },
  { id: "topik-35-reading-127", setId: "topik-35-reading", koreanWord: "도망치다", pronunciation: "domangchida", uzbekTranslation: "qochib ketmoq", exampleSentenceKo: "주인공이 도망쳤어요.", exampleSentenceUz: "Bosh qahramon qochib ketdi.", partOfSpeech: "verb", topic: "Teleserial va tahrirlash", order: 127 },
  { id: "topik-35-reading-128", setId: "topik-35-reading", koreanWord: "애쓰다", pronunciation: "aesseuda", uzbekTranslation: "harakat qilmoq, tirishmoq", exampleSentenceKo: "잘하려고 애썼어요.", exampleSentenceUz: "Yaxshi bajarish uchun tirishdim.", partOfSpeech: "verb", topic: "Teleserial va tahrirlash", order: 128 },
  { id: "topik-35-reading-129", setId: "topik-35-reading", koreanWord: "그대로", pronunciation: "geudaero", uzbekTranslation: "o'sha holicha", exampleSentenceKo: "원고를 그대로 사용했어요.", exampleSentenceUz: "Ssenariyni o'sha holicha ishlatdim.", partOfSpeech: "adverb", topic: "Teleserial va tahrirlash", order: 129 },
  { id: "topik-35-reading-130", setId: "topik-35-reading", koreanWord: "구속", pronunciation: "gusok", uzbekTranslation: "cheklov, band qilish", exampleSentenceKo: "규칙에 구속받고 싶지 않아요.", exampleSentenceUz: "Qoidalar bilan cheklanishni istamayman.", partOfSpeech: "noun", topic: "Teleserial va tahrirlash", order: 130 },
  { id: "topik-35-reading-131", setId: "topik-35-reading", koreanWord: "반발심", pronunciation: "banbalsim", uzbekTranslation: "qarshilik hissi", exampleSentenceKo: "그 말에 반발심이 생겼어요.", exampleSentenceUz: "O'sha gapdan qarshilik hissi paydo bo'ldi.", partOfSpeech: "noun", topic: "Teleserial va tahrirlash", order: 131 },
  { id: "topik-35-reading-132", setId: "topik-35-reading", koreanWord: "의논하다", pronunciation: "uinonhada", uzbekTranslation: "maslahatlashmoq", exampleSentenceKo: "가족과 의논했어요.", exampleSentenceUz: "Oila bilan maslahatlashdim.", partOfSpeech: "verb", topic: "Teleserial va tahrirlash", order: 132 },
  { id: "topik-35-reading-133", setId: "topik-35-reading", koreanWord: "분량", pronunciation: "bullyang", uzbekTranslation: "hajm, miqdor", exampleSentenceKo: "방송 분량이 줄었어요.", exampleSentenceUz: "Efir hajmi qisqartirildi.", partOfSpeech: "noun", topic: "Teleserial va tahrirlash", order: 133 },
  { id: "topik-35-reading-134", setId: "topik-35-reading", koreanWord: "피로하다", pronunciation: "pirohada", uzbekTranslation: "charchagan", exampleSentenceKo: "촬영 때문에 많이 피로해요.", exampleSentenceUz: "Suratga olish tufayli juda charchaganman.", partOfSpeech: "adjective", topic: "Teleserial va tahrirlash", order: 134 },
  { id: "topik-35-reading-135", setId: "topik-35-reading", koreanWord: "간격", pronunciation: "gangyeok", uzbekTranslation: "oraliq", exampleSentenceKo: "방영 간격이 일주일이에요.", exampleSentenceUz: "Efirga uzatish oralig'i bir hafta.", partOfSpeech: "noun", topic: "Teleserial va tahrirlash", order: 135 },
  { id: "topik-35-reading-136", setId: "topik-35-reading", koreanWord: "편집되다", pronunciation: "pyeonjipdoeda", uzbekTranslation: "tahrirlanmoq", exampleSentenceKo: "장면이 짧게 편집됐어요.", exampleSentenceUz: "Sahna qisqa qilib tahrirlandi.", partOfSpeech: "verb", topic: "Teleserial va tahrirlash", order: 136 },
  { id: "topik-35-reading-137", setId: "topik-35-reading", koreanWord: "등장인물", pronunciation: "deungjanginmul", uzbekTranslation: "asar qahramoni", exampleSentenceKo: "등장인물이 많아요.", exampleSentenceUz: "Asar qahramonlari ko'p.", partOfSpeech: "noun", topic: "Teleserial va tahrirlash", order: 137 },
  { id: "topik-35-reading-138", setId: "topik-35-reading", koreanWord: "제한하다", pronunciation: "jehanhada", uzbekTranslation: "cheklamoq", exampleSentenceKo: "시청 연령을 제한했어요.", exampleSentenceUz: "Tomosha yoshini cheklashdi.", partOfSpeech: "verb", topic: "Teleserial va tahrirlash", order: 138 },
  { id: "topik-35-reading-139", setId: "topik-35-reading", koreanWord: "특징", pronunciation: "teukjing", uzbekTranslation: "xususiyat", exampleSentenceKo: "궁중 음식의 특징이에요.", exampleSentenceUz: "Bu saroy taomining xususiyati.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 139 },
  { id: "topik-35-reading-140", setId: "topik-35-reading", koreanWord: "성대하다", pronunciation: "seongdaehada", uzbekTranslation: "dabdabali, tantanali", exampleSentenceKo: "잔치가 아주 성대했어요.", exampleSentenceUz: "Ziyofat juda dabdabali bo'ldi.", partOfSpeech: "adjective", topic: "An'analar va qirollik saroyi", order: 140 },
  { id: "topik-35-reading-141", setId: "topik-35-reading", koreanWord: "잔치", pronunciation: "janchi", uzbekTranslation: "ziyofat, bayram", exampleSentenceKo: "결혼 잔치를 열었어요.", exampleSentenceUz: "To'y ziyofati o'tkazildi.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 141 },
  { id: "topik-35-reading-142", setId: "topik-35-reading", koreanWord: "궁중", pronunciation: "gungjung", uzbekTranslation: "qirollik saroyi", exampleSentenceKo: "궁중 요리를 배웠어요.", exampleSentenceUz: "Saroy taomlarini o'rgandim.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 142 },
  { id: "topik-35-reading-143", setId: "topik-35-reading", koreanWord: "풍습", pronunciation: "pungseup", uzbekTranslation: "urf-odat", exampleSentenceKo: "전통 풍습을 지켜요.", exampleSentenceUz: "An'anaviy urf-odatga rioya qilamiz.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 143 },
  { id: "topik-35-reading-144", setId: "topik-35-reading", koreanWord: "지위", pronunciation: "jiwi", uzbekTranslation: "mavqe, martaba", exampleSentenceKo: "높은 지위에 올랐어요.", exampleSentenceUz: "Yuqori mavqega ko'tarildi.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 144 },
  { id: "topik-35-reading-145", setId: "topik-35-reading", koreanWord: "백성", pronunciation: "baekseong", uzbekTranslation: "xalq, fuqarolar", exampleSentenceKo: "왕은 백성을 사랑했어요.", exampleSentenceUz: "Podshoh xalqni sevardi.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 145 },
  { id: "topik-35-reading-146", setId: "topik-35-reading", koreanWord: "풍경화", pronunciation: "punggyeonghwa", uzbekTranslation: "landshaft rasmi", exampleSentenceKo: "풍경화를 그렸어요.", exampleSentenceUz: "Landshaft rasmini chizdim.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 146 },
  { id: "topik-35-reading-147", setId: "topik-35-reading", koreanWord: "일반적", pronunciation: "ilbanjeok", uzbekTranslation: "umumiy", exampleSentenceKo: "일반적인 방식이에요.", exampleSentenceUz: "Bu umumiy usul.", partOfSpeech: "adjective", topic: "An'analar va qirollik saroyi", order: 147 },
  { id: "topik-35-reading-148", setId: "topik-35-reading", koreanWord: "산업화", pronunciation: "saneophwa", uzbekTranslation: "sanoatlashtirish", exampleSentenceKo: "산업화가 빠르게 진행됐어요.", exampleSentenceUz: "Sanoatlashtirish tez amalga oshdi.", partOfSpeech: "noun", topic: "An'analar va qirollik saroyi", order: 148 },
  { id: "topik-35-reading-149", setId: "topik-35-reading", koreanWord: "붉다", pronunciation: "bukda", uzbekTranslation: "qizil", exampleSentenceKo: "사과가 붉게 익었어요.", exampleSentenceUz: "Olma qizarib pishdi.", partOfSpeech: "adjective", topic: "Ovqat tayyorlash va qadoqlash", order: 149 },
  { id: "topik-35-reading-150", setId: "topik-35-reading", koreanWord: "오염되다", pronunciation: "oyeomdoeda", uzbekTranslation: "ifloslanmoq", exampleSentenceKo: "물이 오염됐어요.", exampleSentenceUz: "Suv ifloslandi.", partOfSpeech: "verb", topic: "Ovqat tayyorlash va qadoqlash", order: 150 },
  { id: "topik-35-reading-151", setId: "topik-35-reading", koreanWord: "건조하다", pronunciation: "geonjohada", uzbekTranslation: "quruq, quritmoq", exampleSentenceKo: "날씨가 건조해요.", exampleSentenceUz: "Havo quruq.", partOfSpeech: "adjective", topic: "Ovqat tayyorlash va qadoqlash", order: 151 },
  { id: "topik-35-reading-152", setId: "topik-35-reading", koreanWord: "고려하다", pronunciation: "goryeohada", uzbekTranslation: "hisobga olmoq", exampleSentenceKo: "여러 상황을 고려했어요.", exampleSentenceUz: "Turli vaziyatlarni hisobga oldim.", partOfSpeech: "verb", topic: "Ovqat tayyorlash va qadoqlash", order: 152 },
  { id: "topik-35-reading-153", setId: "topik-35-reading", koreanWord: "수분", pronunciation: "subun", uzbekTranslation: "namlik", exampleSentenceKo: "수분을 충분히 섭취하세요.", exampleSentenceUz: "Yetarli namlik (suyuqlik) qabul qiling.", partOfSpeech: "noun", topic: "Ovqat tayyorlash va qadoqlash", order: 153 },
  { id: "topik-35-reading-154", setId: "topik-35-reading", koreanWord: "포장", pronunciation: "pojang", uzbekTranslation: "qadoqlash", exampleSentenceKo: "포장을 새로 했어요.", exampleSentenceUz: "Qadoqlashni yangidan qildim.", partOfSpeech: "noun", topic: "Ovqat tayyorlash va qadoqlash", order: 154 },
  { id: "topik-35-reading-155", setId: "topik-35-reading", koreanWord: "고도", pronunciation: "godo", uzbekTranslation: "balandlik", exampleSentenceKo: "높은 고도에서 재배해요.", exampleSentenceUz: "Baland joyda yetishtiriladi.", partOfSpeech: "noun", topic: "Ovqat tayyorlash va qadoqlash", order: 155 },
  { id: "topik-35-reading-156", setId: "topik-35-reading", koreanWord: "미각", pronunciation: "migak", uzbekTranslation: "ta'm sezish", exampleSentenceKo: "미각이 예민해요.", exampleSentenceUz: "Ta'm sezishi sezgir.", partOfSpeech: "noun", topic: "Ovqat tayyorlash va qadoqlash", order: 156 },
  { id: "topik-35-reading-157", setId: "topik-35-reading", koreanWord: "대비하다", pronunciation: "daebihada", uzbekTranslation: "tayyorgarlik ko'rmoq", exampleSentenceKo: "겨울을 대비했어요.", exampleSentenceUz: "Qishga tayyorgarlik ko'rdim.", partOfSpeech: "verb", topic: "Ovqat tayyorlash va qadoqlash", order: 157 },
  { id: "topik-35-reading-158", setId: "topik-35-reading", koreanWord: "조리하다", pronunciation: "jorihada", uzbekTranslation: "ovqat tayyorlamoq", exampleSentenceKo: "재료를 씻고 조리해요.", exampleSentenceUz: "Mahsulotlarni yuvib, ovqat tayyorlayman.", partOfSpeech: "verb", topic: "Ovqat tayyorlash va qadoqlash", order: 158 },
  { id: "topik-35-reading-159", setId: "topik-35-reading", koreanWord: "행동하다", pronunciation: "haengdonghada", uzbekTranslation: "harakat qilmoq", exampleSentenceKo: "벌은 무리 지어 행동해요.", exampleSentenceUz: "Asalarilar guruh bo'lib harakat qiladi.", partOfSpeech: "verb", topic: "Asalarilar va qishloq", order: 159 },
  { id: "topik-35-reading-160", setId: "topik-35-reading", koreanWord: "벌", pronunciation: "beol", uzbekTranslation: "asalari", exampleSentenceKo: "벌이 꽃 사이를 날아다녀요.", exampleSentenceUz: "Asalari gullar orasida uchib yuradi.", partOfSpeech: "noun", topic: "Asalarilar va qishloq", order: 160 },
  { id: "topik-35-reading-161", setId: "topik-35-reading", koreanWord: "생존", pronunciation: "saengjon", uzbekTranslation: "omon qolish", exampleSentenceKo: "생존이 점점 어려워지고 있어요.", exampleSentenceUz: "Omon qolish tobora qiyinlashmoqda.", partOfSpeech: "noun", topic: "Asalarilar va qishloq", order: 161 },
  { id: "topik-35-reading-162", setId: "topik-35-reading", koreanWord: "상대적", pronunciation: "sangdaejeok", uzbekTranslation: "nisbiy", exampleSentenceKo: "상대적으로 안전한 편이에요.", exampleSentenceUz: "Nisbatan xavfsizroq hisoblanadi.", partOfSpeech: "adjective", topic: "Asalarilar va qishloq", order: 162 },
  { id: "topik-35-reading-163", setId: "topik-35-reading", koreanWord: "농촌", pronunciation: "nongchon", uzbekTranslation: "qishloq joy", exampleSentenceKo: "농촌에서 자랐어요.", exampleSentenceUz: "Qishloqda o'sganman.", partOfSpeech: "noun", topic: "Asalarilar va qishloq", order: 163 },
  { id: "topik-35-reading-164", setId: "topik-35-reading", koreanWord: "농업", pronunciation: "nongeop", uzbekTranslation: "qishloq xo'jaligi", exampleSentenceKo: "농업에 종사하고 있어요.", exampleSentenceUz: "Qishloq xo'jaligi bilan shug'ullanaman.", partOfSpeech: "noun", topic: "Asalarilar va qishloq", order: 164 },
  { id: "topik-35-reading-165", setId: "topik-35-reading", koreanWord: "캠페인", pronunciation: "kaempein", uzbekTranslation: "kampaniya", exampleSentenceKo: "환경 캠페인에 참여했어요.", exampleSentenceUz: "Ekologik kampaniyaga qatnashdim.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 165 },
  { id: "topik-35-reading-166", setId: "topik-35-reading", koreanWord: "활성화하다", pronunciation: "hwalseonghwahada", uzbekTranslation: "faollashtirmoq", exampleSentenceKo: "지역 경제를 활성화했어요.", exampleSentenceUz: "Mintaqa iqtisodiyotini faollashtirdi.", partOfSpeech: "verb", topic: "Yolg'izlar madaniyati va biznes", order: 166 },
  { id: "topik-35-reading-167", setId: "topik-35-reading", koreanWord: "미혼", pronunciation: "mihon", uzbekTranslation: "turmush qurmagan", exampleSentenceKo: "미혼 남녀가 늘고 있어요.", exampleSentenceUz: "Turmush qurmagan yigit-qizlar soni oshmoqda.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 167 },
  { id: "topik-35-reading-168", setId: "topik-35-reading", koreanWord: "독신", pronunciation: "doksin", uzbekTranslation: "yolg'iz (bo'ydoq)", exampleSentenceKo: "독신 생활이 편해요.", exampleSentenceUz: "Yolg'iz yashash qulay.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 168 },
  { id: "topik-35-reading-169", setId: "topik-35-reading", koreanWord: "패션", pronunciation: "paesyeon", uzbekTranslation: "moda", exampleSentenceKo: "패션에 관심이 많아요.", exampleSentenceUz: "Modaga qiziqishim katta.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 169 },
  { id: "topik-35-reading-170", setId: "topik-35-reading", koreanWord: "비즈니스", pronunciation: "bijeuniseu", uzbekTranslation: "biznes", exampleSentenceKo: "새 비즈니스를 시작했어요.", exampleSentenceUz: "Yangi biznesni boshladim.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 170 },
  { id: "topik-35-reading-171", setId: "topik-35-reading", koreanWord: "빳빳하다", pronunciation: "ppatppatada", uzbekTranslation: "qattiq, tik turgan", exampleSentenceKo: "셔츠가 빳빳하게 다려졌어요.", exampleSentenceUz: "Ko'ylak qattiq qilib dazmollandi.", partOfSpeech: "adjective", topic: "Yolg'izlar madaniyati va biznes", order: 171 },
  { id: "topik-35-reading-172", setId: "topik-35-reading", koreanWord: "무채색", pronunciation: "muchaesaek", uzbekTranslation: "neytral rang", exampleSentenceKo: "무채색 옷을 즐겨 입어요.", exampleSentenceUz: "Neytral rangdagi kiyimlarni yaxshi ko'raman.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 172 },
  { id: "topik-35-reading-173", setId: "topik-35-reading", koreanWord: "색상", pronunciation: "saeksang", uzbekTranslation: "rang", exampleSentenceKo: "다양한 색상이 있어요.", exampleSentenceUz: "Turli xil ranglar mavjud.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 173 },
  { id: "topik-35-reading-174", setId: "topik-35-reading", koreanWord: "전략", pronunciation: "jeollyak", uzbekTranslation: "strategiya", exampleSentenceKo: "새로운 전략을 세웠어요.", exampleSentenceUz: "Yangi strategiya tuzdim.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 174 },
  { id: "topik-35-reading-175", setId: "topik-35-reading", koreanWord: "협상", pronunciation: "hyeopsang", uzbekTranslation: "muzokara", exampleSentenceKo: "가격 협상을 했어요.", exampleSentenceUz: "Narx bo'yicha muzokara qildik.", partOfSpeech: "noun", topic: "Yolg'izlar madaniyati va biznes", order: 175 },
  { id: "topik-35-reading-176", setId: "topik-35-reading", koreanWord: "육체적", pronunciation: "yukchejeok", uzbekTranslation: "jismoniy", exampleSentenceKo: "육체적으로 힘든 일이에요.", exampleSentenceUz: "Jismonan og'ir ish.", partOfSpeech: "adjective", topic: "Robot texnologiyasi va sog'liq", order: 176 },
  { id: "topik-35-reading-177", setId: "topik-35-reading", koreanWord: "정신적", pronunciation: "jeongsinjeok", uzbekTranslation: "ruhiy", exampleSentenceKo: "정신적으로 지쳤어요.", exampleSentenceUz: "Ruhan charchadim.", partOfSpeech: "adjective", topic: "Robot texnologiyasi va sog'liq", order: 177 },
  { id: "topik-35-reading-178", setId: "topik-35-reading", koreanWord: "무기력하다", pronunciation: "mugiryeokhada", uzbekTranslation: "madorsiz, ojiz", exampleSentenceKo: "요즘 무기력해요.", exampleSentenceUz: "Oxirgi paytda madorsizman.", partOfSpeech: "adjective", topic: "Robot texnologiyasi va sog'liq", order: 178 },
  { id: "topik-35-reading-179", setId: "topik-35-reading", koreanWord: "의심하다", pronunciation: "uisimhada", uzbekTranslation: "shubhalanmoq", exampleSentenceKo: "결과를 의심했어요.", exampleSentenceUz: "Natijadan shubhalandim.", partOfSpeech: "verb", topic: "Robot texnologiyasi va sog'liq", order: 179 },
  { id: "topik-35-reading-180", setId: "topik-35-reading", koreanWord: "증후군", pronunciation: "jeunghugun", uzbekTranslation: "sindrom", exampleSentenceKo: "번아웃 증후군이 늘고 있어요.", exampleSentenceUz: "Charchash sindromi ko'paymoqda.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 180 },
  { id: "topik-35-reading-181", setId: "topik-35-reading", koreanWord: "대표적", pronunciation: "daepyojeok", uzbekTranslation: "asosiy, tipik", exampleSentenceKo: "대표적인 증상이에요.", exampleSentenceUz: "Bu asosiy alomat.", partOfSpeech: "adjective", topic: "Robot texnologiyasi va sog'liq", order: 181 },
  { id: "topik-35-reading-182", setId: "topik-35-reading", koreanWord: "불안감", pronunciation: "buranggam", uzbekTranslation: "xavotir hissi", exampleSentenceKo: "불안감을 느꼈어요.", exampleSentenceUz: "Xavotir hissi paydo bo'ldi.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 182 },
  { id: "topik-35-reading-183", setId: "topik-35-reading", koreanWord: "앓다", pronunciation: "alta", uzbekTranslation: "kasal bo'lmoq", exampleSentenceKo: "심한 감기를 앓았어요.", exampleSentenceUz: "Og'ir shamollashni boshdan kechirdim.", partOfSpeech: "verb", topic: "Robot texnologiyasi va sog'liq", order: 183 },
  { id: "topik-35-reading-184", setId: "topik-35-reading", koreanWord: "심신", pronunciation: "simsin", uzbekTranslation: "tan-u jon", exampleSentenceKo: "심신이 지쳤어요.", exampleSentenceUz: "Tan-u jonim charchadi.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 184 },
  { id: "topik-35-reading-185", setId: "topik-35-reading", koreanWord: "로봇", pronunciation: "robot", uzbekTranslation: "robot", exampleSentenceKo: "로봇이 청소를 해요.", exampleSentenceUz: "Robot tozalash ishlarini bajaradi.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 185 },
  { id: "topik-35-reading-186", setId: "topik-35-reading", koreanWord: "대체하다", pronunciation: "daechehada", uzbekTranslation: "o'rnini bosmoq", exampleSentenceKo: "사람을 대체할 수 있어요.", exampleSentenceUz: "Insonning o'rnini bosishi mumkin.", partOfSpeech: "verb", topic: "Robot texnologiyasi va sog'liq", order: 186 },
  { id: "topik-35-reading-187", setId: "topik-35-reading", koreanWord: "심층", pronunciation: "simcheung", uzbekTranslation: "chuqur qatlam", exampleSentenceKo: "심층 분석을 했어요.", exampleSentenceUz: "Chuqur tahlil qildim.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 187 },
  { id: "topik-35-reading-188", setId: "topik-35-reading", koreanWord: "담당하다", pronunciation: "damdanghada", uzbekTranslation: "mas'ul bo'lmoq", exampleSentenceKo: "이 업무를 담당하고 있어요.", exampleSentenceUz: "Shu vazifaga mas'ulman.", partOfSpeech: "verb", topic: "Robot texnologiyasi va sog'liq", order: 188 },
  { id: "topik-35-reading-189", setId: "topik-35-reading", koreanWord: "직결되다", pronunciation: "jikgyeoldoeda", uzbekTranslation: "bevosita bog'liq bo'lmoq", exampleSentenceKo: "건강과 직결돼요.", exampleSentenceUz: "Sog'liq bilan bevosita bog'liq.", partOfSpeech: "verb", topic: "Robot texnologiyasi va sog'liq", order: 189 },
  { id: "topik-35-reading-190", setId: "topik-35-reading", koreanWord: "차선", pronunciation: "chaseon", uzbekTranslation: "yo'l chizig'i", exampleSentenceKo: "차선을 바꿨어요.", exampleSentenceUz: "Yo'l chizig'ini almashtirdim.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 190 },
  { id: "topik-35-reading-191", setId: "topik-35-reading", koreanWord: "반사", pronunciation: "bansa", uzbekTranslation: "aks etish, refleks", exampleSentenceKo: "빛이 거울에 반사돼요.", exampleSentenceUz: "Yorug'lik oynadan aks etadi.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 191 },
  { id: "topik-35-reading-192", setId: "topik-35-reading", koreanWord: "성능", pronunciation: "seongneung", uzbekTranslation: "unumdorlik, ishlash sifati", exampleSentenceKo: "성능이 좋아졌어요.", exampleSentenceUz: "Unumdorlik yaxshilandi.", partOfSpeech: "noun", topic: "Robot texnologiyasi va sog'liq", order: 192 },
  { id: "topik-35-reading-193", setId: "topik-35-reading", koreanWord: "혼합되다", pronunciation: "honhapdoeda", uzbekTranslation: "aralashmoq", exampleSentenceKo: "두 물질이 혼합됐어요.", exampleSentenceUz: "Ikki modda aralashdi.", partOfSpeech: "verb", topic: "Robot texnologiyasi va sog'liq", order: 193 },
  { id: "topik-35-reading-194", setId: "topik-35-reading", koreanWord: "부자", pronunciation: "buja", uzbekTranslation: "boy odam", exampleSentenceKo: "그는 큰 부자예요.", exampleSentenceUz: "U katta boy odam.", partOfSpeech: "noun", topic: "Boylik va meros", order: 194 },
  { id: "topik-35-reading-195", setId: "topik-35-reading", koreanWord: "사업체", pronunciation: "saeopche", uzbekTranslation: "korxona", exampleSentenceKo: "사업체를 물려받았어요.", exampleSentenceUz: "Korxonani meros qilib oldim.", partOfSpeech: "noun", topic: "Boylik va meros", order: 195 },
  { id: "topik-35-reading-196", setId: "topik-35-reading", koreanWord: "상속", pronunciation: "sangsok", uzbekTranslation: "meros", exampleSentenceKo: "재산을 상속받았어요.", exampleSentenceUz: "Mulkni meros qilib oldim.", partOfSpeech: "noun", topic: "Boylik va meros", order: 196 },
  { id: "topik-35-reading-197", setId: "topik-35-reading", koreanWord: "축적", pronunciation: "chukjeok", uzbekTranslation: "to'plash, jamg'arish", exampleSentenceKo: "부의 축적이 빨라요.", exampleSentenceUz: "Boylik jamg'arish tez sur'atda.", partOfSpeech: "noun", topic: "Boylik va meros", order: 197 },
  { id: "topik-35-reading-198", setId: "topik-35-reading", koreanWord: "유형", pronunciation: "yuhyeong", uzbekTranslation: "tur, turkum", exampleSentenceKo: "부자에는 여러 유형이 있어요.", exampleSentenceUz: "Boylarda bir necha tur mavjud.", partOfSpeech: "noun", topic: "Boylik va meros", order: 198 },
  { id: "topik-35-reading-199", setId: "topik-35-reading", koreanWord: "상속형", pronunciation: "sangsokhyeong", uzbekTranslation: "meros turi", exampleSentenceKo: "상속형 부자가 많아요.", exampleSentenceUz: "Meros orqali boyigan boylar ko'p.", partOfSpeech: "noun", topic: "Boylik va meros", order: 199 },
  { id: "topik-35-reading-200", setId: "topik-35-reading", koreanWord: "절반", pronunciation: "jeolban", uzbekTranslation: "yarmi", exampleSentenceKo: "절반 정도 완성했어요.", exampleSentenceUz: "Taxminan yarmini tugatdim.", partOfSpeech: "noun", topic: "Boylik va meros", order: 200 },
  { id: "topik-35-reading-201", setId: "topik-35-reading", koreanWord: "응답하다", pronunciation: "eungdaphada", uzbekTranslation: "javob bermoq", exampleSentenceKo: "설문에 응답했어요.", exampleSentenceUz: "So'rovnomaga javob berdim.", partOfSpeech: "verb", topic: "Boylik va meros", order: 201 },
  { id: "topik-35-reading-202", setId: "topik-35-reading", koreanWord: "자수성가형", pronunciation: "jasugeongahyeong", uzbekTranslation: "o'z kuchi bilan boyigan tur", exampleSentenceKo: "자수성가형 부자를 존경해요.", exampleSentenceUz: "O'z kuchi bilan boyiganlarni hurmat qilaman.", partOfSpeech: "noun", topic: "Boylik va meros", order: 202 },
  { id: "topik-35-reading-203", setId: "topik-35-reading", koreanWord: "물려주다", pronunciation: "mullyeojuda", uzbekTranslation: "meros qoldirmoq", exampleSentenceKo: "자녀에게 재산을 물려줬어요.", exampleSentenceUz: "Farzandiga mulk meros qoldirdi.", partOfSpeech: "verb", topic: "Boylik va meros", order: 203 },
  { id: "topik-35-reading-204", setId: "topik-35-reading", koreanWord: "전수하다", pronunciation: "jeonsuhada", uzbekTranslation: "o'rgatib topshirmoq", exampleSentenceKo: "기술을 제자에게 전수했어요.", exampleSentenceUz: "Mahoratini shogirdiga o'rgatib qoldirdi.", partOfSpeech: "verb", topic: "Boylik va meros", order: 204 },
  { id: "topik-35-reading-205", setId: "topik-35-reading", koreanWord: "리더십", pronunciation: "rideosip", uzbekTranslation: "yetakchilik", exampleSentenceKo: "리더십이 뛰어나요.", exampleSentenceUz: "Yetakchilik qobiliyati kuchli.", partOfSpeech: "noun", topic: "Boylik va meros", order: 205 },
  { id: "topik-35-reading-206", setId: "topik-35-reading", koreanWord: "일종", pronunciation: "iljong", uzbekTranslation: "bir turi", exampleSentenceKo: "이것도 일종의 투자예요.", exampleSentenceUz: "Bu ham bir turdagi investitsiya.", partOfSpeech: "noun", topic: "Boylik va meros", order: 206 },
  { id: "topik-35-reading-207", setId: "topik-35-reading", koreanWord: "탁월하다", pronunciation: "takwolhada", uzbekTranslation: "ajoyib, mukammal", exampleSentenceKo: "실력이 탁월해요.", exampleSentenceUz: "Mahorati ajoyib.", partOfSpeech: "adjective", topic: "Boylik va meros", order: 207 },
  { id: "topik-35-reading-208", setId: "topik-35-reading", koreanWord: "업적", pronunciation: "eopjeok", uzbekTranslation: "yutuq", exampleSentenceKo: "큰 업적을 남겼어요.", exampleSentenceUz: "Katta yutuq qoldirdi.", partOfSpeech: "noun", topic: "Boylik va meros", order: 208 },
  { id: "topik-35-reading-209", setId: "topik-35-reading", koreanWord: "불가능하다", pronunciation: "bulganeunghada", uzbekTranslation: "imkonsiz", exampleSentenceKo: "그건 불가능해요.", exampleSentenceUz: "Bu imkonsiz.", partOfSpeech: "adjective", topic: "Boylik va meros", order: 209 },
  { id: "topik-35-reading-210", setId: "topik-35-reading", koreanWord: "다이빙대", pronunciation: "daibingdae", uzbekTranslation: "sakrash taxtasi", exampleSentenceKo: "다이빙대에서 뛰어내렸어요.", exampleSentenceUz: "Sakrash taxtasidan sakradim.", partOfSpeech: "noun", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 210 },
  { id: "topik-35-reading-211", setId: "topik-35-reading", koreanWord: "호기", pronunciation: "hogi", uzbekTranslation: "qiziqish", exampleSentenceKo: "호기심에 물어봤어요.", exampleSentenceUz: "Qiziqishdan so'radim.", partOfSpeech: "noun", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 211 },
  { id: "topik-35-reading-212", setId: "topik-35-reading", koreanWord: "한참", pronunciation: "hancham", uzbekTranslation: "uzoq vaqt", exampleSentenceKo: "한참을 기다렸어요.", exampleSentenceUz: "Uzoq vaqt kutdim.", partOfSpeech: "adverb", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 212 },
  { id: "topik-35-reading-213", setId: "topik-35-reading", koreanWord: "당연히", pronunciation: "dangyeonhi", uzbekTranslation: "albatta, tabiiyki", exampleSentenceKo: "당연히 도와줄게요.", exampleSentenceUz: "Albatta yordam beraman.", partOfSpeech: "adverb", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 213 },
  { id: "topik-35-reading-214", setId: "topik-35-reading", koreanWord: "스피커", pronunciation: "seupikeo", uzbekTranslation: "karnay", exampleSentenceKo: "스피커에서 소리가 났어요.", exampleSentenceUz: "Karnaydan ovoz eshitildi.", partOfSpeech: "noun", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 214 },
  { id: "topik-35-reading-215", setId: "topik-35-reading", koreanWord: "멈추다", pronunciation: "meomchuda", uzbekTranslation: "to'xtamoq", exampleSentenceKo: "갑자기 멈췄어요.", exampleSentenceUz: "Birdan to'xtadi.", partOfSpeech: "verb", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 215 },
  { id: "topik-35-reading-216", setId: "topik-35-reading", koreanWord: "격려하다", pronunciation: "gyeongnyeohada", uzbekTranslation: "ruhlantirmoq", exampleSentenceKo: "친구를 격려했어요.", exampleSentenceUz: "Do'stimni ruhlantirdim.", partOfSpeech: "verb", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 216 },
  { id: "topik-35-reading-217", setId: "topik-35-reading", koreanWord: "건조하다", pronunciation: "geonjohada", uzbekTranslation: "quruq, sovuq (munosabat)", exampleSentenceKo: "말투가 건조했어요.", exampleSentenceUz: "Gapirish ohangi quruq edi.", partOfSpeech: "adjective", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 217 },
  { id: "topik-35-reading-218", setId: "topik-35-reading", koreanWord: "위로하다", pronunciation: "wirohada", uzbekTranslation: "yupatmoq", exampleSentenceKo: "슬퍼하는 친구를 위로했어요.", exampleSentenceUz: "G'amgin do'stimni yupatdim.", partOfSpeech: "verb", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 218 },
  { id: "topik-35-reading-219", setId: "topik-35-reading", koreanWord: "원망하다", pronunciation: "wonmanghada", uzbekTranslation: "gina qilmoq", exampleSentenceKo: "아무도 원망하지 않아요.", exampleSentenceUz: "Hech kimga gina qilmayman.", partOfSpeech: "verb", topic: "Diving va ruhiy qo'llab-quvvatlash", order: 219 },
  { id: "topik-35-reading-220", setId: "topik-35-reading", koreanWord: "온실가스", pronunciation: "onsilgaseu", uzbekTranslation: "issiqxona gazlari", exampleSentenceKo: "온실가스를 줄여야 해요.", exampleSentenceUz: "Issiqxona gazlarini kamaytirish kerak.", partOfSpeech: "noun", topic: "Iqlim o'zgarishi siyosati", order: 220 },
  { id: "topik-35-reading-221", setId: "topik-35-reading", koreanWord: "시행하다", pronunciation: "sihaenghada", uzbekTranslation: "amalga oshirmoq, joriy etmoq", exampleSentenceKo: "새 정책을 시행했어요.", exampleSentenceUz: "Yangi siyosatni joriy etdik.", partOfSpeech: "verb", topic: "Iqlim o'zgarishi siyosati", order: 221 },
  { id: "topik-35-reading-222", setId: "topik-35-reading", koreanWord: "앞두다", pronunciation: "apduda", uzbekTranslation: "oldinda turmoq", exampleSentenceKo: "시험을 앞두고 있어요.", exampleSentenceUz: "Imtihon oldida turibman.", partOfSpeech: "verb", topic: "Iqlim o'zgarishi siyosati", order: 222 },
  { id: "topik-35-reading-223", setId: "topik-35-reading", koreanWord: "지구온난화", pronunciation: "jiguonnanhwa", uzbekTranslation: "global isish", exampleSentenceKo: "지구온난화가 심각해요.", exampleSentenceUz: "Global isish jiddiy holatda.", partOfSpeech: "noun", topic: "Iqlim o'zgarishi siyosati", order: 223 },
  { id: "topik-35-reading-224", setId: "topik-35-reading", koreanWord: "배출량", pronunciation: "baechullyang", uzbekTranslation: "chiqindi miqdori", exampleSentenceKo: "탄소 배출량을 줄였어요.", exampleSentenceUz: "Uglerod chiqindisi miqdorini kamaytirdik.", partOfSpeech: "noun", topic: "Iqlim o'zgarishi siyosati", order: 224 },
  { id: "topik-35-reading-225", setId: "topik-35-reading", koreanWord: "할당량", pronunciation: "haldangnyang", uzbekTranslation: "kvota", exampleSentenceKo: "할당량을 초과했어요.", exampleSentenceUz: "Kvotadan oshib ketdi.", partOfSpeech: "noun", topic: "Iqlim o'zgarishi siyosati", order: 225 },
  { id: "topik-35-reading-226", setId: "topik-35-reading", koreanWord: "가동하다", pronunciation: "gadonghada", uzbekTranslation: "ishga tushirmoq", exampleSentenceKo: "새 설비를 가동했어요.", exampleSentenceUz: "Yangi uskunani ishga tushirdik.", partOfSpeech: "verb", topic: "Iqlim o'zgarishi siyosati", order: 226 },
  { id: "topik-35-reading-227", setId: "topik-35-reading", koreanWord: "도리어", pronunciation: "dorieo", uzbekTranslation: "aksincha", exampleSentenceKo: "도리어 상황이 나빠졌어요.", exampleSentenceUz: "Aksincha vaziyat yomonlashdi.", partOfSpeech: "adverb", topic: "Iqlim o'zgarishi siyosati", order: 227 },
  { id: "topik-35-reading-228", setId: "topik-35-reading", koreanWord: "정책", pronunciation: "jeongchaek", uzbekTranslation: "siyosat", exampleSentenceKo: "환경 정책을 발표했어요.", exampleSentenceUz: "Ekologik siyosat e'lon qilindi.", partOfSpeech: "noun", topic: "Iqlim o'zgarishi siyosati", order: 228 },
  { id: "topik-35-reading-229", setId: "topik-35-reading", koreanWord: "동의하다", pronunciation: "donguihada", uzbekTranslation: "rozi bo'lmoq", exampleSentenceKo: "그 의견에 동의해요.", exampleSentenceUz: "O'sha fikrga roziman.", partOfSpeech: "verb", topic: "Iqlim o'zgarishi siyosati", order: 229 },
  { id: "topik-35-reading-230", setId: "topik-35-reading", koreanWord: "대책", pronunciation: "daechaek", uzbekTranslation: "chora-tadbir", exampleSentenceKo: "대책을 마련했어요.", exampleSentenceUz: "Chora-tadbir ishlab chiqdik.", partOfSpeech: "noun", topic: "Iqlim o'zgarishi siyosati", order: 230 },
  { id: "topik-35-reading-231", setId: "topik-35-reading", koreanWord: "면하다", pronunciation: "myeonhada", uzbekTranslation: "qutulmoq", exampleSentenceKo: "위험을 겨우 면했어요.", exampleSentenceUz: "Xavfdan zo'rg'a qutuldim.", partOfSpeech: "verb", topic: "Iqlim o'zgarishi siyosati", order: 231 },
  { id: "topik-35-reading-232", setId: "topik-35-reading", koreanWord: "포털", pronunciation: "poteol", uzbekTranslation: "portal (veb-sayt)", exampleSentenceKo: "포털 사이트에서 검색했어요.", exampleSentenceUz: "Portal saytida qidirdim.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 232 },
  { id: "topik-35-reading-233", setId: "topik-35-reading", koreanWord: "떠오르다", pronunciation: "tteooreuda", uzbekTranslation: "yodga tushmoq, ko'tarilmoq", exampleSentenceKo: "좋은 생각이 떠올랐어요.", exampleSentenceUz: "Yaxshi fikr yodimga keldi.", partOfSpeech: "verb", topic: "Kompaniyalar birlashuvi", order: 233 },
  { id: "topik-35-reading-234", setId: "topik-35-reading", koreanWord: "샛별", pronunciation: "saetbyeol", uzbekTranslation: "tong yulduzi", exampleSentenceKo: "샛별처럼 떠오른 회사예요.", exampleSentenceUz: "Tong yulduzidek yaraqlab chiqqan kompaniya.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 234 },
  { id: "topik-35-reading-235", setId: "topik-35-reading", koreanWord: "합병", pronunciation: "hapbyeong", uzbekTranslation: "kompaniyalar birlashuvi", exampleSentenceKo: "두 회사가 합병했어요.", exampleSentenceUz: "Ikki kompaniya birlashdi.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 235 },
  { id: "topik-35-reading-236", setId: "topik-35-reading", koreanWord: "지각", pronunciation: "jigak", uzbekTranslation: "kechikish; idrok", exampleSentenceKo: "회의에 지각했어요.", exampleSentenceUz: "Majlisga kechikdim.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 236 },
  { id: "topik-35-reading-237", setId: "topik-35-reading", koreanWord: "예측", pronunciation: "yecheuk", uzbekTranslation: "bashorat", exampleSentenceKo: "미래를 예측하기 어려워요.", exampleSentenceUz: "Kelajakni bashorat qilish qiyin.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 237 },
  { id: "topik-35-reading-238", setId: "topik-35-reading", koreanWord: "양분되다", pronunciation: "yangbundoeda", uzbekTranslation: "ikkiga bo'linmoq", exampleSentenceKo: "의견이 양분됐어요.", exampleSentenceUz: "Fikrlar ikkiga bo'lindi.", partOfSpeech: "verb", topic: "Kompaniyalar birlashuvi", order: 238 },
  { id: "topik-35-reading-239", setId: "topik-35-reading", koreanWord: "최상", pronunciation: "choesang", uzbekTranslation: "eng yuqori", exampleSentenceKo: "최상의 결과를 얻었어요.", exampleSentenceUz: "Eng yaxshi natijaga erishdim.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 239 },
  { id: "topik-35-reading-240", setId: "topik-35-reading", koreanWord: "시너지", pronunciation: "sineoji", uzbekTranslation: "sinergiya", exampleSentenceKo: "합병으로 시너지 효과를 냈어요.", exampleSentenceUz: "Birlashuv orqali sinergiya samarasiga erishdik.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 240 },
  { id: "topik-35-reading-241", setId: "topik-35-reading", koreanWord: "역량", pronunciation: "yeongnyang", uzbekTranslation: "salohiyat, imkoniyat", exampleSentenceKo: "역량을 키워야 해요.", exampleSentenceUz: "Salohiyatni oshirish kerak.", partOfSpeech: "noun", topic: "Kompaniyalar birlashuvi", order: 241 },
  { id: "topik-35-reading-242", setId: "topik-35-reading", koreanWord: "소규모", pronunciation: "sogyumo", uzbekTranslation: "kichik hajm, kichik miqyos", exampleSentenceKo: "소규모 회사에서 일해요.", exampleSentenceUz: "Kichik kompaniyada ishlayman.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 242 },
  { id: "topik-35-reading-243", setId: "topik-35-reading", koreanWord: "대처하다", pronunciation: "daecheohada", uzbekTranslation: "chora ko'rmoq", exampleSentenceKo: "문제에 잘 대처했어요.", exampleSentenceUz: "Muammoga yaxshi chora ko'rdim.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 243 },
  { id: "topik-35-reading-244", setId: "topik-35-reading", koreanWord: "삭제", pronunciation: "sakje", uzbekTranslation: "o'chirish", exampleSentenceKo: "게시물을 삭제했어요.", exampleSentenceUz: "Postni o'chirdim.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 244 },
  { id: "topik-35-reading-245", setId: "topik-35-reading", koreanWord: "제정", pronunciation: "jejeong", uzbekTranslation: "qonun chiqarish", exampleSentenceKo: "새 법이 제정됐어요.", exampleSentenceUz: "Yangi qonun chiqarildi.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 245 },
  { id: "topik-35-reading-246", setId: "topik-35-reading", koreanWord: "쟁점", pronunciation: "jaengjeom", uzbekTranslation: "bahsli masala", exampleSentenceKo: "이것이 핵심 쟁점이에요.", exampleSentenceUz: "Bu asosiy bahsli masala.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 246 },
  { id: "topik-35-reading-247", setId: "topik-35-reading", koreanWord: "부각되다", pronunciation: "bugakdoeda", uzbekTranslation: "ajralib chiqmoq", exampleSentenceKo: "문제점이 부각됐어요.", exampleSentenceUz: "Muammo yaqqol ajralib chiqdi.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 247 },
  { id: "topik-35-reading-248", setId: "topik-35-reading", koreanWord: "찬성하다", pronunciation: "chanseonghada", uzbekTranslation: "qo'llab-quvvatlamoq", exampleSentenceKo: "그 의견에 찬성해요.", exampleSentenceUz: "O'sha fikrni qo'llab-quvvatlayman.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 248 },
  { id: "topik-35-reading-249", setId: "topik-35-reading", koreanWord: "실행하다", pronunciation: "silhaenghada", uzbekTranslation: "amalga oshirmoq", exampleSentenceKo: "계획을 실행했어요.", exampleSentenceUz: "Rejani amalga oshirdim.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 249 },
  { id: "topik-35-reading-250", setId: "topik-35-reading", koreanWord: "존중하다", pronunciation: "jonjunghada", uzbekTranslation: "hurmat qilmoq", exampleSentenceKo: "서로의 의견을 존중해요.", exampleSentenceUz: "Bir-birimizning fikrini hurmat qilamiz.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 250 },
  { id: "topik-35-reading-251", setId: "topik-35-reading", koreanWord: "부작용", pronunciation: "bujagyong", uzbekTranslation: "yon ta'sir", exampleSentenceKo: "약의 부작용이 있어요.", exampleSentenceUz: "Dorining yon ta'siri bor.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 251 },
  { id: "topik-35-reading-252", setId: "topik-35-reading", koreanWord: "고발하다", pronunciation: "gobalhada", uzbekTranslation: "shikoyat qilmoq (sudga berish)", exampleSentenceKo: "회사를 고발했어요.", exampleSentenceUz: "Kompaniyaga qarshi shikoyat qildi.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 252 },
  { id: "topik-35-reading-253", setId: "topik-35-reading", koreanWord: "불행하다", pronunciation: "bulhaenghada", uzbekTranslation: "baxtsiz", exampleSentenceKo: "불행한 일이 생겼어요.", exampleSentenceUz: "Baxtsiz voqea yuz berdi.", partOfSpeech: "adjective", topic: "Qonun va huquq", order: 253 },
  { id: "topik-35-reading-254", setId: "topik-35-reading", koreanWord: "권리", pronunciation: "gwolli", uzbekTranslation: "huquq", exampleSentenceKo: "자신의 권리를 지켜야 해요.", exampleSentenceUz: "O'z huquqingizni himoya qilishingiz kerak.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 254 },
  { id: "topik-35-reading-255", setId: "topik-35-reading", koreanWord: "형성되다", pronunciation: "hyeongseongdoeda", uzbekTranslation: "shakllanmoq", exampleSentenceKo: "새로운 문화가 형성됐어요.", exampleSentenceUz: "Yangi madaniyat shakllandi.", partOfSpeech: "verb", topic: "Qonun va huquq", order: 255 },
  { id: "topik-35-reading-256", setId: "topik-35-reading", koreanWord: "장치", pronunciation: "jangchi", uzbekTranslation: "qurilma", exampleSentenceKo: "안전 장치를 설치했어요.", exampleSentenceUz: "Xavfsizlik qurilmasini o'rnatdim.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 256 },
  { id: "topik-35-reading-257", setId: "topik-35-reading", koreanWord: "행정", pronunciation: "haengjeong", uzbekTranslation: "ma'muriyat", exampleSentenceKo: "행정 업무를 처리해요.", exampleSentenceUz: "Ma'muriy ishlarni bajaraman.", partOfSpeech: "noun", topic: "Qonun va huquq", order: 257 },
  { id: "topik-35-reading-258", setId: "topik-35-reading", koreanWord: "성급하다", pronunciation: "seonggeuphada", uzbekTranslation: "shoshqaloq", exampleSentenceKo: "성급하게 결정하지 마세요.", exampleSentenceUz: "Shoshqaloqlik bilan qaror qabul qilmang.", partOfSpeech: "adjective", topic: "Qonun va huquq", order: 258 },
];

export const TOPIK_35_READING_SET: VocabularySet = {
  id: "topik-35-reading",
  topikLevel: 5,
  setNumber: 35,
  title: "35-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik35ReadingWords.length,
};

// Note: `topikLevel` is kept as metadata only — it is NOT used to group or
// filter sets anywhere in the app anymore. The student's TOPIK level (3-6)
// shown on the dashboard is instead *estimated* from how much of the total
// vocabulary (across every set combined) they've mastered — see
// estimateTopikLevel() in lib/services/statsService.ts.
export const TOPIK_35_LISTENING_SET: VocabularySet = {
  id: "topik-35-listening",
  topikLevel: 5,
  setNumber: 35,
  title: "35-TOPIK 듣기",
  description: "Tinglab tushunish so'zlari",
  wordCount: topik35ListeningWords.length,
};

export const TOPIK_36_READING_SET: VocabularySet = {
  id: "topik-36-reading",
  topikLevel: 5,
  setNumber: 36,
  title: "36-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik36ReadingWords.length,
};

export const TOPIK_36_LISTENING_SET: VocabularySet = {
  id: "topik-36-listening",
  topikLevel: 5,
  setNumber: 36,
  title: "36-TOPIK 듣기",
  description: "Tinglab tushunish so'zlari",
  wordCount: topik36ListeningWords.length,
};

export const TOPIK_37_READING_SET: VocabularySet = {
  id: "topik-37-reading",
  topikLevel: 5,
  setNumber: 37,
  title: "37-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik37ReadingWords.length,
};

export const TOPIK_41_READING_SET: VocabularySet = {
  id: "topik-41-reading",
  topikLevel: 5,
  setNumber: 41,
  title: "41-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik41ReadingWords.length,
};

export const TOPIK_41_LISTENING_SET: VocabularySet = {
  id: "topik-41-listening",
  topikLevel: 5,
  setNumber: 41,
  title: "41-TOPIK 듣기",
  description: "Tinglab tushunish so'zlari",
  wordCount: topik41ListeningWords.length,
};

export const TOPIK_47_READING_SET: VocabularySet = {
  id: "topik-47-reading",
  topikLevel: 5,
  setNumber: 47,
  title: "47-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik47ReadingWords.length,
};

export const TOPIK_52_READING_SET: VocabularySet = {
  id: "topik-52-reading",
  topikLevel: 5,
  setNumber: 52,
  title: "52-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik52ReadingWords.length,
};

export const TOPIK_60_READING_SET: VocabularySet = {
  id: "topik-60-reading",
  topikLevel: 5,
  setNumber: 60,
  title: "60-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik60ReadingWords.length,
};

export const TOPIK_64_READING_SET: VocabularySet = {
  id: "topik-64-reading",
  topikLevel: 5,
  setNumber: 64,
  title: "64-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik64ReadingWords.length,
};

export const TOPIK_83_READING_SET: VocabularySet = {
  id: "topik-83-reading",
  topikLevel: 5,
  setNumber: 83,
  title: "83-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik83ReadingWords.length,
};

export const TOPIK_91_READING_SET: VocabularySet = {
  id: "topik-91-reading",
  topikLevel: 5,
  setNumber: 91,
  title: "91-TOPIK 읽기",
  description: "O'qib tushunish so'zlari",
  wordCount: topik91ReadingWords.length,
};

// ↓↓↓ Add more sets here, following the same pattern ↓↓↓
export const VOCAB_SETS: VocabularySet[] = [
  TOPIK_35_READING_SET,
  TOPIK_35_LISTENING_SET,
  TOPIK_36_READING_SET,
  TOPIK_36_LISTENING_SET,
  TOPIK_37_READING_SET,
  TOPIK_41_READING_SET,
  TOPIK_41_LISTENING_SET,
  TOPIK_47_READING_SET,
  TOPIK_52_READING_SET,
  TOPIK_60_READING_SET,
  TOPIK_64_READING_SET,
  TOPIK_83_READING_SET,
  TOPIK_91_READING_SET,
  ...SEOUL_VOCAB_SETS,
];

export const VOCAB_WORDS: VocabularyWord[] = [
  ...topik35ReadingWords,
  ...topik35ListeningWords,
  ...topik36ReadingWords,
  ...topik36ListeningWords,
  ...topik37ReadingWords,
  ...topik41ReadingWords,
  ...topik41ListeningWords,
  ...topik47ReadingWords,
  ...topik52ReadingWords,
  ...topik60ReadingWords,
  ...topik64ReadingWords,
  ...topik83ReadingWords,
  ...topik91ReadingWords,
  ...SEOUL_VOCAB_WORDS,
];
