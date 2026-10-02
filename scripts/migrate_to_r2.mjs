import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const R2_ACCOUNT_ID = '2815d9972da5a038961fbfd11abf5d88';
const R2_ACCESS_KEY_ID = '1238ef13ffc2b70d7379f13b1952bf22';
const R2_SECRET_ACCESS_KEY = '7c68618ac4a58fc4c22afcb4f99c2d16520d7e25fbb4345e75e2a219a578b600';
const R2_BUCKET = 'eduverse-media';
const R2_PUBLIC_URL = 'https://pub-4e88ac579a704dc4967076cfd4f4139f.r2.dev';

const SUPABASE_URL = 'https://dvagyvlkshwpqvbcxwjx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWd5dmxrc2h3cHF2YmN4d2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjcxMzMsImV4cCI6MjA5MzQ0MzEzM30.iuczKpFeYEW6uuzshXLzSm3VYEdr7P0kZHmZwdkvtFY';

const BACKUP_DIR = path.resolve(__dirname, '../backup_eduverse');
const MANIFEST_PATH = path.join(BACKUP_DIR, 'backup_manifest.json');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function updateSupabaseSubmission(submissionId, newFileUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assignment_submissions?id=eq.${submissionId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      file_url: newFileUrl
    })
  });
  if (!res.ok) {
    throw new Error(`Supabase PATCH error: HTTP ${res.status} - ${await res.text()}`);
  }
}

async function migrate() {
  console.log('=== MEMULAI MIGRASI MEDIA DARI BACKUP KE CLOUDFLARE R2 ===\n');

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest tidak ditemukan di: ${MANIFEST_PATH}`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const files = manifest.files || [];
  console.log(`Ditemukan ${files.length} berkas yang siap diunggah ke R2 bucket: ${R2_BUCKET}\n`);

  let uploadedCount = 0;
  let errorCount = 0;
  const migrationResults = [];

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const safeFilename = (item.file_name || 'submission_file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `submissions/${item.assignment_id}/${item.submission_id}_${safeFilename}`;
    const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;

    process.stdout.write(`[${i + 1}/${files.length}] Uploading ${safeFilename}... `);

    try {
      if (!fs.existsSync(item.local_path)) {
        throw new Error(`Berkas lokal tidak ditemukan: ${item.local_path}`);
      }

      const fileBuffer = fs.readFileSync(item.local_path);

      // Upload to R2
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: item.file_type || 'application/octet-stream',
      }));

      // Update Supabase
      await updateSupabaseSubmission(item.submission_id, publicUrl);

      console.log(`✓ Berhasil -> ${publicUrl}`);
      uploadedCount++;

      migrationResults.push({
        submission_id: item.submission_id,
        assignment_id: item.assignment_id,
        student_name: item.student_name,
        old_url: item.original_appwrite_url,
        new_url: publicUrl,
        r2_key: r2Key,
        status: 'SUCCESS'
      });
    } catch (err) {
      console.log(`✗ Gagal (${err.message})`);
      errorCount++;
      migrationResults.push({
        submission_id: item.submission_id,
        error: err.message,
        status: 'FAILED'
      });
    }
  }

  // Save migration log
  const logPath = path.join(BACKUP_DIR, 'r2_migration_log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: files.length,
    uploaded: uploadedCount,
    failed: errorCount,
    results: migrationResults
  }, null, 2), 'utf-8');

  console.log('\n===========================================');
  console.log('MIGRASI CLOUDFLARE R2 SELESAI!');
  console.log(`- Berhasil: ${uploadedCount} dari ${files.length} berkas`);
  console.log(`- Gagal: ${errorCount}`);
  console.log(`- Log Migrasi: ${logPath}`);
  console.log('===========================================\n');
}

migrate().catch(console.error);
