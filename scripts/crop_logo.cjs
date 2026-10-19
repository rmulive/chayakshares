const sharp = require('sharp');
const path = require('path');

const inputPath = 'C:/Users/LENOVO/.gemini/antigravity/brain/ad439ba5-10fc-48ca-8cb2-597f65f4dd08/.user_uploaded/media_1792433944254_51616410.jpg';
const outputPath = path.join(__dirname, 'public/logos/chayaksha_gold_logo.png');
const defaultLogoPath = path.join(__dirname, 'public/logos/chayaksha_logo.png');

async function processLogo() {
  const cropLeft = 80;
  const cropTop = 112;
  const cropWidth = 608;
  const cropHeight = 215;

  const croppedBuffer = await sharp(inputPath)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .toBuffer();

  const { data, info } = await sharp(croppedBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Remove "IAAP: 2026/503" text at top
      if (x > 210 && x < 400 && y < 32) {
        data[idx + 3] = 0;
        continue;
      }

      // Remove any dark non-gold text below y = 180 (the "INTERNATIONAL..." text is black/dark grey)
      if (y > 180) {
        // The gold sword stroke has warm golden hue (r > 120, g > 80, r > b + 30)
        const isGold = (r > 110 && g > 70 && r > b + 25);
        if (!isGold) {
          data[idx + 3] = 0;
          continue;
        }
      }

      // Transparent background for light/cream pixels
      if (r > 228 && g > 228 && b > 228) {
        data[idx + 3] = 0;
      } else if (r > 200 && g > 200 && b > 200) {
        const brightness = Math.max(r, g, b);
        const alpha = Math.min(255, Math.max(0, Math.floor((255 - brightness) / 28 * 255)));
        data[idx + 3] = alpha;
      }
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .trim()
  .png()
  .toFile(outputPath);

  await sharp(outputPath).toFile(defaultLogoPath);

  console.log('Saved 100% clean pristine 3D gold logo!');
}

processLogo().catch(console.error);
