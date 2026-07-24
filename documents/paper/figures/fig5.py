"""Figure 5 — Findings by cycle and class (OmniPizza paper).

Renders from documents/paper/findings.csv. NOTHING is hardcoded from memory:
counts, rates, hatching, annotations and releases are all derived from the CSV
and cross-checked with assertions that fail loudly on any mismatch.
"""
import csv
import json
import math
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from matplotlib.lines import Line2D
import matplotlib.patheffects as pe

CSV_PATH = r"C:/Users/gilsa/Documents/Repos/OmniPizza/documents/paper/findings.csv"
OUT_DIR = r"C:/Users/gilsa/Documents/Repos/OmniPizza/documents/paper/figures"
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------------- data ------
with open(CSV_PATH, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

DATES = ["2026-07-16", "2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21", "2026-07-22"]
SHORT = [d[5:] for d in DATES]  # 07-16 ... 07-22

# Fixed 8-class order (legend + stacking order, bottom -> top)
CLASSES = [
    "real-bug", "harness-artifact", "shared-fixture", "infrastructure",
    "by-design", "third-party", "not-reproducible", "exonerated-unattributed",
]

# --- group findings per cycle date -------------------------------------------
by_date = {d: [] for d in DATES}
for r in rows:
    d = r["report_date"]
    assert d in by_date, f"unexpected report_date {d!r}"
    assert r["final_class"] in CLASSES, f"unknown final_class {r['final_class']!r} ({r['id']})"
    by_date[d].append(r)
for d in by_date:
    by_date[d].sort(key=lambda r: r["id"])

totals = [len(by_date[d]) for d in DATES]
assert sum(totals) == 19, f"expected 19 findings, got {sum(totals)}"
assert totals == [8, 3, 0, 2, 3, 3], f"per-cycle totals mismatch: {totals}"

n_app_bug = sum(1 for r in rows if r["final_verdict"] == "app_bug")
assert n_app_bug == 11, f"expected 11 final app_bug, got {n_app_bug}"
# real-bug class must coincide with final app_bug verdicts
n_class_rb = sum(1 for r in rows if r["final_class"] == "real-bug")
assert n_class_rb == n_app_bug, f"real-bug class ({n_class_rb}) != app_bug verdicts ({n_app_bug})"

# --- per-cycle class counts ---------------------------------------------------
class_counts = {d: {c: 0 for c in CLASSES} for d in DATES}
for d in DATES:
    for r in by_date[d]:
        class_counts[d][r["final_class"]] += 1

# --- real-bug rates (FINAL verdicts); None where no findings ------------------
final_rates = []
for d, t in zip(DATES, totals):
    if t == 0:
        final_rates.append(None)
    else:
        final_rates.append(sum(1 for r in by_date[d] if r["final_verdict"] == "app_bug") / t)
exp = [0.75, 1 / 3, None, 0.50, 1.00, 0.00]
for got, want, d in zip(final_rates, exp, DATES):
    if want is None:
        assert got is None, f"{d}: expected empty cycle"
    else:
        assert got is not None and math.isclose(got, want, abs_tol=1e-9), \
            f"{d}: final rate {got} != {want}"

# --- initial-verdict rate for the reversed cycle (07-21) ----------------------
d21 = "2026-07-21"
init_21 = sum(1 for r in by_date[d21] if r["initial_verdict"] == "app_bug") / len(by_date[d21])
assert math.isclose(init_21, 2 / 3, abs_tol=1e-9), f"07-21 initial rate {init_21} != 2/3"

# --- retractions / reversal ---------------------------------------------------
retr = [r for r in rows if r["retraction"] == "true"]
assert sorted(r["id"] for r in retr) == ["F09", "F10"], f"retractions: {[r['id'] for r in retr]}"
assert all(r["report_date"] == "2026-07-18" for r in retr)
rev = [r for r in rows if r["reversal"] == "true"]
assert [r["id"] for r in rev] == ["F15"], f"reversals: {[r['id'] for r in rev]}"
assert rev[0]["report_date"] == d21

# --- instrumentation-mediated hatching ----------------------------------------
dense_ids = sorted(r["id"] for r in rows if r["instrumentation_mediated"] == "true")
cand_ids = sorted(r["id"] for r in rows if r["instrumentation_mediated"] == "candidate")
assert dense_ids == ["F17", "F18"], f"dense hatch ids: {dense_ids}"
assert cand_ids == ["F09"], f"candidate hatch ids: {cand_ids}"

# --- releases per cycle -------------------------------------------------------
releases = []
for d in DATES:
    rels = {r["release"] for r in by_date[d] if r["release"]}
    assert len(rels) <= 1, f"{d}: inconsistent releases {rels}"
    releases.append(rels.pop() if rels else "—")  # em dash for none
assert releases == ["v1.1.4", "v1.1.5", "—", "v1.1.7", "v1.1.8", "—"], releases

# ------------------------------------------------------- palette (computed) --
# Grayscale-safe: muted hues on strictly increasing lightness, one per class in
# the fixed order above. Separation is COMPUTED and asserted, not eyeballed.
PALETTE = {
    "real-bug":                 "#7a1f1f",
    "harness-artifact":         "#2e5687",
    "shared-fixture":           "#4b7d6a",
    "infrastructure":           "#a17c42",
    "by-design":                "#8fa3c4",
    "third-party":              "#d0b273",
    "not-reproducible":         "#c9cfd6",
    "exonerated-unattributed":  "#ece5d8",
}

def luma(hexcol):
    r, g, b = (int(hexcol[i:i + 2], 16) for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b

lumas = [luma(PALETTE[c]) for c in CLASSES]
assert all(b - a >= 15 for a, b in zip(lumas, lumas[1:])), \
    f"palette not grayscale-safe (luma steps): {[round(v,1) for v in lumas]}"

HATCH_DENSE, HATCH_LIGHT = "//////", "//"
HATCH_COLOR = "#2b2b2b"          # on light fills / legend swatches
HATCH_COLOR_ON_DARK = "#ffffff"  # dark fills need a light hatch to stay visible

def hatch_color_for(cls):
    return HATCH_COLOR_ON_DARK if luma(PALETTE[cls]) < 140 else HATCH_COLOR
LINE_COLOR = "#0b0b0b"
MUTED = "#52514e"
GRID = "#e1e0d9"

# ------------------------------------------------------------------- plot ---
plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["DejaVu Sans"],
    "font.size": 8,
    "hatch.linewidth": 0.6,
    "axes.linewidth": 0.7,
    "svg.fonttype": "path",
})

