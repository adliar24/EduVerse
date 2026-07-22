const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dvagyvlkshwpqvbcxwjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWd5dmxrc2h3cHF2YmN4d2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjcxMzMsImV4cCI6MjA5MzQ0MzEzM30.iuczKpFeYEW6uuzshXLzSm3VYEdr7P0kZHmZwdkvtFY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('Querying Supabase database...');
    
    // 1. Check schools
    const { data: schools, error: schoolErr } = await supabase.from('schools').select('*');
    console.log('Schools:', schools ? schools.length : 0, schools, schoolErr || '');

    // 2. Check classes
    const { data: classes, error: classErr } = await supabase.from('classes').select('*');
    console.log('Classes:', classes ? classes.length : 0, classes, classErr || '');

    // 3. Check teacher_profiles
    const { data: profiles, error: profileErr } = await supabase.from('teacher_profiles').select('*');
    console.log('Teacher Profiles:', profiles ? profiles.length : 0, profiles, profileErr || '');

    // 4. Check students
    const { data: students, error: studentErr } = await supabase.from('students').select('*');
    console.log('Students:', students ? students.length : 0, students, studentErr || '');

  } catch (err) {
    console.error('Error during query:', err);
  }
}

checkDatabase();
