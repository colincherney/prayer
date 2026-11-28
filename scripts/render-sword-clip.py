"""Renders the Sword of the Spirit intro clip (1080x2338, 30fps, ~29s, no audio) to match the other event clips.

usage: python scripts/render-sword-clip.py <repo root> preview <t1> <t2> ...   -> PNG stills in ./frames
       python scripts/render-sword-clip.py <repo root> render <out.mp4>
"""
import math
import random
import subprocess
import sys
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = sys.argv[1]
W, H, FPS, DUR = 1080, 2338, 30, 29.0
ART = os.path.join(ROOT, 'assets/images/gladi')
FONTS = os.path.join(ROOT, 'node_modules/@expo-google-fonts/playfair-display')

NAVY = (10, 31, 44)
CREAM = (230, 248, 255)
ICE = (191, 234, 246)
GOLD = (216, 180, 90)
TEAL = (127, 221, 242)


def font(weight, size):
    files = {'regular': '400Regular/PlayfairDisplay_400Regular.ttf', 'semi': '600SemiBold/PlayfairDisplay_600SemiBold.ttf',
             'bold': '700Bold/PlayfairDisplay_700Bold.ttf', 'italic': '400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf'}
    path = os.path.join(FONTS, files[weight])
    if not os.path.exists(path):
        path = os.path.join(FONTS, files['regular'])
    return ImageFont.truetype(path, size)


# ---------- easing ----------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ramp(t, a, b):
    """0 before a, 1 after b, eased out between."""
    return ease_out((t - a) / (b - a))


def window(t, a_in, b_in, a_out, b_out):
    return ramp(t, a_in, b_in) * (1 - smooth((t - a_out) / (b_out - a_out)))


# ---------- assets ----------
wall = Image.open(os.path.join(ART, 'sword-wallpaper.jpg')).convert('RGB')
scale = max(W / wall.width, H / wall.height)
wall = wall.resize((round(wall.width * scale * 1.12), round(wall.height * scale * 1.12)), Image.LANCZOS)


def load_pet(name, height):
    im = Image.open(os.path.join(ART, name)).convert('RGBA')
    w = round(im.width * height / im.height)
    return im.resize((w, height), Image.LANCZOS)


shard = load_pet('gladi-1-shard.png', 880)
gladius = load_pet('gladi-3-gladius.png', 1420)


def statue(im):
    """Grey stone version, alpha kept."""
    grey = im.convert('L').convert('RGB')
    grey = Image.blend(grey, Image.new('RGB', grey.size, (150, 170, 182)), 0.35)
    out = grey.convert('RGBA')
    out.putalpha(im.getchannel('A'))
    return out


gladius_stone = statue(gladius)


def glow_layer(size, color, radius):
    g = Image.new('RGBA', (size, size), color + (0,))
    d = ImageDraw.Draw(g)
    r = size * 0.28
    d.ellipse((size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r), fill=color + (200,))
    return g.filter(ImageFilter.GaussianBlur(radius))


glow = glow_layer(1100, TEAL, 130)


def with_alpha(im, k):
    if k >= 0.999:
        return im
    out = im.copy()
    out.putalpha(im.getchannel('A').point(lambda v: int(v * k)))
    return out


