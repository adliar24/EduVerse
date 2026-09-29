// ============================================================
// VERSE COMPANION & LEVELING ENGINE - EDUVERSE
// ============================================================
import { 
  StudentVerse, 
  VerseElement, 
  VerseSpecies, 
  VerseStage 
} from '../types';

export type { StudentVerse, VerseElement, VerseSpecies, VerseStage };
export type VerseEvolutionStage = VerseStage;

export interface VerseStageInfo {
  stage: VerseStage;
  name: string;
  title: string;
  minLevel: number;
  maxLevel: number;
  description: string;
  image: string;
  pngImage: string;
}

export type VerseStagesCollection = VerseStageInfo[] & Record<VerseStage, VerseStageInfo>;

export interface VerseSpeciesConfig {
  species: VerseSpecies;
  element: VerseElement;
  elementName: string;
  elementLabel: string;
  elementColor: string; // Hex color
  philosophy: string;
  badgeBg: string;
  accentBg: string;
  gradientClass: string;
  borderClass: string;
  bgGlowClass: string;
  eggImage: string;
  eggPngImage: string;
  eggTitle: string;
  eggDescription: string;
  trait: string;
  stages: VerseStagesCollection;
}

export interface LevelProgress {
  currentLevel: number;
  currentStage: VerseStage;
  currentExp: number;
  nextLevelExp: number;
  currentLevelProgress: number;
  pointsNeededForNext: number;
  progressPercent: number;
  progressPct: number;
  pointsRemaining: number;
  isMaxStage: boolean;
  totalLifetimePoints: number;
  level: number;
  stage: VerseStage;
  nextStageLevel: number | null;
  pointsToNextStage: number | null;
  title: string;
}

export const CHEST_ASSET = {
  webp: '/verse/chest.webp',
  png: '/verse/chest.png',
};

// ------------------------------------------------------------
// 1. HELPER NORMALISASI SPESIES & ELEMEN
// ------------------------------------------------------------
export const normalizeSpecies = (species: string): VerseSpecies => {
  const s = (species || '').toLowerCase();
  if (s.includes('pyro') || s.includes('api')) return 'Pyrofox';
  if (s.includes('aqua') || s.includes('air')) return 'Aquaxolt';
  if (s.includes('pango') || s.includes('bumi')) return 'Pangorock';
  if (s.includes('cirro') || s.includes('angin')) return 'Cirrofinch';
  if (s.includes('volt') || s.includes('petir')) return 'Voltlynx';
  return 'Pyrofox';
};

export const getElementForSpecies = (species: VerseSpecies): VerseElement => {
  switch (species) {
    case 'Pyrofox': return 'api';
    case 'Aquaxolt': return 'air';
    case 'Pangorock': return 'bumi';
    case 'Cirrofinch': return 'angin';
    case 'Voltlynx': return 'petir';
  }
};

function makeStages(
  species: VerseSpecies,
  data: [
    { name: string; title: string; minLevel: number; maxLevel: number; desc: string },
    { name: string; title: string; minLevel: number; maxLevel: number; desc: string },
    { name: string; title: string; minLevel: number; maxLevel: number; desc: string },
    { name: string; title: string; minLevel: number; maxLevel: number; desc: string },
  ]
): VerseStagesCollection {
  const s1: VerseStageInfo = {
    stage: 1,
    name: data[0].name,
    title: data[0].title,
    minLevel: data[0].minLevel,
    maxLevel: data[0].maxLevel,
    description: data[0].desc,
    image: `/verse/${species}/1.webp`,
    pngImage: `/verse/${species}/1.png`,
  };
  const s2: VerseStageInfo = {
    stage: 2,
    name: data[1].name,
    title: data[1].title,
    minLevel: data[1].minLevel,
    maxLevel: data[1].maxLevel,
    description: data[1].desc,
    image: `/verse/${species}/2.webp`,
    pngImage: `/verse/${species}/2.png`,
  };
  const s3: VerseStageInfo = {
    stage: 3,
    name: data[2].name,
    title: data[2].title,
    minLevel: data[2].minLevel,
    maxLevel: data[2].maxLevel,
    description: data[2].desc,
    image: `/verse/${species}/3.webp`,
    pngImage: `/verse/${species}/3.png`,
  };
  const s4: VerseStageInfo = {
    stage: 4,
    name: data[3].name,
    title: data[3].title,
    minLevel: data[3].minLevel,
    maxLevel: data[3].maxLevel,
    description: data[3].desc,
    image: `/verse/${species}/4.webp`,
    pngImage: `/verse/${species}/4.png`,
  };

  const arr: any = [s1, s2, s3, s4];
  arr[1] = s1;
  arr[2] = s2;
  arr[3] = s3;
  arr[4] = s4;
  return arr;
}

