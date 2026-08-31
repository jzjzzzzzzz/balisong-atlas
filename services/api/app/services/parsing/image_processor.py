import hashlib
import io
from typing import cast

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageOps


def image_metadata(content: bytes) -> tuple[int, int, str]:
    with Image.open(io.BytesIO(content)) as image:
        return image.width, image.height, image.format or ""


def perceptual_hash(content: bytes) -> str:
    matrix = cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if matrix is None:
        raise ValueError("Image could not be decoded")
    resized = cv2.resize(matrix, (32, 32))
    dct = cast(NDArray[np.float32], cv2.dct(np.asarray(resized, dtype=np.float32)))[:8, :8]
    values = sorted(float(value) for value in dct[1:].ravel())
    median = values[len(values) // 2]
    bits = dct > median
    return f"{int(''.join('1' if bit else '0' for bit in bits.flatten()), 2):016x}"


def hamming_distance(first: str, second: str) -> int:
    return (int(first, 16) ^ int(second, 16)).bit_count()


def create_thumbnail(content: bytes, maximum: tuple[int, int] = (640, 640)) -> bytes:
    with Image.open(io.BytesIO(content)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail(maximum)
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=84, optimize=True)
        return output.getvalue()


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
