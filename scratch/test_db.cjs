const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dvagyvlkshwpqvbcxwjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWd5dmxrc2h3cHF2YmN4d2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjcxMzMsImV4cCI6MjA5MzQ0MzEzM30.iuczKpFeYEW6uuzshXLzSm3VYEdr7P0kZHmZwdkvtFY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    console.log('Fetching profiles...');
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*');
    if (profileErr) {
      console.error('Error fetching profiles:', profileErr);
      return;
    }
    console.log('Profiles found:', profiles.length, profiles);

    if (profiles.length === 0) {
      console.log('No profiles found in the database. Cannot test insertion because we need a valid user ID.');
      return;
    }

    const testUserId = profiles[0].id;
    console.log('Using test user ID:', testUserId);

    // Get a valid school ID
    const { data: schools } = await supabase.from('schools').select('*');
    if (!schools || schools.length === 0) {
      console.log('No schools found.');
      return;
    }
    const testSchoolId = schools[0].id;
    console.log('Using test school ID:', testSchoolId);

    // Attempt to insert a class
    console.log('Attempting test class insertion...');
    const { data: insertedClass, error: insertErr } = await supabase.from('classes').insert([{
      name: 'Test Class Node',
      subject: 'IPAS',
      teacher_id: testUserId,
      school_id: testSchoolId
    }]).select();

    console.log('Insert Result:', insertedClass, 'Error:', insertErr || 'None');

  } catch (err) {
    console.error('Error during test:', err);
  }
}

testInsert();
