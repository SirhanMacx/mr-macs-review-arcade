#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import math
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
GAMES_PATH = ROOT / "games.json"
THUMB_DIR = ROOT / "assets" / "game-thumbnails"
CARD_DIR = ROOT / "assets" / "game-card-art"
MARQUEE_DIR = ROOT / "assets" / "game-marquees"
CABINET_DIR = ROOT / "assets" / "cabinet"
MANIFEST_PATH = ROOT / "assets" / "generated-game-art-manifest.json"

THUMB_SIZE = (640, 360)
CARD_SIZE = (768, 432)
MARQUEE_SIZE = (960, 300)

BASE = "#070912"
PAPER = "#f6f4ee"
MUTED = "#9aa3bb"
PALETTES = {
    "AP Psychology": ("#ff7cc8", "#b892ff", "#7af0ff"),
    "AP United States History": ("#f5c451", "#ff8e6f", "#7af0ff"),
    "AP World History: Modern": ("#7af0ff", "#f5c451", "#ff7cc8"),
    "AP European History": ("#b892ff", "#f5c451", "#7af0ff"),
    "AP Human Geography": ("#69f0aa", "#7af0ff", "#f5c451"),
    "AP Macroeconomics": ("#f5c451", "#69f0aa", "#7af0ff"),
    "AP Microeconomics": ("#ffd884", "#69f0aa", "#ff7cc8"),
    "AP Macro/Micro Combined": ("#f5c451", "#69f0aa", "#ff8e6f"),
    "AP U.S. Government and Politics": ("#7af0ff", "#f5c451", "#ff8e6f"),
    "Grade 10 Global History II": ("#7af0ff", "#f5c451", "#b892ff"),
    "Grade 11 U.S. History": ("#f5c451", "#ff8e6f", "#7af0ff"),
    "Grade 9 Global History I": ("#69f0aa", "#f5c451", "#7af0ff"),
    "Economics": ("#f5c451", "#69f0aa", "#7af0ff"),
    "Civics and Participation in Government": ("#7af0ff", "#f5c451", "#ff8e6f"),
    "All Courses": ("#7af0ff", "#f5c451", "#ff7cc8"),
}


def stable_seed(value: str) -> int:
    return int(hashlib.sha256(value.encode("utf-8")).hexdigest()[:16], 16)


def slug_words(value: str, limit: int = 5) -> str:
    words = re.findall(r"[A-Za-z0-9]+", value)
    return " ".join(words[:limit]) or "Review"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def palette_for(game: dict) -> tuple[str, str, str]:
    course = game.get("course") or "All Courses"
    if course in PALETTES:
        return PALETTES[course]
    for key, colors in PALETTES.items():
        if key != "All Courses" and key in course:
            return colors
    return PALETTES["All Courses"]


def category_for(game: dict) -> str:
    haystack = " ".join(str(game.get(k, "")) for k in ("id", "title", "gameType", "collection", "subject", "file")).lower()
    if "jeopardy" in haystack:
        return "jeopardy"
    if "practice-exam" in haystack or "regents" in haystack or "ap-practice" in haystack:
        return "exam"
    if "source" in haystack or "cipher" in haystack:
        return "source"
    if "writing" in haystack:
        return "writing"
    if "pinball" in haystack:
        return "pinball"
    if "invaders" in haystack or "defender" in haystack or "galaxy" in haystack:
        return "shooter"
    if "runner" in haystack or "drift" in haystack or "rally" in haystack:
        return "runner"
    if "snake" in haystack:
        return "snake"
    if "blocks" in haystack or "2048" in haystack or "brick" in haystack or "cube" in haystack:
        return "blocks"
    if "maze" in haystack or "quest" in haystack or "hunters" in haystack:
        return "adventure"
    return "arcade"


