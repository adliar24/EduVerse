export interface LkpdAspect {
  id: string;
  label: string;
  placeholder: string;
  helperText?: string;
}

export interface LkpdTypeOption {
  id: 'observation' | 'experiment' | 'case_study' | 'interview';
  title: string;
  badgeLabel: string;
  iconName: string;
  description: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
}

export const LKPD_TYPES: LkpdTypeOption[] = [
  {
    id: 'observation',
    title: 'Observasi Lapangan & Objek',
    badgeLabel: 'Observasi Lingkungan',
    iconName: 'Search',
    description: 'Murid mencari dan memotret benda/objek nyata di sekolah serta menganalisis unsur atau karakteristiknya.',
    colorClass: 'text-amber-500',
    bgLightClass: 'bg-amber-500/10 text-amber-400',
    borderClass: 'border-amber-500/30'
  },
  {
    id: 'experiment',
    title: 'Praktikum & Eksperimen',
    badgeLabel: 'Praktikum Sains & IT',
    iconName: 'FlaskConical',
    description: 'Panduan uji coba, langkah kerja, dokumentasi foto proses, dan tabel data hasil percobaan.',
    colorClass: 'text-emerald-500',
    bgLightClass: 'bg-emerald-500/10 text-emerald-400',
    borderClass: 'border-emerald-500/30'
  },
  {
    id: 'case_study',
    title: 'Studi Kasus & Analisis',
    badgeLabel: 'Studi Kasus',
    iconName: 'FileQuestion',
    description: 'Analisis skenario atau masalah kontekstual dengan alur penalaran kritis bertahap.',
    colorClass: 'text-indigo-500',
    bgLightClass: 'bg-indigo-500/10 text-indigo-400',
    borderClass: 'border-indigo-500/30'
  },
  {
    id: 'interview',
    title: 'Wawancara & Investigasi',
    badgeLabel: 'Investigasi Lapangan',
    iconName: 'Mic',
    description: 'Kegiatan wawancara dengan narasumber di sekolah, dokumentasi foto, dan rangkuman poin temuan.',
    colorClass: 'text-sky-500',
    bgLightClass: 'bg-sky-500/10 text-sky-400',
    borderClass: 'border-sky-500/30'
  }
];

export interface ObservationPreset {
  id: string;
  name: string;
  subject: string;
  defaultTitle: string;
  defaultDesc: string;
  requirePhoto: boolean;
  photoLabel: string;
  aspects: LkpdAspect[];
  reflectionPrompt: string;
}