fig, ax = plt.subplots(figsize=(6.3, 4.6))
fig.patch.set_facecolor("white")
ax.set_facecolor("white")

X = list(range(len(DATES)))
BAR_W = 0.6

# left-axis geometry; right axis mapped so rate 1.0 == 8.0 findings
L_MAX = 9.0
R_MAX = L_MAX / 8.0  # 1.125

# --- stacked bars: one block per finding so individual blocks can be hatched --
for xi, d in zip(X, DATES):
    bottom = 0.0
    for cls in CLASSES:
        members = [r for r in by_date[d] if r["final_class"] == cls]
        for r in members:
            ax.bar(xi, 1.0, BAR_W, bottom=bottom, facecolor=PALETTE[cls],
                   edgecolor="white", linewidth=0.8, zorder=2)
            im = r["instrumentation_mediated"]
            if im in ("true", "candidate"):
                ax.bar(xi, 1.0, BAR_W, bottom=bottom, facecolor="none",
                       edgecolor=hatch_color_for(cls), linewidth=0.0,
                       hatch=HATCH_DENSE if im == "true" else HATCH_LIGHT,
                       zorder=2.1)
            bottom += 1.0
    if bottom > 0:  # total-count label above each non-empty bar
        ax.text(xi, bottom + 0.16, str(int(bottom)), ha="center", va="bottom",
                fontsize=7, color=MUTED, zorder=4)

