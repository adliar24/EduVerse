const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const sharp = require('sharp');

const SPECIES = ['Pyrofox', 'Aquaxolt', 'Pangorock', 'Cirrofinch', 'Voltlynx'];
const STAGES = ['1', '2', '3', '4', 'egg'];

async function processOriginalBuffer(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const getIdx = (x, y) => (y * width + x) * channels;

  // Background BFS
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Consider pixel background if it's very light / near white (>= 228 on all channels)
  const isBgPixel = (r, g, b) => r >= 228 && g >= 228 && b >= 228;

  // 1. Seed BFS from all 4 borders
  for (let x = 0; x < width; x++) {
    const iTop = getIdx(x, 0);
    if (isBgPixel(data[iTop], data[iTop + 1], data[iTop + 2])) {
      visited[x] = 1;
      queue.push([x, 0]);
    }
    const iBot = getIdx(x, height - 1);
    if (isBgPixel(data[iBot], data[iBot + 1], data[iBot + 2])) {
      visited[(height - 1) * width + x] = 1;
      queue.push([x, height - 1]);
    }
  }
  for (let y = 0; y < height; y++) {
    const iLeft = getIdx(0, y);
    if (isBgPixel(data[iLeft], data[iLeft + 1], data[iLeft + 2])) {
      visited[y * width] = 1;
      queue.push([0, y]);
    }
    const iRight = getIdx(width - 1, y);
    if (isBgPixel(data[iRight], data[iRight + 1], data[iRight + 2])) {
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
          if (isBgPixel(data[idx], data[idx + 1], data[idx + 2])) {
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  // Initial zeroing of outer background
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      data[i * channels + 3] = 0;
    }
  }

  // 3. Compute distance to background for all remaining pixels (up to radius 4)
  const dist = new Int8Array(width * height).fill(10);
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) dist[i] = 0;
  }

  for (let d = 1; d <= 4; d++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (dist[idx] > d) {
          const left = x > 0 ? dist[idx - 1] : 0;
          const right = x < width - 1 ? dist[idx + 1] : 0;
          const up = y > 0 ? dist[idx - width] : 0;
          const down = y < height - 1 ? dist[idx + width] : 0;
          if (left === d - 1 || right === d - 1 || up === d - 1 || down === d - 1) {
            dist[idx] = d;
          }
        }
      }
    }
  }

  // 4. Find nearest solid inner color for edge color bleeding / defringing
  const solidColors = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      const cIdx = pIdx * channels;
      solidColors[pIdx * 3] = data[cIdx];
      solidColors[pIdx * 3 + 1] = data[cIdx + 1];
      solidColors[pIdx * 3 + 2] = data[cIdx + 2];
    }
  }

  // 5. Clean fringes:
  // Layer 1 (direct border): pixels with high whiteness should be transparent, or defringed
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      const d = dist[pIdx];
      if (d >= 1 && d <= 3) {
        const cIdx = pIdx * channels;
        const r = data[cIdx];
        const g = data[cIdx + 1];
        const b = data[cIdx + 2];
        const minVal = Math.min(r, g, b);
        const maxVal = Math.max(r, g, b);
        const brightness = (r + g + b) / 3;

        // If distance 1 and largely white/grey background edge:
        if (d === 1) {
          if (minVal >= 210 || brightness >= 215) {
            // Pure fringe artifact -> make transparent
            data[cIdx + 3] = 0;
            dist[pIdx] = 0;
            continue;
          } else if (minVal >= 170) {
            // Semi-transparent anti-aliased edge
            const alphaFactor = Math.max(0, (210 - minVal) / (210 - 160));
            data[cIdx + 3] = Math.round(alphaFactor * 255);
          }
        } else if (d === 2) {
          if (minVal >= 225) {
            data[cIdx + 3] = 0;
            dist[pIdx] = 0;
            continue;
          } else if (minVal >= 195) {
            const alphaFactor = Math.max(0.2, (230 - minVal) / (230 - 180));
            data[cIdx + 3] = Math.round(alphaFactor * 255);
          }
        }
      }
    }
  }

  // 6. Defringe RGB colors on semi-transparent or outer boundary pixels
  // If a pixel is near the border and has high white contamination, replace its RGB with the nearest deeper non-white pixel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pIdx = y * width + x;
      const cIdx = pIdx * channels;
      const alpha = data[cIdx + 3];

      if (alpha > 0 && dist[pIdx] <= 2) {
        const r = data[cIdx];
        const g = data[cIdx + 1];
        const b = data[cIdx + 2];
        const minVal = Math.min(r, g, b);

        if (minVal > 165) {
          // Look for deeper neighbor with dist >= 3 to borrow saturated color
          let bestNeighbor = null;
          let bestSat = -1;

          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (dist[nIdx] >= 3) {
                  const nr = solidColors[nIdx * 3];
                  const ng = solidColors[nIdx * 3 + 1];
                  const nb = solidColors[nIdx * 3 + 2];
                  const sat = Math.max(nr, ng, nb) - Math.min(nr, ng, nb);
                  if (sat > bestSat) {
                    bestSat = sat;
                    bestNeighbor = [nr, ng, nb];
                  }
                }
              }
            }
          }

          if (bestNeighbor && bestSat > 20) {
            // Blend out the white: replace white spill with true character hue
            const blendRatio = (minVal - 165) / (255 - 165);
            data[cIdx] = Math.round(data[cIdx] * (1 - blendRatio * 0.7) + bestNeighbor[0] * (blendRatio * 0.7));
            data[cIdx + 1] = Math.round(data[cIdx + 1] * (1 - blendRatio * 0.7) + bestNeighbor[1] * (blendRatio * 0.7));
            data[cIdx + 2] = Math.round(data[cIdx + 2] * (1 - blendRatio * 0.7) + bestNeighbor[2] * (blendRatio * 0.7));
          }
        }
      }
    }
  }

  return sharp(data, { raw: { width, height, channels } });
}

