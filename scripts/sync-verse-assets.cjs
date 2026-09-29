const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SPECIES = ['Pyrofox', 'Aquaxolt', 'Pangorock', 'Cirrofinch', 'Voltlynx'];
const STAGES = ['1', '2', '3', '4'];

async function syncAssets() {
  console.log('=== SYNCING USER MANUAL PNG ASSETS TO PUBLIC/VERSE ===\n');

  for (const sp of SPECIES) {
    for (const st of STAGES) {
      const srcPng = path.join(__dirname, '..', 'Verse', sp, `${st}.png`);
      const destPng = path.join(__dirname, '..', 'public', 'verse', sp, `${st}.png`);
      const destWebp = path.join(__dirname, '..', 'public', 'verse', sp, `${st}.webp`);

      if (!fs.existsSync(srcPng)) {
        console.warn(`[WARN] Not found: ${srcPng}`);
        continue;
      }

      // Copy PNG
      fs.copyFileSync(srcPng, destPng);

      // Generate WebP from the new PNG
      await sharp(srcPng)
        .webp({ quality: 92, effort: 6 })
        .toFile(destWebp);

      console.log(`[SYNCED] ${sp}/${st}.png -> public/verse/${sp}/${st}.png & .webp`);
    }
  }

  console.log('\n=== ALL USER ASSETS SUCCESSFULLY APPLIED TO APPLICATION! ===');
}

syncAssets().catch(err => {
  console.error('Error during sync:', err);
  process.exit(1);
});
