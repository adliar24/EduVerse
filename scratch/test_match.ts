import pkg from 'xlsx';
const { readFile, utils } = pkg;
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

function cleanName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  if (!fs.existsSync('.env')) return;
  const envContent = fs.readFileSync('.env', 'utf-8');
  const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)?.[1] || '';
  const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)?.[1] || '';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Build name maps
  const nameToGenderMap: { [name: string]: 'M' | 'F' } = {};
  const cleanNameToGenderMap: { [name: string]: { originalName: string, gender: 'M' | 'F' } } = {};
  const files = ['KELAS X.xlsx', 'KELAS XI.xlsx'];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const workbook = readFile(file);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      let headerIdx = -1;
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.some(cell => {
          const str = String(cell).toUpperCase();
          return str === 'NIS' || str === 'JK' || str === 'NAMA' || str.includes('NAMA SISWA');
        })) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) continue;

      const headers = rawData[headerIdx].map(h => String(h || '').trim().toUpperCase());
      const nameIdx = headers.findIndex(h => h.includes('NAMA'));
      const jkIdx = headers.findIndex(h => h === 'JK');

      if (nameIdx === -1 || jkIdx === -1) continue;

      for (let i = headerIdx + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length <= Math.max(nameIdx, jkIdx)) continue;
        const name = String(row[nameIdx] || '').trim();
        const jk = String(row[jkIdx] || '').trim().toUpperCase();
        if (!name || !jk) continue;

        let genderVal: 'M' | 'F' | null = null;
        if (['L', 'M', 'LAKI', 'LAKI-LAKI', 'MALE', 'MAN', 'PRIA'].includes(jk)) {
          genderVal = 'M';
        } else if (['P', 'F', 'PEREMPUAN', 'FEMALE', 'WOMAN', 'WANITA'].includes(jk)) {
          genderVal = 'F';
        }

        if (genderVal) {
          nameToGenderMap[name.toLowerCase()] = genderVal;
          cleanNameToGenderMap[cleanName(name)] = { originalName: name, gender: genderVal };
        }
      }
    }
  }

  // 2. Fetch students from Supabase
  const { data: dbStudents, error } = await supabase.from('students').select('id, name, gender');
  if (error) return;

  console.log(`Total database students: ${dbStudents.length}`);
  
  let exactMatches = 0;
  let cleanMatches = 0;
  let unmatched: any[] = [];

  for (const s of dbStudents) {
    const sName = (s.name || '').trim().toLowerCase();
    const cleanSName = cleanName(s.name || '');
    
    if (nameToGenderMap[sName]) {
      exactMatches++;
    } else if (cleanNameToGenderMap[cleanSName]) {
      cleanMatches++;
    } else {
      unmatched.push(s.name);
    }
  }

  console.log(`Exact Matches: ${exactMatches}`);
  console.log(`Clean Matches (ignoring punctuation/spaces): ${cleanMatches}`);
  console.log(`Unmatched: ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log(`Sample unmatched database names:`, unmatched.slice(0, 15));
  }
}

main().catch(console.error);