async function run() {
  console.log('=== RUNNING HIGH-PRECISION DEFRINGE & MATTING ON ALL VERSE ASSETS ===\n');

  for (const sp of SPECIES) {
    for (const st of STAGES) {
      const relPath = `public/verse/${sp}/${st}.png`;
      console.log(`Processing ${sp}/${st}...`);

      let originalBuf;
      try {
        originalBuf = cp.execFileSync('git', ['show', `c1d959f:${relPath}`], { maxBuffer: 30 * 1024 * 1024 });
      } catch (e) {
        console.warn(`Could not get original from git for ${relPath}, using local file`);
        originalBuf = fs.readFileSync(path.join(__dirname, '..', relPath));
      }

      const processedSharp = await processOriginalBuffer(originalBuf);

      const outPng = path.join(__dirname, '..', 'public', 'verse', sp, `${st}.png`);
      const outWebp = path.join(__dirname, '..', 'public', 'verse', sp, `${st}.webp`);

      await processedSharp.clone().png({ compressionLevel: 9 }).toFile(outPng);
      await processedSharp.clone().webp({ quality: 92, effort: 6 }).toFile(outWebp);

      // Sync to Verse/ if exists
      const versePng = path.join(__dirname, '..', 'Verse', sp, `${st}.png`);
      if (fs.existsSync(versePng)) {
        fs.copyFileSync(outPng, versePng);
      }
    }
  }

  // Process Chest
  const chestRel = 'public/verse/chest.png';
  console.log('Processing chest...');
  let chestBuf;
  try {
    chestBuf = cp.execFileSync('git', ['show', `c1d959f:${chestRel}`], { maxBuffer: 30 * 1024 * 1024 });
  } catch (e) {
    chestBuf = fs.readFileSync(path.join(__dirname, '..', chestRel));
  }
  const processedChest = await processOriginalBuffer(chestBuf);
  const outChestPng = path.join(__dirname, '..', 'public', 'verse', 'chest.png');
  const outChestWebp = path.join(__dirname, '..', 'public', 'verse', 'chest.webp');
  await processedChest.clone().png({ compressionLevel: 9 }).toFile(outChestPng);
  await processedChest.clone().webp({ quality: 92, effort: 6 }).toFile(outChestWebp);

  const verseChest = path.join(__dirname, '..', 'Verse', 'chest.png');
  if (fs.existsSync(verseChest)) {
    fs.copyFileSync(outChestPng, verseChest);
  }

  console.log('\n=== ALL 26 ASSETS DEFRINGED AND PERFECTLY MATTED! ===');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