// ------------------------------------------------------------
// 2. KONFIGURASI 5 SPESIES ELEMEN & 4 TAHAP EVOLUSI
// ------------------------------------------------------------
export const VERSE_SPECIES_CONFIG: Record<VerseSpecies, VerseSpeciesConfig> = {
  Pyrofox: {
    species: 'Pyrofox',
    element: 'api',
    elementName: 'Api',
    elementLabel: 'Api',
    elementColor: '#EF4444',
    philosophy: 'Membawa energi hangat keberanian, ketangkasan, dan semangat pantang padam.',
    badgeBg: 'bg-red-50 text-red-600 border-red-200',
    accentBg: 'from-orange-500/15 via-rose-500/10 to-transparent',
    gradientClass: 'from-orange-500 via-rose-500 to-red-600',
    borderClass: 'border-orange-200',
    bgGlowClass: 'bg-orange-500/10 text-orange-600',
    eggImage: '/verse/Pyrofox/egg.webp',
    eggPngImage: '/verse/Pyrofox/egg.png',
    eggTitle: 'Telur Api Hangat',
    eggDescription: 'Membawa energi hangat keberanian dan ketangkasan beraksi.',
    trait: 'Berani & Semangat',
    stages: makeStages('Pyrofox', [
      { name: 'Emberkit', title: 'Rubah Kerdil Bayi', minLevel: 1, maxLevel: 5, desc: 'Rubah kerdil mungil berujung ekor bara api yang hangat dan ceria.' },
      { name: 'Pyrofox', title: 'Rubah Remaja Lincah', minLevel: 6, maxLevel: 15, desc: 'Rubah muda gesit bertelinga api dengan syal petualang pemberani.' },
      { name: 'Flametail', title: 'Penjaga Api Abadi', minLevel: 16, maxLevel: 30, desc: 'Rubah anggun berekor tiga berkobar dengan cakar obsidian bercahaya.' },
      { name: 'Solaris Kyubi', title: 'Dewa Surya Surgawi', minLevel: 31, maxLevel: 999, desc: 'Rubah agung sembilan ekor surya bermahkota api matahari abadi.' }
    ])
  },

  Aquaxolt: {
    species: 'Aquaxolt',
    element: 'air',
    elementName: 'Air',
    elementLabel: 'Air',
    elementColor: '#06B6D4',
    philosophy: 'Membawa kejernihan berpikir, empati mendalam, dan kedamaian hati dalam belajar.',
    badgeBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    accentBg: 'from-cyan-500/15 via-sky-500/10 to-transparent',
    gradientClass: 'from-cyan-500 via-sky-500 to-blue-600',
    borderClass: 'border-cyan-200',
    bgGlowClass: 'bg-cyan-500/10 text-cyan-600',
    eggImage: '/verse/Aquaxolt/egg.webp',
    eggPngImage: '/verse/Aquaxolt/egg.png',
    eggTitle: 'Telur Air Menenangkan',
    eggDescription: 'Membawa kejernihan berpikir, empati mendalam, dan kedamaian.',
    trait: 'Tenang & Jernih',
    stages: makeStages('Aquaxolt', [
      { name: 'Dewlotl', title: 'Bayi Gelembung Embun', minLevel: 1, maxLevel: 5, desc: 'Bayi axolotl transparan yang melayang anggun di dalam gelembung air.' },
      { name: 'Aqualotl', title: 'Axolotl Melayang', minLevel: 6, maxLevel: 15, desc: 'Axolotl bersirip gelombang dengan antena kristal penyejuk suasana.' },
      { name: 'Tidestride', title: 'Pengelana Samudra', minLevel: 16, maxLevel: 30, desc: 'Axolotl anggun berjubah kabut air dengan kemampuan memanggil gelombang.' },
      { name: 'Leviathan Levi', title: 'Naga Air Celestial', minLevel: 31, maxLevel: 999, desc: 'Wujud naga laut mistis bermutiara kosmik penguasa kedalaman ilmu.' }
    ])
  },

  Pangorock: {
    species: 'Pangorock',
    element: 'bumi',
    elementName: 'Bumi',
    elementLabel: 'Bumi',
    elementColor: '#10B981',
    philosophy: 'Membawa ketekunan baja, keteguhan prinsip, dan daya tahan belajar tak tergoyahkan.',
    badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    accentBg: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    gradientClass: 'from-emerald-500 via-teal-600 to-emerald-700',
    borderClass: 'border-emerald-200',
    bgGlowClass: 'bg-emerald-500/10 text-emerald-600',
    eggImage: '/verse/Pangorock/egg.webp',
    eggPngImage: '/verse/Pangorock/egg.png',
    eggTitle: 'Telur Bumi Kokoh',
    eggDescription: 'Membawa ketekunan baja, kedisiplinan, dan daya tahan belajar.',
    trait: 'Teguh & Konsisten',
    stages: makeStages('Pangorock', [
      { name: 'Pebbleling', title: 'Trenggiling Kerikil', minLevel: 1, maxLevel: 5, desc: 'Trenggiling mini berkulit kerikil halus yang bisa membulat lucu.' },
      { name: 'Pangorock', title: 'Trenggiling Berbatu', minLevel: 6, maxLevel: 15, desc: 'Trenggiling berzirah lempeng granit kokoh pelindung kawan belajar.' },
      { name: 'Geoshield', title: 'Benteng Kristal Bumi', minLevel: 16, maxLevel: 30, desc: 'Trenggiling berzirah lempeng zamrud dengan cakar pembelah rintangan.' },
      { name: 'Titanscale', title: 'Titan Lempeng Jagat', minLevel: 31, maxLevel: 999, desc: 'Titan bebatuan purba berurat kristal zamrud bercahaya tak tergoyahkan.' }
    ])
  },

  Cirrofinch: {
    species: 'Cirrofinch',
    element: 'angin',
    elementName: 'Angin',
    elementLabel: 'Angin',
    elementColor: '#38BDF8',
    philosophy: 'Membawa kebebasan daya cipta, eksplorasi tanpa batas, dan ide-ide cemerlang.',
    badgeBg: 'bg-sky-50 text-sky-600 border-sky-200',
    accentBg: 'from-sky-500/15 via-blue-500/10 to-transparent',
    gradientClass: 'from-sky-400 via-blue-400 to-indigo-500',
    borderClass: 'border-sky-200',
    bgGlowClass: 'bg-sky-500/10 text-sky-600',
    eggImage: '/verse/Cirrofinch/egg.webp',
    eggPngImage: '/verse/Cirrofinch/egg.png',
    eggTitle: 'Telur Angin Semilir',
    eggDescription: 'Membawa kebebasan daya cipta, eksplorasi tanpa batas, dan imajinasi.',
    trait: 'Kreatif & Eksploratif',
    stages: makeStages('Cirrofinch', [
      { name: 'Breezeling', title: 'Anak Burung Awan', minLevel: 1, maxLevel: 5, desc: 'Anak burung mungil berbulu kapas halus seperti gumpalan awan pagi.' },
      { name: 'Cirrofinch', title: 'Burung Angin Fajar', minLevel: 6, maxLevel: 15, desc: 'Burung awan bersayap semilir fajar dengan jambul meliuk elegan.' },
      { name: 'Stormwing', title: 'Rajawali Stratus', minLevel: 16, maxLevel: 30, desc: 'Rajawali awan penyibak kabut dengan bentang sayap aerodinamis.' },
      { name: 'Aero Tempest', title: 'Garuda Angkasa Raya', minLevel: 31, maxLevel: 999, desc: 'Garuda surgawi bermahkota pelangi pelindung cakrawala cita-cita.' }
    ])
  },

  Voltlynx: {
    species: 'Voltlynx',
    element: 'petir',
    elementName: 'Petir',
    elementLabel: 'Petir',
    elementColor: '#F59E0B',
    philosophy: 'Membawa ketajaman analisis, pemecahan masalah tangkas, dan kecerdikan kilat.',
    badgeBg: 'bg-amber-50 text-amber-600 border-amber-200',
    accentBg: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    gradientClass: 'from-amber-400 via-yellow-500 to-orange-500',
    borderClass: 'border-amber-200',
    bgGlowClass: 'bg-amber-500/10 text-amber-600',
    eggImage: '/verse/Voltlynx/egg.webp',
    eggPngImage: '/verse/Voltlynx/egg.png',
    eggTitle: 'Telur Petir Berpijar',
    eggDescription: 'Membawa kecerdikan taktis, refleks kilat, dan ketajaman logika.',
    trait: 'Cerdas & Refleks Kilat',
    stages: makeStages('Voltlynx', [
      { name: 'Sparkitten', title: 'Anak Kucing Kilat', minLevel: 1, maxLevel: 5, desc: 'Anak musang/kucing bertelinga kilat dengan percikan listrik statis lucu.' },
      { name: 'Voltlynx', title: 'Musang Kilat Neon', minLevel: 6, maxLevel: 15, desc: 'Kucing musang lincah bergaris neon kuning berkecepatan kilat.' },
      { name: 'Thundershade', title: 'Pemburu Petir Supersonik', minLevel: 16, maxLevel: 30, desc: 'Lynx pemburu bermata biru neon yang mampu melesat secepat petir.' },
      { name: 'Raijin Lynx', title: 'Kucing Dewa Halilintar', minLevel: 31, maxLevel: 999, desc: 'Kucing dewa halilintar agung berzirah plasma emas berkekuatan penuh.' }
    ])
  }
};

