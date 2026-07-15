import assert from "node:assert/strict";

import {
  FORMAT_LABELS,
  MIXED_FORMAT_THRESHOLD,
  formatLabel,
  formatMixTooltip,
  normalizeAdFormat,
  normalizeDisplayFormat,
  normalizeFormatMix,
  pickCampaignFormatFields,
} from "./ad-formats";

assert.equal(normalizeAdFormat("reel"), "reel");
assert.equal(normalizeAdFormat("REELS"), "reel");
assert.equal(normalizeAdFormat("image"), "photo");
assert.equal(normalizeAdFormat("foto"), "photo");
assert.equal(normalizeAdFormat("carrusel"), "carousel");
assert.equal(normalizeAdFormat("story"), "story");
assert.equal(normalizeAdFormat("dynamic"), "dynamic");
assert.equal(normalizeAdFormat("mixed"), undefined);
assert.equal(normalizeAdFormat(""), undefined);
assert.equal(normalizeAdFormat(null), undefined);
assert.equal(normalizeAdFormat("weird_xyz"), "other");

assert.equal(normalizeDisplayFormat("mixed"), "mixed");
assert.equal(normalizeDisplayFormat("Mixto"), "mixed");
assert.equal(normalizeDisplayFormat("video"), "video");
assert.equal(normalizeDisplayFormat(undefined, "photo"), "photo");
assert.equal(normalizeDisplayFormat("", "reel"), "reel");

const mixCamel = normalizeFormatMix({ reel: 0.7, photo: 0.3 });
assert.ok(mixCamel);
assert.equal(mixCamel!.reel, 0.7);
assert.equal(mixCamel!.photo, 0.3);

const mixPct = normalizeFormatMix({ video: 60, carousel: 40 });
assert.ok(mixPct);
assert.equal(mixPct!.video, 0.6);
assert.equal(mixPct!.carousel, 0.4);

assert.equal(normalizeFormatMix(null), undefined);
assert.equal(normalizeFormatMix([]), undefined);

assert.equal(formatLabel("mixed"), "Mixto");
assert.equal(formatLabel("photo"), "Foto");
assert.equal(formatLabel(undefined), "—");
assert.equal(FORMAT_LABELS.carousel, "Carrusel");

const tip = formatMixTooltip({ reel: 0.75, photo: 0.25 });
assert.ok(tip.includes("Reel"));
assert.ok(tip.includes("75%"));
assert.ok(tip.includes("20%"));
assert.ok(formatMixTooltip(undefined).includes("20%"));

assert.equal(MIXED_FORMAT_THRESHOLD, 0.2);

const snake = pickCampaignFormatFields({
  primary_format: "reel",
  display_format: "mixed",
  format_mix: { reel: 0.55, carousel: 0.25, photo: 0.2 },
  creative_count: 4,
});
assert.equal(snake.primaryFormat, "reel");
assert.equal(snake.displayFormat, "mixed");
assert.equal(snake.creativeCount, 4);
assert.ok(snake.formatMix && snake.formatMix.carousel === 0.25);

const camel = pickCampaignFormatFields({
  primaryFormat: "video",
  displayFormat: "video",
  formatMix: { video: 1 },
  creativeCount: 1,
});
assert.equal(camel.displayFormat, "video");
assert.equal(camel.primaryFormat, "video");

const absent = pickCampaignFormatFields({ name: "legacy" });
assert.equal(absent.primaryFormat, undefined);
assert.equal(absent.displayFormat, undefined);
assert.equal(absent.formatMix, undefined);

console.log("ad-formats.self-check OK");
