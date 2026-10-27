"""Make the film's real QR code and prove the torn version scans.
   ~/.venv-qr/bin/python film/qrcode/qr/make_qr.py [--search]
Writes film/qrcode/qr.js (window.QR: the level-H matrix and the two tear polygons the film draws) and the proof in
film/qrcode/out/check/ (torn PNGs, decode results from ZXing-cpp and zbar). The film draws exactly these modules and
polygons, so what it shows is what was decoded here."""
import json, math, random, sys, os
import segno, zxingcpp
from pyzbar import pyzbar
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
CHECK = os.path.join(FILM, 'out', 'check')
os.makedirs(CHECK, exist_ok=True)
TEXT = 'TECH, EXPLAINED'
qr = segno.make(TEXT, error='h', boost_error=False, micro=False)
assert qr.error == 'H', qr.error
N = qr.symbol_size(border=0)[0]
M = [[1 if v else 0 for v in row] for row in qr.matrix]
Q = 4                      # quiet zone in modules; the paper is the symbol plus this margin
BG, PAPER, INK = (21, 19, 27), (241, 233, 216), (33, 29, 38)

def codeword_map():
    """Which codeword each module carries (ISO/IEC 18004 placement: zigzag up and down column pairs from the bottom
    right, skipping function patterns). -1 = function pattern or remainder bit. Codewords 0..ND-1 are data
    (interleaved over the blocks), the rest are Reed-Solomon backup."""
    assert qr.version == 3
    F = [[0] * N for _ in range(N)]
    def box(r0, c0, r1, c1):
        for r in range(max(0, r0), min(N, r1 + 1)):
            for c in range(max(0, c0), min(N, c1 + 1)): F[r][c] = 1
    box(0, 0, 8, 8); box(0, N - 8, 8, N - 1); box(N - 8, 0, N - 1, 8)          # finders, separators, format strips
    box(6, 0, 6, N - 1); box(0, 6, N - 1, 6)                                    # timing lines
    box(20, 20, 24, 24)                                                          # the alignment square (version 3)
    F[4 * 3 + 9][8] = 1                                                          # the dark module
    free = sum(1 for r in range(N) for c in range(N) if not F[r][c]); assert free == 567, free
    CW = [[-1] * N for _ in range(N)]; i = 0; col = N - 1; up = True
    while col > 0:
        if col == 6: col = 5
        rows = range(N - 1, -1, -1) if up else range(N)
        for r in rows:
            for c in (col, col - 1):
                if not F[r][c]:
                    CW[r][c] = i // 8 if i < 70 * 8 else -1; i += 1
        col -= 2; up = not up
    return CW, F
ND = 26     # version 3-H: 2 blocks of 13 data + 22 Reed-Solomon codewords = 70

def jag(p0, p1, n, amp, seed):
    """A torn edge from p0 to p1 in module units: n segments, seeded sideways jitter (zero at the ends)."""
    r = random.Random(seed); pts = []
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    for i in range(n + 1):
        k = i / n; j = 0 if i in (0, n) else (r.random() - .5) * 2 * amp * (1 if i % 2 else .55)
        pts.append([round(p0[0] + dx * k + nx * j, 3), round(p0[1] + dy * k + ny * j, 3)])
    return pts

def tear_br(a, b, seed=11):
    """Bottom-right tear: the edge runs from the paper's right side at row a to its bottom at column b."""
    E = N + Q
    edge = jag([E, a], [b, E], 22, .9, seed)
    return edge + [[E + 1, E + 1]]

def tear_tl(seed=6, c=10.0):
    """The `corners` tear: a bite out of the top-left, through the corner square."""
    s = -Q
    edge = jag([s, c], [c, s], 12, .6, seed)
    return edge + [[s - 1, s - 1]]

def render(tears, px=20, rot=0, blur=0, scale=1.0, pad=3):
    """The paper on the ink stage, torn: torn-off paper shows the dark stage, as in the film."""
    P = N + 2 * Q; W = (P + 2 * pad) * px
    im = Image.new('RGB', (W, W), BG); d = ImageDraw.Draw(im)
    o = (pad + Q) * px
    d.rectangle([pad * px, pad * px, (pad + P) * px - 1, (pad + P) * px - 1], fill=PAPER)
    for y in range(N):
        for x in range(N):
            if M[y][x]: d.rectangle([o + x * px, o + y * px, o + (x + 1) * px - 1, o + (y + 1) * px - 1], fill=INK)
    for poly in tears:
        d.polygon([(o + u * px, o + v * px) for u, v in poly], fill=BG)
    if rot: im = im.rotate(rot, resample=Image.BICUBIC, fillcolor=BG, expand=True)
    if scale != 1: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.BILINEAR)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return im

