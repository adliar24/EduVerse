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
 * Interface payload jawaban siswa pada tabel assignment_submissions
 */
export interface LkpdSubmissionPayload {
  is_lkpd: boolean;
  lkpd_type: 'observation' | 'experiment' | 'case_study' | 'interview';
  preset_id?: string;
  object_name?: string;
  location?: string;
  answers: Record<string, string>;
  reflection?: string;
  submitted_device?: string;
  version: number;
}

/**
 * Cek apakah string respons text merupakan format payload LKPD yang valid
 */
export function parseLkpdResponse(textResponse?: string | null): LkpdSubmissionPayload | null {
  if (!textResponse) return null;
  try {
    const parsed = JSON.parse(textResponse);
    if (parsed && (parsed.is_lkpd || parsed.lkpd_type)) {
      return parsed as LkpdSubmissionPayload;
    }
  } catch (e) {
    // Regular text response
  }
  return null;
}
