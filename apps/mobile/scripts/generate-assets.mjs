import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffers) {
  let c = 0xffffffff;
  for (const buffer of buffers) {
    for (const byte of buffer) {
      c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32([typeBuffer, data]), 8 + data.length);
  return output;
}

function createImage(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

function color(hex, alpha = 255) {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    alpha,
  ];
}

function mix(a, b, amount) {
  return Math.round(a + (b - a) * amount);
}

function setPixel(image, x, y, rgba) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }
  const offset = (y * image.width + x) * 4;
  image.data[offset] = rgba[0];
  image.data[offset + 1] = rgba[1];
  image.data[offset + 2] = rgba[2];
  image.data[offset + 3] = rgba[3];
}

function fill(image, rgba) {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      setPixel(image, x, y, rgba);
    }
  }
}

function fillRect(image, x, y, width, height, rgba) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(image, xx, yy, rgba);
    }
  }
}

function fillCircle(image, cx, cy, radius, rgba) {
  const radiusSq = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        setPixel(image, x, y, rgba);
      }
    }
  }
}

function drawLine(image, x1, y1, x2, y2, width, rgba) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    fillCircle(
      image,
      Math.round(x1 + (x2 - x1) * t),
      Math.round(y1 + (y2 - y1) * t),
      width / 2,
      rgba,
    );
  }
}

function pseudoNoise(x, y, seed) {
  let value = x * 374761393 + y * 668265263 + seed * 982451653;
  value = (value ^ (value >>> 13)) * 1274126177;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function writePng(filePath, image) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = image.width * 4;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rawOffset = y * (stride + 1);
    raw[rawOffset] = 0;
    Buffer.from(image.data.buffer, y * stride, stride).copy(raw, rawOffset + 1);
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND'),
    ]),
  );
}

function floorTile() {
  const image = createImage(64, 64);
  const base = color('#11182d');
  const warm = color('#1b2943');
  fill(image, base);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const n = pseudoNoise(x, y, 7);
      const amount = 0.15 + n * 0.18;
      setPixel(image, x, y, [
        mix(base[0], warm[0], amount),
        mix(base[1], warm[1], amount),
        mix(base[2], warm[2], amount),
        255,
      ]);
    }
  }
  fillRect(image, 0, 0, 64, 2, color('#223253'));
  fillRect(image, 0, 62, 64, 2, color('#070b18'));
  fillRect(image, 0, 0, 2, 64, color('#223253'));
  fillRect(image, 62, 0, 2, 64, color('#070b18'));
  return image;
}

function wallTile() {
  const image = createImage(64, 64);
  fill(image, color('#26314f'));
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const n = pseudoNoise(x, y, 19);
      const shade = n > 0.72 ? color('#38466a') : color('#26314f');
      setPixel(image, x, y, shade);
    }
  }
  fillRect(image, 0, 0, 64, 4, color('#6f7ca8'));
  fillRect(image, 0, 0, 4, 64, color('#586793'));
  fillRect(image, 0, 60, 64, 4, color('#11182c'));
  fillRect(image, 60, 0, 4, 64, color('#11182c'));
  fillRect(image, 10, 22, 44, 3, color('#151d32'));
  fillRect(image, 30, 0, 3, 23, color('#151d32'));
  fillRect(image, 18, 25, 3, 36, color('#151d32'));
  fillRect(image, 43, 25, 3, 36, color('#151d32'));
  fillRect(image, 7, 7, 12, 3, color('#8b97bf', 190));
  fillRect(image, 38, 9, 14, 3, color('#8b97bf', 170));
  return image;
}

function exitTile() {
  const image = createImage(64, 64);
  fill(image, color('#000000', 0));
  fillCircle(image, 32, 32, 24, color('#1f355c', 230));
  fillCircle(image, 32, 32, 19, color('#17213b', 245));
  fillCircle(image, 32, 32, 14, color('#2de2ff', 110));
  drawLine(image, 16, 42, 48, 42, 5, color('#f9c74f'));
  drawLine(image, 20, 42, 20, 23, 5, color('#f9c74f'));
  drawLine(image, 44, 42, 44, 23, 5, color('#f9c74f'));
  drawLine(image, 20, 23, 32, 14, 5, color('#f9c74f'));
  drawLine(image, 32, 14, 44, 23, 5, color('#f9c74f'));
  fillCircle(image, 32, 33, 5, color('#85fff7'));
  return image;
}

function keyTile() {
  const image = createImage(64, 64);
  fill(image, color('#000000', 0));
  fillCircle(image, 22, 25, 11, color('#f8e16c'));
  fillCircle(image, 22, 25, 6, color('#000000', 0));
  drawLine(image, 31, 30, 50, 49, 7, color('#f8e16c'));
  fillRect(image, 44, 43, 12, 5, color('#f8e16c'));
  fillRect(image, 39, 49, 12, 5, color('#f8e16c'));
  drawLine(image, 16, 18, 48, 50, 2, color('#fff3a3', 180));
  return image;
}

