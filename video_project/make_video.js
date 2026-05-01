/**
 * SCVA Promotional Video Generator
 * Renders each scene HTML → PNG via Puppeteer, then assembles with ffmpeg.
 */
const puppeteer = require("puppeteer");
const { execSync, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const BASE = path.resolve(__dirname);
const FRAMES = path.join(BASE, "frames");
const OUTPUT = path.join(BASE, "output");
fs.mkdirSync(FRAMES, { recursive: true });
fs.mkdirSync(OUTPUT, { recursive: true });

// Scene config: [htmlFile, durationSeconds, label]
const SCENES = [
  ["scene1_intro.html",    10, "مقدمة"],
  ["scene2_devices.html",  12, "الأجهزة"],
  ["scene3_members.html",  11, "الأعضاء"],
  ["scene4_reports.html",  11, "التقارير"],
  ["scene5_security.html", 10, "الأمان"],
  ["scene6_bilingual.html", 10, "ثنائي اللغة"],
  ["scene7_contact.html",  11, "التواصل"],
];

const CHROMIUM = (() => {
  try { return execSync("which chromium", { encoding: "utf8" }).trim(); }
  catch { return "/usr/bin/chromium"; }
})();

async function renderScenes() {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-web-security","--allow-file-access-from-files"],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const framePaths = [];

  for (let i = 0; i < SCENES.length; i++) {
    const [html, dur, label] = SCENES[i];
    const htmlPath = `file://${path.join(BASE, "scenes", html)}`;
    const pngPath  = path.join(FRAMES, `scene${i+1}.png`);

    console.log(`[${i+1}/${SCENES.length}] Rendering: ${label}...`);
    const page = await browser.newPage();
    await page.goto(htmlPath, { waitUntil: "networkidle0", timeout: 20000 });
    await page.waitForTimeout(800); // let fonts load
    await page.screenshot({ path: pngPath, type: "png", clip: { x:0, y:0, width:1920, height:1080 } });
    await page.close();

    framePaths.push({ png: pngPath, dur, label });
    console.log(`   ✓ Saved: ${pngPath}`);
  }

  await browser.close();
  return framePaths;
}

function buildVideo(framePaths) {
  const FPS = 30;
  const FADE_DUR = 0.6; // seconds for crossfade
  const outPath = path.join(OUTPUT, "SCVA_Members_Promo.mp4");

  console.log("\n[ffmpeg] Assembling video...");

  // Build inputs + filter_complex for Ken Burns zoom + crossfades
  const inputs = framePaths.map(f => `-loop 1 -t ${f.dur} -i "${f.png}"`).join(" ");

  // Build filter: scale, zoompan (Ken Burns), then xfade chain
  const filters = [];
  const zoomFilters = framePaths.map((f, i) => {
    // Alternate zoom directions for visual variety
    const zooms = [
      `zoompan=z='min(zoom+0.0006,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${f.dur * FPS}:s=1920x1080:fps=${FPS}`,
      `zoompan=z='min(zoom+0.0005,1.04)':x='iw/2-(iw/zoom/2)+t*3':y='ih/2-(ih/zoom/2)':d=${f.dur * FPS}:s=1920x1080:fps=${FPS}`,
      `zoompan=z='min(zoom+0.0007,1.06)':x='iw/2-(iw/zoom/2)-t*2':y='ih/2-(ih/zoom/2)+t*2':d=${f.dur * FPS}:s=1920x1080:fps=${FPS}`,
      `zoompan=z='if(lte(zoom,1.0),1.04,max(1.0,zoom-0.0005))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${f.dur * FPS}:s=1920x1080:fps=${FPS}`,
    ];
    const z = zooms[i % zooms.length];
    return `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,${z},setsar=1[v${i}]`;
  });
  filters.push(...zoomFilters);

  // Chain xfades
  let lastLabel = `v0`;
  let offset = 0;
  for (let i = 1; i < framePaths.length; i++) {
    offset += framePaths[i-1].dur - FADE_DUR;
    const outLabel = i === framePaths.length - 1 ? "vout" : `xf${i}`;
    filters.push(`[${lastLabel}][v${i}]xfade=transition=fade:duration=${FADE_DUR}:offset=${offset.toFixed(2)}[${outLabel}]`);
    lastLabel = outLabel;
  }

  const filterStr = filters.join("; ");
  const totalDur = framePaths.reduce((a, f) => a + f.dur, 0) - FADE_DUR * (framePaths.length - 1);

  // Music: generate ambient tone using ffmpeg sine+aevalsrc
  const musicPath = path.join(BASE, "assets", "ambient.mp3");
  if (!fs.existsSync(musicPath)) {
    console.log("[ffmpeg] Generating ambient music...");
    const musicCmd = `ffmpeg -y -f lavfi -i "aevalsrc=0.12*sin(2*PI*220*t)+0.08*sin(2*PI*330*t)+0.06*sin(2*PI*440*t)+0.04*sin(2*PI*550*t)+0.03*sin(2*PI*165*t):s=44100" -af "aecho=0.8:0.7:60:0.4,volume=0.55,afade=t=in:st=0:d=3,afade=t=out:st=${totalDur-3}:d=3" -t ${totalDur + 2} "${musicPath}"`;
    try { execSync(musicCmd, { stdio: "inherit" }); }
    catch(e) { console.warn("Music gen failed, continuing without..."); }
  }

  const hasMusicFile = fs.existsSync(musicPath);
  const musicInput = hasMusicFile ? `-stream_loop -1 -i "${musicPath}"` : "";
  const audioMap = hasMusicFile ? `-map "[vout]" -map "${framePaths.length}:a" -shortest` : `-map "[vout]"`;

  const ffCmd = [
    "ffmpeg -y",
    inputs,
    musicInput,
    `-filter_complex "${filterStr}"`,
    audioMap,
    `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p`,
    hasMusicFile ? `-c:a aac -b:a 192k` : "",
    `-movflags +faststart`,
    `"${outPath}"`
  ].filter(Boolean).join(" ");

  console.log("[ffmpeg] Running assembly (this may take 1-2 minutes)...");
  try {
    execSync(ffCmd, { stdio: "inherit", maxBuffer: 100 * 1024 * 1024 });
    console.log(`\n✅ Video ready: ${outPath}`);
  } catch (e) {
    console.error("ffmpeg error:", e.message);
    // Fallback: simpler concat without Ken Burns
    console.log("[ffmpeg] Trying simple concat fallback...");
    const listFile = path.join(BASE, "frames", "list.txt");
    const listContent = framePaths.map(f => `file '${f.png}'\nduration ${f.dur}`).join("\n");
    fs.writeFileSync(listFile, listContent);
    const simpleCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -movflags +faststart "${outPath}"`;
    execSync(simpleCmd, { stdio: "inherit" });
    console.log(`\n✅ Video ready (simple): ${outPath}`);
  }

  return outPath;
}

(async () => {
  console.log("═══════════════════════════════════════");
  console.log("  SCVA Members — Promotional Video");
  console.log("═══════════════════════════════════════\n");
  const frames = await renderScenes();
  const outPath = buildVideo(frames);
  const stats = fs.statSync(outPath);
  console.log(`\nFile size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log("Done! 🎬");
})();
