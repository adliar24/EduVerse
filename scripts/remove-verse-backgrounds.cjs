const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SPECIES = ['Pyrofox', 'Aquaxolt', 'Pangorock', 'Cirrofinch', 'Voltlynx'];
const STAGES = ['1', '2', '3', '4', 'egg'];

async function makeTransparent(inputPath, outputPathPng, outputPathWebp) {
  if (!fs.existsSync(inputPath)) {
    console.warn(`[SKIP] File not found: ${inputPath}`);
    return;
  }

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const getIdx = (x, y) => (y * width + x) * channels;

  const visited = new Uint8Array(width * height);
  const queue = [];

  // A pixel is white background if r, g, b are all >= 238
  const isWhiteBg = (r, g, b) => r >= 238 && g >= 238 && b >= 238;

  // 1. Seed BFS from all 4 borders
  for (let x = 0; x < width; x++) {
    const iTop = getIdx(x, 0);
    if (isWhiteBg(data[iTop], data[iTop + 1], data[iTop + 2])) {
      visited[x] = 1;
      queue.push([x, 0]);
    }
    const iBot = getIdx(x, height - 1);
    if (isWhiteBg(data[iBot], data[iBot + 1], data[iBot + 2])) {
      visited[(height - 1) * width + x] = 1;
      queue.push([x, height - 1]);
    }
  }
  for (let y = 0; y < height; y++) {
    const iLeft = getIdx(0, y);
    if (isWhiteBg(data[iLeft], data[iLeft + 1], data[iLeft + 2])) {
      visited[y * width] = 1;
      queue.push([0, y]);
    }
    const iRight = getIdx(width - 1, y);
    if (isWhiteBg(data[iRight], data[iRight + 1], data[iRight + 2])) {
      visited[y * width + (width - 1)] = 1;
      queue.push([width - 1, y]);
    }
  }

  // 2. BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          const idx = getIdx(nx, ny);
          if (isWhiteBg(data[idx], data[idx + 1], data[idx + 2])) {
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  // 3. Set visited background pixels to alpha = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y);
      if (visited[y * width + x]) {
        data[idx + 3] = 0;
      }
    }
  }

  // 4. Soft edge feathering on outer perimeter only
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const nIdx = y * width + x;
      if (!visited[nIdx]) {
        const hasBgNeighbor =
          visited[nIdx - 1] ||
          visited[nIdx + 1] ||
          visited[nIdx - width] ||
          visited[nIdx + width];

        if (hasBgNeighbor) {
          const idx = getIdx(x, y);
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const minC = Math.min(r, g, b);
          if (minC > 220) {
            const factor = (255 - minC) / (255 - 220);
            const newAlpha = Math.round(factor * 255);
            data[idx + 3] = Math.min(data[idx + 3], Math.max(0, newAlpha));
          }
        }
      }
    }
  }

  // 5. Save transparent PNG and WebP
  const imageInstance = sharp(data, { raw: { width, height, channels } });

  // Save PNG
  await imageInstance.clone().png({ compressionLevel: 9 }).toFile(outputPathPng);

  // Save WebP (ultra-lightweight)
  await imageInstance.clone().webp({ quality: 90, effort: 6 }).toFile(outputPathWebp);

  console.log(`[OK] Processed: ${path.basename(outputPathPng)} & .webp (${Math.round((queue.length / (width * height)) * 100)}% transparent bg)`);
}

async function main() {
  console.log('=== REMOVING WHITE BACKGROUND FROM VERSE ASSETS ===\n');

  // Process all species assets
  for (const sp of SPECIES) {
    for (const st of STAGES) {
      const srcPng = path.join(__dirname, '..', 'public', 'verse', sp, `${st}.png`);
      const outPng = srcPng;
      const outWebp = path.join(__dirname, '..', 'public', 'verse', sp, `${st}.webp`);
      await makeTransparent(srcPng, outPng, outWebp);

      // Also sync to Verse/ directory if present
      const rawVersePng = path.join(__dirname, '..', 'Verse', sp, `${st}.png`);
      if (fs.existsSync(rawVersePng)) {
        try {
          fs.copyFileSync(outPng, rawVersePng);
        } catch (e) {}
      }
    }
  }

  // Process Chest
  const chestPng = path.join(__dirname, '..', 'public', 'verse', 'chest.png');
  const chestWebp = path.join(__dirname, '..', 'public', 'verse', 'chest.webp');
  await makeTransparent(chestPng, chestPng, chestWebp);

  const rawChestPng = path.join(__dirname, '..', 'Verse', 'chest.png');
  if (fs.existsSync(rawChestPng)) {
    try {
      fs.copyFileSync(chestPng, rawChestPng);
    } catch (e) {}
  }

  console.log('\n=== ALL VERSE ASSETS ARE NOW 100% TRANSPARENT! ===');
}

main().catch(err => {
  console.error('Error during background removal:', err);
  process.exit(1);
});