function explorerTile(primary, secondary, accent) {
  const image = createImage(64, 64);
  fill(image, color('#000000', 0));
  fillRect(image, 15, 16, 34, 34, color('#07111f', 140));
  fillRect(image, 13, 10, 38, 34, color(primary));
  fillRect(image, 17, 14, 30, 26, color(secondary));
  fillRect(image, 18, 19, 9, 10, color('#08120a'));
  fillRect(image, 37, 19, 9, 10, color('#08120a'));
  fillRect(image, 27, 30, 10, 6, color('#08120a'));
  fillRect(image, 23, 36, 18, 8, color('#08120a'));
  fillRect(image, 12, 45, 40, 9, color(primary));
  fillRect(image, 17, 52, 11, 6, color('#08120a', 210));
  fillRect(image, 36, 52, 11, 6, color('#08120a', 210));
  fillRect(image, 13, 10, 38, 4, color(accent));
  fillRect(image, 13, 10, 4, 34, color(accent));
  fillRect(image, 47, 10, 4, 34, color('#17421e', 210));
  fillRect(image, 13, 40, 38, 4, color('#17421e', 210));
  fillRect(image, 20, 15, 8, 3, color('#c8ff9a', 170));
  fillRect(image, 34, 47, 10, 3, color('#c8ff9a', 130));
  return image;
}

function iconBackground(size) {
  const image = createImage(size, size);
  const base = color('#07101f');
  const warm = color('#172640');
  fill(image, base);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = pseudoNoise(x, y, 41);
      const amount = 0.12 + n * 0.18;
      setPixel(image, x, y, [
        mix(base[0], warm[0], amount),
        mix(base[1], warm[1], amount),
        mix(base[2], warm[2], amount),
        255,
      ]);
    }
  }

  const gridStep = Math.floor(size / 8);
  for (let line = gridStep; line < size; line += gridStep) {
    fillRect(image, line - 2, 0, 4, size, color('#263753', 90));
    fillRect(image, 0, line - 2, size, 4, color('#263753', 90));
  }

  return image;
}

function drawBlock(image, x, y, width, height, primary, top, side) {
  fillRect(image, x, y, width, height, primary);
  fillRect(image, x, y, width, Math.max(2, Math.floor(height * 0.12)), top);
  fillRect(image, x, y, Math.max(2, Math.floor(width * 0.12)), height, top);
  fillRect(image, x + width - Math.max(2, Math.floor(width * 0.12)), y, Math.max(2, Math.floor(width * 0.12)), height, side);
  fillRect(image, x, y + height - Math.max(2, Math.floor(height * 0.12)), width, Math.max(2, Math.floor(height * 0.12)), side);
}

