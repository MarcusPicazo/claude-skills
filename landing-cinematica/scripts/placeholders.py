#!/usr/bin/env python3
"""Genera fotogramas de placeholder para el estilo recorrido (o cualquier imagen faltante).

Uso:
  python3 placeholders.py <carpeta_destino> "Llegada" "El grano" "El tostado" ...
  python3 placeholders.py assets/img "Parada 1" "Parada 2" --color "#c79a6e" --bg "#f2eee8"

Crea parada-N-1920.{webp,jpg} y parada-N-960.{webp,jpg} (16:9). Cada uno lleva un "sujeto"
distinto en el TERCIO DERECHO (deja vacío el lado del texto) y la etiqueta PLACEHOLDER dentro
de la zona segura central, para que no la recorte object-fit:cover en un celular vertical.
Requiere Pillow (pip install pillow).
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont

def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('dest')
    ap.add_argument('names', nargs='+')
    ap.add_argument('--color', default='#c79a6e', help='color del sujeto (acento)')
    ap.add_argument('--bg', default='#f2eee8', help='color de fondo de la página')
    a = ap.parse_args()
    os.makedirs(a.dest, exist_ok=True)
    bg, col = hex2rgb(a.bg), hex2rgb(a.color)
    dark = tuple(int(c * .35) for c in col)
    try:
        font = ImageFont.truetype('DejaVuSans-Bold.ttf', 44)
    except OSError:
        font = ImageFont.load_default()
    W, H = 1920, 1080
    for n, name in enumerate(a.names, 1):
        im = Image.new('RGB', (W, H), bg)
        d = ImageDraw.Draw(im)
        for y in range(H):  # degradado hacia el color del sujeto
            t = y / H * .35
            d.line([(0, y), (W, y)], fill=tuple(int(bg[k] * (1 - t) + col[k] * t) for k in range(3)))
        cx, cy = int(W * .68), int(H * .52)
        kind = (n - 1) % 4  # formas distintas para que se note el cambio de parada
        if kind == 0:
            d.rectangle([cx - 300, cy - 300, cx + 300, cy + 360], fill=col)
            d.rectangle([cx - 80, cy + 60, cx + 80, cy + 360], fill=dark)
        elif kind == 1:
            d.ellipse([cx - 320, cy - 320, cx + 320, cy + 320], fill=col)
            d.ellipse([cx - 180, cy - 180, cx + 180, cy + 180], fill=dark)
        elif kind == 2:
            for k in range(4):
                d.rounded_rectangle([cx - 400 + k * 210, cy - 150, cx - 260 + k * 210, cy + 90], 24, fill=col)
            d.rectangle([cx - 480, cy + 90, cx + 480, cy + 200], fill=dark)
        else:
            d.pieslice([cx - 280, cy - 400, cx + 280, cy + 160], 180, 360, fill=col)
            d.rectangle([cx - 280, cy - 120, cx + 280, cy + 400], fill=col)
            d.rectangle([cx - 120, cy + 60, cx + 120, cy + 400], fill=dark)
        label = f'PLACEHOLDER {n}: {name}'
        tw = d.textlength(label, font=font)
        d.text((cx - tw / 2, cy - 420), label, font=font, fill=dark)
        for w in (1920, 960):
            out = im.resize((w, int(H * w / W)), Image.LANCZOS)
            base = os.path.join(a.dest, f'parada-{n}-{w}')
            out.save(base + '.webp', quality=78)
            out.save(base + '.jpg', quality=80, optimize=True, progressive=True)
        print(f'parada-{n}: {name}')

if __name__ == '__main__':
    main()
