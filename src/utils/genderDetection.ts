/**
 * Gender detection from Indonesian names.
 * Uses scoring-based approach: high confidence = assign, low confidence = null.
 * Only called when explicit gender column is empty/missing during import.
 */

const MALE_PREFIXES = [
  'muhammad', 'mohammad', 'mohamad', 'mohd', 'ahmad', 'hamid',
  'ali', 'hasan', 'husain', 'hussein', 'abdullah', 'abdul', 'abdur',
  'syekh', 'syekh', 'kyai', 'haji', 'hajji', 'ustadz', 'ustaz', 'sheikh',
  'putra', 'putro', 'pratama',
];

const FEMALE_PREFIXES = [
  'siti', 'sita', ' siti', 'nur', 'nurul', 'nyai', 'hajjah', 'hajar',
  'putri', 'putri', 'ratna',
];

const MALE_NAMES = new Set([
  'budi', 'dedi', 'eko', 'joko', 'agus', 'wayan', 'made', 'nyoman', 'ketut',
  'komang', 'gede', 'rizki', 'rizky', 'fajar', 'hendra', 'iwan', 'kurniawan',
  'lukman', 'surya', 'tono', 'wahyu', 'yuda', 'zainal', 'fernando', 'riko',
  'dimas', 'arif', 'bambang', 'dodi', 'endang', 'firman', 'gilang', 'handoko',
  'indra', 'jaya', 'koko', 'leo', 'michael', 'nanda', 'panji', 'randy',
  'slamet', 'taufik', 'ujang', 'vino', 'wibowo', 'yanto', 'zaki', 'aditya',
  'adit', 'aldo', 'alex', 'andi', 'angga', 'anton', 'apri', 'ario', 'bagas',
  'bima', 'bintang', 'bram', 'cakra', 'catur', 'cahya', 'daffa', 'darma',
  'daru', 'deni', 'denny', 'deo', 'dhika', 'dian', 'didik', 'diki', 'dito',
  'dwi', 'edy', 'eko', 'erik', 'faris', 'gaga', 'galih', 'ghani', 'hadi',
  'hakam', 'hamba', 'hanif', 'harian', 'heri', 'herman', 'heru', 'huda',
  'ibnu', 'ilham', 'iman', 'irfan', 'ivan', 'jagat', 'jaka', 'jamal',
  'jamil', 'januar', 'jefri', 'jerry', 'jodi', 'julio', 'junaidi', 'karma',
  'kemal', 'kenji', 'luthfi', 'lukas', 'mahdi', 'malik', 'manuel', 'marcel',
  'mardani', 'mario', 'maruf', 'masrul', 'miftah', 'mikail', 'milo',
  'mirza', 'mizan', 'muchlis', 'mufti', 'muhaimin', 'muhibbin', 'mulyadi',
  'nabil', 'nadir', 'nafis', 'nasrullah', 'nugroho', 'nurhadi', 'nurman',
  'okta', 'omar', 'otong', 'pandu', 'prabowo', 'pramuka', 'prayoga',
  'pujo', 'rachel', 'radit', 'rafi', 'rahasa', 'raka', 'ramadhan', 'ramzi',
  'rangga', 'rasyad', 'refa', 'regar', 'reza', 'rian', 'ridho', 'rifqi',
  'riki', 'riza', 'robbi', 'robi', 'rohman', 'rohmat', 'roni', 'rudi',
  'rully', 'rusdi', 'samsul', 'sandi', 'saputra', 'satria', 'saeful',
  'soni', 'sopiansyah', 'sulton', 'suryadi', 'susanto', 'syahril', 'syamsul',
  'tata', 'teguh', 'toni', 'topan', 'tri', 'tulus', 'umar', 'usman',
  'wahyudi', 'walid', 'wanda', 'wawan', 'wibisono', 'wicaksono', 'wildan',
  'wira', 'yoga', 'yohanes', 'yosua', 'yudha', 'yudhistira', 'yusuf',
  'zulfikar', 'zulkifli',
]);