def gradient(size: tuple[int, int], accent: str, secondary: str, rng: random.Random) -> Image.Image:
    w, h = size
    small = (max(80, w // 8), max(45, h // 8))
    sw, sh = small
    img = Image.new("RGB", small, BASE)
    pix = img.load()
    ax = rng.uniform(-0.3, 1.3) * sw
    ay = rng.uniform(-0.2, 1.1) * sh
    bx = rng.uniform(-0.3, 1.3) * sw
    by = rng.uniform(-0.2, 1.1) * sh
    a = tuple(int(accent[i : i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(secondary[i : i + 2], 16) for i in (1, 3, 5))
    base = (7, 9, 18)
    for y in range(sh):
        for x in range(sw):
            da = max(0, 1 - math.hypot(x - ax, y - ay) / (sw * 0.82))
            db = max(0, 1 - math.hypot(x - bx, y - by) / (sw * 0.78))
            scan = 0.92 + (0.05 if y % 4 == 0 else 0)
            pix[x, y] = tuple(
                min(255, int((base[i] + a[i] * da * 0.28 + b[i] * db * 0.22) * scan))
                for i in range(3)
            )
    return img.resize(size, Image.Resampling.BICUBIC)


def draw_scanlines(draw: ImageDraw.ImageDraw, size: tuple[int, int]) -> None:
    w, h = size
    for y in range(0, h, 4):
        draw.line((0, y, w, y), fill=(255, 255, 255, 13), width=1)
    for x in range(0, w, 28):
        draw.line((x, 0, x, h), fill=(122, 240, 255, 8), width=1)


def draw_title(draw: ImageDraw.ImageDraw, xy: tuple[int, int], title: str, max_width: int, accent: str, scale: float = 1.0) -> None:
    words = slug_words(title, 6).upper().split()
    lines: list[str] = []
    current = ""
    title_font = font(max(24, int(42 * scale)), bold=True)
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=title_font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    lines = lines[:2]
    x, y = xy
    for line in lines:
        draw.text((x + 2, y + 2), line, fill="#02040a", font=title_font)
        draw.text((x, y), line, fill=PAPER, font=title_font)
        y += int(47 * scale)
    draw.line((x, y + 5, x + min(max_width, 260), y + 5), fill=accent, width=max(2, int(4 * scale)))


def draw_globe(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], accent: str, secondary: str) -> None:
    x0, y0, x1, y1 = box
    draw.ellipse(box, outline=accent, width=4)
    for t in (0.3, 0.5, 0.7):
        x = x0 + (x1 - x0) * t
        draw.arc((x0, y0, x1, y1), 70, 110, fill=secondary, width=2)
        draw.ellipse((x - 5, y0 + 10, x + 5, y1 - 10), outline=(122, 240, 255, 80), width=1)
    for t in (0.35, 0.5, 0.65):
        y = y0 + (y1 - y0) * t
        draw.arc((x0 + 8, y - 28, x1 - 8, y + 28), 0, 360, fill=(245, 196, 81, 120), width=2)


def draw_document(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], accent: str) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=8, fill=(246, 244, 238, 230), outline=accent, width=3)
    draw.rectangle((x1 - 34, y0, x1, y0 + 34), fill=(200, 207, 220, 230))
    for i in range(7):
        y = y0 + 48 + i * 18
        draw.line((x0 + 18, y, x1 - 20 - (i % 3) * 28, y), fill=(20, 28, 42, 135), width=4)
    draw.rectangle((x0 + 18, y1 - 55, x0 + 96, y1 - 24), outline=(20, 28, 42, 120), width=3)


def draw_joystick(draw: ImageDraw.ImageDraw, cx: int, cy: int, accent: str, secondary: str) -> None:
    draw.rounded_rectangle((cx - 68, cy + 32, cx + 68, cy + 78), radius=12, fill=(15, 20, 31, 230), outline=accent, width=3)
    draw.line((cx - 12, cy + 34, cx - 30, cy - 28), fill=(215, 223, 238, 220), width=8)
    draw.ellipse((cx - 54, cy - 78, cx - 6, cy - 30), fill=secondary, outline=PAPER, width=3)
    for i, color in enumerate((accent, "#ff7cc8", "#f5c451")):
        draw.ellipse((cx + 8 + i * 32, cy + 42, cx + 29 + i * 32, cy + 63), fill=color)


def draw_motif(draw: ImageDraw.ImageDraw, size: tuple[int, int], category: str, accent: str, secondary: str, rng: random.Random) -> None:
    w, h = size
    if category == "jeopardy":
        for row in range(4):
            for col in range(6):
                x = int(w * 0.48) + col * int(w * 0.07)
                y = int(h * 0.18) + row * int(h * 0.12)
                draw.rounded_rectangle((x, y, x + int(w * 0.055), y + int(h * 0.085)), radius=4, fill=(11, 18, 36, 230), outline=accent, width=2)
        draw_joystick(draw, int(w * 0.22), int(h * 0.58), accent, secondary)
    elif category in {"exam", "source", "writing"}:
        draw_document(draw, (int(w * 0.58), int(h * 0.13), int(w * 0.89), int(h * 0.80)), accent)
        draw_globe(draw, (int(w * 0.11), int(h * 0.20), int(w * 0.40), int(h * 0.72)), accent, secondary)
        if category == "writing":
            draw.line((int(w * 0.50), int(h * 0.74), int(w * 0.75), int(h * 0.24)), fill=secondary, width=7)
            draw.polygon([(int(w * 0.75), int(h * 0.24)), (int(w * 0.81), int(h * 0.18)), (int(w * 0.77), int(h * 0.31))], fill=PAPER)
    elif category == "pinball":
        for i in range(5):
            x = int(w * (0.24 + i * 0.12))
            draw.ellipse((x, int(h * 0.28), x + 54, int(h * 0.28) + 54), outline=accent if i % 2 else secondary, width=5)
        draw.line((int(w * 0.20), int(h * 0.78), int(w * 0.45), int(h * 0.66)), fill=accent, width=9)
        draw.line((int(w * 0.80), int(h * 0.78), int(w * 0.55), int(h * 0.66)), fill=secondary, width=9)
    elif category in {"shooter", "runner", "snake", "blocks", "adventure"}:
        for i in range(12):
            x = rng.randint(int(w * 0.08), int(w * 0.88))
            y = rng.randint(int(h * 0.16), int(h * 0.76))
            if category == "blocks":
                draw.rounded_rectangle((x, y, x + 42, y + 28), radius=4, fill=accent if i % 2 else secondary, outline=(255, 255, 255, 80), width=1)
            elif category == "snake":
                draw.ellipse((x, y, x + 28, y + 28), fill=accent if i % 2 else secondary)
            elif category == "runner":
                draw.line((x, y, x + 70, y - 18), fill=accent if i % 2 else secondary, width=6)
            elif category == "shooter":
                draw.polygon([(x, y), (x + 18, y + 34), (x - 18, y + 34)], fill=accent if i % 2 else secondary)
            else:
                draw.polygon([(x, y), (x + 38, y + 18), (x + 16, y + 55), (x - 18, y + 30)], outline=accent if i % 2 else secondary, width=4)
        draw_globe(draw, (int(w * 0.58), int(h * 0.17), int(w * 0.88), int(h * 0.70)), accent, secondary)
    else:
        draw_globe(draw, (int(w * 0.56), int(h * 0.14), int(w * 0.88), int(h * 0.72)), accent, secondary)
        draw_joystick(draw, int(w * 0.23), int(h * 0.58), accent, secondary)


def render_game_art(game: dict, size: tuple[int, int], variant: str) -> Image.Image:
    seed = stable_seed(f"{game.get('id')}:{variant}")
    rng = random.Random(seed)
    accent, secondary, tertiary = palette_for(game)
    category = category_for(game)
    img = gradient(size, accent, secondary, rng).convert("RGBA")
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = size

    for i in range(16):
        x = rng.randint(-40, w)
        y = rng.randint(-40, h)
        r = rng.randint(16, 70)
        color = accent if i % 3 == 0 else secondary if i % 3 == 1 else tertiary
        draw.ellipse((x, y, x + r, y + r), outline=color + "42", width=rng.randint(1, 4))

    draw_motif(draw, size, category, accent, secondary, rng)
    draw_scanlines(draw, size)

    rail = max(14, int(w * 0.024))
    draw.rounded_rectangle((rail, rail, w - rail, h - rail), radius=10, outline=accent, width=max(3, int(w * 0.006)))
    draw.rounded_rectangle((rail + 8, rail + 8, w - rail - 8, h - rail - 8), radius=8, outline=(255, 255, 255, 38), width=1)
    draw.rectangle((0, h - int(h * 0.30), w, h), fill=(2, 4, 10, 188))
    draw.rectangle((0, 0, w, int(h * 0.13)), fill=(2, 4, 10, 160))

    title_scale = min(size[0] / THUMB_SIZE[0], size[1] / THUMB_SIZE[1])
    draw_title(draw, (int(w * 0.055), int(h * 0.64)), str(game.get("title") or game.get("id")), int(w * 0.72), accent, title_scale)
    label_font = font(max(13, int(18 * title_scale)), bold=True)
    label = (game.get("gameType") or game.get("subject") or "Review").upper()
    draw.text((int(w * 0.055), int(h * 0.07)), label[:42], fill=accent, font=label_font)
    clue = f"{game.get('clueCount') or 0} prompts" if game.get("clueCount") else "review cabinet"
    draw.text((int(w * 0.055), h - int(h * 0.10)), clue.upper(), fill=MUTED, font=label_font)

    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3)).convert("RGB")


