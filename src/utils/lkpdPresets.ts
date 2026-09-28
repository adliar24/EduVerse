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
    defaultTitle: 'LKPD Observasi Lingkungan: Eksplorasi Unsur Seni Rupa',
    defaultDesc: 'Temukan 1 objek atau sudut visual menarik di lingkungan sekolah. Ambil foto objek tersebut menggunakan kameramu, lalu jelaskan unsur-unsur rupa yang ada pada objek tersebut secara cermat.',
    requirePhoto: true,
    photoLabel: 'Foto Objek yang Diobservasi',
    aspects: [
      {
        id: 'garis',
        label: '1. Unsur Garis',
        placeholder: 'Contoh: Terlihat garis lengkung dinamis pada tepi daun, dan garis lurus tegas pada pilar penyangga...',
        helperText: 'Perhatikan jenis garis: lurus, melengkung, patah-patah, tegas, atau semu.'
      },
      {
        id: 'bidang_bentuk',
        label: '2. Unsur Bidang & Bentuk',
        placeholder: 'Contoh: Bentuk 3 dimensi gabungan bidang geometris (alas kotak) dan organis (patung elang)...',
        helperText: 'Apakah bentuknya geometris (persegi, lingkaran) atau organis/alami? 2 Dimensi atau 3 Dimensi?'
      },
      {
        id: 'warna',
        label: '3. Unsur Warna',
        placeholder: 'Contoh: Dominan warna hijau lumut alami dipadukan dengan aksen kuning kecokelatan...',
        helperText: 'Sebutkan warna dominan, apakah warna primer/sekunder, bernuansa hangat, dingin, atau kontras.'
      },
      {
        id: 'tekstur',
        label: '4. Unsur Tekstur',
        placeholder: 'Contoh: Tekstur nyata yang terasa kasar saat disentuh, dengan pori-pori yang jelas...',
        helperText: 'Bagaimana tekstur permukaannya: kasar, halus, licin, berpori, atau bergelombang? Nyata atau semu?'
      },
      {
        id: 'gelap_terang',
        label: '5. Unsur Gelap-Terang & Ruang',
        placeholder: 'Contoh: Pencahayaan dari atas menimbulkan bayangan pekat di bawah lipatan, memberi kesan volume...',
        helperText: 'Bagaimana arah jatuhnya cahaya dan bayangan? Apakah menciptakan kesan kedalaman ruang?'
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
