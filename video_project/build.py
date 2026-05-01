#!/usr/bin/env python3
"""
SCVA Members Promotional Video Builder
Step-by-step reliable approach.
"""
import subprocess, os, sys, shutil

BASE  = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(BASE, "frames")
ASSETS = os.path.join(BASE, "assets")
OUTPUT = os.path.join(BASE, "output")
MUSIC  = os.path.join(ASSETS, "ambient.mp3")
FINAL  = os.path.join(OUTPUT, "SCVA_Members_Promo.mp4")

os.makedirs(FRAMES, exist_ok=True)
os.makedirs(OUTPUT, exist_ok=True)

FFMPEG = "ffmpeg"

# Scenes: (filename, duration_sec)
SCENES = [
    ("scene1.png", 10),
    ("scene2.png", 12),
    ("scene3.png", 11),
    ("scene4.png", 11),
    ("scene5.png", 10),
    ("scene6.png", 10),
    ("scene7.png", 11),
]

def run(cmd, label=""):
    print(f"  >> {label or cmd[:80]}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[-500:]}")
        return False
    return True

def make_clip(png_path, dur, out_path):
    """Convert a PNG to a looped video clip."""
    cmd = (
        f'{FFMPEG} -y -loop 1 -framerate 25 -t {dur} -i "{png_path}" '
        f'-vf "scale=1920:1080:flags=lanczos,setsar=1" '
        f'-c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -r 25 '
        f'"{out_path}"'
    )
    return run(cmd, f"clip {os.path.basename(out_path)}")

def crossfade_two(clip_a, clip_b, dur_a, fade_dur, out_path, trans="fade"):
    """Join two clips with xfade transition."""
    offset = dur_a - fade_dur
    cmd = (
        f'{FFMPEG} -y -i "{clip_a}" -i "{clip_b}" '
        f'-filter_complex "[0:v][1:v]xfade=transition={trans}:duration={fade_dur}:offset={offset:.2f}[v]" '
        f'-map "[v]" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -r 25 '
        f'"{out_path}"'
    )
    return run(cmd, f"xfade → {os.path.basename(out_path)}")

def add_audio(video_path, audio_path, total_dur, out_path):
    """Mix audio onto final video."""
    fade_out_start = total_dur - 3.5
    cmd = (
        f'{FFMPEG} -y -i "{video_path}" -stream_loop -1 -i "{audio_path}" '
        f'-filter_complex "[1:a]afade=t=in:st=0:d=2.5,afade=t=out:st={fade_out_start:.1f}:d=3.5,volume=0.65[a]" '
        f'-map "0:v" -map "[a]" '
        f'-c:v copy -c:a aac -b:a 192k -t {total_dur} '
        f'-movflags +faststart "{out_path}"'
    )
    return run(cmd, "adding audio")

# ─── STEP 1: Create individual clips ───────────────────────────────────────
print("\n═══ Step 1/3: Creating per-scene clips ═══")
clip_paths = []
clip_durs  = []

TRANSITIONS = ["fade","wipeleft","dissolve","slideright","wipeleft","fade","dissolve"]

for i, (png_name, dur) in enumerate(SCENES):
    png_path  = os.path.join(FRAMES, png_name)
    clip_path = os.path.join(FRAMES, f"clip{i+1}.mp4")
    if not os.path.exists(png_path):
        print(f"  MISSING: {png_path}")
        sys.exit(1)
    ok = make_clip(png_path, dur, clip_path)
    if not ok:
        sys.exit(1)
    clip_paths.append(clip_path)
    clip_durs.append(dur)
    print(f"  ✓ Scene {i+1} ({dur}s)")

# ─── STEP 2: Chain crossfades ────────────────────────────────────────────
print("\n═══ Step 2/3: Chaining crossfades ═══")
FADE = 0.7
current = clip_paths[0]
current_dur = clip_durs[0]

for i in range(1, len(clip_paths)):
    trans = TRANSITIONS[i]
    merged_dur = current_dur + clip_durs[i] - FADE
    out = os.path.join(FRAMES, f"merged{i}.mp4")
    ok = crossfade_two(current, clip_paths[i], current_dur, FADE, out, trans)
    if not ok:
        sys.exit(1)
    current = out
    current_dur = merged_dur
    print(f"  ✓ Merged through scene {i+1} (running dur: {current_dur:.1f}s)")

total_dur = current_dur
print(f"\n  Total video duration: {total_dur:.1f}s")

# ─── STEP 3: Add audio ────────────────────────────────────────────────────
print("\n═══ Step 3/3: Adding audio ═══")
if os.path.exists(MUSIC):
    ok = add_audio(current, MUSIC, total_dur, FINAL)
    if not ok:
        # Fallback: copy without audio
        shutil.copy(current, FINAL)
        print("  Audio failed — saved without audio")
else:
    shutil.copy(current, FINAL)
    print("  No music file — saved without audio")

# ─── DONE ─────────────────────────────────────────────────────────────────
size_mb = os.path.getsize(FINAL) / 1024 / 1024
print(f"\n{'═'*50}")
print(f"  ✅  SCVA_Members_Promo.mp4")
print(f"  📁  {FINAL}")
print(f"  📦  {size_mb:.1f} MB | {total_dur:.0f} seconds")
print(f"{'═'*50}\n")