export const OBSERVATION_PRESETS: Record<string, ObservationPreset> = {
  art_elements: {
    id: 'art_elements',
    name: 'Seni Rupa (Unsur-Unsur Rupa)',
    subject: 'Seni Budaya / Seni Rupa',
    defaultTitle: 'LKPD Observasi Lingkungan: Eksplorasi 6 Unsur Seni Rupa',
    defaultDesc: 'Temukan 1 objek atau karya visual menarik di lingkungan sekolah. Ambil foto objek tersebut menggunakan kamera, lalu analisis 6 unsur rupa yang tampak: titik dan garis, bidang dan bentuk, ruang, tekstur, warna, serta gelap terang.',
    requirePhoto: true,
    photoLabel: 'Foto Objek yang Diobservasi',
    aspects: [
      {
        id: 'titik_garis',
        label: '1. Titik dan Garis',
        placeholder: 'Contoh: Terlihat garis lengkung dinamis pada tepi ornamen, garis lurus tegas pada pilar, serta pola bintik/titik tekstural...',
        helperText: 'Perhatikan bagaimana unsur titik dan goresan garis membentuk objek (lurus, melengkung, patah-patah, tegas, atau semu).'
      },
      {
        id: 'bidang_bentuk',
        label: '2. Bidang dan Bentuk',
        placeholder: 'Contoh: Wujud 3 dimensi bervolume, gabungan bidang geometris (alas balok) dan bentuk organis (sayap burung)...',
        helperText: 'Amati wujud bidang (2 Dimensi) dan bentuk bervolume (3 Dimensi), apakah geometris (teratur) atau organis (alami/bebas).'
      },
      {
        id: 'ruang',
        label: '3. Ruang',
        placeholder: 'Contoh: Objek memiliki ruang nyata 3 dimensi dengan rongga terbuka di bagian tengah yang memberi kesan kedalaman...',
        helperText: 'Amati kesan kedalaman, rongga, atau jarak (ruang nyata pada benda 3D atau ilusi kedalaman pada karya 2D).'
      },
      {
        id: 'tekstur',
        label: '4. Tekstur',
        placeholder: 'Contoh: Tekstur nyata yang terasa kasar dan berpori saat diraba pada bagian batu, serta halus licin pada bagian logam...',
        helperText: 'Bagaimana permukaan benda: kasar, halus, licin, berpori, atau bergelombang? Apakah tekstur nyata atau semu?'
      },
      {
        id: 'warna',
        label: '5. Warna',
        placeholder: 'Contoh: Didominasi warna hijau lumut alami dipadukan dengan aksen kuning kecokelatan yang hangat dan harmonis...',
        helperText: 'Sebutkan warna dominan, keharmonisan, kontras, serta kesan hangat, dingin, atau netral dari warna objek.'
      },
      {
        id: 'gelap_terang',
        label: '6. Gelap Terang',
        placeholder: 'Contoh: Arah datangnya sinar matahari dari samping atas menimbulkan bayangan pekat di sisi bawah, mempertegas volume objek...',
        helperText: 'Amati intensitas cahaya dan bayangan. Bagaimana gelap terang mempertegas bentuk, dimensi, dan volume benda?'
      }
    ],
    reflectionPrompt: 'Mengapa kamu memilih objek ini dan apa kesan keindahan/estetika yang kamu rasakan?'
  },
  biology_morphology: {
    id: 'biology_morphology',
    name: 'Biologi / IPA (Morfologi Makhluk Hidup)',
    subject: 'IPA / Biologi',
    defaultTitle: 'LKPD Observasi Lingkungan: Ciri Morfologi Tumbuhan/Hewan Sekolah',
    defaultDesc: 'Amati salah satu tumbuhan atau hewan kecil di sekitar sekolah. Ambil foto yang jelas, lalu identifikasi bagian-bagian tubuh dan ciri adaptasinya.',
    requirePhoto: true,
    photoLabel: 'Foto Spesimen / Tumbuhan / Hewan',
    aspects: [
      {
        id: 'ciri_morfologi',
        label: '1. Ciri Fisik / Morfologi',
        placeholder: 'Jelaskan bentuk daun, batang, akar, atau struktur tubuh yang tampak...',
        helperText: 'Bentuk fisik, warna, ukuran relatif, dan karakteristik bagian luar spesimen.'
      },
      {
        id: 'habitat_lingkungan',
        label: '2. Habitat & Tempat Tumbuh',
        placeholder: 'Dimana spesimen ini hidup (tanah lembap, menempel di pohon, di sela batu)...',
        helperText: 'Kondisi lingkungan mikro tempat spesimen ditemukan.'
      },
      {
        id: 'adaptasi',
        label: '3. Bentuk Adaptasi',
        placeholder: 'Bagaimana bentuk tubuh membantunya bertahan hidup (misal: daun berlapis lilin)...',
        helperText: 'Ciri fisik yang berfungsi untuk bertahan hidup terhadap cuaca atau lingkungan.'
      },
      {
        id: 'peran_ekosistem',
        label: '4. Peran dalam Lingkungan',
        placeholder: 'Perannya sebagai produsen, tempat berteduh serangga, peneduh lingkungan...',
        helperText: 'Manfaat atau interaksi spesimen terhadap lingkungan sekitarnya.'
      }
    ],
    reflectionPrompt: 'Apa wawasan menarik yang kamu pelajari dari keanekaragaman hayati sekolah ini?'
  },
  custom_observation: {
    id: 'custom_observation',
    name: 'Observasi Umum / Kustom',
    subject: 'Semua Mapel',
    defaultTitle: 'LKPD Observasi Lapangan',
    defaultDesc: 'Lakukan observasi langsung di lingkungan sekolah sesuai petunjuk guru, ambil dokumentasi foto, dan jawab poin analisis berikut.',
    requirePhoto: true,
    photoLabel: 'Foto Objek Pengamatan',
    aspects: [
      {
        id: 'ciri_utama',
        label: '1. Ciri Utama & Karakteristik',
        placeholder: 'Jelaskan karakteristik utama yang kamu amati...',
        helperText: 'Tuliskan pengamatan objektif kamu.'
      },
      {
        id: 'analisis_fungsi',
        label: '2. Fungsi atau Penggunaan',
        placeholder: 'Bagaimana peran atau fungsi dari objek/keadaan ini...',
        helperText: 'Fungsi, mekanisme, atau manfaat yang ditemukan.'
      },
      {
        id: 'kondisi_temuan',
        label: '3. Analisis Temuan',
        placeholder: 'Apa temuan menarik atau hal yang perlu dievaluasi...',
        helperText: 'Evaluasi kelebihan, kekurangan, atau dampak yang kamu temukan.'
      }
    ],
    reflectionPrompt: 'Tuliskan kesimpulan menyeluruh dari hasil observasi yang kamu lakukan.'
  }
};