def text_block(lines, fnt, fill, spacing, width=W):
    """Centred lines rendered once into a transparent layer (height fits the text)."""
    heights = [fnt.getbbox(l)[3] - fnt.getbbox(l)[1] for l in lines]
    asc = max(fnt.getbbox(l)[3] for l in lines)
    total = len(lines) * asc + (len(lines) - 1) * spacing + 20
    layer = Image.new('RGBA', (width, total), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    y = 0
    for l in lines:
        w = d.textlength(l, font=fnt)
        d.text(((width - w) / 2, y), l, font=fnt, fill=fill)
        y += asc + spacing
    return layer


def spaced(s, n=4):
    return (' ' * 0).join(s)  # Playfair caps read fine; tracking handled by font size


def tracked(text, fnt, fill, tracking):
    """One line of letter-spaced caps."""
    widths = [fnt.getlength(c) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    layer = Image.new('RGBA', (W, fnt.size + 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x = (W - total) / 2
    for c, w in zip(text, widths):
        d.text((x, 0), c, font=fnt, fill=fill)
        x += w + tracking
    return layer


verse_font = font('regular', 52)
ref_font = font('semi', 26)
verse1 = text_block(['Finally, my brethren, be strong', 'in the Lord, and in the', 'power of his might.'], verse_font, CREAM, 22)
ref1 = tracked('EPHESIANS 6:10', ref_font, GOLD, 6)
verse2 = text_block(['Take the helmet of salvation,', 'and the sword of the Spirit,', 'which is the word of God.'], verse_font, CREAM, 22)
ref2 = tracked('EPHESIANS 6:17', ref_font, GOLD, 6)

kicker = tracked('THE SWORD OF THE SPIRIT · JUN 1 TO JUN 30', font('semi', 31), ICE, 5)
title = text_block(['The Sword of', 'the Spirit'], font('bold', 118), CREAM, 18)
subtitle = text_block(['Complete the June challenges', 'to forge Gladius.'], font('regular', 46), ICE + (235,), 16)


def button():
    bw, bh = 900, 150
    layer = Image.new('RGBA', (W, bh + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0 = (W - bw) // 2
    d.rounded_rectangle((x0, 10, x0 + bw, 10 + bh), radius=bh // 2, fill=GOLD)
    f = font('bold', 46)
    label = 'Take up the sword'
    tw = d.textlength(label, font=f)
    bb = f.getbbox(label)
    d.text(((W - tw) / 2, 10 + (bh - (bb[3] + bb[1])) / 2), label, font=f, fill=NAVY)
    return layer


btn = button()

# top-down shade under the title card
shade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shade)
for y in range(0, 1250):
    a = int(215 * (1 - y / 1250) ** 1.4)
    sd.line((0, y, W, y), fill=NAVY + (a,))
for y in range(H - 600, H):
    a = int(150 * ((y - (H - 600)) / 600) ** 1.8)
    sd.line((0, y, W, y), fill=NAVY + (a,))

# ---------- particles: small motes of light rising ----------
random.seed(617)
motes = [dict(x=random.uniform(0, W), y0=random.uniform(0, H), r=random.uniform(2.5, 7), speed=random.uniform(28, 80),
              sway=random.uniform(8, 26), phase=random.uniform(0, 6.28), tw=random.uniform(0.6, 1.6)) for _ in range(70)]


def draw_motes(frame, t, k):
    if k <= 0:
        return
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for m in motes:
        y = (m['y0'] - m['speed'] * t) % (H + 40) - 20
        x = m['x'] + math.sin(t * 0.7 + m['phase']) * m['sway']
        a = int(255 * k * (0.45 + 0.55 * (0.5 + 0.5 * math.sin(t * m['tw'] * 2 + m['phase']))))
        r = m['r']
        d.ellipse((x - r * 2.2, y - r * 2.2, x + r * 2.2, y + r * 2.2), fill=TEAL + (a // 6,))
        d.ellipse((x - r, y - r, x + r, y + r), fill=CREAM + (a,))
    frame.alpha_composite(layer)


def paste(frame, im, cx, bottom, k):
    if k <= 0.003:
        return
    frame.alpha_composite(with_alpha(im, k), (round(cx - im.width / 2), round(bottom - im.height)))


# ---------- one frame ----------
FLASH = 13.0


def render(t):
    # Background: slow push-in all the way through; dim until the flash, then the sword room lights up.
    z = 1.12 - 0.12 * smooth(t / DUR)
    # The wallpaper was loaded 1.12x larger than "cover"; a window of cover/z is cropped and scaled to the frame.
    win_w = (wall.width / 1.12) / z
    win_h = win_w * H / W
    x0 = (wall.width - win_w) / 2
    y0 = (wall.height - win_h) / 2 - 40 * (1 - smooth(t / DUR))
    bg = wall.transform((W, H), Image.EXTENT, (x0, y0, x0 + win_w, y0 + win_h), Image.BILINEAR).convert('RGBA')

    dim = 0.48 + 0.34 * ramp(t, FLASH, FLASH + 1.6)
    dim *= ramp(t, 0.0, 1.8)
    frame = Image.blend(Image.new('RGBA', (W, H), NAVY + (255,)), bg, dim)

    draw_motes(frame, t, ramp(t, 0.6, 2.6))

    # Gladius: a grey statue rising out of the dark, then alive after the flash.
    g_in = ramp(t, 4.4, 6.6)
    g_live = ramp(t, FLASH - 0.05, FLASH + 0.9)
    bob = math.sin(t * 1.6) * 10 * g_live
    g_bottom = 2010 + 70 * (1 - g_in) + bob
    if g_live > 0:
        gk = g_live * (0.75 + 0.25 * (0.5 + 0.5 * math.sin(t * 2.1)))
        frame.alpha_composite(with_alpha(glow, gk), (round(620 - glow.width / 2), round(g_bottom - 760 - glow.height / 2)))
    paste(frame, gladius_stone, 620, g_bottom, g_in * 0.82 * (1 - g_live))
    paste(frame, gladius, 620, g_bottom, g_live)

    # Shard: floats in from the right and settles at the left, bobbing.
    s_in = ramp(t, 2.0, 3.6)
    s_x = 255 + 160 * (1 - s_in)
    s_bottom = 2080 + math.sin(t * 2.3 + 1) * 12
    paste(frame, shard, s_x, s_bottom, s_in)

    v1 = window(t, 7.0, 8.2, 11.6, 12.5)
    v2 = window(t, 15.2, 16.4, 20.4, 21.3)

    # The flash: two flickers of lightning, then the burst that wakes him.
    flash = 0.22 * math.exp(-((t - 11.95) / 0.06) ** 2) + 0.3 * math.exp(-((t - 12.35) / 0.07) ** 2)
    if t >= FLASH - 0.12:
        flash += 0.92 * math.exp(-max(0.0, t - FLASH) / 0.38) * ramp(t, FLASH - 0.12, FLASH)
    if flash > 0.004:
        frame = Image.blend(frame, Image.new('RGBA', (W, H), (225, 247, 255, 255)), clamp(flash))

    # Title card.
    card = ramp(t, 21.6, 23.0)
    frame.alpha_composite(with_alpha(shade, max(card, 0.85 * v1, 0.85 * v2)))
    paste(frame, verse1, W / 2, 560, v1)
    paste(frame, ref1, W / 2, 640, v1)
    paste(frame, verse2, W / 2, 560, v2)
    paste(frame, ref2, W / 2, 640, v2)
    paste(frame, kicker, W / 2, 340 + 20 * (1 - ramp(t, 21.9, 23.1)), ramp(t, 21.9, 23.1))
    paste(frame, title, W / 2, 640 + 26 * (1 - ramp(t, 22.2, 23.5)), ramp(t, 22.2, 23.5))
    paste(frame, subtitle, W / 2, 800 + 20 * (1 - ramp(t, 22.7, 23.9)), ramp(t, 22.7, 23.9))
    paste(frame, btn, W / 2, H - 110 + 24 * (1 - ramp(t, 23.6, 24.6)), ramp(t, 23.6, 24.6))

    # Fade up from black at the very start.
    if t < 0.8:
        frame = Image.blend(Image.new('RGBA', (W, H), (4, 12, 18, 255)), frame, ease_out(t / 0.8))
    return frame.convert('RGB')


def main():
    mode = sys.argv[2]
    if mode == 'preview':
        out = sys.argv[3]
        os.makedirs(out, exist_ok=True)
        ims = [render(float(t)).resize((360, 779)) for t in sys.argv[4:]]
        sheet = Image.new('RGB', (360 * len(ims), 779))
        for i, im in enumerate(ims):
            sheet.paste(im, (360 * i, 0))
        sheet.save(os.path.join(out, 'sword-preview.jpg'), quality=88)
        return
    out = sys.argv[3]
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
                          stdin=subprocess.PIPE)
    n = int(DUR * FPS)
    for i in range(n):
        ff.stdin.write(render(i / FPS).tobytes())
        if i % 60 == 0:
            print(f'{i}/{n}', flush=True)
    ff.stdin.close()
    ff.wait()
    print('done', out)


main()