def decode(im):
    z = [r.text for r in zxingcpp.read_barcodes(im) if r.format == zxingcpp.BarcodeFormat.QRCode]
    b = [r.data.decode('utf-8', 'replace') for r in pyzbar.decode(im)]
    return (z[0] if z else None), (b[0] if b else None)

VARIANTS = [dict(), dict(scale=.5), dict(scale=.35), dict(blur=1.2), dict(rot=4), dict(rot=-7, scale=.6), dict(rot=180)]
def robust(tears):
    res = []
    for v in VARIANTS:
        z, b = decode(render(tears, **v)); res.append((v, z, b))
    ok = all(z == TEXT and b == TEXT for _, z, b in res)
    return ok, res

def lost(tears):
    """Fraction of the symbol's modules whose centre lies in a tear (area of the code that is gone)."""
    im = Image.new('1', (N * 8, N * 8), 0); d = ImageDraw.Draw(im)
    for poly in tears: d.polygon([(u * 8, v * 8) for u, v in poly], fill=1)
    n = sum(1 for y in range(N) for x in range(N) if im.getpixel((x * 8 + 4, y * 8 + 4)))
    return n / (N * N)

if '--search' in sys.argv:
    for a in [22, 20, 18, 16, 14, 13, 12, 11, 10]:
        for b in [22, 20, 18, 16, 14, 13, 12, 11, 10]:
            t = tear_br(a, b); ok, res = robust([t])
            print(f'a={a:>2} b={b:>2} lost={lost([t])*100:4.1f}%  {"OK " if ok else "-- "}', ' '.join(('z' if z == TEXT else '.') + ('b' if bb == TEXT else '.') for _, z, bb in res))
    sys.exit()


# ---------- the greased car-part tag (factory scene): same code, a grease smudge over its middle ----------
TAG_U = 300 / (N + 8)          # film: miniCode(g, 150, 45, 300, MOD) with a 4-module margin
SMUDGE_PX = [(15, 25, 58, 40, -.4), (55, -5, 34, 22, .3), (-30, 50, 26, 18, .1)]   # film px around the code centre
GREASE = (59, 51, 40, round(.78 * 255))
def smudge(scale):
    return [[round(x / TAG_U, 3), round(y / TAG_U, 3), round(rx * scale / TAG_U, 3), round(ry * scale / TAG_U, 3), r] for x, y, rx, ry, r in SMUDGE_PX]
def render_tag(sm, px=10, rot=0, blur=0, scale=1.0):
    P = N + 8; W = (P + 6) * px
    im = Image.new('RGB', (W, W), (241, 233, 216)); d = ImageDraw.Draw(im)
    o = 3 * px; d.rectangle([o, o, o + P * px - 1, o + P * px - 1], fill=(251, 246, 234))
    q = o + 4 * px
    for y in range(N):
        for x in range(N):
            if M[y][x]: d.rectangle([q + x * px, q + y * px, q + (x + 1) * px - 1, q + (y + 1) * px - 1], fill=INK)
    lay = Image.new('RGBA', im.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay); c = q + N * px / 2
    for x, y, rx, ry, r in sm:
        pts = [(c + x * px + math.cos(a) * rx * px * math.cos(r) - math.sin(a) * ry * px * math.sin(r),
                c + y * px + math.cos(a) * rx * px * math.sin(r) + math.sin(a) * ry * px * math.cos(r)) for a in [i * math.pi / 30 for i in range(60)]]
        ld.polygon(pts, fill=GREASE)
    im = Image.alpha_composite(im.convert('RGBA'), lay).convert('RGB')
    if rot: im = im.rotate(rot, resample=Image.BICUBIC, fillcolor=(241, 233, 216), expand=True)
    if scale != 1: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.BILINEAR)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return im