/**
 * Tipe Blok pada Form Builder LKPD
 */
export type LkpdBlockType = 'instruction' | 'question';
export type LkpdResponseType = 'text' | 'link' | 'media';
export type LkpdMediaKind = 'image' | 'audio' | 'video' | 'document' | 'any';

export interface LkpdBlock {
  id: string;
  order: number;
  type: LkpdBlockType;
  title: string;
  description?: string;
  responseType?: LkpdResponseType;
  mediaKind?: LkpdMediaKind;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
}

export interface LkpdFormConfig {
  version: number; // 3 = modular form builder
  preset?: string;
  blocks: LkpdBlock[];
  allowReflection?: boolean;
  reflectionPrompt?: string;
  // Legacy backward compatibility fields
  id?: string;
  name?: string;
  requirePhoto?: boolean;
  photoLabel?: string;
  aspects?: LkpdAspect[];
}

/**
 * Jawaban murid per blok pada versi Form Builder Modular (V3)
 */
export interface LkpdBlockAnswer {
  blockId: string;
  type: LkpdResponseType;
  textValue?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

/**
 * Interface payload jawaban siswa pada tabel assignment_submissions
 */
export interface LkpdSubmissionPayload {
  is_lkpd: boolean;
  lkpd_type?: 'observation' | 'experiment' | 'case_study' | 'interview' | 'modular' | string;
  preset_id?: string;
  object_name?: string;
  location?: string;
  answers?: Record<string, string>; // Legacy V1/V2 answers
  blockAnswers?: Record<string, LkpdBlockAnswer>; // V3 modular answers
  reflection?: string;
  submitted_device?: string;
  version: number;
}

/**
 * Helper untuk memastikan URL valid dan memiliki skema https://
 */
export function ensureHttpUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Ekstrak daftar URL dari string teks
 */
export function extractUrlsFromText(text?: string | null): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|id|co|io|me|app|link|dev|gl|ly)(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map(m => ensureHttpUrl(m))));
}

/**
 * Konversi preset observasi menjadi blok-blok modular form builder (V3)
 */
export function convertPresetToBlocks(presetKey: string): LkpdBlock[] {
  const preset = OBSERVATION_PRESETS[presetKey] || OBSERVATION_PRESETS.art_elements;
  const blocks: LkpdBlock[] = [];
  let order = 1;

  // 1. Blok Instruksi / Pengantar
  blocks.push({
    id: `blk_inst_${Date.now()}_1`,
    order: order++,
    type: 'instruction',
    title: 'Petunjuk & Arahan Observasi',
    description: preset.defaultDesc
  });

  // 2. Blok Nama Objek
  blocks.push({
    id: `blk_obj_${Date.now()}_2`,
    order: order++,
    type: 'question',
    title: 'Nama Objek / Benda Pengamatan',
    description: 'Tuliskan nama benda, karya, atau objek yang kamu amati secara spesifik.',
    responseType: 'text',
    required: true,
    placeholder: 'Contoh: Patung Hias Taman Sekolah / Daun Sirih Kebun...'
  });

  // 3. Blok Foto Objek (jika preset mewajibkan foto)
  if (preset.requirePhoto) {
    blocks.push({
      id: `blk_photo_${Date.now()}_3`,
      order: order++,
      type: 'question',
      title: preset.photoLabel || 'Foto Objek Pengamatan',
      description: 'Gunakan kamera smartphone langsung atau unggah foto objek yang jelas.',
      responseType: 'media',
      mediaKind: 'image',
      required: true
    });
  }

  // 4. Blok Poin Analisis dari Aspek Preset
  preset.aspects.forEach((asp, idx) => {
    blocks.push({
      id: asp.id || `blk_asp_${Date.now()}_${order}`,
      order: order++,
      type: 'question',
      title: asp.label,
      description: asp.helperText,
      responseType: 'text',
      required: true,
      placeholder: asp.placeholder
    });
  });

  // 5. Blok Refleksi
  if (preset.reflectionPrompt) {
    blocks.push({
      id: `blk_refl_${Date.now()}_${order}`,
      order: order++,
      type: 'question',
      title: 'Refleksi & Kesimpulan Siswa',
      description: preset.reflectionPrompt,
      responseType: 'text',
      required: false,
      placeholder: 'Tuliskan kesimpulan atau kesan yang kamu peroleh...'
    });
  }

  return blocks;
}

