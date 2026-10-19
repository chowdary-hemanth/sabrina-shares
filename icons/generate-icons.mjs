// Icon generator using Sharp
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log("Generating PWA icons from icon.svg...");

  // 1. Standard 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toFile(path.join(__dirname, 'icon-192.png'));
  console.log("  -> Generated icon-192.png");

  // 2. Standard 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(__dirname, 'icon-512.png'));
  console.log("  -> Generated icon-512.png");

  // 3. Maskable 512x512 PNG (Icon centered in safe zone 80% with #0b0d14 padding)
  const innerSize = Math.round(512 * 0.80); // 410px
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 13, b: 20, alpha: 1 }
    }
  })
    .composite([
      {
        input: innerBuffer,
        top: Math.round((512 - innerSize) / 2),
        left: Math.round((512 - innerSize) / 2)
      }
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(__dirname, 'icon-maskable-512.png'));
  console.log("  -> Generated icon-maskable-512.png");

  console.log("All PWA icons generated successfully!");
}

generate().catch(err => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
