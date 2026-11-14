const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');

// Reuse Expo's image tooling so preparing assets needs no extra dependency.
const imageToolsRequire = createRequire(require.resolve('@expo/image-utils'));
const Jimp = imageToolsRequire('jimp-compact');
const projectDirectory = path.dirname(require.resolve('../package.json'));
const imageDirectory = path.join(projectDirectory, 'assets/images/customization-icons');
const outputDirectory = path.join(imageDirectory, 'optimized');
const decorations = [
  { name: 'candle', crop: [352, 132, 536, 896], sceneSize: 256 },
  { name: 'blue-carpet', crop: [206, 453, 828, 370], sceneSize: 640 },
  { name: 'red-carpet', crop: [402, 360, 726, 334], sceneSize: 640 },
  { name: 'potted-flower', crop: [394, 258, 468, 784], sceneSize: 256 },
];

async function prepareImages() {
  await fs.mkdir(outputDirectory, { recursive: true });
  let originalBytes = 0;
  let preparedBytes = 0;

  for (const { name, crop, sceneSize } of decorations) {
    const original = await fs.readFile(path.join(imageDirectory, `${name}.png`));
    const image = (await Jimp.read(original)).crop(...crop);
    originalBytes += original.length;

    for (const [suffix, longestEdge] of [['', sceneSize], ['-thumb', 128]]) {
      const ratio = Math.min(1, longestEdge / Math.max(image.bitmap.width, image.bitmap.height));
      const width = Math.round(image.bitmap.width * ratio);
      const height = Math.round(image.bitmap.height * ratio);
      const prepared = await image.clone()
        .resize(width, height, Jimp.RESIZE_BICUBIC)
        .deflateLevel(9)
        .getBufferAsync(Jimp.MIME_PNG);
      await fs.writeFile(path.join(outputDirectory, `${name}${suffix}.png`), prepared);
      preparedBytes += prepared.length;
      console.log(`${name}${suffix}: ${width}x${height}, ${prepared.length} bytes`);
    }
  }

  console.log(`Originals: ${originalBytes} bytes; scene images and thumbnails: ${preparedBytes} bytes`);
}

prepareImages().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
