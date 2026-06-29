// One-off brand asset pipeline: knock out the solid charcoal background from the
// supplied CORE logo PNG so the mark sits transparently on any surface.
// Uses the top-left corner as the background reference and ramps alpha by color
// distance (so anti-aliased edges stay smooth). Run: node scripts/make-transparent-logo.mjs
import sharp from "sharp";

async function knockout(input, output, d0 = 38, d1 = 95) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const [bgR, bgG, bgB] = [data[0], data[1], data[2]];
  for (let i = 0; i < data.length; i += ch) {
    const dr = data[i] - bgR;
    const dg = data[i + 1] - bgG;
    const db = data[i + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    const a = Math.min(1, Math.max(0, (dist - d0) / (d1 - d0)));
    data[i + 3] = Math.round(a * 255);
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: ch } })
    .png()
    .toFile(output);
  console.log(`wrote ${output} (${info.width}x${info.height})`);
}

await knockout("public/brand/core-logo-wide.png", "public/brand/core-logo-wide.png");
await knockout("public/brand/core-logo.png", "public/brand/core-logo-mark.png");
