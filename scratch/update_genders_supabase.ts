import pkg from 'xlsx';
const { readFile, utils } = pkg;
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function main() {
  if (!fs.existsSync('.env')) {
    console.error('.env file not found!');
    return;
  }
  const envContent = fs.readFileSync('.env', 'utf-8');
  const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)?.[1] || '';
  const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)?.[1] || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not found in .env!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Build name-to-gender map from Excel files
  const nameToGenderMap: { [name: string]: 'M' | 'F' } = {};
  const files = ['KELAS X.xlsx', 'KELAS XI.xlsx'];

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`File not found: ${file}`);
      continue;
    }
    const workbook = readFile(file);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Find header row
      let headerIdx = -1;
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.some(cell => {
          const str = String(cell).toUpperCase();
          return str === 'NIS' || str === 'JK' || str === 'L/P' || str === 'NAMA' || str.includes('NAMA SISWA');
        })) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) continue;

      const headers = rawData[headerIdx].map(h => String(h || '').trim().toUpperCase());
      const nameIdx = headers.findIndex(h => h.includes('NAMA'));
      // Find JK or L/P column
      const jkIdx = headers.findIndex(h => h === 'JK' || h === 'L/P' || h === 'L/P ');

      if (nameIdx === -1 || jkIdx === -1) {
        continue;
      }

      // Extract data
      let sheetCount = 0;
      for (let i = headerIdx + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length <= Math.max(nameIdx, jkIdx)) continue;
        const name = String(row[nameIdx] || '').trim();
        const jk = String(row[jkIdx] || '').trim().toUpperCase();
        if (!name || !jk || jk === '0') continue;

        let genderVal: 'M' | 'F' | null = null;
        if (['L', 'M', 'LAKI', 'LAKI-LAKI', 'MALE', 'MAN', 'PRIA'].includes(jk)) {
          genderVal = 'M';
        } else if (['P', 'F', 'PEREMPUAN', 'FEMALE', 'WOMAN', 'WANITA'].includes(jk)) {
          genderVal = 'F';
        }

        if (genderVal) {
          nameToGenderMap[name.toLowerCase()] = genderVal;
          sheetCount++;
        }
      }
      console.log(`Sheet "${sheetName}" in ${file}: Loaded ${sheetCount} genders`);
    }
  }

  console.log(`\nTotal unique student names with genders mapped: ${Object.keys(nameToGenderMap).length}`);

  // 2. Fetch students from Supabase
  const { data: dbStudents, error } = await supabase.from('students').select('id, name, gender');
  if (error) {
    console.error('Error fetching students from Supabase:', error);
    return;
  }

  console.log(`Fetched ${dbStudents.length} students from Supabase.`);

  // 3. Update students on Supabase
  let updateCount = 0;
  for (const s of dbStudents) {
    const sName = (s.name || '').trim().toLowerCase();
    const gender = nameToGenderMap[sName];
    if (gender && s.gender !== gender) {
      const { error: updateErr } = await supabase
        .from('students')
        .update({ gender })
        .eq('id', s.id);
      if (updateErr) {
        console.error(`Failed to update ${s.name}:`, updateErr);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updateCount} student genders in Supabase!`);
}

main().catch(err => console.error('Execution error:', err));
