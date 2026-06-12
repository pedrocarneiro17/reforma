from PIL import Image, ImageDraw, ImageFont
import os

W, H = 2400, 3200

BG         = (7,  13,  28)
GRID       = (12, 20,  44)
BORDER     = (22, 32,  64)
PRIMARY    = (200, 212, 228)
SECONDARY  = (80, 104, 138)
ACCENT     = (184, 146, 46)
CBS_COLOR  = (24,  52, 105)
IBS_COLOR  = (20,  70,  90)
IVA_COLOR  = (190, 152,  52)
HAIRLINE   = (16,  26,  54)

FONT_DIR = (
    r"C:\Users\pedro\AppData\Roaming\Claude\local-agent-mode-sessions"
    r"\skills-plugin\5f081b11-da8b-47f9-924a-43ebf8e1dee0"
    r"\0e13407d-6565-420b-bdc5-4b2f8069fd68\skills\canvas-design\canvas-fonts"
)

def F(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    except Exception as e:
        print(f"Font load error {name}: {e}")
        return ImageFont.load_default()

img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# — grid —
for x in range(0, W, 80):
    draw.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 80):
    draw.line([(0, y), (W, y)], fill=GRID, width=1)

# — outer border —
draw.rectangle([80, 80, W-80, H-80], outline=BORDER, width=1)

# — corner registration marks —
def cross(cx, cy, arm=20):
    draw.line([(cx - arm, cy), (cx + arm, cy)], fill=SECONDARY, width=1)
    draw.line([(cx, cy - arm), (cx, cy + arm)], fill=SECONDARY, width=1)
cross(80, 80); cross(W-80, 80); cross(80, H-80); cross(W-80, H-80)

# — fonts —
fmono_xs   = F("IBMPlexMono-Regular.ttf",  18)
fmono_sm   = F("IBMPlexMono-Regular.ttf",  22)
fmono_bold = F("IBMPlexMono-Bold.ttf",     28)
fsans_sm   = F("InstrumentSans-Regular.ttf", 26)
fsans_bold = F("InstrumentSans-Bold.ttf",   36)
fbig       = F("BigShoulders-Bold.ttf",    600)
fbig_pct   = F("BigShoulders-Bold.ttf",    220)

# — header —
HY = 160
draw.text((160, HY),      "REFORMA TRIBUTÁRIA",              font=fmono_sm,   fill=SECONDARY)
draw.text((160, HY + 38), "SIMULADOR DE IMPACTO FISCAL",     font=fmono_xs,   fill=(50, 72, 105))
draw.text((W - 160, HY),  "2026 — 2033",                     font=fmono_sm,   fill=SECONDARY, anchor="ra")

RULE0 = 280
draw.line([(160, RULE0), (W - 160, RULE0)], fill=BORDER, width=1)

# ——— converging flow bars ———
FT = 340        # flow top y
FC = 1050       # convergence y

# CBS polygon (left bar tapering right-inward)
cbs_poly = [
    (160,  FT),
    (1060, FT),
    (1095, FC),
    (740,  FC),
]
draw.polygon(cbs_poly, fill=CBS_COLOR)

# IBS polygon (right bar tapering left-inward)
ibs_poly = [
    (1340, FT),
    (2240, FT),
    (1660, FC),
    (1305, FC),
]
draw.polygon(ibs_poly, fill=IBS_COLOR)

# inner edge highlights
draw.line([(1060, FT), (1095, FC)], fill=(35, 75, 145), width=1)
draw.line([(1340, FT), (1305, FC)], fill=(30, 100, 130), width=1)

# CBS label
draw.text((530,  FT + 80), "CBS",                               font=fmono_bold, fill=(48, 88, 165), anchor="mm")
draw.text((530,  FT + 118), "Contribuição sobre Bens e Serviços", font=fmono_xs, fill=(35, 65, 130), anchor="mm")
draw.text((530,  FT + 148), "FEDERAL",                          font=fmono_xs,  fill=(28, 52, 112),  anchor="mm")

# IBS label
draw.text((1800, FT + 80), "IBS",                               font=fmono_bold, fill=(36, 110, 140), anchor="mm")
draw.text((1800, FT + 118), "Imposto sobre Bens e Serviços",    font=fmono_xs, fill=(26, 85, 115), anchor="mm")
draw.text((1800, FT + 148), "ESTADUAL · MUNICIPAL",             font=fmono_xs,  fill=(22, 70, 100), anchor="mm")

# funnel continuation: y=FC → y=FN (narrow channel)
FN = 1190
cbs_funnel = [(740, FC), (1095, FC), (1088, FN), (958, FN)]
ibs_funnel = [(1305, FC), (1660, FC), (1442, FN), (1312, FN)]
draw.polygon(cbs_funnel, fill=CBS_COLOR)
draw.polygon(ibs_funnel, fill=IBS_COLOR)

