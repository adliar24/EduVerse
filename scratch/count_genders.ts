import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function main() {
  if (!fs.existsSync('.env')) return;
  const envContent = fs.readFileSync('.env', 'utf-8');
  const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)?.[1] || '';
  const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)?.[1] || '';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: dbStudents, error } = await supabase.from('students').select('name, gender');
  if (error) return;

  const total = dbStudents.length;
  const withGender = dbStudents.filter(s => s.gender !== null && s.gender !== '').length;
  const withoutGender = total - withGender;

  console.log(`Total students in DB: ${total}`);
  console.log(`With gender: ${withGender}`);
  console.log(`Without gender: ${withoutGender}`);
  if (withoutGender > 0) {
    console.log(`Sample without gender:`, dbStudents.filter(s => s.gender === null || s.gender === '').slice(0, 15).map(s => s.name));
  }
}

main().catch(console.error);
