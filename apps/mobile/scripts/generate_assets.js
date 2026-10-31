const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = chunk.slice(4, 8 + len);
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len);
  return chunk;
}

function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // Scanlines with filter 0
  const stride = width * 4;
  const rawScanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawScanlines[y * (stride + 1)] = 0; // Filter 0 (None)
    rgbaBuffer.copy(rawScanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Decode source image
const imgPath = 'C:/Users/usr/.gemini/antigravity-ide/brain/9f243d24-e4ec-46b5-a867-4238e5f25010/.user_uploaded/media_1793340788797.png';
const srcBuf = fs.readFileSync(imgPath);

let pos = 8;
const idats = [];
while (pos < srcBuf.length) {
  const len = srcBuf.readUInt32BE(pos);
  const type = srcBuf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idats.push(srcBuf.slice(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const decomp = zlib.inflateSync(Buffer.concat(idats));
const srcW = 407, srcH = 444, bpp = 4;
const srcStride = srcW * bpp;
const srcPixels = Buffer.alloc(srcH * srcStride);
let src = 0;
for (let y = 0; y < srcH; y++) {
  const filter = decomp[src++];
  const prevRow = y > 0 ? srcPixels.slice((y - 1) * srcStride, y * srcStride) : null;
  const currRow = srcPixels.slice(y * srcStride, (y + 1) * srcStride);
  for (let x = 0; x < srcStride; x++) {
    const raw = decomp[src++];
    const a = x >= bpp ? currRow[x - bpp] : 0;
    const b = prevRow ? prevRow[x] : 0;
    const c = (prevRow && x >= bpp) ? prevRow[x - bpp] : 0;
    if (filter === 0) currRow[x] = raw;
    else if (filter === 1) currRow[x] = (raw + a) & 0xff;
    else if (filter === 2) currRow[x] = (raw + b) & 0xff;
    else if (filter === 3) currRow[x] = (raw + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      currRow[x] = (raw + pr) & 0xff;
    }
  }
}

// Function to sample source pixel with bilinear interpolation
function getSrcPixel(x, y) {
  if (x < 0 || x >= srcW || y < 0 || y >= srcH) return [255, 255, 255, 0];
  const x0 = Math.floor(x), x1 = Math.min(srcW - 1, x0 + 1);
  const y0 = Math.floor(y), y1 = Math.min(srcH - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;

  const idx00 = (y0 * srcW + x0) * 4;
  const idx10 = (y0 * srcW + x1) * 4;
  const idx01 = (y1 * srcW + x0) * 4;
  const idx11 = (y1 * srcW + x1) * 4;

  const res = [];
  for (let c = 0; c < 4; c++) {
    const v0 = srcPixels[idx00 + c] * (1 - fx) + srcPixels[idx10 + c] * fx;
    const v1 = srcPixels[idx01 + c] * (1 - fx) + srcPixels[idx11 + c] * fx;
    res[c] = Math.round(v0 * (1 - fy) + v1 * fy);
  }
  return res;
}

// Function to render an icon of target size (e.g. 1024, 512, 192, 144, 96, 72, 48)
// isRound: if true, masks with circle
// bg: background color [R, G, B, A]
function renderIcon(targetSize, isRound = false, bgDark = false) {
  const buf = Buffer.alloc(targetSize * targetSize * 4);
  const center = targetSize / 2;
  const radius = targetSize * 0.48;
  const squircleRadius = targetSize * 0.22;

  // We want the emblem centered with a nice padding
  const emblemSize = targetSize * 0.72;
  const emblemX0 = (targetSize - emblemSize) / 2;
  const emblemY0 = (targetSize - emblemSize) / 2;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const idx = (y * targetSize + x) * 4;
      
      // Determine clipping
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isRound) {
        if (dist > radius) {
          buf[idx] = 0; buf[idx+1] = 0; buf[idx+2] = 0; buf[idx+3] = 0;
          continue;
        }
      }

      // Check if inside squircle badge
      // Rounded rect equation
      const pad = targetSize * 0.05;
      const bw = targetSize - pad * 2;
      const bh = targetSize - pad * 2;
      const rx = targetSize * 0.18;
      const ry = targetSize * 0.18;

      let inBadge = false;
      const bx = x - pad;
      const by = y - pad;

      if (bx >= 0 && bx <= bw && by >= 0 && by <= bh) {
        if (bx >= rx && bx <= bw - rx || by >= ry && by <= bh - ry) {
          inBadge = true;
        } else {
          // Corner test
          const cx = bx < rx ? rx : bw - rx;
          const cy = by < ry ? ry : bh - ry;
          const cdist = Math.hypot(bx - cx, by - cy);
          if (cdist <= rx) inBadge = true;
        }
      }

      if (!inBadge && !isRound) {
        if (bgDark) {
          buf[idx] = 3; buf[idx+1] = 7; buf[idx+2] = 18; buf[idx+3] = 255; // #030712
        } else {
          buf[idx] = 0; buf[idx+1] = 0; buf[idx+2] = 0; buf[idx+3] = 0;
        }
        continue;
      }

      // Inside badge:
      // Base color is white (#ffffff)
      let r = 255, g = 255, b = 255, a = 255;

      // Map to source emblem
      const sx = ((x - emblemX0) / emblemSize) * srcW;
      const sy = ((y - emblemY0) / emblemSize) * srcH;

      if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
        const [sr, sg, sb, sa] = getSrcPixel(sx, sy);
        // Alpha blend over white
        const alpha = sa / 255;
        r = Math.round(sr * alpha + r * (1 - alpha));
        g = Math.round(sg * alpha + g * (1 - alpha));
        b = Math.round(sb * alpha + b * (1 - alpha));
      }

      buf[idx] = r;
      buf[idx+1] = g;
      buf[idx+2] = b;
      buf[idx+3] = a;
    }
  }

  return encodePng(targetSize, targetSize, buf);
}

// Ensure assets directory exists
const assetsDir = 'C:/Users/usr/Desktop/iSLLAs-Clone/apps/mobile/assets';
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// 1. Generate Expo Assets
console.log('Generating Expo assets...');
fs.writeFileSync(path.join(assetsDir, 'icon.png'), renderIcon(1024, false, false));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), renderIcon(1024, false, false));
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), renderIcon(48, false, false));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), renderIcon(1024, false, true));
console.log('Generated apps/mobile/assets/');

