const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const BASE   = __dirname;
const FRAMES = path.join(BASE, "frames");
const ASSETS = path.join(BASE, "assets");
const OUTPUT = path.join(BASE, "output");
const MUSIC  = path.join(ASSETS, "ambient.mp3");
const FINAL  = path.join(OUTPUT, "SCVA_Members_Promo.mp4");

const SCENES = [
  { png: "scene1.png", dur: 10 },
  { png: "scene2.png", dur: 12 },
  { png: "scene3.png", dur: 11 },
  { png: "scene4.png", dur: 11 },
  { png: "scene5.png", dur: 10 },
  { png: "scene6.png", dur: 10 },
  { png: "scene7.png", dur: 11 },
];
const TRANSITIONS = ["fade","wipeleft","dissolve","slideright","wipeleft","fade","dissolve"];
const FADE = 0.7;

function run(cmd, label) {
  process.stdout.write(`  >> ${label}\n`);
  try {
    execSync(cmd, { stdio: ["pipe","pipe","pipe"], maxBuffer: 50*1024*1024 });
    return true;
  } catch(e) {
    const msg = (e.stderr || e.stdout || "").toString().slice(-600);
    console.error(`  ERROR: ${msg}`);
    return false;
  }
}

// Step 1: make per-scene static clips
console.log("\n═══ Step 1/3: Creating per-scene clips ═══");
const clips = [];
for (let i = 0; i < SCENES.length; i++) {
  const { png, dur } = SCENES[i];
  const src = path.join(FRAMES, png);
  const dst = path.join(FRAMES, `clip${i+1}.mp4`);
  if (!fs.existsSync(src)) { console.error(`MISSING: ${src}`); process.exit(1); }
  const ok = run(
    `ffmpeg -y -loop 1 -framerate 25 -t ${dur} -i "${src}" -vf "scale=1920:1080:flags=lanczos,setsar=1" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -r 25 "${dst}"`,
    `clip${i+1}.mp4 (${dur}s)`
  );
  if (!ok) process.exit(1);
  clips.push({ path: dst, dur });
  console.log(`  ✓ Scene ${i+1} (${dur}s)`);
}

// Step 2: chain crossfades one at a time
console.log("\n═══ Step 2/3: Chaining crossfades ═══");
let current = clips[0].path;
let currentDur = clips[0].dur;

for (let i = 1; i < clips.length; i++) {
  const trans = TRANSITIONS[i];
  const offset = (currentDur - FADE).toFixed(2);
  const mergedDur = currentDur + clips[i].dur - FADE;
  const out = path.join(FRAMES, `merged${i}.mp4`);
  const ok = run(
    `ffmpeg -y -i "${current}" -i "${clips[i].path}" -filter_complex "[0:v][1:v]xfade=transition=${trans}:duration=${FADE}:offset=${offset}[v]" -map "[v]" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -r 25 "${out}"`,
    `xfade scene${i+1} (${trans})`
  );
  if (!ok) process.exit(1);
  current = out;
  currentDur = mergedDur;
  console.log(`  ✓ Through scene ${i+1} — running dur: ${currentDur.toFixed(1)}s`);
}

const totalDur = currentDur;
console.log(`\n  Total: ${totalDur.toFixed(1)}s`);

// Step 3: add audio
console.log("\n═══ Step 3/3: Adding audio ═══");
const fadeOutStart = (totalDur - 3.5).toFixed(1);
let ok;
if (fs.existsSync(MUSIC)) {
  ok = run(
    `ffmpeg -y -i "${current}" -stream_loop -1 -i "${MUSIC}" -filter_complex "[1:a]afade=t=in:st=0:d=2.5,afade=t=out:st=${fadeOutStart}:d=3.5,volume=0.65[a]" -map "0:v" -map "[a]" -c:v copy -c:a aac -b:a 192k -t ${totalDur.toFixed(2)} -movflags +faststart "${FINAL}"`,
    "mixing audio"
  );
  if (!ok) { fs.copyFileSync(current, FINAL); console.log("  Audio failed — video saved without audio"); }
} else {
  fs.copyFileSync(current, FINAL);
  console.log("  No music file");
}

const sizeMb = (fs.statSync(FINAL).size / 1024 / 1024).toFixed(1);
console.log(`\n${"═".repeat(52)}`);
console.log(`  ✅  SCVA_Members_Promo.mp4`);
console.log(`  📁  ${FINAL}`);
console.log(`  📦  ${sizeMb} MB  |  ${totalDur.toFixed(0)} seconds`);
console.log(`${"═".repeat(52)}\n`);