def save_webp(image: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=quality, method=6)


def render_cabinet_assets() -> dict:
    CABINET_DIR.mkdir(parents=True, exist_ok=True)
    generated = {}
    cabinet_specs = {
        "arcade-marquee.webp": (1200, 360, "MR. MAC'S REVIEW ARCADE"),
        "crt-bezel.webp": (1200, 760, "SOURCE READY"),
        "coin-slot.webp": (720, 360, "INSERT REVIEW TOKEN"),
        "joystick-panel.webp": (1200, 420, "PRESS START"),
    }
    for name, (w, h, title) in cabinet_specs.items():
        game = {"id": name, "title": title, "course": "All Courses", "gameType": "Cabinet UI"}
        img = render_game_art(game, (w, h), name)
        save_webp(img, CABINET_DIR / name, 78)
        generated[name] = f"assets/cabinet/{name}"
    scanline = CABINET_DIR / "scanline-overlay.svg"
    scanline.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">'
        '<path d="M0 0h8v1H0z" fill="#ffffff" opacity=".10"/>'
        '<path d="M0 4h8v1H0z" fill="#7af0ff" opacity=".06"/>'
        "</svg>\n",
        encoding="utf-8",
    )
    generated["scanline-overlay.svg"] = "assets/cabinet/scanline-overlay.svg"
    return generated


