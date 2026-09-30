const fs = require('fs');
const path = require('path');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
    console.log('[Optimize] Sharp loaded successfully.');
  } catch (e) {
    console.log('[Optimize] Sharp not installed, will copy PNG files directly.');
  }

  const srcRoot = path.resolve(__dirname, '../Verse');
  const destRoot = path.resolve(__dirname, '../public/verse');

  if (!fs.existsSync(destRoot)) {
    fs.mkdirSync(destRoot, { recursive: true });
  }

  const items = fs.readdirSync(srcRoot);

  for (const item of items) {
    const srcPath = path.join(srcRoot, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      const destDir = path.join(destRoot, item);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      // Check if there is a 'fix' subfolder with updated images
      const fixDir = path.join(srcPath, 'fix');
      let filesToProcess = fs.readdirSync(srcPath)
        .filter(f => f.endsWith('.png'))
        .map(f => ({ file: f, fullPath: path.join(srcPath, f) }));

      if (fs.existsSync(fixDir)) {
        const fixFiles = fs.readdirSync(fixDir).filter(f => f.endsWith('.png'));
        for (const ff of fixFiles) {
          // Replace or add
          const existingIdx = filesToProcess.findIndex(x => x.file === ff);
          if (existingIdx >= 0) {
            filesToProcess[existingIdx] = { file: ff, fullPath: path.join(fixDir, ff) };
          } else {
            filesToProcess.push({ file: ff, fullPath: path.join(fixDir, ff) });
          }
        }
      }

      for (const { file, fullPath } of filesToProcess) {
        const baseName = path.parse(file).name;
        
        // Always copy PNG as reliable fallback
        const destPng = path.join(destDir, file);
        fs.copyFileSync(fullPath, destPng);

        // Also convert to WebP if sharp is available
        if (sharp) {
          const destWebp = path.join(destDir, `${baseName}.webp`);
          await sharp(fullPath)
            .webp({ quality: 90, alphaQuality: 100, lossless: false })
            .toFile(destWebp);
          
          const oldSize = (fs.statSync(fullPath).size / 1024).toFixed(1);
          const newSize = (fs.statSync(destWebp).size / 1024).toFixed(1);
          console.log(`[Optimized] ${item}/${baseName}.webp: ${oldSize}KB -> ${newSize}KB (from ${fullPath.includes('fix') ? 'fix/' : ''}${file})`);
        } else {
          console.log(`[Copied] ${item}/${file}`);
        }
      }
    } else if (item.endsWith('.png')) {
      // Root level pngs like chest.png
      const baseName = path.parse(item).name;
      const destPng = path.join(destRoot, item);
      fs.copyFileSync(srcPath, destPng);

      if (sharp) {
        const destWebp = path.join(destRoot, `${baseName}.webp`);
        await sharp(srcPath)
          .webp({ quality: 85, alphaQuality: 100, lossless: false })
          .toFile(destWebp);
        const oldSize = (fs.statSync(srcPath).size / 1024).toFixed(1);
        const newSize = (fs.statSync(destWebp).size / 1024).toFixed(1);
        console.log(`[Optimized] ${baseName}.webp: ${oldSize}KB -> ${newSize}KB`);
      } else {
        console.log(`[Copied] ${item}`);
      }
    }
  }

  console.log('[Optimize] Done processing all Verse assets to public/verse/');
}

main().catch(console.error);