/**
 * Buat template form kosong untuk kreasi bebas guru
 */
export function createEmptyFormBlocks(): LkpdBlock[] {
  return [
    {
      id: `blk_${Date.now()}_1`,
      order: 1,
      type: 'instruction',
      title: 'Petunjuk Kegiatan Pembelajaran',
      description: 'Tuliskan panduan pengerjaan, tujuan kegiatan, atau materi pengantar di sini...'
    },
    {
      id: `blk_${Date.now()}_2`,
      order: 2,
      type: 'question',
      title: 'Poin Soal / Analisis 1',
      description: 'Tuliskan pertanyaan atau instruksi pengumpulan untuk siswa.',
      responseType: 'text',
      required: true,
      placeholder: 'Tuliskan jawaban kamu di sini...'
    }
  ];
}

/**
 * Normalisasi konfigurasi LKPD (apakah legacy V1/V2 atau modular V3) menjadi daftar blok
 */
export function getNormalizedLkpdBlocks(config?: any): LkpdBlock[] {
  if (!config) return [];
  if (Array.isArray(config.blocks) && config.blocks.length > 0) {
    return config.blocks;
  }
  // Fallback dari config preset lama
  if (config.preset && OBSERVATION_PRESETS[config.preset]) {
    return convertPresetToBlocks(config.preset);
  }
  if (config.aspects && Array.isArray(config.aspects)) {
    const blocks: LkpdBlock[] = [];
    let order = 1;
    if (config.defaultDesc) {
      blocks.push({
        id: 'inst_legacy',
        order: order++,
        type: 'instruction',
        title: 'Petunjuk Pengerjaan',
        description: config.defaultDesc
      });
    }
    blocks.push({
      id: 'legacy_object_name',
      order: order++,
      type: 'question',
      title: 'Nama Objek Pengamatan',
      responseType: 'text',
      required: true
    });
    if (config.requirePhoto !== false) {
      blocks.push({
        id: 'legacy_photo',
        order: order++,
        type: 'question',
        title: config.photoLabel || 'Foto Objek Pengamatan',
        responseType: 'media',
        mediaKind: 'image',
        required: true
      });
    }
    config.aspects.forEach((asp: any) => {
      blocks.push({
        id: asp.id,
        order: order++,
        type: 'question',
        title: asp.label,
        description: asp.helperText,
        responseType: 'text',
        required: true,
        placeholder: asp.placeholder
      });
    });
    if (config.reflectionPrompt) {
      blocks.push({
        id: 'legacy_reflection',
        order: order++,
        type: 'question',
        title: 'Refleksi Siswa',
        description: config.reflectionPrompt,
        responseType: 'text',
        required: false
      });
    }
    return blocks;
  }
  return [];
}

/**
 * Cek apakah string respons text merupakan format payload LKPD yang valid
 */
export function parseLkpdResponse(textResponse?: string | null): LkpdSubmissionPayload | null {
  if (!textResponse) return null;
  try {
    const parsed = JSON.parse(textResponse);
    if (parsed && (parsed.is_lkpd || parsed.lkpd_type || parsed.blockAnswers)) {
      return parsed as LkpdSubmissionPayload;
    }
  } catch (e) {
    // Regular text response
  }
  return null;
}

