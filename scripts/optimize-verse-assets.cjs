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

      const files = fs.readdirSync(srcPath);
      for (const file of files) {
        if (!file.endsWith('.png')) continue;
        const srcFile = path.join(srcPath, file);
        const baseName = path.parse(file).name;
        
        // Always copy PNG as reliable fallback
        const destPng = path.join(destDir, file);
        fs.copyFileSync(srcFile, destPng);

        // Also convert to WebP if sharp is available
        if (sharp) {
          const destWebp = path.join(destDir, `${baseName}.webp`);
          await sharp(srcFile)
            .webp({ quality: 85, alphaQuality: 100, lossless: false })
            .toFile(destWebp);
          
          const oldSize = (fs.statSync(srcFile).size / 1024).toFixed(1);
          const newSize = (fs.statSync(destWebp).size / 1024).toFixed(1);
          console.log(`[Optimized] ${item}/${baseName}.webp: ${oldSize}KB -> ${newSize}KB`);
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
