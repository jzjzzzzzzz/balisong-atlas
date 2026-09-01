import json
import struct
from pathlib import Path


def test_demo_glb_is_valid_single_mesh_fixture() -> None:
    path = Path(__file__).parents[1] / "fixtures/demo-abstract-proxy.glb"
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF"
    assert version == 2
    assert length == len(data)
    json_length, chunk_type = struct.unpack_from("<I4s", data, 12)
    assert chunk_type == b"JSON"
    document = json.loads(data[20:20 + json_length])
    assert len(document["meshes"]) == 1
    assert len(document["meshes"][0]["primitives"]) == 1
    extras = document["asset"]["extras"]
    assert extras["notice"] == "NONFUNCTIONAL MUSEUM VISUALIZATION"
    assert extras["realScaleRemoved"] is True
    assert extras["noMovingParts"] is True
    assert extras["neutralCentralInsert"] is True
    assert "animations" not in document
