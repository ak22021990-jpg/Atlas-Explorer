#!/usr/bin/env python3
"""
Convert Natural Earth GeoPackage to a game-ready SVG map of North America.
Uses ne_50m_admin_1_states_provinces_lakes (clean coastlines, no lake outlines).
"""

import sqlite3
import struct
import math
import sys

GPKG_PATH   = 'C:/Users/anoop/Downloads/ne_vector.gpkg'
OUTPUT_PATH = 'C:/Users/anoop/OneDrive/Desktop/AMZ/maps/north-america.svg'
SVG_W, SVG_H = 1000, 660

# All postal codes we need
TARGET_CODES = {
    # US States + DC
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID',
    'IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS',
    'MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
    'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
    'WI','WY',
    # Canadian provinces + territories
    'AB','BC','MB','NB','NL','NT','NS','NU','ON','PE','QC','SK','YT',
}

# ── ALBERS EQUAL-AREA CONIC PROJECTION ─────────────────────────
# Good parameters for a combined US + Canada map
LON0 = math.radians(-96)   # central meridian
LAT0 = math.radians(40)    # origin latitude
PHI1 = math.radians(35)    # standard parallel 1
PHI2 = math.radians(65)    # standard parallel 2  (raised vs CONUS-only to include Canada)

_n  = (math.sin(PHI1) + math.sin(PHI2)) / 2
_C  = math.cos(PHI1)**2 + 2 * _n * math.sin(PHI1)
_r0 = math.sqrt(_C - 2 * _n * math.sin(LAT0)) / _n

def albers(lon, lat):
    phi = math.radians(lat)
    lam = math.radians(lon)
    val = _C - 2 * _n * math.sin(phi)
    if val < 0:
        val = 0
    rho   = math.sqrt(val) / _n
    theta = _n * (lam - LON0)
    return rho * math.sin(theta), _r0 - rho * math.cos(theta)

# ── GEOPACKAGE BINARY GEOMETRY PARSER ──────────────────────────

def parse_gpkg_geom(data):
    """Return list of rings [(lon,lat), ...] from a GeoPackage blob."""
    if not data or len(data) < 8:
        return []
    blob = bytes(data)
    if blob[0:2] != b'GP':
        return []
    flags        = blob[3]
    is_empty     = (flags >> 4) & 0x01
    if is_empty:
        return []
    envelope_type = (flags >> 1) & 0x07
    env_sizes     = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    wkb_start     = 8 + env_sizes.get(envelope_type, 0)
    return _parse_wkb(blob, wkb_start)[0]


def _parse_wkb(data, offset):
    """Recursively parse WKB; returns (rings, new_offset)."""
    if offset >= len(data):
        return [], offset
    bo  = data[offset]; offset += 1
    fmt = '<' if bo == 1 else '>'
    geom_type = struct.unpack_from(fmt + 'I', data, offset)[0]; offset += 4

    rings = []

    if geom_type == 3:          # Polygon
        n_rings = struct.unpack_from(fmt + 'I', data, offset)[0]; offset += 4
        for _ in range(n_rings):
            n_pts = struct.unpack_from(fmt + 'I', data, offset)[0]; offset += 4
            pts = []
            for _ in range(n_pts):
                x, y = struct.unpack_from(fmt + 'dd', data, offset); offset += 16
                pts.append((x, y))
            rings.append(pts)

    elif geom_type == 6:        # MultiPolygon
        n_polys = struct.unpack_from(fmt + 'I', data, offset)[0]; offset += 4
        for _ in range(n_polys):
            sub_rings, offset = _parse_wkb(data, offset)
            rings.extend(sub_rings)

    return rings, offset


# ── COORDINATE HELPERS ──────────────────────────────────────────

def rings_to_svg_path(rings, tx, ty, scale):
    """Project rings → SVG path d string."""
    parts = []
    for ring in rings:
        if len(ring) < 3:
            continue
        coords = []
        for lon, lat in ring:
            px, py = albers(lon, lat)
            sx = (px - tx) * scale
            sy = SVG_H - (py - ty) * scale   # flip Y
            coords.append(f'{sx:.1f},{sy:.1f}')
        parts.append('M ' + ' L '.join(coords) + ' Z')
    return ' '.join(parts)


# ── MAIN ────────────────────────────────────────────────────────

def main():
    conn = sqlite3.connect(GPKG_PATH)
    rows = conn.execute(
        "SELECT postal, name, adm0_a3, geom "
        "FROM ne_50m_admin_1_states_provinces_lakes "
        "WHERE adm0_a3 IN ('USA','CAN')"
    ).fetchall()

    entries = []   # (code, name, country, rings)

    for postal, name, country, geom_blob in rows:
        code = postal
        if code not in TARGET_CODES:
            continue
        rings = parse_gpkg_geom(geom_blob)
        if not rings:
            print(f'  WARN: no geometry for {code} ({name})', file=sys.stderr)
            continue
        entries.append((code, name, country, rings))
        print(f'  OK  {code}  {name}')

    if not entries:
        print('ERROR: no entries found — check GPKG path', file=sys.stderr)
        sys.exit(1)

    # ── determine bounding box of projected coords ──────────────
    all_px, all_py = [], []
    for _, _, _, rings in entries:
        for ring in rings:
            for lon, lat in ring:
                px, py = albers(lon, lat)
                all_px.append(px)
                all_py.append(py)

    min_px, max_px = min(all_px), max(all_px)
    min_py, max_py = min(all_py), max(all_py)

    # uniform scale to fill SVG with 20px padding
    pad    = 20
    scale  = min((SVG_W - 2*pad) / (max_px - min_px),
                 (SVG_H - 2*pad) / (max_py - min_py))
    tx     = min_px - pad / scale
    ty     = min_py - pad / scale   # bottom of projected space

    print(f'\nProjected bounds: x=[{min_px:.3f},{max_px:.3f}] y=[{min_py:.3f},{max_py:.3f}]')
    print(f'Scale: {scale:.2f}')

    # ── build SVG ───────────────────────────────────────────────
    us_entries = [(c,n,r) for c,n,cc,r in entries if cc == 'USA']
    ca_entries = [(c,n,r) for c,n,cc,r in entries if cc == 'CAN']

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}" '
        f'role="img" aria-label="Clickable atlas map of United States and Canada">',
        f'  <rect x="0" y="0" width="{SVG_W}" height="{SVG_H}" fill="transparent"/>',
        '  <g id="canada" fill="#001100" stroke="#00ffff" stroke-width="0.8" stroke-linejoin="round">',
    ]
    for code, name, rings in ca_entries:
        d = rings_to_svg_path(rings, tx, ty, scale)
        if d:
            lines.append(f'    <path id="{code}" class="atlas-region" data-code="{code}" d="{d}"/>')

    lines.append('  </g>')
    lines.append('  <g id="usa" fill="#001100" stroke="#00ffff" stroke-width="0.8" stroke-linejoin="round">')
    for code, name, rings in us_entries:
        d = rings_to_svg_path(rings, tx, ty, scale)
        if d:
            lines.append(f'    <path id="{code}" class="atlas-region" data-code="{code}" d="{d}"/>')
    lines.append('  </g>')
    lines.append('</svg>')

    svg_content = '\n'.join(lines)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    missing = TARGET_CODES - {e[0] for e in entries}
    print(f'\nSaved  → {OUTPUT_PATH}')
    print(f'Regions written : {len(entries)}')
    if missing:
        print(f'Missing codes   : {sorted(missing)}')
    else:
        print('All target codes found.')


if __name__ == '__main__':
    main()