# gap fill between funnel halves → gold convergence
gap_fill = [(1095, FC), (1305, FC), (1312, FN), (1088, FN)]
draw.polygon(gap_fill, fill=IVA_COLOR)

# convergence rule line
draw.line([(160, FC), (W - 160, FC)], fill=HAIRLINE, width=1)

# IVA DUAL label
draw.text((W // 2, FC + 68), "IVA  DUAL", font=fsans_bold, fill=ACCENT, anchor="mm")

# merged bar FN → number top
MBT = FN; MBB = 1390
draw.polygon([(958, MBT), (1442, MBT), (1442, MBB), (958, MBB)], fill=IVA_COLOR)

# ——— central number "26,5" ———
NUM_Y = 1360
bbox  = draw.textbbox((0, 0), "26,5", font=fbig)
TW    = bbox[2] - bbox[0]
TH    = bbox[3] - bbox[1]
TX    = (W - TW) // 2

# shadow
draw.text((TX + 4, NUM_Y + 4), "26,5", font=fbig, fill=(16, 26, 52))
draw.text((TX,     NUM_Y),     "26,5", font=fbig, fill=PRIMARY)

# percent sign bottom-aligned
pct_bbox = draw.textbbox((0, 0), "%", font=fbig_pct)
PW = pct_bbox[2] - pct_bbox[0]
PH = pct_bbox[3] - pct_bbox[1]
PX = (W - PW) // 2
PY = NUM_Y + TH - PH + 50
draw.text((PX, PY), "%", font=fbig_pct, fill=ACCENT)

# ——— rule + sublabel below number ———
RULE1 = NUM_Y + TH + 140
draw.line([(160, RULE1), (W - 160, RULE1)], fill=BORDER, width=2)
draw.text((W // 2, RULE1 + 32), "ALÍQUOTA DE REFERÊNCIA  ·  LC 214 / 2025",
          font=fmono_sm, fill=SECONDARY, anchor="mm")

# ——— ledger zone ———
LS = RULE1 + 90
LE = H - 200
rows = [
    ("MEI",                      "SIMPLES NACIONAL"),
    ("MICROEMPRESA — FAIXA I",   "SIMPLES NACIONAL"),
    ("MICROEMPRESA — FAIXA II",  "SIMPLES NACIONAL"),
    ("EMPRESA PEQUENO PORTE",    "SIMPLES NACIONAL"),
    ("COMÉRCIO",                 "LUCRO PRESUMIDO"),
    ("SERVIÇOS",                 "LUCRO PRESUMIDO"),
    ("INDÚSTRIA",                "LUCRO PRESUMIDO"),
    ("OPERAÇÕES PADRÃO",         "LUCRO REAL"),
    ("EXPORTAÇÕES",              "ALÍQUOTA ZERO"),
    ("PROFISSIONAL LIBERAL",     "REGIME ESPECIAL"),
    ("IMÓVEIS RESIDENCIAIS",     "REDUÇÃO 60%"),
    ("TRANSPORTE COLETIVO",      "REDUÇÃO 100%"),
    ("SAÚDE",                    "REDUÇÃO 60%"),
    ("EDUCAÇÃO",                 "REDUÇÃO 60%"),
    ("ALIMENTOS — CESTA BÁSICA", "ISENÇÃO"),
    ("CRÉDITO FISCAL",           "CREDITAMENTO IVA"),
]
N = len(rows)
GAP = (LE - LS) // N
for i, (col_a, col_b) in enumerate(rows):
    y = LS + i * GAP
    lc = (28, 42, 78) if i % 4 == 0 else HAIRLINE
    tc = (72, 96, 132) if i % 4 == 0 else (48, 68, 100)
    draw.line([(160, y), (W - 160, y)], fill=lc, width=1)
    draw.text((180, y + 7), col_a, font=fmono_xs, fill=tc)
    draw.text((900, y + 7), col_b, font=fmono_xs, fill=(tc[0] - 15, tc[1] - 15, tc[2]))

draw.line([(160, LE), (W - 160, LE)], fill=BORDER, width=1)

# ——— footer ———
FY = H - 150
draw.text((160,   FY), "REFORMACALC — SIMULADOR DE REFORMA TRIBUTÁRIA", font=fmono_xs, fill=SECONDARY)
draw.text((W-160, FY), "LC 214 · 2025", font=fmono_xs, fill=SECONDARY, anchor="ra")
draw.text((W//2,  FY), "CBS + IBS  →  IVA DUAL", font=fmono_xs, fill=(52, 75, 110), anchor="ma")

# — save —
out = r"C:\Users\pedro\OneDrive\Área de Trabalho\reforma\reforma-design-canvas.png"
img.save(out, dpi=(300, 300))
print(f"Saved: {out}  |  {W}x{H}px")