function drawIconMaze(image, { monochrome = false } = {}) {
  const size = image.width;
  const maze = [
    '#########',
    '#...#...#',
    '#.#.#.#.#',
    '#.#...#.#',
    '#.#####.#',
    '#.....#.#',
    '###.#.#.#',
    '#...#...#',
    '#########',
  ];
  const margin = Math.floor(size * 0.11);
  const cell = Math.floor((size - margin * 2) / maze.length);
  const boardSize = cell * maze.length;
  const startX = Math.floor((size - boardSize) / 2);
  const startY = Math.floor((size - boardSize) / 2);
  const wallColor = monochrome ? color('#ffffff') : color('#6677a3');
  const wallTop = monochrome ? color('#ffffff') : color('#a6b5e5');
  const wallSide = monochrome ? color('#d7ddef') : color('#243150');
  const floorColor = monochrome ? color('#000000', 0) : color('#101b31', 180);
  const routeColor = monochrome ? color('#ffffff') : color('#7cff58');
  const routeAccent = monochrome ? color('#ffffff') : color('#58e0ff');
  const keyColor = monochrome ? color('#ffffff') : color('#f8e16c');
  const exitColor = monochrome ? color('#ffffff') : color('#85fff7');

  fillRect(image, startX - Math.floor(cell * 0.18), startY - Math.floor(cell * 0.18), boardSize + Math.floor(cell * 0.36), boardSize + Math.floor(cell * 0.36), monochrome ? color('#000000', 0) : color('#07101f', 210));

  maze.forEach((row, rowIndex) => {
    [...row].forEach((tile, colIndex) => {
      const x = startX + colIndex * cell;
      const y = startY + rowIndex * cell;
      if (tile === '#') {
        drawBlock(
          image,
          x + Math.floor(cell * 0.05),
          y + Math.floor(cell * 0.05),
          Math.ceil(cell * 0.9),
          Math.ceil(cell * 0.9),
          wallColor,
          wallTop,
          wallSide,
        );
        return;
      }
      if (!monochrome) {
        fillRect(image, x + Math.floor(cell * 0.08), y + Math.floor(cell * 0.08), Math.ceil(cell * 0.84), Math.ceil(cell * 0.84), floorColor);
      }
    });
  });

  const center = (row, col) => ({
    x: startX + col * cell + Math.floor(cell / 2),
    y: startY + row * cell + Math.floor(cell / 2),
  });
  const route = [
    center(1, 1),
    center(1, 3),
    center(3, 3),
    center(3, 5),
    center(1, 5),
    center(1, 7),
    center(7, 7),
  ];
  const routeWidth = Math.max(16, Math.floor(cell * 0.24));
  for (let index = 1; index < route.length; index += 1) {
    drawLine(image, route[index - 1].x, route[index - 1].y, route[index].x, route[index].y, routeWidth + Math.floor(routeWidth * 0.8), monochrome ? color('#ffffff', 90) : color('#3df7ce', 70));
    drawLine(image, route[index - 1].x, route[index - 1].y, route[index].x, route[index].y, routeWidth, index % 2 === 0 ? routeAccent : routeColor);
  }

  const parent = center(1, 1);
  const child = center(1, 2);
  const tokenSize = Math.floor(cell * 0.38);
  fillRect(image, parent.x - tokenSize, parent.y - tokenSize, tokenSize * 2, tokenSize * 2, monochrome ? color('#ffffff') : color('#7cff58'));
  fillRect(image, child.x - tokenSize, child.y - tokenSize, tokenSize * 2, tokenSize * 2, monochrome ? color('#ffffff') : color('#58e0ff'));
  fillRect(image, parent.x - Math.floor(tokenSize * 0.45), parent.y - Math.floor(tokenSize * 0.18), Math.floor(tokenSize * 0.9), Math.floor(tokenSize * 0.36), color('#07101f'));
  fillRect(image, child.x - Math.floor(tokenSize * 0.45), child.y - Math.floor(tokenSize * 0.18), Math.floor(tokenSize * 0.9), Math.floor(tokenSize * 0.36), color('#07101f'));

  const key = center(7, 3);
  fillCircle(image, key.x - Math.floor(cell * 0.12), key.y - Math.floor(cell * 0.12), Math.floor(cell * 0.17), keyColor);
  fillCircle(image, key.x - Math.floor(cell * 0.12), key.y - Math.floor(cell * 0.12), Math.floor(cell * 0.08), monochrome ? color('#000000', 0) : color('#07101f'));
  drawLine(image, key.x, key.y, key.x + Math.floor(cell * 0.34), key.y + Math.floor(cell * 0.34), Math.floor(cell * 0.12), keyColor);
  fillRect(image, key.x + Math.floor(cell * 0.2), key.y + Math.floor(cell * 0.25), Math.floor(cell * 0.26), Math.floor(cell * 0.1), keyColor);

  const exit = center(7, 7);
  drawLine(image, exit.x - Math.floor(cell * 0.26), exit.y + Math.floor(cell * 0.22), exit.x + Math.floor(cell * 0.26), exit.y + Math.floor(cell * 0.22), Math.floor(cell * 0.12), exitColor);
  drawLine(image, exit.x - Math.floor(cell * 0.22), exit.y + Math.floor(cell * 0.22), exit.x - Math.floor(cell * 0.22), exit.y - Math.floor(cell * 0.1), Math.floor(cell * 0.12), exitColor);
  drawLine(image, exit.x + Math.floor(cell * 0.22), exit.y + Math.floor(cell * 0.22), exit.x + Math.floor(cell * 0.22), exit.y - Math.floor(cell * 0.1), Math.floor(cell * 0.12), exitColor);
  drawLine(image, exit.x - Math.floor(cell * 0.22), exit.y - Math.floor(cell * 0.1), exit.x, exit.y - Math.floor(cell * 0.32), Math.floor(cell * 0.12), exitColor);
  drawLine(image, exit.x, exit.y - Math.floor(cell * 0.32), exit.x + Math.floor(cell * 0.22), exit.y - Math.floor(cell * 0.1), Math.floor(cell * 0.12), exitColor);
}

function appIcon(size) {
  const image = iconBackground(size);
  drawIconMaze(image);
  return image;
}

function adaptiveIconForeground(size) {
  const image = createImage(size, size);
  fill(image, color('#000000', 0));
  drawIconMaze(image);
  return image;
}

function monochromeIcon(size) {
  const image = createImage(size, size);
  fill(image, color('#000000', 0));
  drawIconMaze(image, { monochrome: true });
  return image;
}

writePng(join(rootDir, 'assets/tiles/floor.png'), floorTile());
writePng(join(rootDir, 'assets/tiles/wall.png'), wallTile());
writePng(join(rootDir, 'assets/tiles/exit.png'), exitTile());
writePng(join(rootDir, 'assets/tiles/key.png'), keyTile());
writePng(
  join(rootDir, 'assets/characters/parent.png'),
  explorerTile('#4fc35f', '#6ede79', '#f6c94d'),
);
writePng(
  join(rootDir, 'assets/characters/child.png'),
  explorerTile('#3aa0ff', '#69c4ff', '#58e0ff'),
);
writePng(join(rootDir, 'assets/icon.png'), appIcon(1024));
writePng(join(rootDir, 'assets/favicon.png'), appIcon(256));
writePng(join(rootDir, 'assets/splash-icon.png'), adaptiveIconForeground(1024));
writePng(join(rootDir, 'assets/android-icon-background.png'), iconBackground(1024));
writePng(join(rootDir, 'assets/android-icon-foreground.png'), adaptiveIconForeground(1024));
writePng(join(rootDir, 'assets/android-icon-monochrome.png'), monochromeIcon(432));