// 2. Generate Android Mipmap & Drawable assets
const resDir = 'C:/Users/usr/Desktop/iSLLAs-Clone/apps/mobile/android/app/src/main/res';
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48, splash: 288 },
  { dir: 'mipmap-hdpi', size: 72, splash: 432 },
  { dir: 'mipmap-xhdpi', size: 96, splash: 576 },
  { dir: 'mipmap-xxhdpi', size: 144, splash: 864 },
  { dir: 'mipmap-xxxhdpi', size: 192, splash: 1152 },
];

for (const m of mipmaps) {
  const mDir = path.join(resDir, m.dir);
  if (fs.existsSync(mDir)) {
    console.log(`Writing ${m.dir} icons (size ${m.size})...`);
    const squarePng = renderIcon(m.size, false, false);
    const roundPng = renderIcon(m.size, true, false);

    // Write PNG and WebP files
    fs.writeFileSync(path.join(mDir, 'ic_launcher.png'), squarePng);
    fs.writeFileSync(path.join(mDir, 'ic_launcher_round.png'), roundPng);
    // Note: Android can take webp or png. If webp is present, replace or rename
    fs.writeFileSync(path.join(mDir, 'ic_launcher.webp'), squarePng);
    fs.writeFileSync(path.join(mDir, 'ic_launcher_round.webp'), roundPng);
  }

  // Splashscreen logo in drawable-*
  const dDir = path.join(resDir, 'drawable-' + m.dir.replace('mipmap-', ''));
  if (fs.existsSync(dDir)) {
    console.log(`Writing splashscreen_logo in ${dDir} (size ${m.splash})...`);
    fs.writeFileSync(path.join(dDir, 'splashscreen_logo.png'), renderIcon(m.splash, false, false));
  }
}

console.log('All mobile logo assets generated successfully!');