const FEMALE_NAMES = new Set([
  'dewi', 'ratna', 'ani', 'citra', 'eka', 'fitri', 'gita', 'hera', 'indah',
  'kusuma', 'lestari', 'murni', 'ningsih', 'puspita', 'ratih', 'sari', 'tuti',
  'umi', 'wati', 'yuli', 'zahra', 'amelia', 'bella', 'diana', 'elisa',
  'fitria', 'hana', 'indira', 'julia', 'kania', 'lisa', 'maya', 'nina',
  'olivia', 'ratna', 'sarah', 'tiara', 'wulan', 'yunita', 'zaskia',
  'anggraini', 'ayu', 'bunga', 'dian', 'fatimah', 'indri', 'juni',
  'kartika', 'larasati', 'mega', 'neni', 'oktaviani', 'permata', 'tutik',
  'uswatun', 'vivi', 'winda', 'yeni', 'ambar', 'anisa', 'aprilia',
  'aura', 'bilqis', 'cintya', 'della', 'desy', 'diah', 'dina', 'dini',
  'dita', 'elena', 'elsa', 'emo', 'eneng', 'erlin', 'erni', 'ester',
  'evi', 'fadilah', 'fauziah', 'fifi', 'fitriana', 'gina', 'gusti',
  'hafsah', 'halimah', 'hanna', 'harisa', 'heni', 'herlina', 'hesty',
  'husnul', 'imelda', 'ina', 'indi', 'islamiah', 'istiqomah', 'izza',
  'jamilah', 'jannah', 'juliah', 'kahar', 'kamila', 'karimah', 'kartini',
  'khoirunnisa', 'laila', 'lailatul', 'lina', 'lutfiah', 'madelina',
  'maharani', 'mardiah', 'maysarah', 'melati', 'mila', 'mimin', 'mita',
  'muhibbah', 'nabila', 'naila', 'najwa', 'nashita', 'nasya', 'nazwa',
  'nisa', 'nita', 'nizma', 'nurfadilah', 'nurhaliza', 'nurjanah',
  'nurlaila', 'nurmaidah', 'nurmala', 'nurochmah', 'nurul', 'nuraini',
  'nurazizah', 'octa', 'puput', 'raffi', 'rahma', 'rahmawati', 'rara',
  'rere', 'resti', 'riri', 'rosita', 'sabrina', 'salma', 'salsabila',
  'sami', 'sandra', 'savitri', 'septiani', 'shinta', 'shofa', 'silvia',
  'sinta', 'siti', 'sri', 'suci', 'sudarma', 'sumarni', 'susanti',
  'syaira', 'syakira', 'syifa', 'tami', 'tantri', 'tesa', 'tia',
  'ummi', 'ursula', 'valentina', 'vania', 'vienna', 'virgian',
  'wafiqah', 'wahyuni', 'wardani', 'windarti', 'yolandita', 'yusnita',
  'zahra', 'zainab', 'zakiyah', 'zein', 'zizi', 'zulia',
]);

const MALE_SUFFIXES = ['anto', 'arto', 'adi', 'uddin', 'udin', 'ullah', 'wan', 'man', 'din'];
const FEMALE_SUFFIXES = ['ah', 'na', 'iah', 'iyah', 'ina', 'ella', 'ela'];

export type GenderGuess = 'M' | 'F' | null;

export function detectGenderFromName(name: string): GenderGuess {
  if (!name || name.trim().length < 2) return null;

  const parts = name.toLowerCase().trim().split(/\s+/);
  const firstName = parts[0] || '';
  const fullLower = name.toLowerCase().trim();

  let maleScore = 0;
  let femaleScore = 0;

  // 1) Check prefixes (strong signal: ±3)
  for (const p of MALE_PREFIXES) {
    if (firstName === p || fullLower.startsWith(p + ' ')) {
      maleScore += 3;
      break;
    }
  }
  for (const p of FEMALE_PREFIXES) {
    if (firstName === p || fullLower.startsWith(p + ' ')) {
      femaleScore += 3;
      break;
    }
  }

  // 2) Check against known name sets (moderate signal: ±2)
  if (MALE_NAMES.has(firstName)) maleScore += 2;
  if (FEMALE_NAMES.has(firstName)) femaleScore += 2;

  // 3) Check suffixes on the last name part (weak signal: ±1)
  const lastName = parts[parts.length - 1] || '';
  for (const s of MALE_SUFFIXES) {
    if (lastName.endsWith(s) && lastName.length > s.length) {
      maleScore += 1;
      break;
    }
  }
  for (const s of FEMALE_SUFFIXES) {
    if (lastName.endsWith(s) && lastName.length > s.length) {
      femaleScore += 1;
      break;
    }
  }

  // 4) Require a clear margin (at least +2 difference) to decide
  if (maleScore >= 3 && maleScore > femaleScore + 1) return 'M';
  if (femaleScore >= 3 && femaleScore > maleScore + 1) return 'F';

  return null; // ambiguous → leave empty
}