// Aliases for ease of consumption
export const VERSE_CHARACTERS = VERSE_SPECIES_CONFIG;

export const getAllVerseCharacters = (): VerseSpeciesConfig[] => {
  return Object.values(VERSE_SPECIES_CONFIG);
};

export const getVerseCharacter = (species: VerseSpecies | string): VerseSpeciesConfig => {
  const norm = normalizeSpecies(species);
  return VERSE_SPECIES_CONFIG[norm] || VERSE_SPECIES_CONFIG.Pyrofox;
};

// ------------------------------------------------------------
// 3. FORMULA LEVEL & KALKULASI PROGRES
// ------------------------------------------------------------
export const STAGE_THRESHOLDS = [
  { stage: 1 as VerseStage, minLevel: 1, title: 'Tahap 1: Hatchling' },
  { stage: 2 as VerseStage, minLevel: 6, title: 'Tahap 2: Junior' },
  { stage: 3 as VerseStage, minLevel: 16, title: 'Tahap 3: Guardian' },
  { stage: 4 as VerseStage, minLevel: 31, title: 'Tahap 4: Mythic' },
];

export function getStageTitle(stage: VerseStage): string {
  switch (stage) {
    case 1: return 'Tahap 1: Hatchling';
    case 2: return 'Tahap 2: Junior';
    case 3: return 'Tahap 3: Guardian';
    case 4: return 'Tahap 4: Mythic';
  }
}

