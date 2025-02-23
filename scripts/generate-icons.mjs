import sharp from 'sharp';
import fs from 'fs/promises';

const sizes = [192, 512];
const inputIcon = './public/icons/icon.svg';
const inputMaskableIcon = './public/icons/icon-maskable.svg';

async function generateIcons() {
  // Ensure the icons directory exists
  await fs.mkdir('./public/icons', { recursive: true });

  // Generate regular icons
  for (const size of sizes) {
    await sharp(inputIcon)
      .resize(size, size)
      .png()
      .toFile(`./public/icons/icon-${size}x${size}.png`);
  }

  // Generate maskable icon
  await sharp(inputMaskableIcon)
    .resize(192, 192)
    .png()
    .toFile('./public/icons/icon-192x192-maskable.png');

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
