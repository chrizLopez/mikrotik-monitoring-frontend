import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, "../public/icons");

const palette = {
  backgroundTop: [15, 23, 42, 255],
  backgroundBottom: [11, 92, 171, 255],
  cyan: [56, 189, 248, 255],
  white: [248, 250, 252, 255],
  shadow: [15, 23, 42, 72],
};

const glyphs = {
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  S: ["11111", "10000", "10000", "11111", "00001", "00001", "11111"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
};

mkdirSync(outputDir, { recursive: true });

buildIcon("icon-192.png", 192, { maskable: false });
buildIcon("icon-512.png", 512, { maskable: false });
buildIcon("icon-maskable-512.png", 512, { maskable: true });
buildIcon("apple-touch-icon.png", 180, { maskable: false });

function buildIcon(filename, size, options) {
  const pixels = new Uint8Array(size * size * 4);
  const outerPadding = options.maskable ? 0 : Math.round(size * 0.06);
  const radius = options.maskable ? Math.round(size * 0.22) : Math.round(size * 0.18);

  fillRoundedRect(
    pixels,
    size,
    outerPadding,
    outerPadding,
    size - outerPadding * 2,
    size - outerPadding * 2,
    radius,
    (x, y) => mix(
      palette.backgroundTop,
      palette.backgroundBottom,
      (x + y) / (size * 1.85),
    ),
  );

  drawWave(pixels, size, size * 0.5, size * 0.28, size * 0.19, Math.max(3, Math.round(size * 0.018)));
  drawWave(pixels, size, size * 0.5, size * 0.28, size * 0.12, Math.max(2, Math.round(size * 0.014)));

  fillRoundedRect(
    pixels,
    size,
    Math.round(size * 0.17),
    Math.round(size * 0.42),
    Math.round(size * 0.66),
    Math.round(size * 0.24),
    Math.round(size * 0.08),
    () => palette.shadow,
  );

  drawText(pixels, size, "ISP", {
    x: Math.round(size * 0.21),
    y: Math.round(size * 0.47),
    scale: Math.max(4, Math.round(size * 0.03)),
    gap: Math.max(3, Math.round(size * 0.012)),
    color: palette.white,
  });

  writeFileSync(resolve(outputDir, filename), encodePng(size, size, pixels));
}

function drawText(pixels, size, text, options) {
  let cursorX = options.x;

  for (const character of text) {
    const glyph = glyphs[character];

    if (!glyph) {
      cursorX += options.scale * 6;
      continue;
    }

    glyph.forEach((row, rowIndex) => {
      [...row].forEach((value, columnIndex) => {
        if (value === "1") {
          fillRect(
            pixels,
            size,
            cursorX + columnIndex * options.scale,
            options.y + rowIndex * options.scale,
            options.scale,
            options.scale,
            options.color,
          );
        }
      });
    });

    cursorX += glyph[0].length * options.scale + options.gap;
  }
}

function drawWave(pixels, size, centerX, centerY, radius, thickness) {
  const inner = radius - thickness;
  const outerSquared = radius * radius;
  const innerSquared = inner * inner;
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(size - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(size - 1, Math.ceil(centerY + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distanceSquared = dx * dx + dy * dy;
      const angle = Math.atan2(dy, dx);

      if (
        distanceSquared <= outerSquared &&
        distanceSquared >= innerSquared &&
        angle >= -2.9 &&
        angle <= -0.25
      ) {
        blendPixel(pixels, size, x, y, palette.cyan);
      }
    }
  }
}

function fillRoundedRect(pixels, size, x, y, width, height, radius, colorAt) {
  const right = x + width;
  const bottom = y + height;

  for (let py = y; py < bottom; py += 1) {
    for (let px = x; px < right; px += 1) {
      if (insideRoundedRect(px, py, x, y, width, height, radius)) {
        blendPixel(pixels, size, px, py, colorAt(px, py));
      }
    }
  }
}

function fillRect(pixels, size, x, y, width, height, color) {
  const startX = Math.max(0, x);
  const startY = Math.max(0, y);
  const endX = Math.min(size, x + width);
  const endY = Math.min(size, y + height);

  for (let py = startY; py < endY; py += 1) {
    for (let px = startX; px < endX; px += 1) {
      blendPixel(pixels, size, px, py, color);
    }
  }
}

function insideRoundedRect(px, py, x, y, width, height, radius) {
  const right = x + width;
  const bottom = y + height;

  if (px >= x + radius && px < right - radius) {
    return py >= y && py < bottom;
  }

  if (py >= y + radius && py < bottom - radius) {
    return px >= x && px < right;
  }

  const corners = [
    [x + radius, y + radius],
    [right - radius - 1, y + radius],
    [x + radius, bottom - radius - 1],
    [right - radius - 1, bottom - radius - 1],
  ];

  return corners.some(([cx, cy]) => {
    const dx = px - cx;
    const dy = py - cy;

    return dx * dx + dy * dy <= radius * radius;
  });
}

function blendPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const index = (y * size + x) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;

  pixels[index] = Math.round(color[0] * alpha + pixels[index] * inverse);
  pixels[index + 1] = Math.round(color[1] * alpha + pixels[index + 1] * inverse);
  pixels[index + 2] = Math.round(color[2] * alpha + pixels[index + 2] * inverse);
  pixels[index + 3] = Math.round((alpha + (pixels[index + 3] / 255) * inverse) * 255);
}

function mix(start, end, factor) {
  const clamped = Math.max(0, Math.min(1, factor));

  return [
    Math.round(start[0] + (end[0] - start[0]) * clamped),
    Math.round(start[1] + (end[1] - start[1]) * clamped),
    Math.round(start[2] + (end[2] - start[2]) * clamped),
    255,
  ];
}

function encodePng(width, height, rgba) {
  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    raw[rowStart] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), rowStart + 1);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const png = Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  return png;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
