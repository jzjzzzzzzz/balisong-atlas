import json
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).parents[1]
FIX = ROOT / "data/fixtures"
SAFE = ROOT / "packages/safe-3d/fixtures"
FIX.mkdir(parents=True, exist_ok=True)
SAFE.mkdir(parents=True, exist_ok=True)


def png(path: Path, width: int, height: int, variant: int) -> None:
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            nx, ny = x / width, y / height
            if variant == 1:
                band = 1 if abs(ny - 0.5) < 0.16 + 0.05 * math.sin(nx * 8) else 0
                color = (184, 126, 69) if band else (31, 48, 53)
            else:
                radius = math.hypot(nx - 0.5, ny - 0.5)
                ring = int(radius * 12) % 2
                color = (205, 190, 153) if ring else (70, 86, 84)
            row.extend(color)
        rows.append(bytes(row))
    raw = b"".join(rows)
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def pdf(path: Path) -> None:
    content = b"BT /F1 15 Tf 70 745 Td (Balisong Atlas Demo Research Sheet) Tj 0 -28 Td /F1 10 Tf (This fictional source documents an abstract museum visualization fixture.) Tj 0 -18 Td (The sheet describes two muted surface bands and a neutral central insert.) Tj 0 -18 Td (A second caption disputes whether the ochre band belongs to the same study.) Tj 0 -24 Td (No real object, measurements, operating instructions, or manufacturing data are present.) Tj ET"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects)+1}\n".encode())
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    path.write_bytes(output)


def glb(path: Path) -> None:
    lat, lon = 18, 36
    positions = []
    normals = []
    colors = []
    for i in range(lat + 1):
        theta = math.pi * i / lat
        for j in range(lon):
            phi = 2 * math.pi * j / lon
            sx, sy, sz = math.sin(theta) * math.cos(phi), math.sin(theta) * math.sin(phi), math.cos(theta)
            lobe = 0.82 + 0.14 * math.cos(phi * 2)
            positions.extend((0.5 * sx * lobe, 0.19 * sy, 0.12 * sz))
            normals.extend((sx, sy, sz))
            if abs(sx) < 0.25:
                colors.extend((0.73, 0.67, 0.51, 1.0))
            elif sx < 0:
                colors.extend((0.12, 0.22, 0.24, 1.0))
            else:
                colors.extend((0.57, 0.34, 0.18, 1.0))
    indices = []
    for i in range(lat):
        for j in range(lon):
            nxt = (j + 1) % lon
            a, b = i * lon + j, i * lon + nxt
            c, d = (i + 1) * lon + j, (i + 1) * lon + nxt
            indices.extend((a, c, b, b, c, d))
    buffers = []
    views = []
    accessors = []
    def add(values, fmt: str, component_type: int, accessor_type: str, count: int, minimum=None, maximum=None):
        while sum(len(item) for item in buffers) % 4:
            buffers.append(b"\0")
        offset = sum(len(item) for item in buffers)
        data = struct.pack("<" + fmt * len(values), *values)
        buffers.append(data)
        view_index = len(views)
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(data), "target": 34963 if component_type == 5123 else 34962})
        accessor = {"bufferView": view_index, "componentType": component_type, "count": count, "type": accessor_type}
        if minimum is not None:
            accessor["min"] = minimum
        if maximum is not None:
            accessor["max"] = maximum
        accessors.append(accessor)
        return len(accessors) - 1
    pos = add(positions, "f", 5126, "VEC3", len(positions)//3, [-0.5,-0.19,-0.12], [0.5,0.19,0.12])
    norm = add(normals, "f", 5126, "VEC3", len(normals)//3)
    color = add(colors, "f", 5126, "VEC4", len(colors)//4)
    index = add(indices, "H", 5123, "SCALAR", len(indices), [0], [max(indices)])
    binary = b"".join(buffers)
    while len(binary) % 4:
        binary += b"\0"
    doc = {
        "asset": {"version": "2.0", "generator": "Balisong Atlas fixture generator", "extras": {"notice": "NONFUNCTIONAL MUSEUM VISUALIZATION", "realScaleRemoved": True, "noMovingParts": True, "neutralCentralInsert": True}},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "nonfunctional_museum_visualization"}],
        "meshes": [{"name": "joined_abstract_proxy", "primitives": [{"attributes": {"POSITION": pos, "NORMAL": norm, "COLOR_0": color}, "indices": index, "mode": 4}]}],
        "buffers": [{"byteLength": len(binary)}], "bufferViews": views, "accessors": accessors,
    }
    encoded = json.dumps(doc, separators=(",", ":")).encode()
    while len(encoded) % 4:
        encoded += b" "
    total = 12 + 8 + len(encoded) + 8 + len(binary)
    path.write_bytes(struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(encoded), b"JSON") + encoded + struct.pack("<I4s", len(binary), b"BIN\0") + binary)


png(FIX / "abstract-study-a.png", 720, 480, 1)
png(FIX / "abstract-study-b.png", 720, 480, 2)
pdf(FIX / "fictional-research-sheet.pdf")
glb(SAFE / "demo-abstract-proxy.glb")
png(SAFE / "demo-preview.png", 1200, 800, 1)
(FIX / "iiif-manifest.json").write_text(json.dumps({
    "@context": "http://iiif.io/api/presentation/3/context.json", "id": "https://example.org/iiif/demo/manifest", "type": "Manifest",
    "label": {"en": ["Fictional abstract study"]}, "provider": [{"id": "https://example.org/museum", "type": "Agent", "label": {"en": ["Fictional Museum Lab"]}}],
    "requiredStatement": {"label": {"en": ["Attribution"]}, "value": {"en": ["Balisong Atlas fictional fixture, CC0"]}},
    "rights": "http://creativecommons.org/publicdomain/zero/1.0/",
    "metadata": [{"label": {"en": ["Record type"]}, "value": {"en": ["Abstract digital fixture"]}}],
    "items": [{"id": "https://example.org/iiif/demo/canvas/1", "type": "Canvas", "height": 480, "width": 720, "items": []}]
}, indent=2), encoding="utf-8")
print("Generated safe fixtures")