def main() -> int:
    games = json.loads(GAMES_PATH.read_text(encoding="utf-8"))
    manifest: dict[str, object] = {
        "version": "2026-05-12-codex-overhaul",
        "generator": "scripts/generate_arcade_assets.py",
        "dimensions": {
            "thumbnail": THUMB_SIZE,
            "cardArt": CARD_SIZE,
            "marquee": MARQUEE_SIZE,
        },
        "cabinetAssets": render_cabinet_assets(),
        "games": {},
    }

    for game in games:
        game_id = game.get("id")
        if not game_id:
            continue
        category = category_for(game)
        accent, secondary, tertiary = palette_for(game)
        thumb = THUMB_DIR / f"{game_id}.webp"
        card = CARD_DIR / f"{game_id}.webp"
        marquee = MARQUEE_DIR / f"{game_id}.webp"
        save_webp(render_game_art(game, THUMB_SIZE, "thumbnail"), thumb, 76)
        save_webp(render_game_art(game, CARD_SIZE, "card"), card, 78)
        save_webp(render_game_art(game, MARQUEE_SIZE, "marquee"), marquee, 78)
        manifest["games"][game_id] = {
            "title": game.get("title"),
            "course": game.get("course"),
            "gameType": game.get("gameType"),
            "category": category,
            "palette": [accent, secondary, tertiary],
            "thumbnail": f"assets/game-thumbnails/{game_id}.webp",
            "cardArt": f"assets/game-card-art/{game_id}.webp",
            "marquee": f"assets/game-marquees/{game_id}.webp",
            "alt": f"Original 1989 arcade cabinet art for {game.get('title') or game_id}, a {game.get('gameType') or 'review'} game.",
        }

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Generated assets for {len(manifest['games'])} games.")
    print(f"Wrote {MANIFEST_PATH.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