# --- grid / axes styling ------------------------------------------------------
ax.set_xlim(-0.55, len(DATES) - 0.45)
ax.set_ylim(0, L_MAX)
ax.set_yticks([0, 2, 4, 6, 8])
ax.yaxis.grid(True, color=GRID, linewidth=0.6, zorder=0)
ax.set_axisbelow(True)
ax.set_ylabel("findings per cycle", fontsize=8)
ax.spines["top"].set_visible(False)
ax.tick_params(axis="both", labelsize=7.5, length=3, color="#c3c2b7")

ax.set_xticks(X)
ax.set_xticklabels([f"{s}\n{rel}" for s, rel in zip(SHORT, releases)], fontsize=7.5)
ax.set_xlabel("triage cycle (2026) and shipped release", fontsize=8)

# --- right axis: real-bug rate line -------------------------------------------
ax2 = ax.twinx()
ax2.set_ylim(0, R_MAX)
ax2.set_yticks([0, 0.25, 0.50, 0.75, 1.00])
ax2.set_yticklabels(["0", "0.25", "0.50", "0.75", "1.00"], fontsize=7.5)
ax2.set_ylabel("real-bug rate (final verdicts)", fontsize=8)
ax2.spines["top"].set_visible(False)
ax2.tick_params(axis="y", length=3, color="#c3c2b7")

halo = [pe.withStroke(linewidth=2.6, foreground="white")]
xs = [xi for xi, v in zip(X, final_rates) if v is not None]
ys = [v for v in final_rates if v is not None]
# gap at the empty 07-19 cycle: NaN breaks the line
line_y = [v if v is not None else float("nan") for v in final_rates]
ax2.plot(X, line_y, color=LINE_COLOR, linewidth=1.8, zorder=5,
         path_effects=halo, solid_capstyle="round")
ax2.plot(xs, ys, linestyle="none", marker="o", markersize=5.5,
         markerfacecolor=LINE_COLOR, markeredgecolor="white",
         markeredgewidth=0.9, zorder=6)

# value labels on the rate markers
rate_lbl = [pe.withStroke(linewidth=2.2, foreground="white")]
for xi, v in zip(X, final_rates):
    if v is None:
        continue
    ax2.annotate(f"{v:.2f}", (xi, v), textcoords="offset points",
                 xytext=(8, 6), fontsize=6.8, color=LINE_COLOR,
                 path_effects=rate_lbl, zorder=7)

# hollow marker: initial-verdict rate at the reversed cycle (07-21)
xi21 = DATES.index(d21)
ax2.plot([xi21], [init_21], linestyle="none", marker="o", markersize=5.5,
         markerfacecolor="white", markeredgecolor=LINE_COLOR,
         markeredgewidth=1.1, zorder=6)
ax2.annotate(f"initial verdicts ({init_21:.2f})", (xi21, init_21),
             textcoords="offset points", xytext=(-4, -14), ha="center",
             fontsize=6.8, color=MUTED, path_effects=rate_lbl, zorder=7)

# --- 07-19 empty slot ---------------------------------------------------------
xi19 = DATES.index("2026-07-19")
ax.text(xi19, 0.18, "re-verification", rotation=90, ha="center", va="bottom",
        fontsize=6.8, style="italic", color=MUTED, zorder=4)

# --- event annotations --------------------------------------------------------
ann_fx = dict(fontsize=6.8, color=LINE_COLOR, ha="center", zorder=7,
              path_effects=rate_lbl)
arrow = dict(arrowstyle="-|>", color=MUTED, linewidth=0.8,
             shrinkA=2, shrinkB=2)

# 2 root-cause retractions (F09, F10) filed 07-18, resolved 07-19
n_retr = len(retr)
ax.annotate(f"{n_retr} root-cause retractions\n(resolved 07-19)",
            xy=(1.18, 2.5), xytext=(2.05, 5.1),
            arrowprops=dict(**arrow, connectionstyle="arc3,rad=-0.15"),
            **ann_fx)

# verdict reversal (F15) — the middle real-bug block of the 07-21 stack
f15_idx = [r["id"] for r in by_date[d21] if r["final_class"] == "real-bug"].index("F15")
ax.annotate("verdict reversal\n(F15, corrected 07-22)",
            xy=(xi21 + 0.30, f15_idx + 0.5), xytext=(4.85, 6.9),
            arrowprops=dict(**arrow, connectionstyle="arc3,rad=0.2"),
            **ann_fx)