/**
 * Menghitung tahapan evolusi (1 - 4) berdasarkan level.
 */
export function getStageForLevel(level: number): VerseStage {
  if (level >= 31) return 4;
  if (level >= 16) return 3;
  if (level >= 6) return 2;
  return 1;
}

export const getEvolutionStage = getStageForLevel;

/**
 * Menghitung total lifetime points yang dibutuhkan untuk mencapai level tertentu.
 */
export function getTotalPointsForLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += l * 50 + 20;
  }
  return total;
}

/**
 * Menghitung level, EXP saat ini, dan target EXP berikutnya dari total lifetime points.
 * Rumus EXP level berikutnya: Level * 50 + 20
 */
export function calculateLevelAndProgress(lifetimePoints: number): LevelProgress {
  let pts = Math.max(0, Number(lifetimePoints) || 0);
  let level = 1;

  while (true) {
    const requiredForNext = level * 50 + 20;
    if (pts >= requiredForNext) {
      pts -= requiredForNext;
      level++;
    } else {
      break;
    }
  }

  const requiredForNext = level * 50 + 20;
  const currentExp = pts;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentExp / requiredForNext) * 100)));
  const currentStage = getStageForLevel(level);

  let nextStageLevel: number | null = null;
  let pointsToNextStage: number | null = null;

  if (currentStage === 1) nextStageLevel = 6;
  else if (currentStage === 2) nextStageLevel = 16;
  else if (currentStage === 3) nextStageLevel = 31;
  else nextStageLevel = null;

  if (nextStageLevel) {
    const totalNeededForTarget = getTotalPointsForLevel(nextStageLevel);
    pointsToNextStage = Math.max(0, totalNeededForTarget - (Number(lifetimePoints) || 0));
  }

  const pointsRemaining = Math.max(0, requiredForNext - currentExp);

  return {
    currentLevel: level,
    currentStage,
    currentExp,
    nextLevelExp: requiredForNext,
    currentLevelProgress: currentExp,
    pointsNeededForNext: requiredForNext,
    progressPercent,
    progressPct: progressPercent,
    pointsRemaining,
    isMaxStage: currentStage === 4,
    totalLifetimePoints: Number(lifetimePoints) || 0,
    level,
    stage: currentStage,
    nextStageLevel,
    pointsToNextStage,
    title: getStageTitle(currentStage)
  };
}

