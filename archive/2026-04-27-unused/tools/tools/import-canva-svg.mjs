import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const DEFAULT_INPUT = path.join(process.env.USERPROFILE || process.env.HOME || ROOT, 'Downloads', 'Untitled design.svg');
const DEFAULT_NAME = 'canva-game-asset';

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    name: DEFAULT_NAME,
    outDir: path.join(ROOT, 'assets', 'generated'),
    registry: path.join(ROOT, 'js', 'generated', 'canva-game-assets.js')
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if ((arg === '--input' || arg === '-i') && next) {
      args.input = path.resolve(next);
      i += 1;
    } else if ((arg === '--name' || arg === '-n') && next) {
      args.name = next;
      i += 1;
    } else if (arg === '--out-dir' && next) {
      args.outDir = path.resolve(next);
      i += 1;
    } else if (arg === '--registry' && next) {
      args.registry = path.resolve(next);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  args.fileName = `${toKebabCase(args.name)}.svg`;
  args.assetKey = toCamelCase(args.name);
  return args;
}

function printHelp() {
  console.log(`
Import a Canva SVG into the game asset pipeline.

Usage:
  node tools/import-canva-svg.mjs --input "C:\\Users\\anoop\\Downloads\\Untitled design.svg" --name mascot

Options:
  --input, -i     Source SVG path. Defaults to your Downloads/Untitled design.svg.
  --name, -n      Asset name. Defaults to canva-game-asset.
  --out-dir       SVG output folder. Defaults to assets/generated.
  --registry      JS registry path. Defaults to js/generated/canva-game-assets.js.
`);
}

function toKebabCase(value) {
  return String(value || DEFAULT_NAME)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || DEFAULT_NAME;
}

function toCamelCase(value) {
  const kebab = toKebabCase(value);
  return kebab.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function getAttr(svg, name) {
  const match = svg.match(new RegExp(`\\s${name}="([^"]+)"`, 'i'));
  return match ? match[1] : '';
}

function getFirstSvgTag(svg) {
  const match = svg.match(/<svg\b[^>]*>/i);
  return match ? match[0] : '';
}

function sanitizeSvg(raw, assetName) {
  let svg = raw.replace(/^\uFEFF/, '').trim();
  svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '');
  svg = svg.replace(/<!doctype[\s\S]*?>/gi, '');
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/\son[a-z]+="[^"]*"/gi, '');

  const firstTag = getFirstSvgTag(svg);
  if (!firstTag) {
    throw new Error('The input file does not look like an SVG.');
  }

  let replacement = firstTag
    .replace(/\swidth="[^"]*"/i, '')
    .replace(/\sheight="[^"]*"/i, '')
    .replace(/\szoomAndPan="[^"]*"/i, '')
    .replace(/\srole="[^"]*"/i, '')
    .replace(/\sclass="[^"]*"/i, '');

  replacement = replacement.replace(
    /<svg\b/i,
    `<svg class="canva-game-asset canva-game-asset--${toKebabCase(assetName)}" role="img"`
  );

  if (!/\saria-label="/i.test(replacement)) {
    replacement = replacement.replace(/>$/, ` aria-label="${escapeAttribute(assetName)}">`);
  }

  if (!/\sfocusable="/i.test(replacement)) {
    replacement = replacement.replace(/>$/, ' focusable="false">');
  }

  svg = svg.replace(firstTag, replacement);
  return svg;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getViewBoxParts(viewBox) {
  return viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((part) => Number.isFinite(part));
}

function analyzeSvg(svg, sourceStats) {
  const viewBox = getAttr(svg, 'viewBox');
  const width = getAttr(svg, 'width');
  const height = getAttr(svg, 'height');
  const viewBoxParts = viewBox ? getViewBoxParts(viewBox) : [];
  const imageCount = (svg.match(/<image\b/gi) || []).length;
  const embeddedImageCount = (svg.match(/data:image\//gi) || []).length;
  const pathCount = (svg.match(/<path\b/gi) || []).length;
  const groupCount = (svg.match(/<g\b/gi) || []).length;
  const textCount = (svg.match(/<text\b/gi) || []).length;

  return {
    viewBox,
    width: width || (viewBoxParts[2] ? String(viewBoxParts[2]) : ''),
    height: height || (viewBoxParts[3] ? String(viewBoxParts[3]) : ''),
    bytes: sourceStats.size,
    imageMode: embeddedImageCount > 0 ? 'embedded-raster' : 'vector',
    counts: {
      image: imageCount,
      embeddedImage: embeddedImageCount,
      path: pathCount,
      group: groupCount,
      text: textCount
    }
  };
}

function browserPath(filePath) {
  const relative = path.relative(ROOT, filePath).replaceAll(path.sep, '/');
  return relative.startsWith('.') ? relative : relative;
}

async function writeRegistry(registryPath, asset) {
  await mkdir(path.dirname(registryPath), { recursive: true });
  const content = `// Generated by tools/import-canva-svg.mjs. Re-run npm.cmd run asset:canva after replacing the Canva export.
export const CANVA_GAME_ASSETS = ${JSON.stringify({ [asset.key]: asset }, null, 2)};

export function getCanvaGameAsset(key = ${JSON.stringify(asset.key)}) {
  return CANVA_GAME_ASSETS[key] || CANVA_GAME_ASSETS[${JSON.stringify(asset.key)}];
}
`;
  await writeFile(registryPath, content, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceStats = await stat(args.input);
  const raw = await readFile(args.input, 'utf8');
  const sanitized = sanitizeSvg(raw, args.name);
  const analysis = analyzeSvg(raw, sourceStats);

  await mkdir(args.outDir, { recursive: true });
  const outputSvg = path.join(args.outDir, args.fileName);
  const outputManifest = path.join(args.outDir, `${toKebabCase(args.name)}.json`);

  await writeFile(outputSvg, sanitized, 'utf8');

  const asset = {
    key: args.assetKey,
    name: args.name,
    src: browserPath(outputSvg),
    manifest: browserPath(outputManifest),
    sourceFile: path.basename(args.input),
    sourceModifiedAt: sourceStats.mtime.toISOString(),
    imageMode: analysis.imageMode,
    viewBox: analysis.viewBox,
    width: Number(analysis.width) || null,
    height: Number(analysis.height) || null,
    counts: analysis.counts
  };

  await writeFile(outputManifest, `${JSON.stringify(asset, null, 2)}\n`, 'utf8');
  await writeRegistry(args.registry, asset);

  console.log(`Imported ${args.input}`);
  console.log(`SVG: ${browserPath(outputSvg)}`);
  console.log(`Registry: ${browserPath(args.registry)}`);
  console.log(`Mode: ${analysis.imageMode}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
