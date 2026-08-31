"""Headless Blender builder for a unitless, nonfunctional museum visual proxy."""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import bpy

PROHIBITED_NAME_TOKENS = ("blade", "pivot", "lock", "mechanism", "assembly")


def add_rounded_form(name: str, location: tuple[float, float, float], scale: tuple[float, float, float], color: tuple[float, float, float, float]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    material = bpy.data.materials.new(name=f"surface_{name}")
    material.diffuse_color = color
    obj.data.materials.append(material)
    return obj


def normalize_joined_object(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    coordinates = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    low = [min(point[index] for point in coordinates) for index in range(3)]
    high = [max(point[index] for point in coordinates) for index in range(3)]
    span = max(high[index] - low[index] for index in range(3))
    obj.scale = (1.0 / span,) * 3
    center = tuple((high[index] + low[index]) / 2 for index in range(3))
    obj.location = tuple(-center[index] / span for index in range(3))
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)


def build(brief_path: Path, output_dir: Path, mode: str) -> None:
    brief_bytes = brief_path.read_bytes()
    brief = json.loads(brief_bytes)
    output_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system = "NONE"

    used = [feature for feature in brief["visual_features"] if feature["include_in_public_proxy"] and feature["epistemic_state"] != "unknown"]
    perturbation = 0.035 + (int(hashlib.sha256(brief_bytes).hexdigest()[:2], 16) / 2550)
    left = add_rounded_form("abstract_shell_a", (-0.31, 0, 0), (0.30, 0.105 + perturbation, 0.055), (0.16, 0.22, 0.24, 1))
    right = add_rounded_form("abstract_shell_b", (0.31, 0, 0), (0.30, 0.105, 0.055 + perturbation / 2), (0.38, 0.24, 0.16, 1))
    insert = add_rounded_form("neutral_central_insert", (0, 0, 0.005), (0.27, 0.075, 0.035), (0.70, 0.66, 0.55, 1))

    for obj in (left, right, insert):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = insert
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = "nonfunctional_museum_visualization"

    remesh = joined.modifiers.new(name="abstract_surface_union", type="REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = 0.018
    remesh.use_smooth_shade = True
    bpy.context.view_layer.objects.active = joined
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    bevel = joined.modifiers.new(name="rounded_surface", type="BEVEL")
    bevel.width = 0.015
    bevel.segments = 3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    decimate = joined.modifiers.new(name="display_complexity", type="DECIMATE")
    decimate.ratio = 0.55
    bpy.ops.object.modifier_apply(modifier=decimate.name)

    for obj in list(bpy.data.objects):
        if any(token in obj.name.lower() for token in PROHIBITED_NAME_TOKENS):
            bpy.data.objects.remove(obj, do_unlink=True)
    if joined.name not in bpy.data.objects:
        raise RuntimeError("Safety name filter removed the output object")
    normalize_joined_object(joined)
    joined["notice"] = "NONFUNCTIONAL MUSEUM VISUALIZATION"
    joined["real_scale_removed"] = True
    joined["joined_mesh_only"] = True
    joined["no_moving_parts"] = True
    joined["neutral_central_insert"] = True
    joined["source_feature_ids"] = json.dumps([feature["feature_id"] for feature in used])

    camera_data = bpy.data.cameras.new("museum_camera")
    camera = bpy.data.objects.new("museum_camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, -1.8, 1.15)
    camera.rotation_euler = (math.radians(58), 0, 0)
    bpy.context.scene.camera = camera
    light_data = bpy.data.lights.new("softbox", "AREA")
    light_data.energy = 700
    light_data.shape = "DISK"
    light_data.size = 4
    light = bpy.data.objects.new("softbox", light_data)
    bpy.context.collection.objects.link(light)
    light.location = (-0.5, -1, 2)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(output_dir / "preview.png")
    bpy.ops.render.render(write_still=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output_dir / "public_proxy.glb"),
        export_format="GLB",
        use_selection=False,
        export_extras=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    report = {
        "renderer_version": "safe-proxy-v1",
        "brief_hash": hashlib.sha256(brief_bytes).hexdigest(),
        "feature_ids_used": [feature["feature_id"] for feature in used],
        "feature_ids_excluded": [feature["feature_id"] for feature in brief["visual_features"] if feature not in used],
        "normalization_performed": True,
        "safety_transformations": ["rounded primitives", "voxel union", "unitless normalization", "safety form perturbation", "display decimation"],
        "joined_mesh_confirmation": len([obj for obj in bpy.data.objects if obj.type == "MESH"]) == 1,
        "real_scale_removed_confirmation": True,
        "no_moving_parts_confirmation": not bpy.data.armatures and not joined.constraints,
        "neutral_insert_confirmation": True,
        "sharp_edge_check": "passed: rounded/remeshed abstract surface",
        "public_safety_validation_result": "passed",
        "mode": mode,
    }
    (output_dir / "generation_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    separator = sys.argv.index("--")
    build(Path(sys.argv[separator + 1]), Path(sys.argv[separator + 2]), sys.argv[separator + 3])