def tag_ok(sm):
    res = [(v, *decode(render_tag(sm, **v))) for v in VARIANTS]
    return all(z == TEXT and b == TEXT for _, z, b in res), res
SMUDGE_SCALE = None
for sc in [1.0, .9, .8, .7, .6, .5, .4]:
    okT, rT = tag_ok(smudge(sc))
    print('smudge scale', sc, 'both decoders, all variants:', okT)
    if okT: SMUDGE_SCALE = sc; break
if SMUDGE_SCALE:                      # one step smaller than the first pass, for margin, and checked again
    SMUDGE_SCALE = round(SMUDGE_SCALE - .1, 2); assert tag_ok(smudge(SMUDGE_SCALE))[0]; print('film smudge scale', SMUDGE_SCALE)
SM = smudge(SMUDGE_SCALE or 1.0)
render_tag(SM).save(os.path.join(CHECK, 'qr-greased-tag.png'))

A, B = float(os.environ.get('TEAR_A', 10)), float(os.environ.get('TEAR_B', 14))
T1 = tear_br(A, B); T2 = tear_tl()
ok1, r1 = robust([T1])
ok2, r2 = robust([T1, T2]); ok3, r3 = robust([T2])
clean = decode(render([]))
render([T1]).save(os.path.join(CHECK, 'qr-torn.png'))
render([T1, T2]).save(os.path.join(CHECK, 'qr-torn-corner.png'))
render([]).save(os.path.join(CHECK, 'qr-clean.png'))
def fmt(res): return [{'variant': v or 'as drawn', 'zxing': z, 'zbar': b} for v, z, b in res]
proof = {
    'text': TEXT, 'version': qr.version, 'error': qr.error, 'mask': qr.mask, 'modules': N,
    'decoders': {'zxing-cpp': zxingcpp.__version__ if hasattr(zxingcpp, '__version__') else 'zxing-cpp (pip)', 'zbar': 'pyzbar ' + __import__('pyzbar').__version__},
    'clean': {'zxing': clean[0], 'zbar': clean[1]},
    'hook_tear': {'rows_cols': [A, B], 'symbol_area_lost_pct': round(lost([T1]) * 100, 1), 'scans_everywhere': ok1, 'results': fmt(r1)},
    'corner_tear_alone': {'symbol_area_lost_pct': round(lost([T2]) * 100, 1), 'scans_anywhere': any(z or b for _, z, b in r3), 'results': fmt(r3)},
    'greased_tag': {'smudge_scale': SMUDGE_SCALE, 'scans_everywhere': SMUDGE_SCALE is not None, 'results': fmt(tag_ok(SM)[1])},
    'hook_plus_corner_tear': {'scans_anywhere': any(z or b for _, z, b in r2), 'results': fmt(r2)},
}
json.dump(proof, open(os.path.join(CHECK, 'qr-proof.json'), 'w'), indent=2, ensure_ascii=False)
open(os.path.join(FILM, 'qr.js'), 'w').write(
    '/* written by qr/make_qr.py: a real level-H QR code (segno) and the tears the film draws; decoded in out/check/qr-proof.json */\n'
    'window.QR = ' + json.dumps({'text': TEXT, 'nd': ND, 'cw': [c for row in codeword_map()[0] for c in row], 'n': N, 'q': Q, 'm': [''.join(map(str, r)) for r in M], 'tear': T1, 'tear2': T2, 'smudge': SM, 'tagok': SMUDGE_SCALE is not None, 'mm': [''.join('1' if v else '0' for v in r) for r in segno.make(TEXT, error='m', boost_error=False, micro=False).matrix],
                                 'lost': round(lost([T1]) * 100, 1), 'scanned': ok1 and not any(z or b for _, z, b in r2)}) + ';\n')
print(json.dumps({k: v for k, v in proof.items() if k not in ('hook_tear', 'corner_tear_alone', 'hook_plus_corner_tear')}, indent=1))
print('hook tear', A, B, 'lost', proof['hook_tear']['symbol_area_lost_pct'], '% scans everywhere:', ok1)
for v, z, b in r1: print('   ', v or 'as drawn', 'zxing:', z, ' zbar:', b)
print('corner tear alone scans anywhere:', proof['corner_tear_alone']['scans_anywhere'], ' hook+corner scans anywhere:', proof['hook_plus_corner_tear']['scans_anywhere'])