# --- legend -------------------------------------------------------------------
class_handles = [Patch(facecolor=PALETTE[c], edgecolor="white", linewidth=0.6,
                       label=c) for c in CLASSES]
extra_handles = [
    Line2D([], [], color=LINE_COLOR, linewidth=1.8, marker="o", markersize=5,
           markerfacecolor=LINE_COLOR, markeredgecolor="white",
           label="real-bug rate (final)"),
    Line2D([], [], linestyle="none", marker="o", markersize=5,
           markerfacecolor="white", markeredgecolor=LINE_COLOR,
           markeredgewidth=1.1, label="initial verdicts"),
    Patch(facecolor="white", edgecolor=HATCH_COLOR, linewidth=0.5,
          hatch=HATCH_DENSE, label="instrumentation-mediated"),
    Patch(facecolor="white", edgecolor=HATCH_COLOR, linewidth=0.5,
          hatch=HATCH_LIGHT, label="instrumentation candidate"),
]
# column-major fill with ncol=4 -> col1: first 3 handles, etc.
handles = (class_handles[0:3] + class_handles[3:6]
           + class_handles[6:8] + [extra_handles[0]] + extra_handles[1:])
leg = ax.legend(handles=handles, ncol=4, loc="lower center",
                bbox_to_anchor=(0.5, 1.01), frameon=False, fontsize=6.6,
                handlelength=1.4, handleheight=1.0, columnspacing=1.1,
                handletextpad=0.5, borderaxespad=0.0)

fig.subplots_adjust(left=0.075, right=0.915, top=0.855, bottom=0.115)

png = os.path.join(OUT_DIR, "fig5-findings-by-cycle.png")
svg = os.path.join(OUT_DIR, "fig5-findings-by-cycle.svg")
fig.savefig(png, dpi=600, facecolor="white")
fig.savefig(svg, facecolor="white")

# --------------------------------------------------- verification manifest --
manifest = {
    "source": "documents/paper/findings.csv",
    "figure": "fig5-findings-by-cycle",
    "class_order": CLASSES,
    "palette": PALETTE,
    "grayscale_luma_by_class": {c: round(luma(PALETTE[c]), 1) for c in CLASSES},
    "totals": {"findings": sum(totals), "final_app_bug": n_app_bug},
    "cycles": [
        {
            "report_date": d,
            "label": s,
            "release": rel if rel != "—" else None,
            "note": "re-verification" if d == "2026-07-19" else None,
            "n_findings": t,
            "class_counts": {c: n for c, n in class_counts[d].items() if n},
            "finding_ids": [r["id"] for r in by_date[d]],
            "real_bug_rate_final": round(fr, 4) if fr is not None else None,
            "real_bug_rate_initial": (
                round(sum(1 for r in by_date[d] if r["initial_verdict"] == "app_bug") / t, 4)
                if t else None),
        }
        for d, s, rel, t, fr in zip(DATES, SHORT, releases, totals, final_rates)
    ],
    "hatching": {
        "dense (instrumentation_mediated=true)": dense_ids,
        "light (instrumentation_mediated=candidate)": cand_ids,
    },
    "annotations": {
        "retractions": {"ids": [r["id"] for r in retr], "cycle": "2026-07-18",
                        "resolved": "2026-07-19"},
        "reversal": {"ids": [r["id"] for r in rev], "cycle": "2026-07-21",
                     "corrected": "2026-07-22",
                     "initial_rate_07_21": round(init_21, 4),
                     "final_rate_07_21": 1.0},
    },
}
with open(os.path.join(OUT_DIR, "fig5-data.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("OK — all assertions passed")
print("totals per cycle:", totals)
print("final rates:", [round(v, 4) if v is not None else None for v in final_rates])
print("initial rate 07-21:", round(init_21, 4))
print("luma steps:", [round(v, 1) for v in lumas])
print("wrote:", png)
print("wrote:", svg)