export const calculateLevelFromPoints = calculateLevelAndProgress;

/**
 * Mengambil metadata spesifik untuk spesies dan tahap evolusi tertentu.
 */
export function getVerseStageInfo(species: VerseSpecies | string, stage: VerseStage): VerseStageInfo {
  const cfg = getVerseCharacter(species);
  const targetStage = Math.max(1, Math.min(4, stage || 1)) as VerseStage;
  return cfg.stages[targetStage] || cfg.stages[1];
}

export const getStageInfo = getVerseStageInfo;

// ------------------------------------------------------------
// 4. SAPAAN & MOTIVASI PERSONAL
// ------------------------------------------------------------
export function getVerseGreeting(species: VerseSpecies | string, studentName: string = 'Kawan', _level: number = 1): string {
  const firstName = (studentName || 'Kawan').split(' ')[0];
  const normalized = normalizeSpecies(species);

  const greetingsBySpecies: Record<VerseSpecies, string[]> = {
    Pyrofox: [
      `Semangat membara hari ini, ${firstName}! Mari selesaikan tugasmu!`,
      `Api ketekunanmu makin terang! Lanjutkan belajarmu, ${firstName}!`,
      `Setiap tantangan adalah bahan bakar kemajuanmu, ${firstName}!`,
      `Ayo kumpulkan poin hari ini agar wujud apiku makin berkobar!`
    ],
    Aquaxolt: [
      `Tetap tenang dan jernih dalam belajar, ${firstName}.`,
      `Air yang tenang menghanyutkan ilmu yang luas. Semangat, ${firstName}!`,
      `Bernapaslah sejenak, lalu kerjakan tugasmu dengan damai, ${firstName}.`,
      `Setiap tetes usahamu mengalir menuju kesuksesan besar!`
    ],
    Pangorock: [
      `Konsistensi adalah kuncimu, ${firstName}. Langkah kecil itu berarti!`,
      `Fondasi belajarmu kokoh sekuat batu granit, ${firstName}!`,
      `Jangan menyerah, bebatuan keras pun dapat ditembus oleh tekad!`,
      `Satu tugas demi satu tugas, kita bangun masa depanmu, ${firstName}!`
    ],
    Cirrofinch: [
      `Cakrawala ilmu terbentang luas, mari terbang tinggi, ${firstName}!`,
      `Bebaskan kreativitas dan rasa ingin tahumu hari ini, ${firstName}!`,
      `Semilir angin membawa inspirasi segar untuk belajarmu.`,
      `Terbanglah menembus awan dan taklukkan setiap soal, ${firstName}!`
    ],
    Voltlynx: [
      `Refleks kilat, fokus tajam! Waktunya belajar cepat, ${firstName}!`,
      `Percikan idemu sangat cemerlang hari ini, ${firstName}!`,
      `Selesaikan tugas secepat sambaran kilat! Kamu pasti bisa!`,
      `Energi listrik kita siap menaklukkan semua tantangan hari ini!`
    ]
  };

  const list = greetingsBySpecies[normalized] || greetingsBySpecies.Pyrofox;
  const index = Math.abs(Math.floor(Date.now() / (1000 * 60 * 60))) % list.length;
  return list[index];
}

export const getRandomMotivationQuote = (species: VerseSpecies | string, studentName: string = 'Kawan'): string => {
  return getVerseGreeting(species, studentName, 1);
};

// ------------------------------------------------------------
// 5. PENYIMPANAN LOKAL (OFFLINE-FIRST)
// ------------------------------------------------------------
const VERSE_STORAGE_KEY_PREFIX = 'eduverse_verse_';

export function getStudentVerseLocal(studentId: string): StudentVerse | null {
  try {
    const raw = localStorage.getItem(`${VERSE_STORAGE_KEY_PREFIX}${studentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStudentVerseLocal(verse: StudentVerse): void {
  try {
    localStorage.setItem(`${VERSE_STORAGE_KEY_PREFIX}${verse.studentId}`, JSON.stringify(verse));
  } catch (e) {}
}

export { createStudentVerse } from '../services/verseService';
